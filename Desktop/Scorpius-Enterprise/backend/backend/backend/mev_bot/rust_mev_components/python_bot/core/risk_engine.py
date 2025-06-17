import logging
import time
import numpy as np
from typing import List, Dict, Optional, Any
from web3 import Web3  # For formatUnits or to_wei, etc.

from config import load_config
from arbitrage_math import get_base_token_price, get_eth_price, Token

logger = logging.getLogger(__name__)
CONFIG = load_config()

# Attempt to import pandas/pandas_ta for ATR, etc.
try:
    import pandas as pd
    import pandas_ta as ta
    PANDAS_TA_AVAILABLE = True
except ImportError as e:
    PANDAS_TA_AVAILABLE = False
    logger.warning(f"Pandas TA library not installed. ATR/volatility calculations disabled. Error: {e}")


class RiskEngine:
    """
    Manages risk parameters, calculates volatility, position sizing, checks balances, etc.
    """

    def __init__(self):
        self.volatility_window: int = CONFIG.get("VOLATILITY_WINDOW", 14)
        self.position_sizing_strategy: str = CONFIG.get("POSITION_STRATEGY", 'FIXED')
        self.max_risk_per_trade: float = CONFIG.get("MAX_RISK_PER_TRADE", 0.01)
        self.fixed_size_base_str: str = CONFIG.get("FIXED_POSITION_SIZE", "1000")
        self.max_loan_size_usd: float = CONFIG.get("MAX_LOAN_SIZE_USD", 50000)
        self.min_eth_balance_wei: int = Web3.to_wei(CONFIG.get("MIN_ETH_BALANCE", "0.05"), 'ether')

        # If using pandas_ta for historical data
        self.historical_data: Dict[str, pd.DataFrame] = {} if PANDAS_TA_AVAILABLE else {}

        logger.info(
            f"RiskEngine Initialized: Strategy={self.position_sizing_strategy}, "
            f"MaxRisk={self.max_risk_per_trade*100:.2f}%, VolWindow={self.volatility_window}, "
            f"MinETH={Web3.from_wei(self.min_eth_balance_wei, 'ether')}"
        )

    def update_market_data(self, pair_symbol: str, data_points: List[Dict[str, Any]]):
        """
        Updates historical data for a pair. If pandas_ta is available, stores in a DataFrame
        to allow ATR, historical volatility, etc. columns: timestamp, open, high, low, close, volume
        """
        if not PANDAS_TA_AVAILABLE:
            logger.debug("Cannot update market data - pandas_ta not available.")
            return
        if not data_points:
            return

        try:
            new_data_df = pd.DataFrame(data_points)
            required_cols = ['timestamp', 'open', 'high', 'low', 'close', 'volume']
            if not all(col in new_data_df.columns for col in required_cols):
                logger.warning(f"Market data update for {pair_symbol} missing required columns.")
                return

            for col in ['open', 'high', 'low', 'close', 'volume']:
                new_data_df[col] = pd.to_numeric(new_data_df[col], errors='coerce')

            new_data_df.dropna(subset=required_cols, inplace=True)

            # Convert timestamp to datetime index
            if not pd.api.types.is_datetime64_any_dtype(new_data_df['timestamp']):
                new_data_df['timestamp'] = pd.to_datetime(new_data_df['timestamp'], unit='s')
            new_data_df.set_index('timestamp', inplace=True)

            if pair_symbol in self.historical_data:
                existing_df = self.historical_data[pair_symbol]
                combined_df = pd.concat([existing_df, new_data_df])
                combined_df = combined_df[~combined_df.index.duplicated(keep='last')]
                combined_df.sort_index(inplace=True)
            else:
                combined_df = new_data_df.sort_index()

            # Keep the last N points for the volatility window
            required_length = self.volatility_window * 3
            self.historical_data[pair_symbol] = combined_df.tail(required_length)

        except Exception as e:
            logger.error(f"Error updating market data for {pair_symbol}: {e}", exc_info=True)

    def calculate_atr(self, pair_symbol: str, current_price: float) -> float:
        """Calculates average true range (ATR) as a fraction of current price."""
        if not PANDAS_TA_AVAILABLE or pair_symbol not in self.historical_data:
            return 0.0

        df = self.historical_data[pair_symbol]
        if len(df) < self.volatility_window or current_price <= 0:
            return 0.0

        try:
            df.rename(
                columns={"Open": "open", "High": "high", "Low": "low", "Close": "close"},
                inplace=True, errors='ignore'
            )
            df.ta.atr(length=self.volatility_window, append=True)
            last_atr = df[f'ATR_{self.volatility_window}'].iloc[-1]
            if pd.notna(last_atr) and last_atr > 0:
                return float(last_atr / current_price)
            return 0.0
        except Exception as e:
            logger.error(f"Error calculating ATR for {pair_symbol}: {e}")
            return 0.0

    def calculate_historical_volatility(self, pair_symbol: str) -> float:
        """Calculates rolling standard deviation of log returns for the given pair."""
        if not PANDAS_TA_AVAILABLE or pair_symbol not in self.historical_data:
            return 0.0

        df = self.historical_data[pair_symbol]
        if len(df) < (self.volatility_window + 1):
            return 0.0

        try:
            if 'close' not in df.columns and 'Close' in df.columns:
                df.rename(columns={"Close": "close"}, inplace=True, errors='ignore')
            if 'close' not in df.columns:
                return 0.0

            log_returns = np.log(df['close'] / df['close'].shift(1)).dropna()
            if len(log_returns) < self.volatility_window:
                return 0.0

            vol_series = log_returns.rolling(window=self.volatility_window).std()
            last_vol = vol_series.iloc[-1]
            return float(last_vol) if pd.notna(last_vol) else 0.0
        except Exception as e:
            logger.error(f"Error calculating historical volatility for {pair_symbol}: {e}")
            return 0.0

    def get_pair_volatility(self, pair_symbol: str, current_price: float) -> float:
        """
        Returns a composite volatility measure for the pair.
        Prefers ATR if available; falls back to historical log-return std dev.
        """
        if current_price <= 0:
            return 0.01
        atr_vol = self.calculate_atr(pair_symbol, current_price)
        if atr_vol > 0:
            return atr_vol
        hist_vol = self.calculate_historical_volatility(pair_symbol)
        return hist_vol if hist_vol > 0 else 0.01

    async def calculate_max_position_size(
        self,
        account_balance_wei: int,
        base_token: Token,
        w3: Web3,
        pair_volatility: float = 0.01,
        ml_confidence: float = 0.75
    ) -> int:
        """
        Derives a max position size in base-token 'wei' units, factoring in volatility,
        confidence, account balance, and user strategy (FIXED, VOLATILITY_ADJUSTED, etc.).
        """
        if not base_token or base_token.decimals is None:
            logger.error("RiskEngine: Invalid base_token provided.")

        base_decimals = base_token.decimals
        confidence_factor = max(0.1, ml_confidence)  # clamp to avoid 0

        if self.position_sizing_strategy == 'FIXED':
            fixed_size_base = int(float(self.fixed_size_base_str) * (10 ** base_decimals))
            adjusted_fixed_size = int(fixed_size_base * confidence_factor)
            logger.info(
                f"Risk (FIXED): base={self.fixed_size_base_str} scaled x {confidence_factor:.2f} => "
                f"{adjusted_fixed_size / (10**base_decimals):,.{base_decimals}f} {base_token.symbol}"
            )
            return adjusted_fixed_size

        elif self.position_sizing_strategy == 'VOLATILITY_ADJUSTED':
            safe_volatility = max(pair_volatility, 0.005)
            adjusted_max_risk = self.max_risk_per_trade * confidence_factor

            try:
                eth_price = await get_eth_price(w3)
                if not eth_price:
                    raise ValueError("Failed to fetch ETH price.")
                account_balance_eth = float(Web3.from_wei(account_balance_wei, 'ether'))
                account_balance_usd = account_balance_eth * eth_price
            except Exception as e:
                logger.error(f"Risk: balance conversion error: {e}")
                fallback_size = int(float(self.fixed_size_base_str) * (10**base_decimals) * confidence_factor * 0.5)
                return fallback_size

            max_risk_usd = account_balance_usd * adjusted_max_risk
            max_size_usd = max_risk_usd / safe_volatility
            capped_size_usd = min(max_size_usd, self.max_loan_size_usd)

            try:
                base_price_usd = await get_base_token_price(base_token, w3)
                if base_price_usd <= 0:
                    raise ValueError(f"Invalid base token price: {base_price_usd}")
                position_size_base_wei = int((capped_size_usd / base_price_usd) * (10**base_decimals))
            except Exception as e:
                logger.error(f"Risk: base token price conversion error: {e}")
                fallback_size = int(float(self.fixed_size_base_str) * (10**base_decimals) * confidence_factor * 0.5)
                return fallback_size

            logger.info(
                f"Risk (VOL_ADJ): BalUSD={account_balance_usd:.2f}, AdjRisk={adjusted_max_risk*100:.1f}%, "
                f"Vol={safe_volatility:.4f}, Confidence={confidence_factor:.2f} => "
                f"{position_size_base_wei / (10**base_decimals):,.{base_decimals}f} {base_token.symbol}"
            )
            return position_size_base_wei

        else:
            logger.warning(f"Risk: Unknown strategy {self.position_sizing_strategy}, using simple FIXED.")
            return int(float(self.fixed_size_base_str) * (10 ** base_decimals))

    def has_sufficient_eth(self, current_eth_balance_wei: int) -> bool:
        """Checks if current ETH balance is >= configured minimum."""
        if current_eth_balance_wei is None or current_eth_balance_wei < 0:
            logger.error("RiskEngine: invalid ETH balance for check.")
            return False
        sufficient = (current_eth_balance_wei >= self.min_eth_balance_wei)
        if not sufficient:
            logger.warning(
                f"Insufficient ETH: {Web3.from_wei(current_eth_balance_wei,'ether')} < "
                f"{Web3.from_wei(self.min_eth_balance_wei, 'ether')} required."
            )
        return sufficient

    async def run_preflight_simulation(self, opportunity: Dict, loan_amount: int, w3: Web3) -> bool:
        """
        Stub for using an external forked node or simulation to verify an opportunity
        won't revert. If not enabled, returns True. 
        """
        if not CONFIG.get("ENABLE_PREFLIGHT_SIM", False):
            return True

        logger.info("RiskEngine: Running pre-flight simulation (stub).")
        # Your actual simulation logic here...
        logger.warning("Pre-flight simulation logic not implemented.")
        return True
