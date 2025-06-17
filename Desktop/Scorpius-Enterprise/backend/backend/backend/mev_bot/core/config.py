"""
Configuration Management for Scorpius Enterprise MEV Bot
Supports environment variables, KMS integration, and hot-reload
"""

import os
import json
import logging
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, field
from pathlib import Path
import boto3
from web3 import Web3


@dataclass
class NetworkConfig:
    """Blockchain network configuration"""
    name: str
    chain_id: int
    rpc_url: str
    ws_url: Optional[str] = None
    block_time_seconds: float = 12.0
    gas_price_multiplier: float = 1.1
    max_priority_fee_gwei: int = 10
    flashbots_relay: Optional[str] = None


@dataclass
class DatabaseConfig:
    """Database configuration"""
    host: str
    port: int
    database: str
    username: str
    password: str
    pool_size: int = 10
    max_overflow: int = 20
    
    @property
    def connection_string(self) -> str:
        """Get PostgreSQL connection string"""
        return f"postgresql://{self.username}:{self.password}@{self.host}:{self.port}/{self.database}"


@dataclass
class RedisConfig:
    """Redis configuration"""
    host: str
    port: int
    password: Optional[str] = None
    db: int = 0
    max_connections: int = 50


@dataclass
class MonitoringConfig:
    """Monitoring and logging configuration"""
    log_level: str = "INFO"
    log_format: str = "json"
    prometheus_port: int = 8090
    grafana_url: Optional[str] = None
    loki_url: Optional[str] = None
    alert_webhook: Optional[str] = None


@dataclass
class SecurityConfig:
    """Security configuration"""
    kms_region: str = "us-west-2"
    kms_key_id: Optional[str] = None
    private_key_dev: Optional[str] = None  # Only for development
    max_tx_value_eth: float = 10.0
    max_gas_price_gwei: int = 500
    require_signed_bundles: bool = True


