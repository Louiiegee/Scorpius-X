import time
import asyncio
import logging
import aiohttp
import numpy as np
from collections import defaultdict

from web3 import Web3, exceptions as w3_exceptions
from eth_account import Account

# Real provider SDK imports (ensure these packages are installed)
from flashbots import FlashbotsProvider
from eden_sdk import EdenRPC
from bloxroute import CloudApi

# ---------------------------
# Metrics Collection Class
# ---------------------------
class MEVMetrics:
    """
    Track metrics for each MEV provider and for public fallback.
    
    Attributes:
        metrics (dict): Nested dictionary tracking submissions, successes, latency, gas efficiency, and last success timestamps.
    """
    def __init__(self):
        self.metrics = {
            'providers': defaultdict(lambda: {
                'submissions': 0,
                'successes': 0,
                'avg_latency': 0,
                'gas_efficiency': [],
                'last_success': None
            }),
            'public_fallback': {
                'count': 0,
                'success_rate': 0
            }
        }
        
    def update_provider_metrics(self, provider: str, success: bool, latency: float, gas_used: int):
        data = self.metrics['providers'][provider]
        data['submissions'] += 1
        data['successes'] += int(success)
        data['avg_latency'] = ((data['avg_latency'] * (data['submissions'] - 1)) + latency) / data['submissions']
        if success:
            data['last_success'] = time.time()
            data['gas_efficiency'].append(gas_used)
            
    def get_optimal_provider(self) -> str:
        """Select provider based on weighted success, latency, and gas efficiency metrics."""
        scores = {
            name: ((data['successes'] / data['submissions']) *
                   (1 / (time.time() - data['last_success'] + 1)) *
                   (np.median(data['gas_efficiency']) if data['gas_efficiency'] else 1))
            for name, data in self.metrics['providers'].items() if data['submissions'] > 0
        }
        if scores:
            return max(scores, key=scores.get)
        return None

# ---------------------------
# Transaction Simulator with Tenderly
# ---------------------------
class TransactionSimulator:
    """
    Pre-flight transaction simulation using Tenderly's API.
    """
    def __init__(self, config, w3: Web3):
        self.config = config
        self.w3 = w3
        self.logger = logging.getLogger(self.__class__.__name__)
    
    async def simulate_tx(self, tx_params: dict) -> tuple:
        """
        Simulate a transaction using Tenderly's API.

        Args:
            tx_params (dict): Transaction parameters.

        Returns:
            tuple: (True, gas_used) if successful; otherwise (False, error message).
        """
        try:
            async with aiohttp.ClientSession() as session:
                resp = await session.post(
                    "https://api.tenderly.co/api/v1/account/me/project/project/simulate",
                    json={
                        "network_id": str(self.w3.eth.chain_id),
                        "from": tx_params['from'],
                        "to": tx_params['to'],
                        "input": tx_params.get('data', '0x'),
                        "gas": tx_params['gas'],
                        "gas_price": tx_params.get('gasPrice', 0),
                        "value": tx_params.get('value', 0)
                    },
                    headers={"X-Access-Key": self.config['TENDERLY_KEY']}
                )
                result = await resp.json()
                if result['transaction'].get('transaction_status'):
                    return True, result['gas_used']
                return False, result.get('error', 'Simulation failed')
        except Exception as e:
            return False, str(e)

