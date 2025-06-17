import os
import yaml
from typing import Any

class ConfigManager:
    def __init__(self, config_path='config.yaml'):
        self.config_path = config_path
        self.config = self._load_config()
        self._apply_env_overrides()

    def _load_config(self):
        try:
            with open(self.config_path, 'r') as f:
                return yaml.safe_load(f)
        except FileNotFoundError:
            print(f"Warning: config file '{self.config_path}' not found. Using defaults and environment variables.")
            return self._get_default_config()
        except Exception as e:
            print(f"Error loading config file '{self.config_path}': {e}. Using defaults.")
            return self._get_default_config()

    def _get_default_config(self):
        # Define defaults here, environment variables will override if set
        return {
            'RPC_URL': 'http://localhost:8545',
            'RPC_URLS': {
                'ethereum': None, # Expecting env var RPC_ETHEREUM
                'arbitrum': None, # Expecting env var RPC_ARBITRUM
                'optimism': None, # Expecting env var RPC_OPTIMISM
            },
            'BITQUERY_KEY': None,
            'MEV_SHARE_KEY': None,
            'MEV_BLOCKER_RPC': None,
            'PRIVATE_KEY': '', # Critical: Should always be set via environment
            'FLASHBOTS_AUTH_KEY': '', # Optional: For Flashbots reputation
            'PROFIT_THRESHOLD': 0.015, # Example threshold in ETH or stablecoin
            'GAS_LIMIT': 500000,
            'MAX_GAS_PRICE_GWEI': 200,
            'MONITORED_PROTOCOLS': ['Uniswap', 'SushiSwap', 'Curve'], # Example
            'LOG_LEVEL': 'INFO',
            'LOG_FILE': None, # Set to a path like 'bot.log' to log to file
            'SIMULATION_CACHE_SIZE': 1000,
            'MIN_PROFIT_THRESHOLD': 0.1, # Minimum profit in ETH for execution
            'MIN_PREDICTION_THRESHOLD': 0.7, # ML model confidence threshold
            'BRIDGE_DATA_UPDATE_INTERVAL': 3600, # 1 hour
            'DEFENDER_API_KEY': None,
            'DEFENDER_API_SECRET': None,
            'DEFENDER_TEAM_ID': None,
            'DEFENDER_RELAYER_ID': None,
            'DEFENDER_NOTIFICATION_ID': None, # Will be set by DefenderIntegration possibly
            'SLACK_WEBHOOK_URL': None,
            'TELEGRAM_BOT_TOKEN': None,
            'TELEGRAM_CHAT_ID': None,
            'AUTO_RESPOND_TO_EXPLOITS': False,
            'VULNERABILITY_UPDATE_FREQUENCY': 86400, # 1 day
            'VULNERABILITY_SOURCES': [], # Add custom sources here if needed
            'ENABLE_MULTI_CHAIN': True,
            'ENABLED_CHAINS': [1, 42161], # Example: Ethereum & Arbitrum
            'ML_MODEL_DIR': 'models',
            'RL_ENABLED': True,
            'RL_UPDATE_FREQUENCY': 100, # Episodes between model saves
            'TARGET_GAS_PRICE': 50 * 10**9, # Example target gas price in Wei
            'BRIDGE_HISTORY_PATH': 'data/bridge_history.json',
            'HISTORICAL_ATTACKS_PATH': 'data/historical_attacks.json',
            'CUDA_KERNEL_PATH': 'kernels/arbitrage_sim.cu',
            'GPU_BATCH_SIZE': 128,
            'CUDA_DEVICE_ID': 0,
            'ZK_CIRCUIT_PATH': 'circuits/model_integrity.circom',
            'ZK_PROVING_KEY': 'keys/model_integrity.zkey',
            'ZK_VERIFICATION_KEY': 'keys/model_integrity_vk.json',
            'DP_EPSILON': 0.5,
            'DP_DELTA': 1e-5,
            'DP_SENSITIVITY': 1.0,
            'MODEL_DIR': 'models', # Redundant with ML_MODEL_DIR? Consolidate if needed.
            'REDIS_CONFIG': { # Example Redis config
                 'host': 'localhost',
                 'port': 6379,
                 'db': 0
             },
            'SIMULATION_RPC': os.getenv('SIMULATION_RPC', 'http://localhost:8545'), # RPC for Anvil/REVM simulator
            'CCIP_ROUTER_ADDRESSES': {}, # Add chain_id: address mapping
            'SUPPORTED_BRIDGES': {}, # Add bridge configurations for BridgeOptimizer
            'NETWORK_NAME': 'mainnet', # Network name for Defender
            # Add other specific contract addresses if needed
            # 'AAVE_LENDING_POOL': '0x...',
            # 'DYDX_SOLO_MARGIN': '0x...',
            # 'MAKER_FLASH_LENDER': '0x...',
            # 'ARBITRAGE_CONTRACT': '0x...' # Your deployed execution contract
        }

    def _apply_env_overrides(self):
        # Simple override: Check environment for keys matching the SCREAMING_SNAKE_CASE version of config keys
        default_keys = self._get_default_config().keys()
        for key in default_keys:
            env_var = key.upper() # Assumes env vars match config keys in uppercase
            env_value = os.getenv(env_var)
            if env_value is not None:
                 # Attempt type conversion based on default type
                default_value = self.config.get(key)
                try:
                    if isinstance(default_value, bool):
                        self.config[key] = env_value.lower() in ('true', '1', 'yes')
                    elif isinstance(default_value, int):
                        self.config[key] = int(env_value)
                    elif isinstance(default_value, float):
                        self.config[key] = float(env_value)
                    elif isinstance(default_value, list):
                        # Simple comma-separated list parsing
                        self.config[key] = [item.strip() for item in env_value.split(',')]
                    elif isinstance(default_value, dict):
                         # Requires more complex parsing (e.g., JSON string in env var)
                         print(f"Warning: Environment variable override for dict key '{key}' not automatically handled.")
                         # Example: Handle RPC_URLS specifically
                         if key == 'RPC_URLS':
                             self.config[key] = {
                                 'ethereum': os.getenv('RPC_ETHEREUM'),
                                 'arbitrum': os.getenv('RPC_ARBITRUM'),
                                 'optimism': os.getenv('RPC_OPTIMISM'),
                                 # Add other chains as needed
                              }
                         elif key == 'REDIS_CONFIG':
                              self.config[key] = {
                                  'host': os.getenv('REDIS_HOST', 'localhost'),
                                  'port': int(os.getenv('REDIS_PORT', '6379')) if os.getenv('REDIS_PORT') else 6379,
                                  'db': int(os.getenv('REDIS_DB', '0')) if os.getenv('REDIS_DB') else 0,
                                  'password': os.getenv('REDIS_PASSWORD') # Optional password
                              }

                    else: # Treat as string
                        self.config[key] = env_value
                except ValueError:
                     print(f"Warning: Could not convert environment variable {env_var}='{env_value}' for key '{key}'. Using default.")


    def get(self, key: str, default: Any = None) -> Any:
        return self.config.get(key, default)

    def __getitem__(self, key: str) -> Any:
        # Allow dictionary-style access, return None if key doesn't exist
        return self.config.get(key)

    def __contains__(self, key: str) -> bool:
        return key in self.config

    def save(self):
        # Avoid saving sensitive keys
        sensitive_keys = {'PRIVATE_KEY', 'DEFENDER_API_SECRET', 'DEFENDER_API_KEY', 'BITQUERY_KEY', 'SLACK_WEBHOOK_URL', 'TELEGRAM_BOT_TOKEN', 'FLASHBOTS_AUTH_KEY'}
        save_config = {k: v for k, v in self.config.items() if k not in sensitive_keys and not k.endswith('_KEY') and not k.endswith('_SECRET')}
        try:
            with open(self.config_path, 'w') as f:
                yaml.dump(save_config, f, default_flow_style=False, sort_keys=False)
        except Exception as e:
            print(f"Error saving config file '{self.config_path}': {e}")

# Create a single instance for anderen modules to import
config_manager = ConfigManager()
config = config_manager.config

# Example explicit overrides after initial load might be useful
# For example, ensure PRIVATE_KEY is loaded ONLY from env
config['PRIVATE_KEY'] = os.getenv('PRIVATE_KEY', '')
if not config['PRIVATE_KEY']:
    print("CRITICAL WARNING: PRIVATE_KEY is not set in environment variables!")

print("Configuration loaded.")
# Optional: print non-sensitive config items for verification
# print({k: v for k, v in config.items() if k != 'PRIVATE_KEY'})
