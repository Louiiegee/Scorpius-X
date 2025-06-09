#!/usr/bin/env python3
"""
Ultimate MEV Bot Configuration System
Combines the best of both Python and Rust MEV bot configurations
"""

import os
import yaml
import logging
from typing import Dict, Any, List, Optional
from dataclasses import dataclass, field

@dataclass
class MEVConfig:
    """MEV Bot Configuration with all strategy settings"""
    
    # Core Network Settings
    rpc_url: str = "http://localhost:8545"
    chain_id: int = 1
    network_name: str = "mainnet"
    live_trading: bool = False
    
    # Account Settings
    private_key: Optional[str] = None
    account_address: Optional[str] = None
    
    # MEV Protection Settings
    flashbots_auth_key: Optional[str] = None
    flashbots_relay: str = "https://relay.flashbots.net"
    flashbots_enabled: bool = True
    protect_mempool: bool = True
    use_private_pool: bool = True
    eden_endpoint: Optional[str] = None
    taichi_endpoint: Optional[str] = None
    
    # Strategy Settings
    profit_threshold: float = 0.015  # Minimum profit in ETH
    min_prediction_threshold: float = 0.7  # ML confidence threshold
    gas_limit: int = 600000
    max_gas_price_gwei: int = 150
    max_concurrent_executions: int = 5
    gas_price_gwei: int = 20
    max_gas_limit: int = 500000
    priority_fee_gwei: int = 2
    
    # Flash Loan Settings
    flashloan_contract_address: Optional[str] = None
    supported_flashloan_providers: List[str] = field(default_factory=lambda: [
        'aave', 'maker', 'dydx', 'balancer'
    ])
    
    # Monitoring Settings
    monitored_protocols: List[str] = field(default_factory=lambda: [
        'UniswapV2', 'UniswapV3', 'SushiSwap', 'Curve', 'Balancer'
    ])
    metrics_enabled: bool = True
    websocket_enabled: bool = True
    alert_threshold_profit: float = 1.0
    history_retention_hours: int = 24
    
    # Enhanced Logging Settings
    log_file_enabled: bool = True
    log_file_path: str = "./logs/mev_bot.log"
    log_max_file_size_mb: int = 100
    log_backup_count: int = 5
    
    # Contract Addresses (Mainnet)
    aave_v3_flashloan_provider: str = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2"
    balancer_flashloan_provider: str = "0xBA12222222228d8Ba445958a75a0704d566BF2C8"
    uniswap_v2_dex_router: str = "0x7a250d5630B4cF539739dF2C5dAcb4c659F2488D"
    uniswap_v3_dex_router: str = "0xE592427A0AEce92De3Edee1F18E0157C05861564"
    sushiswap_dex_router: str = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"
    chainlink_eth_usd_oracle: str = "0x5f4eC3Df9cbd43714FE2740f5E3616155c5b8419"
    chainlink_btc_usd_oracle: str = "0xF4030086522a5bEEa4988F8cA5B36dbC97BeE88c"
    
    # Risk Management
    max_position_size_eth: float = 10.0
    stop_loss_percentage: float = 5.0
    max_daily_loss: float = 2.0
    cooldown_after_loss_seconds: int = 300
    
    # Performance Settings
    opportunity_queue_size: int = 1000
    simulation_cache_size: int = 1000
    concurrent_strategies: int = 4
    
    # Rust Core Settings
    rust_bin_path: str = "./rust_mev_components/rust_core/target/release/mev_rust_core"
    rust_max_hops: int = 3
    rust_enabled: bool = True
    rust_timeout_seconds: int = 30
    rust_memory_limit_mb: int = 512
    
    # ML Settings
    ml_model_dir: str = "models"
    ml_model_path: str = "./models/"
    ml_confidence_threshold: float = 0.6
    ml_retrain_interval_hours: int = 24
    ml_feature_window_blocks: int = 100
    rl_enabled: bool = True
    rl_update_frequency: int = 100
    
    # Logging Settings
    log_level: str = "INFO"
    log_file: Optional[str] = None

