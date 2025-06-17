# chain_registry.py

import os
import json
import logging
from typing import Dict, Optional, List
from web3 import Web3

DEFAULT_CHAIN_CONFIG_PATH = 'chains'
DEFAULT_PROTOCOL_CONFIG_PATH = 'protocols'

logger = logging.getLogger(__name__)

class ChainRegistry:
    def __init__(self, config_path=DEFAULT_CHAIN_CONFIG_PATH):
        self.config_path = config_path
        self.chains: Dict[int, Dict] = {}
        self.providers: Dict[int, Web3] = {}
        try:
            os.makedirs(config_path, exist_ok=True)
            self._load_chain_configs()
            logger.info(f"ChainRegistry initialized. Loaded {len(self.chains)} chain configs from '{config_path}'.")
        except Exception as e:
            logger.error(f"Failed to initialize ChainRegistry: {e}", exc_info=True)

    def _load_chain_configs(self):
        loaded_count = 0
        for filename in os.listdir(self.config_path):
            if filename.endswith('.json'):
                file_path = os.path.join(self.config_path, filename)
                try:
                    with open(file_path, 'r') as f:
                        chain_config = json.load(f)
                        chain_id_str = chain_config.get('chainId') or chain_config.get('chain_id')
                        if chain_id_str:
                             chain_id = int(chain_id_str)
                             if 'name' not in chain_config:
                                 chain_config['name'] = filename.replace('.json', '').replace('chain_', '').capitalize()
                             self.chains[chain_id] = chain_config
                             loaded_count += 1
                        else:
                            logger.warning(f"Skipping config {filename}: Missing 'chainId' or 'chain_id'.")
                except Exception as e:
                    logger.error(f"Error loading chain config {filename}: {e}", exc_info=True)
        # logger.debug(f"_load_chain_configs finished. Loaded {loaded_count} configs.")

    def get_chain(self, chain_id: int) -> Optional[Dict]:
        return self.chains.get(chain_id)

    def get_rpc_url(self, chain_id: int) -> Optional[str]:
         chain_config = self.get_chain(chain_id)
         if not chain_config:
             logger.warning(f"No configuration found for chain ID {chain_id}.")
             return None
         rpc_url = chain_config.get('rpcUrl') or chain_config.get('rpc_url')
         if rpc_url:
             if isinstance(rpc_url, list):
                 if rpc_url:
                     rpc_url = rpc_url[0]
                 else:
                     rpc_url = None
             if rpc_url: return rpc_url
         env_var_key = chain_config.get('rpcEnvVar') or chain_config.get('rpc_env_var')
         if env_var_key:
             rpc_url = os.getenv(env_var_key)
             if rpc_url:
                 logger.debug(f"Using RPC URL from environment variable {env_var_key} for chain {chain_id}.")
                 return rpc_url
             else:
                  logger.warning(f"Environment variable {env_var_key} specified for chain {chain_id}, but it's not set.")
         chain_name = chain_config.get('name', f'unknown_{chain_id}').upper()
         fallback_env_var = f"RPC_{chain_name}"
         rpc_url = os.getenv(fallback_env_var)
         if rpc_url:
             return rpc_url
         logger.error(f"Could not determine RPC URL for chain ID {chain_id} (Name: {chain_config.get('name', 'N/A')}).")
         return None

    def get_web3_provider(self, chain_id: int) -> Optional[Web3]:
        if chain_id in self.providers:
             if self.providers[chain_id].isConnected():
                 return self.providers[chain_id]
             else:
                  logger.warning(f"Cached provider for chain {chain_id} disconnected. Creating new one.")
                  del self.providers[chain_id]
        rpc_url = self.get_rpc_url(chain_id)
        if not rpc_url:
             logger.error(f"Cannot create Web3 provider for chain {chain_id}: No RPC URL found.")
             return None
        try:
            provider = Web3(Web3.HTTPProvider(rpc_url))
            if provider.isConnected():
                self.providers[chain_id] = provider
                logger.info(f"Created and cached Web3 provider for chain {chain_id} at {rpc_url}")
                return provider
            else:
                logger.error(f"Failed to connect Web3 provider for chain {chain_id} at {rpc_url}.")
                return None
        except Exception as e:
            logger.error(f"Error creating Web3 provider for chain {chain_id} ({rpc_url}): {e}", exc_info=True)
            return None

    def add_chain(self, chain_config: Dict) -> bool:
        chain_id = chain_config.get('chainId') or chain_config.get('chain_id')
        if not chain_id:
            logger.error("Cannot add chain: Missing 'chainId' or 'chain_id'.")
            return False
        try:
             chain_id = int(chain_id)
        except ValueError:
            logger.error(f"Cannot add chain: Invalid chain ID format '{chain_id}'. Must be integer.")
            return False
        self.chains[chain_id] = chain_config
        filename = f"chain_{chain_id}.json"
        filepath = os.path.join(self.config_path, filename)
        try:
            with open(filepath, 'w') as f:
                json.dump(chain_config, f, indent=2)
            logger.info(f"Added/Updated chain {chain_id} config to {filepath}.")
            if chain_id in self.providers:
                del self.providers[chain_id]
                logger.debug(f"Invalidated provider cache for updated chain {chain_id}.")
            return True
        except Exception as e:
            logger.error(f"Error saving chain config file {filepath}: {e}", exc_info=True)
            if chain_id in self.chains:
                 del self.chains[chain_id]
            return False

    def update_chain(self, chain_id: int, chain_config: Dict) -> bool:
        if chain_id not in self.chains:
            logger.warning(f"Chain {chain_id} not found for updating. Use add_chain instead.")
            return False
        chain_config['chainId'] = chain_id
        return self.add_chain(chain_config)

    def get_all_chains(self) -> Dict[int, Dict]:
        return self.chains


