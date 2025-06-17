#!/usr/bin/env python3
"""
Environment loader for Elite MEV System.
Loads environment variables from .env file.
"""
import os
from pathlib import Path
from typing import Dict, Any

def load_env_file(env_path: str = ".env") -> Dict[str, str]:
    """Load environment variables from .env file."""
    env_vars = {}
    env_file = Path(env_path)
    
    if not env_file.exists():
        print(f"⚠️  Environment file {env_path} not found")
        return env_vars
    
    try:
        with open(env_file, 'r', encoding='utf-8') as f:
            for line_num, line in enumerate(f, 1):
                line = line.strip()
                
                # Skip empty lines and comments
                if not line or line.startswith('#'):
                    continue
                
                # Parse key=value pairs
                if '=' in line:
                    key, value = line.split('=', 1)
                    key = key.strip()
                    value = value.strip()
                    
                    # Remove quotes if present
                    if value.startswith('"') and value.endswith('"'):
                        value = value[1:-1]
                    elif value.startswith("'") and value.endswith("'"):
                        value = value[1:-1]
                    
                    env_vars[key] = value
                    os.environ[key] = value
                else:
                    print(f"⚠️  Skipping invalid line {line_num}: {line}")
    
    except Exception as e:
        print(f"❌ Error loading environment file: {e}")
        return {}
    
    return env_vars

def verify_required_env_vars() -> bool:
    """Verify that all required environment variables are set."""
    required_vars = [
        'PRIVATE_KEY',
        'ALCHEMY_MAINNET',
        'ALCHEMY_POLYGON', 
        'ALCHEMY_ARBITRUM',
        'ALCHEMY_BASE',
        'LOG_LEVEL'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing required environment variables: {missing_vars}")
        return False
    
    print("✅ All required environment variables are set!")
    return True

def get_rpc_config() -> Dict[str, Any]:
    """Get RPC configuration from environment variables."""
    return {
        'ethereum': {
            'rpc_url': os.getenv('ALCHEMY_MAINNET'),
            'ws_url': os.getenv('ALCHEMY_MAINNET_WS'),
            'chain_id': 1
        },
        'polygon': {
            'rpc_url': os.getenv('ALCHEMY_POLYGON'),
            'ws_url': os.getenv('ALCHEMY_POLYGON_WS'),
            'chain_id': 137
        },
        'arbitrum': {
            'rpc_url': os.getenv('ALCHEMY_ARBITRUM'),
            'ws_url': os.getenv('ALCHEMY_ARBITRUM_WS'),
            'chain_id': 42161
        },
        'base': {
            'rpc_url': os.getenv('ALCHEMY_BASE'),
            'ws_url': os.getenv('ALCHEMY_BASE_WS'),
            'chain_id': 8453
        }
    }

def print_env_status():
    """Print environment configuration status."""
    print("🔧 ENVIRONMENT CONFIGURATION STATUS")
    print("=" * 50)
    
    # Load environment
    env_vars = load_env_file()
    print(f"📁 Loaded {len(env_vars)} environment variables")
    
    # Check required variables
    verify_required_env_vars()
    
    # Show RPC configuration (masked)
    rpc_config = get_rpc_config()
    print("\n🌐 RPC ENDPOINTS:")
    for chain, config in rpc_config.items():
        rpc_url = config.get('rpc_url', 'NOT_SET')
        masked_url = rpc_url[:50] + "..." if len(rpc_url) > 50 else rpc_url
        print(f"  {chain}: {masked_url}")
    
    # Show other key settings
    print(f"\n🔑 Private Key: {'SET' if os.getenv('PRIVATE_KEY') else 'NOT_SET'}")
    print(f"⚡ Flashbots: {os.getenv('FLASHBOTS_RPC', 'NOT_SET')}")
    print(f"🔬 Tenderly: {os.getenv('TENDERLY_ACCOUNT', 'NOT_SET')}")
    print(f"📊 Log Level: {os.getenv('LOG_LEVEL', 'INFO')}")
    print("=" * 50)

if __name__ == "__main__":
    print_env_status()
