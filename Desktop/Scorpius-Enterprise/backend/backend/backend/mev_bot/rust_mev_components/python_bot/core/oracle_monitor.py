# oracle_monitor.py
import asyncio
import logging
import time
import os
import json
from typing import List, Dict, Optional, Any
from web3 import Web3
from web3.types import Address, ChecksumAddress
from eth_typing import BlockNumber
import ccxt.async_support as ccxt # Use async version of ccxt

from config import load_config
from retry_helper import with_retry_async
from arbitrage_math import get_token, get_eth_price # Needs helpers
from abis import IChainlinkAggregatorV3_ABI, IAaveOracle_ABI, IPoolAddressesProvider_ABI # Need ABIs

CONFIG = load_config()
logger = logging.getLogger(__name__)

class OracleMonitor:
    """
    Monitors on-chain (Chainlink/Aave) vs off-chain (CEX) prices and flags deviations.
    Uses ccxt for CEX interaction.
    """
    def __init__(self, provider): # Needs the base async provider object
        self.provider = provider
        self.w3 = Web3(provider) # Create an async Web3 instance
        self.config = CONFIG.get("ORACLE_MONITOR", {}) # Get specific config
        self.enabled: bool = self.config.get("ENABLED", False)

        self.cex_clients: Dict[str, ccxt.Exchange] = {}
        # Stores { symbol: { contract: ContractInstance, decimals: int, address: str } }
        self.chainlink_feeds: Dict[str, Dict] = {}
        self.aave_oracle_contract = None # For Aave source type

        self.latest_prices: Dict[str, Dict] = {}
        self.deviation_flags: Dict[str, bool] = {}
        self.is_initialized = False
        self.is_monitoring = False
        self.monitor_task: Optional[asyncio.Task] = None

        if not self.enabled: logger.info("OracleMonitor disabled by configuration."); return
        self._validate_config() # Validate sub-config

    def _validate_config(self):
        # ... (implement validation logic similar to JS version) ...
        if not self.config.get("monitoredAssets"): raise ValueError("OracleMon: monitoredAssets missing")
        if not self.config.get("cexToCheck"): raise ValueError("OracleMon: cexToCheck missing")
        # ... etc ...
        pass # Add checks


    async def initialize(self):
        if not self.enabled or self.is_initialized: return
        logger.info("Initializing OracleMonitor async components...")
        start_time = time.monotonic()

        # 1. Initialize CEX Clients (Async)
        for exchange_id in self.config.get("cexToCheck", []):
            try:
                 # Create async instance of the exchange
                 exchange_class = getattr(ccxt, exchange_id)
                 # Load API keys if provided for potential private endpoints / higher rate limits
                 api_key = os.getenv(f"CEX_API_KEY_{exchange_id.upper()}")
                 secret = os.getenv(f"CEX_SECRET_{exchange_id.upper()}")
                 options = {'apiKey': api_key, 'secret': secret, 'enableRateLimit': True}
                 # Add custom headers if needed: options['options'] = {'headers': {'X-Custom': 'value'}}
                 client = exchange_class(options)
                 self.cex_clients[exchange_id] = client
                 # Async load_markets with retry
                 await with_retry_async(lambda: client.load_markets(reload=True), f"CCXT loadMarkets {exchange_id}", {'retries': 2})
                 logger.info(f"OracleMonitor: CCXT async client for {exchange_id} initialized.")
            except AttributeError: logger.error(f"OracleMonitor: CCXT exchange '{exchange_id}' not found.")
            except Exception as e: logger.error(f"OracleMonitor: Failed init CCXT {exchange_id}: {e}") # Error logged by retry

        if not self.cex_clients: logger.error("OracleMon: No CEX clients init. Disabling."); self.enabled=False; return


        # 2. Initialize On-Chain Oracles
        oracle_source = self.config.get("onChainOracleSource", {})
        oracle_type = oracle_source.get("type")

        try:
            if oracle_type == 'CHAINLINK':
                feeds = oracle_source.get("feeds", {})
                for asset_symbol in self.config.get("monitoredAssets", []):
                    feed_config = feeds.get(asset_symbol.upper())
                    if feed_config and feed_config.get('address') and feed_config.get('quote') == 'USD':
                        try:
                             address = Web3.to_checksum_address(feed_config['address'])
                             contract = self.w3.eth.contract(address=address, abi=IChainlinkAggregatorV3_ABI)
                             decimals = await with_retry_async(lambda: contract.functions.decimals().call(), f"CL decimals {asset_symbol}")
                             self.chainlink_feeds[asset_symbol] = {"contract": contract, "decimals": int(decimals), "address": address}
                             logger.info(f"OracleMonitor: Chainlink {asset_symbol} (USD/{decimals}dec) -> {address}")
                        except Exception as e: logger.error(f"Failed init Chainlink feed for {asset_symbol}: {e}")
                    # else: logger.debug(f"No Chainlink USD feed for {asset_symbol}")

            elif oracle_type == 'AAVE':
                 provider_addr = oracle_source.get("poolProviderAddress") # Required for Aave type
                 if not provider_addr: raise ValueError("Aave oracle source needs poolProviderAddress")
                 provider_addr_cs = Web3.to_checksum_address(provider_addr)
                 add_prov_contract = self.w3.eth.contract(address=provider_addr_cs, abi=IPoolAddressesProvider_ABI)
                 oracle_address = await with_retry_async(lambda: add_prov_contract.functions.getPriceOracle().call(), "Aave getPriceOracle")
                 self.aave_oracle_contract = self.w3.eth.contract(address=Web3.to_checksum_address(oracle_address), abi=IAaveOracle_ABI)
                 logger.info(f"OracleMonitor: Aave oracle at {oracle_address} (Prices vs ETH)")
                 # We also need an ETH/USD Chainlink feed for AAVE type to work
                 if not self.chainlink_feeds.get("ETH") and not self.chainlink_feeds.get("WETH"):
                      raise ValueError("Aave oracle requires an ETH or WETH Chainlink USD feed configured for conversions.")

            else: raise ValueError(f"Unsupported oracle type: {oracle_type}")

        except Exception as e: logger.error(f"OracleMon On-chain setup failed: {e}"); self.enabled=False; return


        # Initialize price/flag structures
        for symbol in self.config.get("monitoredAssets", []):
             self.latest_prices[symbol] = {"onChainScaledUsd": None, "cexUsd": None, "lastCexUpdate": 0, "lastChainUpdate": 0}
             self.deviation_flags[symbol] = False

        self.is_initialized = True
        logger.info(f"OracleMonitor initialization complete in {time.monotonic() - start_time:.2f} seconds.")


    async def start_monitoring(self):
        """Starts the background price fetching and comparison task."""
        if not self.enabled or not self.is_initialized or self.is_monitoring: return
        logger.info(f"OracleMonitor starting monitoring interval ({self.config.get('checkIntervalSeconds', 6)}s)...")
        self.is_monitoring = True

        async def monitor_loop():
            interval_s = self.config.get('checkIntervalSeconds', 6)
            while self.is_monitoring:
                 try:
                     await self._fetch_all_prices()
                     self._compare_all_prices()
                     await asyncio.sleep(interval_s)
                 except asyncio.CancelledError: logger.info("Oracle monitor loop cancelled."); break
                 except Exception: logger.exception("Error in oracle monitor loop:") ; await asyncio.sleep(interval_s * 2) # Longer sleep on error

        self.monitor_task = asyncio.create_task(monitor_loop())


    async def stop_monitoring(self):
        """Stops the background monitoring task and closes CEX connections."""
        if not self.is_monitoring: return
        logger.info("OracleMonitor stopping...")
        self.is_monitoring = False
        if self.monitor_task and not self.monitor_task.done():
            self.monitor_task.cancel()
            try: await self.monitor_task
            except asyncio.CancelledError: logger.info("Oracle monitor task cancelled.")
        self.monitor_task = None
        # Close CCXT clients
        for exchange_id, client in self.cex_clients.items():
             try:
                  if hasattr(client, 'close'):
                      await client.close() # Close async sessions
                      logger.debug(f"Closed CCXT client for {exchange_id}")
             except Exception as e: logger.error(f"Error closing CCXT client {exchange_id}: {e}")
        logger.info("OracleMonitor stopped.")


    async def _fetch_all_prices(self):
        """Fetches both on-chain and off-chain prices concurrently."""
        await asyncio.gather(
            self._fetch_on_chain_prices(),
            self._fetch_cex_prices(),
            return_exceptions=True # Log errors but don't stop monitor loop usually
        )

    async def _fetch_on_chain_prices(self):
        """Fetches prices from configured on-chain source (Chainlink/Aave)."""
        # ... (Implementation similar to JS version using self.chainlink_feeds, self.aave_oracle_contract, etc.) ...
        # Remember to use await for contract calls and scale to CHAINLINK_PRICE_DECIMALS (18)
        # Use with_retry_async for all external contract calls.
        oracle_source = self.config.get("onChainOracleSource", {})
        oracle_type = oracle_source.get("type")
        eth_price_data = None

        try:
             # Get ETH Price if needed
             if oracle_type == 'AAVE' or 'ETH' in self.config.get("monitoredAssets", []) or 'WETH' in self.config.get("monitoredAssets", []):
                  eth_feed = self.chainlink_feeds.get('ETH') or self.chainlink_feeds.get('WETH')
                  if eth_feed:
                      eth_price_res = await get_price_from_chainlink('ETH', self.w3) # Use shared helper
                      if eth_price_res:
                          eth_price_data = {'price': eth_price_res['price'], 'decimals': eth_price_res['decimals']} # price is BN(18dec)
                          # Store ETH price directly if monitored
                          for sym in ['ETH', 'WETH']:
                               if sym in self.latest_prices: self.latest_prices[sym].update({'onChainScaledUsd': eth_price_data['price'], 'lastChainUpdate': time.time()})
                  elif oracle_type == 'AAVE': logger.error("Cannot fetch Aave prices without ETH feed."); return

             # Fetch other assets
             for asset_symbol in self.config.get("monitoredAssets", []):
                 if asset_symbol.upper() in ['ETH', 'WETH']: continue # Handled above
                 try:
                     price_scaled_usd = None
                     timestamp = 0

                     if oracle_type == 'CHAINLINK':
                          price_data = await get_price_from_chainlink(asset_symbol, self.w3) # Use helper
                          if price_data:
                              price_scaled_usd = price_data['price']
                              timestamp = time.time()

                     elif oracle_type == 'AAVE' and self.aave_oracle_contract and eth_price_data:
                          token = get_token(asset_symbol)
                          if token:
                               price_vs_eth = await with_retry_async(lambda: self.aave_oracle_contract.functions.getAssetPrice(token.address).call(), f"Aave getAssetPrice {asset_symbol}")
                               # Convert to USD (scaled 18 dec)
                               price_scaled_usd = (price_vs_eth * eth_price_data['price']) // (10**18) # ETH price is already 18 dec
                               timestamp = time.time()

                     if price_scaled_usd is not None:
                           self.latest_prices[asset_symbol]['onChainScaledUsd'] = price_scaled_usd
                           self.latest_prices[asset_symbol]['lastChainUpdate'] = timestamp

                 except Exception as e: logger.warning(f"Failed fetching on-chain price for {asset_symbol}: {e}")

        except Exception as e: logger.error(f"Error in _fetchOnChainPrices: {e}", exc_info=True)


    async def _fetch_cex_prices(self):
        """Fetches volume-weighted average price from configured CEXs using ccxt async."""
        for asset_symbol in self.config.get("monitoredAssets", []):
            tasks = []
            base_quote = "USD"; alt_quote = "USDT"; # Standard pairs to check
            market_symbol = f"{asset_symbol}/{base_quote}"; alt_market = f"{asset_symbol}/{alt_quote}"

            for ex_id, client in self.cex_clients.items():
                symbol_to_fetch = None
                if market_symbol in client.markets: symbol_to_fetch = market_symbol
                elif alt_market in client.markets: symbol_to_fetch = alt_market

                if symbol_to_fetch:
                    tasks.append(
                        with_retry_async(lambda: client.fetch_ticker(symbol_to_fetch), f"CCXT fetchTicker {ex_id} {symbol_to_fetch}", custom_options={'retries': 1})
                    )
                # else: logger.debug(f"Market {market_symbol} or {alt_market} not found on {ex_id}")

            results = await asyncio.gather(*tasks, return_exceptions=True)

            # Calculate Volume Weighted Average Price
            total_volume = 0; weighted_sum = 0; sources = 0; latest_update = self.latest_prices[asset_symbol]['lastCexUpdate'] or 0
            stale_threshold_ms = self.config.get('stalePriceThresholdSeconds', 90) * 1000
            now_ms = time.time() * 1000

            for res in results:
                if not isinstance(res, Exception) and res:
                    try:
                         price = res.get('vwap') or res.get('last') # Prefer VWAP
                         volume = res.get('quoteVolume') # Use quote volume for weighting
                         timestamp = res.get('timestamp') # Milliseconds usually

                         # Check if data is valid and not stale
                         if price and volume and timestamp and (now_ms - timestamp < stale_threshold_ms):
                             weight = volume if volume > 0 else 1 # Avoid 0 weight
                             weighted_sum += price * weight
                             total_volume += weight
                             sources += 1
                             latest_update = max(latest_update, timestamp)
                         # else: logger.debug(f"Stale/invalid ticker data ignored: {res}")
                    except Exception as proc_err: logger.warning(f"Error processing CEX ticker {res}: {proc_err}")
                # elif isinstance(res, Exception): logger.warning(f"CEX fetch failed: {res}") # Error logged by retry

            if sources > 0 and total_volume > 0:
                 final_price = weighted_sum / total_volume
                 self.latest_prices[asset_symbol]['cexUsd'] = final_price
                 self.latest_prices[asset_symbol]['lastCexUpdate'] = latest_update / 1000.0 # Store as seconds
                 # logger.debug(f"CEX Price {asset_symbol}: {final_price:.4f} USD ({sources} sources)")
            # else: # Keep stale price if fetch fails? Or set to None? Let's keep for now.
            #    pass

    def _compare_all_prices(self):
        """Compares latest on-chain vs CEX prices and updates deviation flags."""
        # ... (Implementation is identical to the Python version provided previously) ...
        now = time.time()
        stale_limit = self.config.get('stalePriceThresholdSeconds', 90)

        for asset_symbol in self.config.get("monitoredAssets", []):
            prices = self.latest_prices.get(asset_symbol, {})
            flag_key = asset_symbol # Flag by symbol

            is_chain_stale = (now - prices.get('lastChainUpdate', 0)) > stale_limit
            is_cex_stale = (now - prices.get('lastCexUpdate', 0)) > stale_limit
            on_chain_price_wei = prices.get('onChainScaledUsd') # Already scaled to 18 dec
            cex_price_float = prices.get('cexUsd')

            should_be_deviating = False # Default assumption
            if is_chain_stale or is_cex_stale or on_chain_price_wei is None or cex_price_float is None:
                 # logger.debug(f"Cannot compare {asset_symbol}: Stale/missing prices.")
                 pass # Deviation flag will be set to false later if it was true
            else:
                 try:
                      # Compare prices (both effectively USD, onChainScaledUsd is 18 dec wei)
                      on_chain_price_num = float(Web3.from_wei(on_chain_price_wei, 'ether'))
                      cex_price_num = float(cex_price_float)
                      if on_chain_price_num > 1e-9: # Avoid division by zero or tiny numbers
                           diff = abs(1.0 - (cex_price_num / on_chain_price_num))
                           should_be_deviating = diff > self.config.get('deviationThreshold', 0.01)
                      # logger.debug(f"Compare {asset_symbol}: Chain={on_chain_price_num:.4f}, CEX={cex_price_num:.4f}, Diff={(diff * 100):.3f}% -> Deviating: {should_be_deviating}")
                 except Exception as e:
                      logger.error(f"Oracle Compare Error {asset_symbol}: {e}")
                      should_be_deviating = False # Assume not deviating on error

            # Update flag if state changed
            if should_be_deviating != self.deviation_flags.get(flag_key, False):
                 self.deviation_flags[flag_key] = should_be_deviating
                 if should_be_deviating: logger.warning(f"ORACLE DEVIATION DETECTED for {asset_symbol}!")
                 else: logger.info(f"Oracle deviation resolved/stale for {asset_symbol}.")


    # --- Public Accessors ---
    def get_deviation_status(self) -> Dict[str, bool]:
        """Returns copy of current deviation flags."""
        return self.deviation_flags.copy()
        def is_asset_deviating(self, asset_symbol: str) -> bool:
            """Checks if a specific asset is currently flagged."""
            return self.deviation_flags.get(asset_symbol.upper(), False) # Case-insensitive check
    
    
    # Helper function to fetch price from a Chainlink feed
    async def get_price_from_chainlink(asset_symbol: str, w3: Web3) -> Optional[Dict[str, Any]]:
        """
        Fetches the latest price data from Chainlink oracle for the given asset.
        Note: This is a stub implementation; please implement actual logic as required.
        """
        # For example, you might look up the Chainlink feed contract based on asset_symbol
        # and call its latestRoundData() and decimals() methods.
        return None