
import os

def load_config():
    return {
        # === Base Token Settings ===
        "BASE_TOKEN_SYMBOL": "WETH",
        "POSITION_STRATEGY": "FIXED",
        "MAX_RISK_PER_TRADE": 0.01,
        "FIXED_POSITION_SIZE": "1000",
        "MAX_LOAN_SIZE_USD": 50000,
        "MIN_ETH_BALANCE": "0.05",

        # === Volatility Settings ===
        "VOLATILITY_WINDOW": 14,

        # === RPC Settings ===
        "RPC_URL": os.getenv("RPC_URL", "https://eth-mainnet.g.alchemy.com/v2/RAJ8A4mZpCBwXdEGHd__0Rity4GaLKzl"),
        "WS_RPC_URL": os.getenv("WS_RPC_URL", ""),
        "FALLBACK_RPC_URLS": [],
        "RPC_TIMEOUT_S": 15,
        "providerLatencyCheckInterval": 15,

        # === Logging ===
        "LOG_DIRECTORY": "./logs",
        "CONSOLE_LOG_LEVEL": "INFO",
        "FILE_LOG_LEVEL": "DEBUG",
        "LOG_MAX_SIZE_MB": 20,
        "LOG_BACKUP_COUNT": 7,
        "WORKER_LOG_LEVEL": "DEBUG",

        # === Token Decimals ===
        "TOKEN_DECIMALS": {
            "WETH": 18,
            "USDC": 6,
            "DAI": 18
        },

        # === Dry Run Settings ===
        "DRY_RUN_BLOCKS": 25,
        "START_BLOCK": 18000000
    }
