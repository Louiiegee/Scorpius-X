"""
Time Machine Configuration
Centralized configuration management for the Time Machine system.
"""

import os
from typing import Dict, Any, Optional, List
from dataclasses import dataclass, field
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

@dataclass
class APIConfig:
    """API Server configuration"""
    host: str = os.getenv("TIME_MACHINE_HOST", "0.0.0.0")
    port: int = int(os.getenv("TIME_MACHINE_PORT", "8010"))
    debug: bool = os.getenv("DEBUG", "false").lower() == "true"
    reload: bool = os.getenv("RELOAD", "false").lower() == "true"
    workers: int = int(os.getenv("WORKERS", "1"))
    log_level: str = os.getenv("LOG_LEVEL", "INFO")
    docs_url: str = "/docs"
    redoc_url: str = "/redoc"
    cors_origins: List[str] = field(default_factory=lambda: ["*"])  # Configure as needed for production

@dataclass
class CeleryConfig:
    """Celery configuration"""
    broker_url: str = os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0")
    result_backend: str = os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
    task_serializer: str = "json"
    accept_content: Optional[List[str]] = field(default_factory=lambda: ["json"])
    result_serializer: str = "json"
    timezone: str = "UTC"
    enable_utc: bool = True
    
    # Task routing
    task_routes: Optional[Dict[str, Dict[str, str]]] = field(default_factory=lambda: {
        'tasks.replay_tasks.*': {'queue': 'replay'},
        'tasks.analysis_tasks.*': {'queue': 'analysis'},
        'tasks.cleanup_tasks.*': {'queue': 'cleanup'},
    })
    
    # Worker configuration
    worker_prefetch_multiplier: int = 1
    task_acks_late: bool = True
    worker_max_tasks_per_child: int = 1000
    
    # Task time limits
    task_soft_time_limit: int = 300  # 5 minutes
    task_time_limit: int = 600       # 10 minutes
    
    # Retry configuration
    task_default_retry_delay: int = 60
    task_max_retries: int = 3

@dataclass
class BlockchainConfig:
    """Blockchain configuration"""
    ethereum_rpc_url: str = os.getenv("ETHEREUM_RPC_URL", "https://eth-mainnet.g.alchemy.com/v2/demo")
    polygon_rpc_url: str = os.getenv("POLYGON_RPC_URL", "https://polygon-mainnet.g.alchemy.com/v2/demo")
    bsc_rpc_url: str = os.getenv("BSC_RPC_URL", "https://bsc-dataseed.binance.org/")
    arbitrum_rpc_url: str = os.getenv("ARBITRUM_RPC_URL", "https://arb1.arbitrum.io/rpc")
    optimism_rpc_url: str = os.getenv("OPTIMISM_RPC_URL", "https://mainnet.optimism.io")
    
    # Default chain
    default_chain: str = os.getenv("DEFAULT_CHAIN", "ethereum")
    
    # Request timeout
    request_timeout: int = int(os.getenv("WEB3_TIMEOUT", "30"))
    
    # Batch size for bulk operations
    batch_size: int = int(os.getenv("BATCH_SIZE", "100"))
    
    # Fork configuration
    fork_block_buffer: int = int(os.getenv("FORK_BLOCK_BUFFER", "10"))
    max_fork_duration_hours: int = int(os.getenv("MAX_FORK_DURATION_HOURS", "6"))

@dataclass
class RedisConfig:
    """Redis configuration"""
    url: str = os.getenv("REDIS_URL", "redis://localhost:6379/0")
    db: int = int(os.getenv("REDIS_DB", "0"))
    password: Optional[str] = os.getenv("REDIS_PASSWORD")
    socket_timeout: int = int(os.getenv("REDIS_SOCKET_TIMEOUT", "5"))
    socket_connect_timeout: int = int(os.getenv("REDIS_SOCKET_CONNECT_TIMEOUT", "5"))
    max_connections: int = int(os.getenv("REDIS_MAX_CONNECTIONS", "100"))
    
    # Cache settings
    cache_ttl: int = int(os.getenv("CACHE_TTL", "3600"))  # 1 hour
    snapshot_ttl: int = int(os.getenv("SNAPSHOT_TTL", "86400"))  # 24 hours

