# scorpius_scanner/core/sandbox.py (corrected implementation)
import asyncio
import json
import hashlib
import tempfile
import time
import os
from pathlib import Path
from typing import Dict, Any, Optional, List
from dataclasses import dataclass

try:
    from wasmtime import Store, Module, Instance, WasiConfig, Engine, Linker, Config
    WASMTIME_AVAILABLE = True
except ImportError:
    WASMTIME_AVAILABLE = False

from .config import settings
from .logging import get_logger
from .telemetry import meter

logger = get_logger(__name__)

# Metrics with static labels only
sandbox_duration = meter.create_histogram(
    "scorpius_plugin_sandbox_seconds",
    description="Plugin execution time in sandbox"
)

sandbox_failures = meter.create_counter(
    "scorpius_plugin_sandbox_failures_total",
    description="Plugin sandbox failures"
)

@dataclass
class PluginLimits:
    memory_mb: int = 64
    timeout_seconds: int = 30
    cap_net: bool = False
    cap_fs: str = "none"  # none, readonly, readwrite
    sha256: Optional[str] = None

def verify_sha256(wasm_path: str, expected_hash: str) -> bool:
    """Verify SHA256 hash before module load, skip if not requested"""
    if not expected_hash:
        return True
    wasm_bytes = Path(wasm_path).read_bytes()
    actual_hash = hashlib.sha256(wasm_bytes).hexdigest()
    return actual_hash == expected_hash

def _engine_for_limits(limits: PluginLimits) -> Engine:
    """Create Wasmtime engine with fuel consumption and memory limits"""
    cfg = Config()
    cfg.consume_fuel(True)
    cfg.static_memory_maximum_size(limits.memory_mb * 1024 * 1024)
    return Engine(cfg)

class WasmtimeRunner:
    """Execute plugins in Wasmtime WASI sandbox with real timeouts"""
    
    def __init__(self):
        if not WASMTIME_AVAILABLE:
            raise ImportError("Wasmtime not available - install wasmtime-py")
        
        self.cache_dir = Path(settings.workdir) / "wasm_cache"
        self.cache_dir.mkdir(exist_ok=True)
    
    async def run_plugin(
        self, 
        wasm_path: str, 
        payload: Dict[str, Any], 
        limits: PluginLimits
    ) -> List[Dict[str, Any]]:
        """Execute WASM plugin with fuel-based timeout enforcement"""
        # Import here to avoid circular dependency
        start_time = time.time()
        
        try:
            # Verify hash BEFORE loading module
            if not verify_sha256(wasm_path, limits.sha256):
                raise ValueError(f"SHA256 mismatch for {wasm_path}")
            
            # Create engine with limits
            engine = _engine_for_limits(limits)
            store = Store(engine)
            store.add_fuel(10_000_000)  # Initial fuel allocation
            
            # Setup filesystem sandbox
            wasi_config = WasiConfig()
            sandbox_path = None
            
            if limits.cap_fs == "none":
                # No filesystem access
                pass
            elif limits.cap_fs == "readonly":
                # Create read-only tmpfs sandbox
                sandbox_path = Path(tempfile.mkdtemp(dir="/dev/shm"))
                os.chmod(sandbox_path, 0o555)  # read and execute only
                wasi_config.preopen_dir(str(sandbox_path), "/tmp")
            elif limits.cap_fs == "readwrite":
                sandbox_path = Path(tempfile.mkdtemp())
                wasi_config.preopen_dir(str(sandbox_path), "/tmp")
                
            # Setup stdin/stdout communication
            input_data = json.dumps(payload).encode('utf-8')
            wasi_config.set_stdin_bytes(input_data)
            
            # Capture stdout correctly
            with tempfile.NamedTemporaryFile(mode='w+b') as stdout_file:
                wasi_config.set_stdout_file(stdout_file.name)
                store.set_wasi(wasi_config)
                
                # Load and instantiate module
                module = Module.from_file(engine, str(wasm_path))
                linker = Linker(engine)
                linker.define_wasi()
                instance = linker.instantiate(store, module)
                
                # Setup fuel-based timeout watchdog
                async def fuel_watchdog():
                    await asyncio.sleep(limits.timeout_seconds)
                    # Force trap by consuming all remaining fuel
                    remaining_fuel = store.get_fuel()
                    if remaining_fuel and remaining_fuel > 0:
                        store.consume_fuel(remaining_fuel)
                        logger.warning(f"Plugin timed out after {limits.timeout_seconds}s")
                
                watchdog_task = asyncio.create_task(fuel_watchdog())
                
                try:
                    # Execute plugin main function
                    main_func = instance.exports(store).get("_start")
                    if main_func:
                        main_func(store)  # May trap on fuel exhaustion
                    
                    # Cancel watchdog if completed successfully
                    watchdog_task.cancel()
                    
                    # Read stdout AFTER execution completes
                    stdout_file.seek(0)
                    output = stdout_file.read()
                    results = json.loads(output.decode('utf-8'))
                    
                    # Record success metrics
                    duration = time.time() - start_time
                    sandbox_duration.record(duration, {"runtime": "wasmtime", "status": "success"})
                    
                    logger.info(f"WASM plugin executed successfully in {duration:.3f}s")
                    return results.get('findings', [])
                    
                except Exception as e:
                    # Handle fuel exhaustion or other traps
                    if "fuel" in str(e).lower() or "trap" in str(e).lower():
                        sandbox_failures.add(1, {"runtime": "wasmtime", "reason": "timeout"})
                        logger.error(f"WASM plugin trapped (likely timeout): {e}")
                    else:
                        sandbox_failures.add(1, {"runtime": "wasmtime", "reason": "error"})
                        logger.error(f"WASM plugin execution failed: {e}")
                    raise
                finally:
                    watchdog_task.cancel()
                    
                    # Cleanup sandbox directory
                    if sandbox_path and sandbox_path.exists():
                        import shutil
                        shutil.rmtree(sandbox_path, ignore_errors=True)
                        
        except Exception as e:
            duration = time.time() - start_time
            sandbox_duration.record(duration, {"runtime": "wasmtime", "status": "error"})
            raise

