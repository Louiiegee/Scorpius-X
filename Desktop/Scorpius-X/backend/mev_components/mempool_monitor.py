# mempool_monitor.py

import asyncio
import time
import json
import logging
import redis.asyncio as redis
from typing import Dict, List, Optional, Set
from dataclasses import dataclass, asdict
from web3 import Web3, exceptions as w3_exceptions

# Placeholder for REVM Simulator
class REVMSimulator:
     def __init__(self, rpc_url):
         self.rpc_url = rpc_url
         self.logger = logging.getLogger("REVMSimulator")
     async def simulate(self, sender, to, value, data):
         self.logger.debug(f"Simulating tx: from={sender}, to={to}, value={value}, data={data[:20]}...")
         await asyncio.sleep(0.05)
         return {
             'success': True,
             'gas_used': 50000,
             'profit': 0.001,
             'pool_impact': 0.005,
             'protocols': ['UniswapV2'],
             'slippage': 0.001,
             'swap_route': [{'pool': '0x...', 'token_in': '0x...', 'token_out': '0x...'}],
             'token_in': '0x...',
             'amount_in': 10*1e18,
             'logs': [],
             'state_changes': {}
         }

# Optional BitQuery client placeholder
try:
     class BitqueryClientPlaceholder:
          async def connect_stream(self, filters):
               logging.info(f"Bitquery Stream Placeholder: Connecting with filters {filters}")
               count = 0
               while True:
                   await asyncio.sleep(10)
                   yield {'txHash': f'0xbitquerydummy{count}', 'from': '0xsender', 'to': '0xprotocol', 'input': '0x...', 'gasPrice': '50000000000'}
                   count += 1
except ImportError:
     logging.warning("BitQuery client not found. Disabling BitQuery stream.")
     BitqueryClientPlaceholder = None

@dataclass
class TransactionMetadata:
    tx_hash: str
    sender: Optional[str] = None
    to: Optional[str] = None
    gas_price: Optional[int] = None
    max_fee_per_gas: Optional[int] = None
    max_priority_fee_per_gas: Optional[int] = None
    value_wei: Optional[int] = 0
    input_data: Optional[str] = '0x'
    timestamp: float = 0.0
    source: str = 'unknown'
    protocols: List[str] = None
    simulation_result: Optional[Dict] = None
    estimated_profit: Optional[float] = None

    def __post_init__(self):
         if self.protocols is None:
              self.protocols = []

