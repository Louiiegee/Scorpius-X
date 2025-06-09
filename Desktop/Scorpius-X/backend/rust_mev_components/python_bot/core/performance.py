import time
import json
import logging
from collections import defaultdict
from web3 import Web3
from typing import Optional, List, Dict

from config import load_config

CONFIG = load_config()
logger = logging.getLogger(__name__)

class PerformanceTracker:
    """
    Tracks MEV bot performance metrics, manages trade history, and generates reports.
    """

    def __init__(self):
        # Use defaultdict for easier counting of failure reasons
        self.metrics = {
            "total_attempts": 0,
            "successful_arbitrages": 0,
            "successful_liquidations": 0,
            "total_profit_base_token_wei": 0,  # Store base profit in wei
            "total_gas_cost_eth_wei": 0,
            "start_time_ns": time.time_ns(),
            "last_reset_time": time.time(),
            "last_block_processed": 0,
            "scan_latencies_ms": [],
            "execution_latencies_ms": [],
            "flashbots_submissions": 0,
            "flashbots_included": 0,
            "direct_submissions": 0,
            "direct_included": 0,
            "failures_by_reason": defaultdict(int),
        }

        self.trade_history = []
        self.max_trade_history = CONFIG.get("MAX_TRADE_HISTORY", 100)
        self.max_latency_entries = CONFIG.get("MAX_LATENCY_HISTORY", 50)

        # Base token info
        self.base_token_symbol = CONFIG.get("BASE_TOKEN_SYMBOL", "BASE")
        token_decimals_map = CONFIG.get("TOKEN_DECIMALS", {})
        # Try a robust approach to find decimals
        base_decimals_found = token_decimals_map.get(self.base_token_symbol.upper())
        self.base_token_decimals = base_decimals_found if isinstance(base_decimals_found, int) else 6
        self.native_token_decimals = 18  # Usually ETH

        # For convenience, store a small price cache if needed
        self.base_token_price_usd_cache = 1.0

        logger.info(f"PerformanceTracker Initialized. Base: {self.base_token_symbol} (dec={self.base_token_decimals}), Hist size={self.max_trade_history}")

    def track_attempt(self, strategy_type: str = 'arbitrage'):
        """Tracks an attempt to execute a strategy."""
        self.metrics["total_attempts"] += 1

    def track_failure(self, reason_code: str = "UNKNOWN"):
        """Tracks a failed execution attempt by reason."""
        self.metrics["failures_by_reason"][reason_code] += 1

    def track_execution(
        self,
        success: bool,
        profit_amount_wei: int = 0,  # Expect amount in wei
        profit_token_symbol: str = None,
        profit_token_decimals: Optional[int] = None,
        gas_cost_eth_wei: int = 0,  # Expect wei
        latency_ms: float = 0,
        execution_method: str = 'direct',  # 'flashbots' or 'direct'
        execution_type: str = 'arbitrage'  # 'arbitrage' or 'liquidation'
    ):
        """
        Track outcome of an executed strategy attempt.
        """

        if profit_token_symbol is None:
            profit_token_symbol = self.base_token_symbol
        if profit_token_decimals is None:
            profit_token_decimals = self.base_token_decimals

        self._add_latency(self.metrics["execution_latencies_ms"], latency_ms)

        # Track which method was used
        if execution_method == 'flashbots':
            self.metrics["flashbots_submissions"] += 1
        else:
            self.metrics["direct_submissions"] += 1

        # If success
        if success:
            if execution_type == 'arbitrage':
                self.metrics["successful_arbitrages"] += 1
            elif execution_type == 'liquidation':
                self.metrics["successful_liquidations"] += 1

            if execution_method == 'flashbots':
                self.metrics["flashbots_included"] += 1
            else:
                self.metrics["direct_included"] += 1

            # If profit is in base token, aggregate it
            if profit_token_symbol.upper() == self.base_token_symbol.upper() and profit_token_decimals == self.base_token_decimals:
                self.metrics["total_profit_base_token_wei"] += profit_amount_wei
            elif profit_amount_wei != 0:
                # Log non-base profit
                amt_f = float(profit_amount_wei) / (10 ** profit_token_decimals)
                logger.warning(f"Non-base profit {amt_f:.6f} {profit_token_symbol} not added to base total.")
        else:
            # Possibly track an additional failure reason
            self.metrics["failures_by_reason"]["EXECUTION_FAILED"] += 1

        # track gas cost always
        self.metrics["total_gas_cost_eth_wei"] += gas_cost_eth_wei

    def add_trade_history(self, entry: Dict):
        """Add a single record to our rolling trade history in memory."""
        self.trade_history.append(entry)
        if len(self.trade_history) > self.max_trade_history:
            self.trade_history.pop(0)  # remove oldest

    def _add_latency(self, latency_list: List[float], value: float):
        if isinstance(value, (int, float)) and value >= 0:
            latency_list.append(value)
            if len(latency_list) > self.max_latency_entries:
                latency_list.pop(0)

    def track_scan_cycle(self, latency_ms: float, last_block: int):
        """Tracks scanning performance."""
        self._add_latency(self.metrics["scan_latencies_ms"], latency_ms)
        if isinstance(last_block, int) and last_block > self.metrics["last_block_processed"]:
            self.metrics["last_block_processed"] = last_block

    def _safe_division(self, numerator, denominator):
        return numerator / denominator if denominator else 0

    def _calculate_average(self, data_list: List[float]) -> float:
        return (sum(data_list) / len(data_list)) if data_list else 0

    def get_report(self) -> Dict:
        """Generates a performance metrics summary."""
        m = self.metrics
        total_success = m["successful_arbitrages"] + m["successful_liquidations"]
        win_rate = self._safe_division(total_success, m["total_attempts"])
        fb_inclusion = self._safe_division(m["flashbots_included"], m["flashbots_submissions"])
        direct_inclusion = self._safe_division(m["direct_included"], m["direct_submissions"])

        sorted_failures = dict(sorted(
            m["failures_by_reason"].items(),
            key=lambda item: item[1],
            reverse=True
        ))

        # Mean of execution latencies, scan latencies, etc.
        avg_exec_latency = self._calculate_average(m["execution_latencies_ms"])
        avg_scan_latency = self._calculate_average(m["scan_latencies_ms"])

        total_profit_base_dec = Web3.from_wei(m["total_profit_base_token_wei"], 'ether') \
            * (10 ** (18 - self.base_token_decimals))  # Adjust if base token != 18 decimals
        total_gas_eth = Web3.from_wei(m["total_gas_cost_eth_wei"], 'ether')

        return {
            "totalAttempts": m["total_attempts"],
            "successfulArbs": m["successful_arbitrages"],
            "successfulLiqs": m["successful_liquidations"],
            "winRatePercent": f"{win_rate * 100:.2f}%",
            "totalProfitInBase": float(total_profit_base_dec),
            "totalGasCostEth": float(total_gas_eth),
            "flashbotsInclusionRate": fb_inclusion,
            "directInclusionRate": direct_inclusion,
            "failuresByReason": sorted_failures,
            "avgExecutionLatencyMs": avg_exec_latency,
            "avgScanLatencyMs": avg_scan_latency,
            "lastBlockProcessed": m["last_block_processed"],
            "runtimeSec": time.time() - m["last_reset_time"],
        }

    def reset_metrics(self):
        """Clears or re-initializes metrics and trade history."""
        self.__init__()  # Re-init

def get_performance_tracker() -> PerformanceTracker:
    """
    Simple accessor function for a shared or new PerformanceTracker instance.
    Could be extended to make it a singleton if desired.
    """
    return PerformanceTracker()
