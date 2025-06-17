import os
import sys
from pathlib import Path
from typing import Dict, Any, Optional
import logging
import yaml
from dotenv import load_dotenv

logger = logging.getLogger(__name__)

CONFIG_FILE_NAME = "default_config.yaml" # Or allow overriding via env var

def load_config(config_dir: Optional[Path] = None) -> Dict[str, Any]:
    """
    Loads configuration from YAML file, with environment variable overrides.
    
    Args:
        config_dir: Directory containing the config file
        
    Returns:
        Dictionary containing the loaded configuration
    """
    if config_dir is None:
        config_dir = Path(__file__).parent

    # Load environment variables from .env file
    project_root = config_dir.parent if config_dir.name == "config" else config_dir
    dotenv_path = project_root / ".env"
    if dotenv_path.exists():
        load_dotenv(dotenv_path)
        logger.info(f"Loaded environment variables from {dotenv_path}")
    else:
        # Also try loading from current working directory
        load_dotenv()
        logger.info("Attempted to load .env from current directory")

    config_path = config_dir / CONFIG_FILE_NAME
    
    config: Dict[str, Any] = {}
    if config_path.exists():
        with open(config_path, 'r') as f:
            config = yaml.safe_load(f)
        logger.info(f"Loaded configuration from {config_path}")
    else:
        logger.warning(f"Configuration file {config_path} not found. Using defaults and environment variables.")

    # Environment variable overrides (example for a nested value)
    # Env vars should be prefixed, e.g., ELITE_API_HOST, ELITE_ETH_RPC_URLS_0
    config_api = config.setdefault("api", {})
    config_api["host"] = os.getenv("ELITE_API_HOST", config_api.get("host", "127.0.0.1"))
    config_api["port"] = int(os.getenv("ELITE_API_PORT", config_api.get("port", 8000)))
    config_api["admin_api_key"] = os.getenv("ELITE_ADMIN_API_KEY", config_api.get("admin_api_key", "dev_admin_key"))
    config_api["viewer_api_key"] = os.getenv("ELITE_VIEWER_API_KEY", config_api.get("viewer_api_key", "dev_viewer_key"))

    # Example for RPC URLs (comma-separated in env var)
    networks_config = config.setdefault("networks", {})
    eth_mainnet_config = networks_config.setdefault("ethereum_mainnet", {})
    
    rpc_urls_env = os.getenv("ELITE_ETH_RPC_URLS")
    if rpc_urls_env:
        eth_mainnet_config["rpc_urls"] = [url.strip() for url in rpc_urls_env.split(',')]
    elif "rpc_urls" not in eth_mainnet_config: # Default if not in YAML or ENV
         eth_mainnet_config["rpc_urls"] = [
             f"wss://mainnet.infura.io/ws/v3/{os.getenv('INFURA_PROJECT_ID','YOUR_INFURA_KEY_HERE')}",
             f"https://mainnet.infura.io/v3/{os.getenv('INFURA_PROJECT_ID','YOUR_INFURA_KEY_HERE')}"
         ]

    eth_mainnet_config["http_rpc_for_sync"] = os.getenv("ELITE_ETH_HTTP_RPC_FOR_SYNC", 
        eth_mainnet_config.get("http_rpc_for_sync", f"https://mainnet.infura.io/v3/{os.getenv('INFURA_PROJECT_ID','YOUR_INFURA_KEY_HERE')}"))
    
    eth_mainnet_config["flashbots_rpc_url"] = os.getenv("ELITE_FLASHBOTS_RPC_URL", eth_mainnet_config.get("flashbots_rpc_url"))

    # Log level can be overridden
    config["log_level"] = os.getenv("ELITE_LOG_LEVEL", config.get("log_level", "INFO")).upper()

    # Bot wallet - critical, should ideally come from secure source, env vars are common for non-prod
    config.setdefault("execution_engine", {})["bot_wallet_address"] = os.getenv("BOT_WALLET_ADDRESS")
    # PRIVATE KEY SHOULD NOT BE IN YAML. Only ENV or secrets manager.
    # The application code will fetch BOT_WALLET_PRIVATE_KEY directly from os.getenv.

    # Ensure critical keys are replaced if they are placeholders
    def check_placeholder(value: Any, placeholder: str) -> None:
        if isinstance(value, str) and placeholder in value:
            logger.critical(f"Placeholder '{placeholder}' found in configuration. Please update your config or environment variables.")
            sys.exit(1)

    infura_placeholder = "YOUR_INFURA_PROJECT_ID"
    if eth_mainnet_config.get("rpc_urls"):
        for url in eth_mainnet_config["rpc_urls"]: 
            check_placeholder(url, infura_placeholder)
    check_placeholder(eth_mainnet_config.get("http_rpc_for_sync"), infura_placeholder)
    check_placeholder(config_api.get("admin_api_key"), "your_super_secret_admin_api_key")

    return config