class ProductionMempoolMonitor:
    def __init__(self, monitor_config, ml_model, event_bus):
        self.config = monitor_config
        self.ml_model = ml_model
        self.event_bus = event_bus
        self.chain_id = self.config['CHAIN_ID']
        self.chain_name = self.config['CHAIN_NAME']
        self.logger = logging.getLogger(f"MempoolMonitor[{self.chain_name}]")
        self.rpc_endpoints = self.config.get('RPC_ENDPOINTS', [])
        if not self.rpc_endpoints:
             self.logger.critical(f"No RPC_ENDPOINTS provided for chain {self.chain_name}.")
             raise ValueError(f"Missing RPC endpoints for {self.chain_name}")
        self.w3_providers: List[Web3] = []
        for i, url in enumerate(self.rpc_endpoints):
             try:
                  if url.startswith('ws'):
                       provider = Web3(Web3.WebsocketProvider(url, websocket_timeout=60))
                  else:
                       provider = Web3(Web3.HTTPProvider(url))
                  if provider.isConnected():
                       self.w3_providers.append(provider)
                       self.logger.info(f"Connected to RPC provider {i}: {url}")
                  else:
                       self.logger.error(f"Failed to connect to RPC provider {i}: {url}")
             except Exception as e:
                  self.logger.error(f"Error initializing RPC provider {i} ({url}): {e}", exc_info=True)
        if not self.w3_providers:
             self.logger.critical(f"No valid Web3 providers connected for {self.chain_name}.")
             raise ConnectionError(f"Failed to connect any RPC providers for {self.chain_name}.")
        self.bitquery = self._init_bitquery_client(self.config.get('BITQUERY_KEY'))
        self.redis_processed_key = f"processed_txs:{self.chain_id}"
        self.redis_sim_cache_key_prefix = f"sim_cache:{self.chain_id}:"
        self.redis_client = None
        try:
            redis_cfg = self.config.get('REDIS_CONFIG', {})
            if redis_cfg and redis_cfg.get('host'):
                 self.redis_client = redis.Redis(**redis_cfg, decode_responses=True)
                 self.logger.info(f"Redis client initialized for caching: {redis_cfg['host']}:{redis_cfg.get('port', 6379)}")
            else:
                 self.logger.warning("Redis config not found. Simulation caching disabled.")
        except Exception as e:
             self.logger.error(f"Failed to initialize Redis client: {e}", exc_info=True)
             self.redis_client = None
        sim_rpc = self.config.get('SIMULATION_RPC')
        if not sim_rpc:
             self.logger.warning("SIMULATION_RPC not defined. Using primary RPC for simulation.")
             sim_rpc = self.rpc_endpoints[0]
        self.simulation_engine = REVMSimulator(sim_rpc)
        self.min_profit_threshold = self.config.get('MIN_PROFIT_THRESHOLD', 0.1)
        self.monitored_protocols = self.config.get('MONITORED_PROTOCOLS', [])
        self._running = False

    def _init_bitquery_client(self, api_key):
        if BitqueryClientPlaceholder and api_key:
             self.logger.info("Initializing BitQuery client (Placeholder).")
             return BitqueryClientPlaceholder()
        elif not api_key:
             self.logger.warning("BITQUERY_KEY not provided. BitQuery stream disabled.")
             return None
        else:
             self.logger.warning("Actual BitQuery client initialization is needed.")
             return None

    async def start(self):
        if self._running:
             self.logger.warning("Monitor is already running.")
             return
        self._running = True
        self.logger.info(f"Starting monitor streams for {self.chain_name}...")
        tasks = []
        for i, w3 in enumerate(self.w3_providers):
             if isinstance(w3.provider, Web3.WebsocketProvider):
                  tasks.append(asyncio.create_task(self._stream_local_websocket(w3, f"local_ws_{i}")))
             else:
                   self.logger.warning(f"RPC provider {i} is HTTP. Subscription not available.")
        if self.bitquery:
            tasks.append(asyncio.create_task(self._stream_bitquery_mempool()))
        if not tasks:
             self.logger.error("No monitoring streams could be started.")
             self._running = False
             return
        self.logger.info(f"Started {len(tasks)} monitoring stream tasks.")
        try:
            await asyncio.gather(*tasks)
        except asyncio.CancelledError:
             self.logger.info("Monitor tasks cancelled.")
        finally:
             self._running = False
             self.logger.info(f"Monitor stopped for {self.chain_name}.")

    async def stop(self):
         self.logger.info(f"Received stop signal for {self.chain_name}.")
         self._running = False

    async def _stream_local_websocket(self, w3: Web3, source_id: str):
         while self._running:
              subscription_id = None
              try:
                   self.logger.info(f"Subscribing to newPendingTransactions via {source_id}...")
                   subscription_id = await asyncio.to_thread(w3.eth.subscribe, 'newPendingTransactions')
                   self.logger.info(f"Subscribed with ID: {subscription_id} on {source_id}")
                   while self._running:
                        new_tx_hashes = await asyncio.to_thread(w3.eth.get_filter_changes, subscription_id)
                        if new_tx_hashes:
                             process_tasks = [self._fetch_and_process_tx(w3, tx_hash, source_id) for tx_hash in new_tx_hashes]
                             await asyncio.gather(*process_tasks)
                        await asyncio.sleep(0.5)
              except (w3_exceptions.ProviderConnectionError, asyncio.TimeoutError) as e:
                   self.logger.error(f"Connection error on {source_id}: {e}. Reconnecting in 10s...")
                   await asyncio.sleep(10)
              except asyncio.CancelledError:
                   self.logger.info(f"Local stream {source_id} cancelled.")
                   break
              except Exception as e:
                   self.logger.error(f"Error in local mempool stream {source_id}: {e}", exc_info=True)
                   self.event_bus.publish("monitor_error", {"chain": self.chain_name, "source": source_id, "error": str(e)})
                   await asyncio.sleep(5)
              finally:
                 if subscription_id:
                     try:
                         await asyncio.to_thread(w3.eth.unsubscribe, subscription_id)
                         self.logger.info(f"Unsubscribed from {subscription_id} on {source_id}")
                     except Exception as unsub_e:
                         self.logger.warning(f"Failed to unsubscribe from {subscription_id} on {source_id}: {unsub_e}")
                 if self._running:
                      await asyncio.sleep(1)
         self.logger.info(f"Local websocket stream {source_id} stopped.")

    async def _fetch_and_process_tx(self, w3: Web3, tx_hash, source_id: str):
        try:
            if self.redis_client and await self.redis_client.sismember(self.redis_processed_key, tx_hash.hex()):
                return
            tx_data = await asyncio.to_thread(w3.eth.get_transaction, tx_hash)
            if tx_data:
                await self._process_transaction(tx_data, source=source_id)
            else:
                self.logger.warning(f"Could not retrieve tx details for {tx_hash.hex()} from {source_id}")
        except w3_exceptions.TransactionNotFound:
            self.logger.debug(f"Transaction {tx_hash.hex()} not found on {source_id}.")
        except asyncio.CancelledError:
             raise
        except Exception as e:
            self.logger.error(f"Error fetching/processing tx {tx_hash.hex()} from {source_id}: {e}", exc_info=True)

    async def _stream_bitquery_mempool(self):
          if not self.bitquery: return
          while self._running:
               try:
                    self.logger.info("Connecting to BitQuery stream...")
                    stream_filters = {}
                    async for tx_event in self.bitquery.connect_stream(filters=stream_filters):
                         tx_formatted = self._adapt_bitquery_tx(tx_event)
                         if tx_formatted:
                              await self._process_transaction(tx_formatted, source="bitquery")
                         else:
                              self.logger.warning(f"Could not adapt BitQuery event: {tx_event}")
               except asyncio.CancelledError:
                    self.logger.info("Bitquery stream cancelled.")
                    break
               except Exception as e:
                    self.logger.error(f"Error in BitQuery stream: {e}", exc_info=True)
                    self.event_bus.publish("monitor_error", {"chain": self.chain_name, "source": "bitquery", "error": str(e)})
                    await asyncio.sleep(10)
          self.logger.info("Bitquery stream stopped.")

    def _adapt_bitquery_tx(self, bq_tx):
        try:
            return {
                 'hash': bq_tx.get('txHash') or bq_tx.get('hash'),
                 'from': bq_tx.get('from'),
                 'to': bq_tx.get('to'),
                 'value': int(bq_tx.get('value', 0)),
                 'gasPrice': int(bq_tx.get('gasPrice', 0)),
                 'input': bq_tx.get('input') or bq_tx.get('data', '0x'),
                 'maxFeePerGas': int(bq_tx.get('maxFeePerGas', 0)) if bq_tx.get('maxFeePerGas') else None,
                 'maxPriorityFeePerGas': int(bq_tx.get('maxPriorityFeePerGas', 0)) if bq_tx.get('maxPriorityFeePerGas') else None,
            }
        except Exception as e:
             self.logger.error(f"Error adapting BitQuery tx: {e} - Data: {bq_tx}")
             return None

    async def _process_transaction(self, tx_data, source):
        tx_hash = self._extract_tx_hash(tx_data)
        if not tx_hash:
             self.logger.debug(f"Tx from {source} missing hash. Skipping.")
             return
        if self.redis_client:
            try:
                if await self.redis_client.sadd(self.redis_processed_key, tx_hash) == 0:
                    return
            except Exception as redis_e:
                self.logger.error(f"Redis error for {tx_hash[:10]}: {redis_e}")
        self.logger.debug(f"Processing Tx: {tx_hash[:10]}... from {source}")
        if not self._quick_filter(tx_data):
            self.logger.debug(f"Tx {tx_hash[:10]}... failed quick filter.")
            return
        simulation_result = await self._simulate_transaction(tx_data)
        if not simulation_result or not simulation_result.get('success'):
             self.logger.debug(f"Tx {tx_hash[:10]}... simulation failed.")
             return
        features = self._extract_features(tx_data, simulation_result)
        profit_score = 0.0
        if self.ml_model:
            try:
                profit_score = self.ml_model.predict(features)
                self.logger.debug(f"Tx {tx_hash[:10]}... ML score: {profit_score:.4f}")
            except Exception as ml_e:
                self.logger.error(f"ML prediction failed for {tx_hash[:10]}: {ml_e}")
                profit_score = simulation_result.get('profit', 0)
        else:
             profit_score = simulation_result.get('profit', 0)
             self.logger.debug(f"Tx {tx_hash[:10]}... using simulation profit: {profit_score:.4f}")
        if profit_score > self.min_profit_threshold:
            self.logger.info(f"*** Opportunity Detected! *** Tx: {tx_hash[:10]}..., Source: {source}, Est. Profit: {profit_score:.6f} ETH")
            metadata = TransactionMetadata(
                tx_hash=tx_hash,
                sender=self._extract_sender(tx_data),
                to=self._extract_receiver(tx_data),
                gas_price=self._extract_gas_price(tx_data),
                max_fee_per_gas=self._extract_max_fee(tx_data),
                max_priority_fee_per_gas=self._extract_priority_fee(tx_data),
                value_wei=self._extract_value(tx_data),
                input_data=self._extract_input_data(tx_data),
                timestamp=time.time(),
                source=source,
                protocols=self._identify_protocols(tx_data, simulation_result),
                simulation_result=simulation_result,
                estimated_profit=profit_score
            )
            self.event_bus.publish("opportunity_detected", metadata)
        else:
            self.logger.debug(f"Tx {tx_hash[:10]}... profit score {profit_score:.4f} below threshold.")

    async def _simulate_transaction(self, tx_data):
        tx_hash = self._extract_tx_hash(tx_data)
        cache_key = f"{self.redis_sim_cache_key_prefix}{tx_hash}"
        if self.redis_client:
            try:
                cached_result = await self.redis_client.get(cache_key)
                if cached_result:
                    self.logger.debug(f"Simulation cache HIT for tx {tx_hash[:10]}...")
                    return json.loads(cached_result)
            except Exception as redis_e:
                 self.logger.error(f"Redis GET error for {cache_key}: {redis_e}")
        self.logger.debug(f"Simulation cache MISS for tx {tx_hash[:10]}... Running simulation.")
        try:
            params = {
                 'sender': self._extract_sender(tx_data),
                 'to': self._extract_receiver(tx_data),
                 'value': self._extract_value(tx_data),
                 'data': self._extract_input_data(tx_data)
            }
            sim_params = {k: v for k, v in params.items() if v is not None}
            sim_result = await self.simulation_engine.simulate(**sim_params)
            if self.redis_client and sim_result:
                try:
                    await self.redis_client.setex(cache_key, 300, json.dumps(sim_result))
                except Exception as redis_e:
                    self.logger.error(f"Redis SETEX error for {cache_key}: {redis_e}")
            return sim_result
        except asyncio.CancelledError:
              raise
        except Exception as e:
            self.logger.error(f"Simulation failed for tx {tx_hash[:10]}: {e}", exc_info=True)
            self.event_bus.publish("simulation_error", {"chain": self.chain_name, "tx_hash": tx_hash, "error": str(e)})
            return {}

    def _extract_tx_hash(self, tx) -> Optional[str]:
          tx_hash_obj = tx.get('hash') or tx.get('txHash')
          return tx_hash_obj.hex() if tx_hash_obj else None

    def _quick_filter(self, tx) -> bool:
        min_gas = 1_000_000_000
        gas_price = self._extract_gas_price(tx) or self._extract_max_fee(tx) or 0
        if gas_price < min_gas:
            return False
        if not self._extract_receiver(tx):
             return False
        return True

    def _extract_sender(self, tx) -> Optional[str]:
        return tx.get('from')

    def _extract_receiver(self, tx) -> Optional[str]:
         return tx.get('to')

    def _extract_value(self, tx) -> int:
         return tx.get('value', 0)

    def _extract_input_data(self, tx) -> str:
         return tx.get('input') or tx.get('data', '0x')

    def _extract_gas_price(self, tx) -> Optional[int]:
        gp = tx.get('gasPrice')
        return int(gp) if gp is not None else None

    def _extract_max_fee(self, tx) -> Optional[int]:
         mf = tx.get('maxFeePerGas')
         return int(mf) if mf is not None else None

    def _extract_priority_fee(self, tx) -> Optional[int]:
         mpf = tx.get('maxPriorityFeePerGas')
         return int(mpf) if mpf is not None else None

    def _identify_protocols(self, tx, simulation_result) -> List[str]:
        protocols = set(simulation_result.get('protocols', []))
        identified = [p for p in protocols if p in self.monitored_protocols]
        return identified

    def _extract_features(self, tx, simulation_result):
         features = {}
         features['gas_price_gwei'] = (self._extract_gas_price(tx) or self._extract_max_fee(tx) or 0) / 1e9
         features['priority_fee_gwei'] = (self._extract_priority_fee(tx) or 0) / 1e9
         features['value_eth'] = self._extract_value(tx) / 1e18
         features['input_data_len'] = len(self._extract_input_data(tx)) // 2 - 1
         features['sim_success'] = 1.0 if simulation_result.get('success') else 0.0
         features['sim_profit'] = simulation_result.get('profit', 0)
         features['sim_gas_used'] = simulation_result.get('gas_used', 0)
         features['sim_gas_used_normalized'] = features.get('sim_gas_used', 0) / 300000.0
         features['sim_pool_impact'] = simulation_result.get('pool_impact', 0)
         features['sim_slippage'] = simulation_result.get('slippage', 0)
         features['sim_protocols_count'] = len(simulation_result.get('protocols', []))
         expected_feature_keys = self.config.get('ML_FEATURE_KEYS', ['sim_profit', 'sim_gas_used_normalized'])
         feature_vector = [features.get(k, 0.0) for k in expected_feature_keys]
         return feature_vector