class FirecrackerRunner:
    """Execute plugins in Firecracker microVM sandbox"""
    
    def __init__(self):
        self.vm_pool = []
        self.max_pool_size = 3
        self.rootfs_path = Path(settings.workdir) / "firecracker" / "rootfs.ext4"
        self.kernel_path = Path(settings.workdir) / "firecracker" / "vmlinux"
        
    async def run_plugin(
        self, 
        plugin_path: str, 
        payload: Dict[str, Any], 
        limits: PluginLimits
    ) -> List[Dict[str, Any]]:
        """Execute plugin in Firecracker microVM"""
        # Placeholder implementation with proper error handling
        raise NotImplementedError("Firecracker runner not yet implemented")
    
    async def _transfer_plugin(self, vm_id: str, plugin_path: str):
        """Transfer plugin to VM"""
        raise NotImplementedError("_transfer_plugin is not implemented yet")
    
    async def _execute_in_vm(self, vm_id: str, payload: Dict[str, Any], limits: PluginLimits) -> Dict[str, Any]:
        """Execute plugin inside VM"""
        raise NotImplementedError("_execute_in_vm is not implemented yet")

class SandboxOrchestrator:
    """Orchestrate plugin execution across different sandboxes"""
    
    def __init__(self):
        self.wasmtime_runner = None
        self.firecracker_runner = None
        
        if WASMTIME_AVAILABLE:
            self.wasmtime_runner = WasmtimeRunner()
        
        # Firecracker will be added in Phase 2
        # self.firecracker_runner = FirecrackerRunner()
    
    async def run_sandboxed_plugin(
        self, 
        manifest: 'PluginManifest', 
        target: str, 
        ctx: 'ScanContext'
    ) -> List['Finding']:
        """Run plugin in appropriate sandbox based on manifest"""
        # Import here to avoid circular dependency
        from ..plugin_base import Finding
        
        payload = {
            "target": target,
            "context": {
                "chain_rpc": ctx.chain_rpc,
                "block_number": ctx.block_number,
                "workdir": ctx.workdir
            }
        }
        
        if manifest.runtime == "wasmtime":
            if not self.wasmtime_runner:
                raise RuntimeError("Wasmtime not available")
            
            raw_findings = await self.wasmtime_runner.run_plugin(
                manifest.wasm_path, payload, manifest.limits
            )
            
            # Convert raw findings to Finding objects
            return [Finding(**f) for f in raw_findings]
        
        elif manifest.runtime == "firecracker":
            if not self.firecracker_runner:
                raise RuntimeError("Firecracker not available")
            
            raw_findings = await self.firecracker_runner.run_plugin(
                manifest.wasm_path, payload, manifest.limits
            )
            
            return [Finding(**f) for f in raw_findings]
        
        else:
            raise ValueError(f"Unsupported runtime: {manifest.runtime}")

# Global sandbox orchestrator
sandbox = SandboxOrchestrator()