class ProtocolRegistry:
    def __init__(self, config_path=DEFAULT_PROTOCOL_CONFIG_PATH):
        self.config_path = config_path
        self.protocols: Dict[str, Dict] = {}
        try:
            os.makedirs(config_path, exist_ok=True)
            self._load_protocol_configs()
            logger.info(f"ProtocolRegistry initialized. Loaded {len(self.protocols)} protocol configs from '{self.config_path}'.")
        except Exception as e:
             logger.error(f"Failed to initialize ProtocolRegistry: {e}", exc_info=True)

    def _load_protocol_configs(self):
        loaded_count = 0
        for filename in os.listdir(self.config_path):
            if filename.endswith('.json'):
                file_path = os.path.join(self.config_path, filename)
                try:
                    with open(file_path, 'r') as f:
                        protocol_config = json.load(f)
                        protocol_name = protocol_config.get('name')
                        if protocol_name:
                            protocol_key = protocol_name
                            self.protocols[protocol_key] = protocol_config
                            loaded_count += 1
                        else:
                            logger.warning(f"Skipping protocol config {filename}: Missing 'name'.")
                except Exception as e:
                    logger.error(f"Error loading protocol config {filename}: {e}", exc_info=True)
        # logger.debug(f"_load_protocol_configs finished. Loaded {loaded_count} configs.")

    def get_protocol(self, protocol_name: str) -> Optional[Dict]:
        return self.protocols.get(protocol_name)

    def get_protocol_abis(self, protocol_name: str) -> Dict[str, List]:
        protocol = self.get_protocol(protocol_name)
        if not protocol:
            logger.warning(f"Cannot load ABIs: Protocol '{protocol_name}' not found.")
            return {}
        abis = {}
        contracts_info = protocol.get('contracts', {})
        if not contracts_info:
             logger.warning(f"Protocol '{protocol_name}' config has no 'contracts' section.")
             return {}
        for contract_name, contract_details in contracts_info.items():
            abi_path = contract_details.get('abiPath') or contract_details.get('abi_path')
            if abi_path:
                try:
                    abi_full_path = abi_path
                    with open(abi_full_path, 'r') as f:
                        abis[contract_name] = json.load(f)
                        logger.debug(f"Loaded ABI for {protocol_name}/{contract_name} from {abi_full_path}")
                except Exception as e:
                    logger.error(f"Error loading ABI for {protocol_name}/{contract_name} from {abi_path}: {e}", exc_info=True)
            else:
                logger.debug(f"No 'abiPath' defined for contract '{contract_name}' in protocol '{protocol_name}'.")
        return abis

    def get_protocol_chain_config(self, protocol_name: str, chain_id: int) -> Optional[Dict]:
        protocol = self.get_protocol(protocol_name)
        if not protocol:
             logger.warning(f"Protocol '{protocol_name}' not found.")
             return None
        chains_config = protocol.get('chains', {})
        chain_config = chains_config.get(str(chain_id))
        if not chain_config:
             return None
        return chain_config

    def add_protocol(self, protocol_config: Dict) -> bool:
        protocol_name = protocol_config.get('name')
        if not protocol_name:
            logger.error("Cannot add protocol: Missing 'name'.")
            return False
        protocol_key = protocol_name
        self.protocols[protocol_key] = protocol_config
        filename_base = protocol_name.lower().replace(' ', '_').replace('.', '')
        filename = f"{filename_base}.json"
        filepath = os.path.join(self.config_path, filename)
        try:
            with open(filepath, 'w') as f:
                json.dump(protocol_config, f, indent=2)
            logger.info(f"Added/Updated protocol '{protocol_name}' config to {filepath}.")
            return True
        except Exception as e:
            logger.error(f"Error saving protocol config file {filepath}: {e}", exc_info=True)
            if protocol_key in self.protocols:
                 del self.protocols[protocol_key]
            return False

    def update_protocol(self, protocol_name: str, protocol_config: Dict) -> bool:
        protocol_key = protocol_name
        if protocol_key not in self.protocols:
             logger.warning(f"Protocol '{protocol_name}' not found for updating. Use add_protocol instead.")
             return False
        protocol_config['name'] = protocol_name
        return self.add_protocol(protocol_config)

    def get_protocols_for_chain(self, chain_id: int) -> Dict[str, Dict]:
        chain_protocols = {}
        target_chain_id_str = str(chain_id)
        for protocol_name, protocol_config in self.protocols.items():
            chain_config = protocol_config.get('chains', {}).get(target_chain_id_str)
            if chain_config:
                chain_protocols[protocol_name] = chain_config
        logger.debug(f"Found {len(chain_protocols)} protocols for chain {chain_id}.")
        return chain_protocols

    def get_all_protocols(self) -> Dict[str, Dict]:
        return self.protocols


