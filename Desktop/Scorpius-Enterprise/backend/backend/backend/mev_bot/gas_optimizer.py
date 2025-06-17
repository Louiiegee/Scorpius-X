# gas_optimizer.py
import asyncio
import logging
from collections import deque
import numpy as np
from web3 import Web3, exceptions as w3_exceptions
from itertools import pairwise

class SmartGasPredictor:
    HISTORY_LENGTH = 50
    EMA_SPAN = 5
    PRIORITY_FEE_PERCENTILE = 75
    MIN_PRIORITY_FEE_WEI = int(1.0 * 1e9)
    MAX_PRIORITY_FEE_WEI = int(50.0 * 1e9)

    def __init__(self, w3: Web3):
        self.w3 = w3
        self.logger = logging.getLogger(self.__class__.__name__)
        self.history = deque(maxlen=self.HISTORY_LENGTH)
        self._history_lock = asyncio.Lock()
        self._last_processed_block = 0
        self.logger.info(f"SmartGasPredictor initialized. History length: {self.HISTORY_LENGTH}")

    async def _update_history(self, max_blocks=5):
         async with self._history_lock:
              try:
                   latest_block_num = await asyncio.to_thread(self.w3.eth.get_block_number)
                   start_block = max(self._last_processed_block + 1, latest_block_num - max_blocks + 1)
                   if start_block > latest_block_num:
                        return
                   self.logger.debug(f"Updating gas history from block {start_block} to {latest_block_num}")
                   fetch_tasks = []
                   for block_num in range(start_block, latest_block_num + 1):
                        fetch_tasks.append(asyncio.to_thread(self.w3.eth.get_block, block_num, full_transactions=True))
                   blocks = await asyncio.gather(*fetch_tasks)
                   for block in blocks:
                        if not block or not block.get('number') or block.number <= self._last_processed_block:
                             continue
                        base_fee = block.get('baseFeePerGas')
                        if base_fee is None:
                             self.logger.warning(f"Block {block.number} missing baseFeePerGas. Skipping.")
                             continue
                        priority_fees = []
                        if block.get('transactions'):
                             for tx in block.transactions:
                                  if 'maxPriorityFeePerGas' in tx:
                                      priority_fees.append(tx.maxPriorityFeePerGas)
                        self.history.append({
                             'number': block.number,
                             'base_fee': base_fee,
                             'priority_fees': priority_fees
                         })
                        self._last_processed_block = max(self._last_processed_block, block.number)
                   self.logger.debug(f"Gas history updated. Current length: {len(self.history)}. Last block: {self._last_processed_block}")
              except w3_exceptions.ProviderConnectionError as e:
                  self.logger.error(f"Error connecting to provider during history update: {e}")
              except asyncio.CancelledError:
                    raise
              except Exception as e:
                   self.logger.error(f"Error updating gas history: {e}", exc_info=True)

    def _calculate_base_fee_trend(self) -> float:
        if len(self.history) < 2:
            return 1.0
        base_fees = [item['base_fee'] for item in self.history if 'base_fee' in item]
        if len(base_fees) < 2:
            return 1.0
        try:
             changes = [(b2 / b1) for b1, b2 in pairwise(base_fees) if b1 > 0]
        except NameError:
             changes = [(base_fees[i] / base_fees[i-1]) for i in range(1, len(base_fees)) if base_fees[i-1] > 0]
        if not changes:
            return 1.0
        if len(changes) >= self.EMA_SPAN:
            ema_values = changes[-(self.EMA_SPAN):]
            trend = float(np.mean(ema_values))
        elif len(changes) > 0:
            trend = float(np.mean(changes))
        else:
            trend = 1.0
        trend = max(0.8, min(trend, 1.2))
        self.logger.debug(f"Calculated base fee trend: {trend:.4f}")
        return trend

    def _get_recent_priority_fees(self) -> list:
         fees = []
         lookback = min(len(self.history), 5)
         if lookback == 0: return []
         for i in range(1, lookback + 1):
              block_data = self.history[-i]
              if 'priority_fees' in block_data:
                   fees.extend(block_data['priority_fees'])
         return fees

    def _calculate_priority_fee_target(self) -> int:
        recent_priority_fees = self._get_recent_priority_fees()
        if not recent_priority_fees:
            self.logger.warning("No recent priority fee data available. Using minimum priority fee.")
            return self.MIN_PRIORITY_FEE_WEI
        try:
            calculated_fee = int(np.percentile(recent_priority_fees, self.PRIORITY_FEE_PERCENTILE))
            target_priority_fee = max(self.MIN_PRIORITY_FEE_WEI, min(calculated_fee, self.MAX_PRIORITY_FEE_WEI))
            self.logger.debug(f"Priority fees considered: {len(recent_priority_fees)}. Calculated P{self.PRIORITY_FEE_PERCENTILE}: {calculated_fee/1e9:.2f} Gwei. Target Priority Fee: {target_priority_fee/1e9:.2f} Gwei")
            return target_priority_fee
        except Exception as e:
            self.logger.error(f"Error calculating priority fee percentile: {e}", exc_info=True)
            return self.MIN_PRIORITY_FEE_WEI

    async def estimate_optimal_gas_eip1559(self) -> dict:
        try:
            await self._update_history()
            async with self._history_lock:
                 if not self.history:
                     self.logger.warning("Gas history is empty. Fetching latest block base fee directly.")
                     latest_block = await asyncio.to_thread(self.w3.eth.get_block, 'latest')
                     last_base_fee = latest_block.get('baseFeePerGas') if latest_block else None
                     if last_base_fee is None:
                          self.logger.error("Could not fetch latest base fee. Cannot estimate gas.")
                          return {'maxFeePerGas': int(50e9), 'maxPriorityFeePerGas': self.MIN_PRIORITY_FEE_WEI}
                 else:
                     last_base_fee = self.history[-1]['base_fee']
                 trend = self._calculate_base_fee_trend()
                 predicted_base_fee = int(last_base_fee * trend)
                 self.logger.debug(f"Last Base Fee: {last_base_fee/1e9:.2f} Gwei, Trend: {trend:.3f}, Predicted Base: {predicted_base_fee/1e9:.2f} Gwei")
                 target_priority_fee = self._calculate_priority_fee_target()
                 buffer_multiplier = 2.0
                 max_fee_per_gas = int(last_base_fee * buffer_multiplier) + target_priority_fee
                 self.logger.debug(f"Calculated maxFeePerGas: {max_fee_per_gas/1e9:.2f} Gwei (using {buffer_multiplier}x buffer)")
                 max_allowed_gas = self.config.get('MAX_GAS_PRICE_GWEI', 200) * 1e9
                 if max_fee_per_gas > max_allowed_gas:
                      self.logger.warning(f"Calculated maxFeePerGas ({max_fee_per_gas/1e9:.2f} Gwei) exceeds limit ({max_allowed_gas/1e9:.2f} Gwei). Capping.")
                      max_fee_per_gas = int(max_allowed_gas)
                      target_priority_fee = min(target_priority_fee, max(self.MIN_PRIORITY_FEE_WEI, max_fee_per_gas - predicted_base_fee))
            result = {
                 'maxFeePerGas': max_fee_per_gas,
                 'maxPriorityFeePerGas': target_priority_fee
             }
            self.logger.info(f"Optimal Gas Estimate: Max Fee={result['maxFeePerGas']/1e9:.2f} Gwei, Priority Fee={result['maxPriorityFeePerGas']/1e9:.2f} Gwei")
            return result
        except asyncio.CancelledError:
             self.logger.warning("Gas estimation task cancelled.")
             raise
        except Exception as e:
             self.logger.error(f"Failed to estimate optimal EIP-1559 gas: {e}", exc_info=True)
             return {'maxFeePerGas': int(50e9), 'maxPriorityFeePerGas': self.MIN_PRIORITY_FEE_WEI}

