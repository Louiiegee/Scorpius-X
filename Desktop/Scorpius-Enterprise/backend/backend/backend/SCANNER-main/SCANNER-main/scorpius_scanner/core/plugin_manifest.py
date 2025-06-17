# scorpius_scanner/core/plugin_manifest.py
import tomllib
from pathlib import Path
from .sandbox import PluginLimits

class PluginManifest:
    def __init__(
        self,
        name: str,
        version: str,
        runtime: str,
        limits: PluginLimits,
        wasm_path: str | None = None,
        signature: str | None = None
    ):
        self.name = name
        self.version = version
        self.runtime = runtime
        self.limits = limits
        self.wasm_path = wasm_path
        self.signature = signature
        
        valid_runtimes = ["wasmtime", "firecracker", "native"]
        if runtime not in valid_runtimes:
            raise ValueError(f"Invalid runtime '{runtime}'. Must be one of: {valid_runtimes}")

def load_plugin_manifest(manifest_path: str) -> PluginManifest:
    """Loads and validates a plugin manifest from a TOML file."""
    path = Path(manifest_path)
    if not path.is_file():
        raise FileNotFoundError(f"Manifest file not found: {path}")

    with open(path, 'rb') as f:
        data = tomllib.load(f)
    
    limits_data = data.get('limits', {})
    limits = PluginLimits(
        memory_mb=limits_data.get('memory_mb', 64),
        timeout_seconds=limits_data.get('timeout_seconds', 30),
        fuel=limits_data.get('fuel', 100_000_000),
        cap_fs=limits_data.get('cap_fs', 'none'),
        sha256=data.get('sha256')
    )
    
    return PluginManifest(
        name=data['name'],
        version=data['version'],
        runtime=data.get('runtime', 'native'),
        limits=limits,
        wasm_path=str(path.parent / data['wasm_path']) if 'wasm_path' in data else None,
        signature=data.get('signature')
    )