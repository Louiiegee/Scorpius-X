from pydantic import BaseSettings, Field
from typing import Dict, Any, Optional
from pathlib import Path

class DatabaseConfig(BaseSettings):
    url: str = "postgresql://scorpius:scorpius@localhost/scorpius"
    pool_size: int = 10
    max_overflow: int = 20

class RedisConfig(BaseSettings):
    url: str = "redis://localhost:6379/0"
    max_connections: int = 10

class SimulationConfig(BaseSettings):
    anvil_path: str = "anvil"
    forge_path: str = "forge"
    default_gas_limit: int = 30_000_000
    fork_timeout: int = 60
    max_concurrent_forks: int = 3

class TelemetryConfig(BaseSettings):
    otel_endpoint: str = "http://otel-collector:4317"
    otel_service_name: str = "scorpius-scanner"
    enable_tracing: bool = True
    enable_metrics: bool = True

class AuthConfig(BaseSettings):
    jwt_secret: str = "super-secret-key-change-in-production"

class Settings(BaseSettings):
    # Core
    debug: bool = False
    log_level: str = "INFO"
    workdir: str = "./workspace"
    max_concurrent_scans: int = 5
    
    # RPC endpoints
    default_rpc: str = "https://ethereum.publicnode.com"
    rpc_endpoints: Dict[str, str] = {
        "ethereum": "https://ethereum.publicnode.com",
        "polygon": "https://polygon-rpc.com",
        "arbitrum": "https://arb1.arbitrum.io/rpc"
    }
    
    # Services
    database: DatabaseConfig = DatabaseConfig()
    redis: RedisConfig = RedisConfig()
    simulation: SimulationConfig = SimulationConfig()
    telemetry: TelemetryConfig = TelemetryConfig()
    auth: AuthConfig = AuthConfig()
    
    # API
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: list[str] = ["*"]
    
    # Queue
    queue_name: str = "scorpius_scans"
    worker_timeout: int = 300

    class Config:
        env_file = ".env"
        env_nested_delimiter = "__"

    def __post_init__(self):
        Path(self.workdir).mkdir(parents=True, exist_ok=True)

settings = Settings()