class MultiChainMonitor:
     """ Manages monitoring instances across multiple chains """
     def __init__(self, config):
         self.config = config
         self.chain_registry = ChainRegistry()
         self.protocol_registry = ProtocolRegistry()
         self.active_monitors: Dict[int, object] = {}
         self.monitor_tasks: Dict[int, asyncio.Task] = {}
         self.event_bus = None
         self.ml_model = None
         self.logger = logging.getLogger(self.__class__.__name__)

     async def initialize(self, event_bus, ml_model):
         self.event_bus = event_bus
         self.ml_model = ml_model
         enabled_chains = self.config.get('ENABLED_CHAINS', [])
         if not enabled_chains:
             self.logger.warning("ENABLED_CHAINS is empty.")
             return
         self.logger.info(f"Initializing monitors for chains: {enabled_chains}")
         start_tasks = [self.start_chain_monitor(chain_id) for chain_id in enabled_chains]
         results = await asyncio.gather(*start_tasks, return_exceptions=True)
         for chain_id, result in zip(enabled_chains, results):
              if isinstance(result, Exception):
                   self.logger.error(f"Failed monitor for chain {chain_id}: {result}", exc_info=result)
              elif not result:
                   self.logger.error(f"Monitor for chain {chain_id} did not start successfully (returned False).")
         self.logger.info("Multi-chain monitor initialization complete.")

     async def start_chain_monitor(self, chain_id: int) -> bool:
         if chain_id in self.active_monitors:
             self.logger.warning(f"Monitor for chain {chain_id} is already active.")
             return True
         chain_config = self.chain_registry.get_chain(chain_id)
         if not chain_config:
             self.logger.error(f"No configuration for chain {chain_id}.")
             return False
         chain_name = chain_config.get('name', f"Chain {chain_id}")
         self.logger.info(f"Starting monitor for chain {chain_id} ({chain_name})...")
         provider = self.chain_registry.get_web3_provider(chain_id)
         if not provider:
             return False
         chain_protocols = self.protocol_registry.get_protocols_for_chain(chain_id)
         protocol_names = list(chain_protocols.keys())
         if not protocol_names:
              self.logger.warning(f"No protocols configured for chain {chain_id}.")
         try:
             from mempool_monitor import ProductionMempoolMonitor
         except ImportError:
              self.logger.critical("Failed to import ProductionMempoolMonitor.")
              return False
         rpc_url = self.chain_registry.get_rpc_url(chain_id)
         if not rpc_url:
              self.logger.error(f"RPC URL missing for chain {chain_id}.")
              return False
         monitor_config = {
             **self.config,
             'CHAIN_ID': chain_id,
             'CHAIN_NAME': chain_name,
             'RPC_ENDPOINTS': [rpc_url],
             'MONITORED_PROTOCOLS': protocol_names,
         }
         try:
             monitor = ProductionMempoolMonitor(monitor_config, self.ml_model, self.event_bus)
             monitor_task = asyncio.create_task(monitor.start())
             self.monitor_tasks[chain_id] = monitor_task
             self.active_monitors[chain_id] = monitor
             self.logger.info(f"Started monitor for chain {chain_id} ({chain_name}). Protocols: {protocol_names}")
             return True
         except Exception as e:
             self.logger.error(f"Failed to start monitor for chain {chain_id}: {e}", exc_info=True)
             return False

     async def add_chain_monitor(self, chain_id: int) -> bool:
         self.logger.info(f"Request to add monitor for chain {chain_id}.")
         if chain_id in self.active_monitors:
             self.logger.warning(f"Monitor for chain {chain_id} already exists.")
             return False
         success = await self.start_chain_monitor(chain_id)
         if success:
              self.logger.info(f"Dynamically added monitor for chain {chain_id}.")
         else:
              self.logger.error(f"Failed to add monitor for chain {chain_id}.")
         return success

     async def remove_chain_monitor(self, chain_id: int) -> bool:
         self.logger.info(f"Request to remove monitor for chain {chain_id}.")
         monitor = self.active_monitors.get(chain_id)
         monitor_task = self.monitor_tasks.get(chain_id)
         if not monitor or not monitor_task:
             self.logger.warning(f"No active monitor for chain {chain_id}.")
             return False
         try:
             if hasattr(monitor, 'stop') and asyncio.iscoroutinefunction(monitor.stop):
                 await monitor.stop()
             else:
                  monitor_task.cancel()
                  try:
                      await monitor_task
                  except asyncio.CancelledError:
                       self.logger.debug(f"Monitor task for chain {chain_id} cancelled.")
                  except Exception as e:
                       self.logger.error(f"Error cancelling monitor task for chain {chain_id}: {e}")
             del self.active_monitors[chain_id]
             del self.monitor_tasks[chain_id]
             self.logger.info(f"Successfully removed monitor for chain {chain_id}.")
             return True
         except Exception as e:
              self.logger.error(f"Exception while stopping monitor for chain {chain_id}: {e}", exc_info=True)
              return False

     async def stop_all(self):
          self.logger.info("Stopping all active chain monitors...")
          chain_ids = list(self.active_monitors.keys())
          stop_tasks = [self.remove_chain_monitor(chain_id) for chain_id in chain_ids]
          results = await asyncio.gather(*stop_tasks, return_exceptions=True)
          stopped_count = sum(1 for res in results if res is True)
          failed_count = len(results) - stopped_count
          self.logger.info(f"Stopped {stopped_count} monitors. Failed to stop {failed_count}.")

     def get_active_monitors(self) -> List[int]:
          return list(self.active_monitors.keys())