# ---------------------------
# MEV Protection Manager
# ---------------------------
class MEVProtectionManager:
    """
    Handles private transaction submission via real provider SDKs.
    
    Supported providers:
      - Flashbots (using flashbots-py)
      - Eden (using eden-sdk)
      - Bloxroute (using CloudApi from bloxroute)
      
    Provides methods for submitting bundles and individual private transactions,
    with a fallback to public mempool submission.
    """
    def __init__(self, config, w3: Web3):
        self.w3 = w3
        self.config = config
        self.logger = logging.getLogger(self.__class__.__name__)
        self.providers = {
            'flashbots': FlashbotsProvider(
                w3,
                signature_account=Account.from_key(config['FLASHBOTS_SIGNER_KEY']),
                endpoint=config.get('FLASHBOTS_ENDPOINT', 'https://relay.flashbots.net')
            ),
            'eden': EdenRPC(
                endpoint=config['EDEN_ENDPOINT'],
                api_key=config['EDEN_API_KEY']
            ),
            'bloxroute': CloudApi(
                project_id=config['BLOXROUTE_PROJECT_ID'],
                secret_key=config['BLOXROUTE_SECRET']
            )
        }
    
    async def submit_bundle(self, bundle, target_block) -> dict:
        """
        Submit a transaction bundle via Flashbots.
        
        Args:
            bundle (list): List of transactions as a bundle.
            target_block (int): Target block number for inclusion.

        Returns:
            dict: Submission result with success flag and tx_hash.
        """
        try:
            result = await self.providers['flashbots'].send_bundle(
                bundle,
                target_block_number=target_block,
                opts={'simulation': True}
            )
            return {'success': result.get('bundleHash') is not None,
                    'tx_hash': result.get('bundleHash'),
                    'service': 'flashbots'}
        except Exception as e:
            self.logger.error(f"Flashbots submission failed: {e}")
            return {'success': False, 'error': str(e)}
    
    async def submit_private_tx(self, signed_tx) -> dict:
        """
        Submit a signed transaction via multiple private providers with failover.
        
        Args:
            signed_tx: The signed transaction object.

        Returns:
            dict: Submission result containing success flag, tx_hash, and provider used.
        """
        providers = [
            ('eden', self._submit_eden),
            ('bloxroute', self._submit_bloxroute),
            ('flashbots', self._submit_flashbots)
        ]
        for provider_name, handler in providers:
            result = await handler(signed_tx)
            if result.get('success'):
                return result
        return await self._fallback_to_public(signed_tx)
    
    async def _submit_flashbots(self, signed_tx) -> dict:
        try:
            bundle = [{"signed_transaction": signed_tx.rawTransaction}]
            target_block = self.w3.eth.block_number + 1
            result = await self.providers['flashbots'].send_bundle(bundle, target_block_number=target_block, opts={'simulation': False})
            return {'success': result.get('bundleHash') is not None,
                    'tx_hash': result.get('bundleHash'),
                    'service': 'flashbots'}
        except Exception as e:
            self.logger.error(f"Flashbots submission error: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _submit_eden(self, signed_tx) -> dict:
        try:
            result = await self.providers['eden'].send_transaction(signed_tx.rawTransaction)
            return {'success': result.get('tx_hash') is not None,
                    'tx_hash': result.get('tx_hash'),
                    'service': 'eden'}
        except Exception as e:
            self.logger.error(f"Eden submission error: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _submit_bloxroute(self, signed_tx) -> dict:
        try:
            result = await self.providers['bloxroute'].submit_transaction(signed_tx.rawTransaction.hex())
            return {'success': result.get('tx_hash') is not None,
                    'tx_hash': result.get('tx_hash'),
                    'service': 'bloxroute'}
        except Exception as e:
            self.logger.error(f"Bloxroute submission error: {e}")
            return {'success': False, 'error': str(e)}
    
    async def _fallback_to_public(self, signed_tx) -> dict:
        self.logger.info("Falling back to public mempool submission.")
        # Get pending block to read base fee
        current_base_fee = self.w3.eth.get_block('pending')['baseFeePerGas']
        gas_params = self._calculate_optimal_gas(current_base_fee)
        # Adjust transaction parameters accordingly:
        adjusted_tx = signed_tx.copy()
        adjusted_tx['maxPriorityFeePerGas'] = gas_params['priority_fee']
        adjusted_tx['maxFeePerGas'] = gas_params['max_fee']
        try:
            tx_hash = self.w3.eth.send_raw_transaction(adjusted_tx.rawTransaction)
            return {'success': True, 'tx_hash': tx_hash.hex(), 'service': 'public'}
        except Exception as e:
            self.logger.error(f"Public fallback failed: {e}")
            return {'success': False, 'error': str(e)}
    
    def _calculate_optimal_gas(self, base_fee) -> dict:
        """
        Calculate gas parameters dynamically using the current base fee.
        Returns a priority fee and max fee.
        """
        return {
            'priority_fee': int(base_fee * 1.25),
            'max_fee': int(base_fee * 2.5),
            'gas_limit': self.config.get('DEFAULT_GAS_LIMIT', 1_500_000)
        }

# ---------------------------
# Enhanced MEV Protection Wrapper
# ---------------------------
class EnhancedMEVProtection:
    """
    High-level MEV protection interface combining private provider submission,
    fallback logic, pre-flight simulation, and revert reason parsing.
    """
    def __init__(self, config, w3: Web3):
        self.config = config
        self.w3 = w3
        self.logger = logging.getLogger(self.__class__.__name__)
        self.mev_manager = MEVProtectionManager(config, w3)
        self.metrics = MEVMetrics()
        self.simulator = TransactionSimulator(config, w3)
    
    async def protect_transaction(self, tx_params: dict) -> dict:
        """
        Sign a transaction and attempt to submit it via private MEV channels.
        Falls back to the public mempool if necessary.
        
        Args:
            tx_params (dict): Transaction parameters including EIP-1559 fields.
        
        Returns:
            dict: Submission result, including success flag, tx_hash, and service used.
        """
        try:
            account = Account.from_key(self.config['PRIVATE_KEY'])
            signed_tx = account.sign_transaction(tx_params)
        except Exception as e:
            self.logger.error(f"Signing failed: {e}")
            return {'success': False, 'error': f"Signing failed: {e}"}
        
        result = await self.mev_manager.submit_private_tx(signed_tx)
        if result.get('success'):
            return result
        else:
            self.logger.warning("Private submission failed; attempting public fallback.")
            return await self.mev_manager._fallback_to_public(signed_tx)
    
    async def simulate_transaction(self, tx_params: dict) -> tuple:
        """
        Perform a pre-flight simulation of the transaction using Tenderly.

        Args:
            tx_params (dict): Transaction parameters.

        Returns:
            tuple: (True, gas_used) if simulation is successful; otherwise (False, error message).
        """
        return await self.simulator.simulate_tx(tx_params)
    
    def _parse_revert_reason(self, error: Exception) -> str:
        """
        Attempt to decode and return a revert reason from a contract logic error.

        Args:
            error (Exception): The exception raised.

        Returns:
            str: A human-readable revert reason.
        """
        try:
            hex_data = error.args[0].get('data', '')[2:]
            decoded = self.mev_manager.providers['flashbots'].contract.decode_function_input("0x" + hex_data)
            return decoded[0].fn_name
        except Exception:
            return "UNKNOWN_ERROR"