@dataclass
class DatabaseConfig:
    """Database configuration"""
    url: Optional[str] = os.getenv("DATABASE_URL")
    engine: str = os.getenv("DB_ENGINE", "sqlite")
    echo: bool = os.getenv("DB_ECHO", "false").lower() == "true"
    pool_size: int = int(os.getenv("DB_POOL_SIZE", "5"))
    max_overflow: int = int(os.getenv("DB_MAX_OVERFLOW", "10"))
    pool_timeout: int = int(os.getenv("DB_POOL_TIMEOUT", "30"))

@dataclass
class LoggingConfig:
    """Logging configuration"""
    level: str = os.getenv("LOG_LEVEL", "INFO")
    format: str = "%(asctime)s - %(name)s - %(levelname)s - %(message)s"
    file_max_size: int = int(os.getenv("LOG_FILE_MAX_SIZE", "10485760"))  # 10MB
    file_backup_count: int = int(os.getenv("LOG_FILE_BACKUP_COUNT", "5"))
    
    # Log files
    api_log_file: str = os.getenv("API_LOG_FILE", "time_machine_api.log")
    worker_log_file: str = os.getenv("WORKER_LOG_FILE", "time_machine_worker.log")
    startup_log_file: str = os.getenv("STARTUP_LOG_FILE", "time_machine_startup.log")

@dataclass
class SecurityConfig:
    """Security configuration"""
    secret_key: str = os.getenv("SECRET_KEY", "time-machine-secret-key-change-in-production")
    algorithm: str = os.getenv("ALGORITHM", "HS256")
    access_token_expire_minutes: int = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "30"))
    
    # Rate limiting
    rate_limit_enabled: bool = os.getenv("RATE_LIMIT_ENABLED", "false").lower() == "true"
    rate_limit_requests: int = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
    rate_limit_window: int = int(os.getenv("RATE_LIMIT_WINDOW", "60"))

@dataclass
class CleanupConfig:
    """Cleanup configuration"""
    session_max_age_hours: int = int(os.getenv("SESSION_MAX_AGE_HOURS", "24"))
    fork_max_age_hours: int = int(os.getenv("FORK_MAX_AGE_HOURS", "6"))
    temp_files_max_age_hours: int = int(os.getenv("TEMP_FILES_MAX_AGE_HOURS", "12"))
    snapshot_max_age_hours: int = int(os.getenv("SNAPSHOT_MAX_AGE_HOURS", "48"))
    
    # Cleanup schedules (cron format)
    session_cleanup_schedule: str = os.getenv("SESSION_CLEANUP_SCHEDULE", "0 2 * * *")  # Daily at 2 AM
    fork_cleanup_schedule: str = os.getenv("FORK_CLEANUP_SCHEDULE", "0 */6 * * *")      # Every 6 hours
    temp_cleanup_schedule: str = os.getenv("TEMP_CLEANUP_SCHEDULE", "0 */4 * * *")      # Every 4 hours

@dataclass
class TimeMachineConfig:
    """Main Time Machine configuration"""
    api: APIConfig
    celery: CeleryConfig
    blockchain: BlockchainConfig
    redis: RedisConfig
    database: DatabaseConfig
    logging: LoggingConfig
    security: SecurityConfig
    cleanup: CleanupConfig
    
    # Feature flags
    enable_websockets: bool = os.getenv("ENABLE_WEBSOCKETS", "false").lower() == "true"
    enable_metrics: bool = os.getenv("ENABLE_METRICS", "false").lower() == "true"
    enable_auth: bool = os.getenv("ENABLE_AUTH", "false").lower() == "true"
    
    # System limits
    max_concurrent_replays: int = int(os.getenv("MAX_CONCURRENT_REPLAYS", "10"))
    max_replay_duration_minutes: int = int(os.getenv("MAX_REPLAY_DURATION_MINUTES", "60"))
    max_session_size_mb: int = int(os.getenv("MAX_SESSION_SIZE_MB", "1000"))