class Config:
    """
    Central configuration manager for MEV bot
    Handles environment variables, KMS integration, and configuration validation
    """
    
    def __init__(self, config_file: Optional[str] = None):
        """
        Initialize configuration
        
        Args:
            config_file: Optional path to configuration file
        """
        self.logger = logging.getLogger("Config")
        self.config_file = config_file
        self._config_data: Dict[str, Any] = {}
        
        # Load configuration
        self._load_config()
        
        # Validate configuration
        self._validate_config()
        
        self.logger.info("Configuration loaded successfully")
    
    def _load_config(self) -> None:
        """Load configuration from various sources"""
        # Start with defaults
        self._config_data = self._get_default_config()
        
        # Load from file if provided
        if self.config_file and os.path.exists(self.config_file):
            with open(self.config_file, 'r') as f:
                file_config = json.load(f)
                self._merge_config(file_config)
        
        # Override with environment variables
        self._load_env_config()
    
    def _get_default_config(self) -> Dict[str, Any]:
        """Get default configuration"""
        return {
            "networks": {
                "ethereum": {
                    "name": "ethereum",
                    "chain_id": 1,
                    "rpc_url": "https://eth-mainnet.g.alchemy.com/v2/demo",
                    "ws_url": "wss://eth-mainnet.g.alchemy.com/v2/demo",
                    "block_time_seconds": 12.0,
                    "gas_price_multiplier": 1.1,
                    "max_priority_fee_gwei": 10,
                    "flashbots_relay": "https://relay.flashbots.net"
                },
                "arbitrum": {
                    "name": "arbitrum",
                    "chain_id": 42161,
                    "rpc_url": "https://arb-mainnet.g.alchemy.com/v2/demo",
                    "block_time_seconds": 0.25,
                    "gas_price_multiplier": 1.05
                }
            },
            "database": {
                "host": "localhost",
                "port": 5432,
                "database": "scorpius_mev",
                "username": "postgres",
                "password": "password",
                "pool_size": 10,
                "max_overflow": 20
            },
            "redis": {
                "host": "localhost", 
                "port": 6379,
                "db": 0,
                "max_connections": 50
            },
            "monitoring": {
                "log_level": "INFO",
                "log_format": "json",
                "prometheus_port": 8090
            },
            "security": {
                "kms_region": "us-west-2",
                "max_tx_value_eth": 10.0,
                "max_gas_price_gwei": 500,
                "require_signed_bundles": True
            },
            "scanner": {
                "max_tx_per_second": 3000,
                "queue_size": 10000,
                "backpressure_threshold": 0.8
            },
            "execution": {
                "max_concurrent_bundles": 10,
                "bundle_timeout_seconds": 30,
                "retry_attempts": 3
            },
            "strategies": {
                "sandwich": {
                    "enabled": True,
                    "min_profit_wei": int(0.01 * 10**18),  # 0.01 ETH
                    "max_gas_price_gwei": 100,
                    "max_slippage_pct": 0.5
                },
                "two_hop_arb": {
                    "enabled": True,
                    "min_profit_wei": int(0.005 * 10**18),  # 0.005 ETH
                    "max_gas_price_gwei": 150,
                    "max_slippage_pct": 1.0
                },
                "aave_v3_liquidation": {
                    "enabled": True,
                    "min_profit_wei": int(0.02 * 10**18),  # 0.02 ETH
                    "max_gas_price_gwei": 200,
                    "min_health_factor": 1.05
                }
            },
            "global_filters": [
                "(valueEth > 0.1)",
                "(gasPrice < 200000000000)",  # < 200 gwei
                "(to in hotPairs)"
            ],
            "hot_pairs": [
                "0xA0b86a33E6441E8a8C07E04cd0Ad8c2D2b1BdAf1",  # WETH/USDC
                "0x88e6a0c2ddd26feeb64f039a2c41296fcb3f5640",  # WETH/USDC V3
                "0x4e68ccd3e89f51c3074ca5072bbac773960dfa36",  # WETH/USDT V3
            ],
            "explain_mode": False
        }
    
    def _load_env_config(self) -> None:
        """Load configuration from environment variables"""
        env_mappings = {
            # Network configurations
            "RPC_MAINNET": "networks.ethereum.rpc_url",
            "RPC_ARBITRUM": "networks.arbitrum.rpc_url", 
            "WS_MAINNET": "networks.ethereum.ws_url",
            "WS_ARBITRUM": "networks.arbitrum.ws_url",
            "FLASHBOTS_RELAY": "networks.ethereum.flashbots_relay",
            
            # Database
            "DB_HOST": "database.host",
            "DB_PORT": "database.port",
            "DB_NAME": "database.database",
            "DB_USER": "database.username",
            "DB_PASSWORD": "database.password",
            
            # Redis
            "REDIS_HOST": "redis.host",
            "REDIS_PORT": "redis.port",
            "REDIS_PASSWORD": "redis.password",
            
            # Security
            "KMS_REGION": "security.kms_region",
            "KMS_KEY_ID": "security.kms_key_id",
            "PRIVATE_KEY_DEV": "security.private_key_dev",
            
            # Monitoring
            "LOG_LEVEL": "monitoring.log_level",
            "PROMETHEUS_PORT": "monitoring.prometheus_port",
            "GRAFANA_URL": "monitoring.grafana_url",
            "LOKI_URL": "monitoring.loki_url",
            
            # Features
            "EXPLAIN_MODE": "explain_mode"
        }
        
        for env_var, config_path in env_mappings.items():
            value = os.getenv(env_var)
            if value is not None:
                self._set_nested_value(config_path, value)
    
    def _set_nested_value(self, path: str, value: str) -> None:
        """Set nested configuration value from dot notation path"""
        keys = path.split('.')
        current = self._config_data
        
        # Navigate to parent
        for key in keys[:-1]:
            if key not in current:
                current[key] = {}
            current = current[key]
        
        # Set final value with type conversion
        final_key = keys[-1]
        current[final_key] = self._convert_env_value(value)
    
    def _convert_env_value(self, value: str) -> Union[str, int, float, bool]:
        """Convert environment variable string to appropriate type"""
        # Boolean conversion
        if value.lower() in ('true', 'false'):
            return value.lower() == 'true'
        
        # Integer conversion
        try:
            if '.' not in value:
                return int(value)
        except ValueError:
            pass
        
        # Float conversion
        try:
            return float(value)
        except ValueError:
            pass
        
        # Return as string
        return value
    
    def _merge_config(self, new_config: Dict[str, Any]) -> None:
        """Merge new configuration into existing config"""
        def merge_dicts(base: Dict, overlay: Dict) -> Dict:
            result = base.copy()
            for key, value in overlay.items():
                if key in result and isinstance(result[key], dict) and isinstance(value, dict):
                    result[key] = merge_dicts(result[key], value)
                else:
                    result[key] = value
            return result
        
        self._config_data = merge_dicts(self._config_data, new_config)
    
    def _validate_config(self) -> None:
        """Validate configuration values"""
        required_keys = [
            "networks.ethereum.rpc_url",
            "database.host",
            "database.username",
            "database.password"
        ]
        
        for key_path in required_keys:
            if not self._get_nested_value(key_path):
                raise ValueError(f"Required configuration missing: {key_path}")
        
        # Validate network URLs
        for network_name, network_config in self._config_data.get("networks", {}).items():
            rpc_url = network_config.get("rpc_url")
            if rpc_url and not (rpc_url.startswith("http") or rpc_url.startswith("ws")):
                raise ValueError(f"Invalid RPC URL for {network_name}: {rpc_url}")
    
    def _get_nested_value(self, path: str) -> Any:
        """Get nested configuration value from dot notation path"""
        keys = path.split('.')
        current = self._config_data
        
        for key in keys:
            if not isinstance(current, dict) or key not in current:
                return None
            current = current[key]
        
        return current
    
    @property
    def networks(self) -> Dict[str, NetworkConfig]:
        """Get network configurations"""
        networks = {}
        for name, config in self._config_data.get("networks", {}).items():
            networks[name] = NetworkConfig(**config)
        return networks
    
    @property
    def database(self) -> DatabaseConfig:
        """Get database configuration"""
        return DatabaseConfig(**self._config_data["database"])
    
    @property
    def redis(self) -> RedisConfig:
        """Get Redis configuration"""
        return RedisConfig(**self._config_data["redis"])
    
    @property
    def monitoring(self) -> MonitoringConfig:
        """Get monitoring configuration"""
        return MonitoringConfig(**self._config_data["monitoring"])
    
    @property
    def security(self) -> SecurityConfig:
        """Get security configuration"""
        return SecurityConfig(**self._config_data["security"])
    
    @property
    def global_filters(self) -> List[str]:
        """Get global transaction filters"""
        return self._config_data.get("global_filters", [])
    
    @property
    def hot_pairs(self) -> List[str]:
        """Get hot pair addresses"""
        return self._config_data.get("hot_pairs", [])
    
    @property
    def explain_mode(self) -> bool:
        """Check if explain mode is enabled"""
        return self._config_data.get("explain_mode", False)
    
    def get_strategy_config(self, strategy_name: str) -> Dict[str, Any]:
        """Get configuration for specific strategy"""
        return self._config_data.get("strategies", {}).get(strategy_name, {})
    
    def get_scanner_config(self) -> Dict[str, Any]:
        """Get scanner configuration"""
        return self._config_data.get("scanner", {})
    
    def get_execution_config(self) -> Dict[str, Any]:
        """Get execution configuration"""
        return self._config_data.get("execution", {})
    
    async def get_private_key(self, wallet_address: str) -> Optional[str]:
        """
        Get private key for wallet address
        Uses KMS in production, env var in development
        
        Args:
            wallet_address: Wallet address
            
        Returns:
            Private key or None if not found
        """
        try:
            # Development mode - use environment variable
            if self.security.private_key_dev:
                return self.security.private_key_dev
            
            # Production mode - use KMS
            if self.security.kms_key_id:
                return await self._get_kms_private_key(wallet_address)
            
            self.logger.warning("No private key configuration found")
            return None
            
        except Exception as e:
            self.logger.error(f"Error retrieving private key: {e}")
            return None
    
    async def _get_kms_private_key(self, wallet_address: str) -> Optional[str]:
        """
        Retrieve private key from AWS KMS
        
        Args:
            wallet_address: Wallet address
            
        Returns:
            Decrypted private key
        """
        try:
            kms_client = boto3.client('kms', region_name=self.security.kms_region)
            
            # This would implement actual KMS decryption
            # The encrypted private key would be stored securely
            response = kms_client.decrypt(
                CiphertextBlob=b'encrypted_private_key_blob',  # This would be actual encrypted data
                KeyId=self.security.kms_key_id
            )
            
            return response['Plaintext'].decode('utf-8')
            
        except Exception as e:
            self.logger.error(f"KMS decryption failed: {e}")
            return None
    
    def reload_config(self, config_file: Optional[str] = None) -> None:
        """
        Reload configuration from file
        
        Args:
            config_file: Optional new config file path
        """
        if config_file:
            self.config_file = config_file
        
        self._load_config()
        self._validate_config()
        self.logger.info("Configuration reloaded")
    
    def to_dict(self) -> Dict[str, Any]:
        """Get configuration as dictionary (for API responses)"""
        # Return sanitized config without sensitive data
        config_copy = self._config_data.copy()
        
        # Remove sensitive fields
        if "database" in config_copy:
            config_copy["database"].pop("password", None)
        if "redis" in config_copy:
            config_copy["redis"].pop("password", None)
        if "security" in config_copy:
            config_copy["security"].pop("private_key_dev", None)
            config_copy["security"].pop("kms_key_id", None)
        
        return config_copy