class UltimateMEVConfigManager:
    """Enhanced configuration manager for the ultimate MEV bot"""
    
    def __init__(self, config_path: str = 'mev_config.yaml'):
        self.config_path = config_path
        self.strategies_config = {}  # Initialize before loading config
        self.config = self._load_config()
        self._apply_env_overrides()
        self._validate_config()
        
        # Setup logging
        self._setup_logging()
        self.logger = logging.getLogger(self.__class__.__name__)
        self.logger.info(f"MEV Configuration loaded from {config_path}")
    
    def _load_config(self) -> MEVConfig:
        """Load configuration from YAML file with fallback to defaults"""
        try:
            if os.path.exists(self.config_path):
                with open(self.config_path, 'r') as f:
                    yaml_config = yaml.safe_load(f)
                
                # Handle nested strategies section by removing it from the top-level config
                # We'll handle strategies separately
                if 'strategies' in yaml_config:
                    self.strategies_config = yaml_config.pop('strategies')
                else:
                    self.strategies_config = {}
                
                # Create MEVConfig with remaining top-level fields
                return MEVConfig(**yaml_config)
            else:
                print(f"Config file {self.config_path} not found. Using defaults.")
                self.strategies_config = {}
                return MEVConfig()
        except Exception as e:
            print(f"Error loading config: {e}. Using defaults.")
            self.strategies_config = {}
            return MEVConfig()
    
    def _apply_env_overrides(self):
        """Apply environment variable overrides"""
        env_mappings = {
            'RPC_URL': 'rpc_url',
            'PRIVATE_KEY': 'private_key',
            'CHAIN_ID': 'chain_id',
            'FLASHBOTS_AUTH_KEY': 'flashbots_auth_key',
            'FLASHLOAN_CONTRACT_ADDRESS': 'flashloan_contract_address',
            'RUST_BIN_PATH': 'rust_bin_path',
            'LOG_LEVEL': 'log_level',
            'PROFIT_THRESHOLD': 'profit_threshold',
            'MAX_GAS_PRICE_GWEI': 'max_gas_price_gwei'
        }
        
        for env_key, config_attr in env_mappings.items():
            env_value = os.environ.get(env_key)
            if env_value:
                # Type conversion
                if config_attr in ['chain_id', 'max_gas_price_gwei']:
                    env_value = int(env_value)
                elif config_attr in ['profit_threshold']:
                    env_value = float(env_value)
                
                setattr(self.config, config_attr, env_value)
    
    def _validate_config(self):
        """Validate critical configuration parameters"""
        if not self.config.rpc_url:
            raise ValueError("RPC_URL is required")
        
        if self.config.private_key and not self.config.private_key.startswith('0x'):
            self.config.private_key = '0x' + self.config.private_key
    
    def _setup_logging(self):
        """Setup logging configuration"""
        log_level = getattr(logging, self.config.log_level.upper(), logging.INFO)
        log_format = '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        
        if self.config.log_file:
            logging.basicConfig(
                level=log_level,
                format=log_format,
                filename=self.config.log_file,
                filemode='a'
            )
        else:
            logging.basicConfig(level=log_level, format=log_format)
    
    def get_strategy_config(self, strategy_name: str) -> Dict[str, Any]:
        """Get strategy-specific configuration"""
        base_config = {
            'profit_threshold': self.config.profit_threshold,
            'gas_limit': self.config.gas_limit,
            'max_gas_price_gwei': self.config.max_gas_price_gwei,
            'ml_threshold': self.config.min_prediction_threshold
        }
        
        strategy_configs = {
            'flashloan_arbitrage': {
                **base_config,
                'providers': self.config.supported_flashloan_providers,
                'contract_address': self.config.flashloan_contract_address
            },
            'sandwich_attack': {
                **base_config,
                'target_protocols': self.config.monitored_protocols,
                'max_slippage': 0.05
            },
            'liquidation_bot': {
                **base_config,
                'health_factor_threshold': 1.05,
                'supported_protocols': ['aave', 'compound', 'makerdao']
            },
            'cross_chain_arbitrage': {
                **base_config,
                'supported_chains': [1, 137, 42161],  # ETH, Polygon, Arbitrum
                'bridge_protocols': ['ccip', 'polygon_bridge', 'arbitrum_bridge']
            },
            'oracle_manipulation': {
                **base_config,
                'price_deviation_threshold': 0.02,  # 2% price deviation
                'oracle_sources': ['chainlink', 'uniswap_twap', 'band_protocol']
            },
            'governance_attack': {
                **base_config,
                'voting_power_threshold': 0.1,  # 10% voting power
                'proposal_types': ['parameter_change', 'upgrade', 'treasury']
            }
        }
        
        return strategy_configs.get(strategy_name, base_config)

# Global configuration instance
config_manager = UltimateMEVConfigManager()

def load_mev_config() -> Dict[str, Any]:
    """
    Load MEV configuration and return as dictionary for compatibility.
    Returns the configuration from the global config manager.
    """
    return {
        'rpc_url': config_manager.config.rpc_url,
        'chain_id': config_manager.config.chain_id,
        'network_name': config_manager.config.network_name,
        'private_key': config_manager.config.private_key,
        'account_address': config_manager.config.account_address,
        'flashbots_auth_key': config_manager.config.flashbots_auth_key,
        'flashbots_relay': config_manager.config.flashbots_relay,
        'eden_endpoint': config_manager.config.eden_endpoint,
        'taichi_endpoint': config_manager.config.taichi_endpoint,
        'profit_threshold': config_manager.config.profit_threshold,
        'min_prediction_threshold': config_manager.config.min_prediction_threshold,
        'gas_limit': config_manager.config.gas_limit,
        'max_gas_price_gwei': config_manager.config.max_gas_price_gwei,
        'flashloan_contract_address': config_manager.config.flashloan_contract_address,
        'supported_flashloan_providers': config_manager.config.supported_flashloan_providers,
        'monitored_protocols': config_manager.config.monitored_protocols,
        'rust_bin_path': config_manager.config.rust_bin_path,
        'rust_max_hops': config_manager.config.rust_max_hops,
        'rust_enabled': config_manager.config.rust_enabled,
        'ml_model_dir': config_manager.config.ml_model_dir,
        'rl_enabled': config_manager.config.rl_enabled,
        'rl_update_frequency': config_manager.config.rl_update_frequency,
        'log_level': config_manager.config.log_level,
        'log_file': config_manager.config.log_file,
        'opportunity_queue_size': config_manager.config.opportunity_queue_size,
        'simulation_cache_size': config_manager.config.simulation_cache_size,
        'concurrent_strategies': config_manager.config.concurrent_strategies,
        'scan_interval_seconds': 5,  # Default scan interval
        'strategies': config_manager.strategies_config if hasattr(config_manager, 'strategies_config') else {
            'flash_loan_arbitrage': {'enabled': True},
            'sandwich_attack': {'enabled': True},
            'liquidation_bot': {'enabled': True}
        }
    }

def get_config_manager() -> UltimateMEVConfigManager:
    """Get the global configuration manager instance."""
    return config_manager