def load_config() -> TimeMachineConfig:
    """Load and return the complete Time Machine configuration"""
    return TimeMachineConfig(
        api=APIConfig(),
        celery=CeleryConfig(),
        blockchain=BlockchainConfig(),
        redis=RedisConfig(),
        database=DatabaseConfig(),
        logging=LoggingConfig(),
        security=SecurityConfig(),
        cleanup=CleanupConfig()
    )

def get_environment_info() -> Dict[str, Any]:
    """Get current environment information"""
    config = load_config()
    
    return {
        "environment": os.getenv("ENVIRONMENT", "development"),
        "python_version": os.sys.version,
        "config_summary": {
            "api_host": config.api.host,
            "api_port": config.api.port,
            "debug_mode": config.api.debug,
            "celery_broker": config.celery.broker_url,
            "default_chain": config.blockchain.default_chain,
            "redis_url": config.redis.url,
            "database_engine": config.database.engine,
            "log_level": config.logging.level,
            "features": {
                "websockets": config.enable_websockets,
                "metrics": config.enable_metrics,
                "auth": config.enable_auth
            }
        }
    }

def validate_config(config: TimeMachineConfig) -> Dict[str, Any]:
    """Validate configuration and return any issues"""
    issues = []
    warnings = []
    
    # Check required settings
    if config.api.host == "0.0.0.0" and os.getenv("ENVIRONMENT") == "production":
        warnings.append("API host is set to 0.0.0.0 in production")
    
    if config.security.secret_key == "time-machine-secret-key-change-in-production":
        issues.append("Secret key is using default value - change in production")
    
    if not config.blockchain.ethereum_rpc_url.startswith("http"):
        issues.append("Invalid Ethereum RPC URL format")
    
    if config.celery.broker_url == config.celery.result_backend:
        warnings.append("Celery broker and result backend are the same")
    
    # Check numeric limits
    if config.max_concurrent_replays > 50:
        warnings.append("High max concurrent replays limit may impact performance")
    
    if config.cleanup.session_max_age_hours < 1:
        issues.append("Session max age is too low")
    
    return {
        "valid": len(issues) == 0,
        "issues": issues,
        "warnings": warnings,
        "config_hash": hash(str(config))
    }

def print_config_summary():
    """Print a summary of the current configuration"""
    config = load_config()
    env_info = get_environment_info()
    validation = validate_config(config)
    
    print("=" * 60)
    print("TIME MACHINE CONFIGURATION SUMMARY")
    print("=" * 60)
    
    print(f"Environment: {env_info['environment']}")
    print(f"API Server: {config.api.host}:{config.api.port}")
    print(f"Debug Mode: {config.api.debug}")
    print(f"Celery Broker: {config.celery.broker_url}")
    print(f"Default Chain: {config.blockchain.default_chain}")
    print(f"Log Level: {config.logging.level}")
    
    print("\nFeatures:")
    for feature, enabled in env_info['config_summary']['features'].items():
        status = "✓" if enabled else "✗"
        print(f"  {status} {feature.title()}")
    
    print(f"\nValidation: {'✓ PASS' if validation['valid'] else '✗ FAIL'}")
    
    if validation['issues']:
        print("\nIssues:")
        for issue in validation['issues']:
            print(f"  ✗ {issue}")
    
    if validation['warnings']:
        print("\nWarnings:")
        for warning in validation['warnings']:
            print(f"  ⚠ {warning}")
    
    print("=" * 60)

if __name__ == "__main__":
    print_config_summary()
