# tests/test_wasm_sandbox.py
import subprocess
import pytest
import pathlib
import json
import tempfile
from scorpius_scanner.core.sandbox import WasmtimeRunner, PluginLimits

@pytest.mark.wasm
def test_rust_wasm_plugin_compiles_and_runs():
    """Test that Rust WASM plugin template compiles and executes"""
    plugin_dir = pathlib.Path("plugins/templates/rust")
    
    # Skip if Rust not available
    try:
        subprocess.run(["cargo", "--version"], check=True, capture_output=True)
    except (subprocess.CalledProcessError, FileNotFoundError):
        pytest.skip("Cargo not available")
    
    # Build the plugin
    result = subprocess.run([
        "cargo", "build", "--release", "--target=wasm32-wasi"
    ], cwd=plugin_dir, capture_output=True, text=True)
    
    assert result.returncode == 0, f"Build failed: {result.stderr}"
    
    wasm_path = plugin_dir / "target/wasm32-wasi/release/scorpius_plugin_template.wasm"
    assert wasm_path.exists(), "WASM file not found"

@pytest.mark.asyncio
@pytest.mark.wasm
async def test_wasm_plugin_execution():
    """Test WASM plugin execution with timeout and memory limits"""
    try:
        runner = WasmtimeRunner()
    except ImportError:
        pytest.skip("Wasmtime not available")
    
    # Use test payload
    payload = {
        "target": "contract_with_withdraw_and_call",
        "context": {
            "chain_rpc": "http://localhost:8545",
            "block_number": None,
            "workdir": "/tmp"
        }
    }
    
    limits = PluginLimits(
        memory_mb=32,
        timeout_seconds=5,
        cap_fs="none"
    )
    
    plugin_dir = pathlib.Path("plugins/templates/rust")
    wasm_path = plugin_dir / "target/wasm32-wasi/release/scorpius_plugin_template.wasm"
    
    if not wasm_path.exists():
        pytest.skip("WASM plugin not built")
    
    # Execute plugin
    findings = await runner.run_plugin(str(wasm_path), payload, limits)
    
    assert isinstance(findings, list)
    # Should detect the pattern in our test target
    assert len(findings) > 0
    assert findings[0]["id"] == "potential-reentrancy"

@pytest.mark.asyncio 
async def test_wasm_timeout_enforcement():
    """Test that infinite loop plugins are properly terminated"""
    try:
        runner = WasmtimeRunner()
    except ImportError:
        pytest.skip("Wasmtime not available")
    
    # Create a malicious WASM that would loop forever
    # (This would need a separate test plugin)
    pass

@pytest.mark.asyncio
async def test_wasm_memory_limit():
    """Test memory limit enforcement"""
    try:
        runner = WasmtimeRunner()
    except ImportError:
        pytest.skip("Wasmtime not available")
    
    # Test with very low memory limit
    limits = PluginLimits(memory_mb=1, timeout_seconds=5)
    
    # This should fail due to memory constraints
    # (Would need a memory-hungry test plugin)
    pass
