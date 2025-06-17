import asyncio
import subprocess
import tempfile
import json
from typing import Dict, Any, Optional, List
from pathlib import Path
from ..core.config import settings
from ..core.logging import get_logger

logger = get_logger(__name__)

class AdvancedSimulationRunner:
    """Manages blockchain simulation using Anvil/Foundry"""
    
    def __init__(self, rpc_url: str, block_number: Optional[int] = None):
        self.rpc_url = rpc_url
        self.block_number = block_number
        self.anvil_process: Optional[subprocess.Popen] = None
        self.port = 8545
        self.temp_dir = None
    
    async def __aenter__(self):
        await self.start()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        await self.cleanup()
    
    async def start(self):
        """Start Anvil fork"""
        self.temp_dir = tempfile.mkdtemp()
        
        cmd = [
            settings.simulation.anvil_path,
            "--fork-url", self.rpc_url,
            "--port", str(self.port),
            "--gas-limit", str(settings.simulation.default_gas_limit),
            "--silent"
        ]
        
        if self.block_number:
            cmd.extend(["--fork-block-number", str(self.block_number)])
        
        logger.info(f"Starting Anvil on port {self.port}")
        self.anvil_process = subprocess.Popen(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            cwd=self.temp_dir
        )
        
        # Wait for Anvil to be ready
        await self._wait_for_ready()
        logger.info("Anvil fork started successfully")
    
    async def _wait_for_ready(self, timeout: int = 30):
        """Wait for Anvil to be ready"""
        import httpx
        
        for _ in range(timeout):
            try:
                async with httpx.AsyncClient() as client:
                    response = await client.post(
                        f"http://localhost:{self.port}",
                        json={
                            "jsonrpc": "2.0",
                            "method": "eth_blockNumber",
                            "params": [],
                            "id": 1
                        },
                        timeout=1.0
                    )
                    if response.status_code == 200:
                        return
            except:
                await asyncio.sleep(1)
        
        raise RuntimeError("Anvil failed to start within timeout")
    
    async def run_forge_test(self, test_contract: str) -> Dict[str, Any]:
        """Run a Foundry test against the fork"""
        if not self.temp_dir:
            raise RuntimeError("Simulation not started")
        
        # Create basic foundry project structure
        foundry_toml = Path(self.temp_dir) / "foundry.toml"
        foundry_toml.write_text("""
[profile.default]
src = "src"
out = "out"
libs = ["lib"]
test = "test"
cache_path = "cache"

[rpc_endpoints]
local = "http://localhost:8545"
""")
        
        # Create test directory and file
        test_dir = Path(self.temp_dir) / "test"
        test_dir.mkdir(exist_ok=True)
        
        test_file = test_dir / "Exploit.t.sol"
        test_file.write_text(test_contract)
        
        # Run forge test
        cmd = [
            settings.simulation.forge_path,
            "test",
            "--rpc-url", f"http://localhost:{self.port}",
            "--gas-report",
            "-vvv"
        ]
        
        proc = await asyncio.create_subprocess_exec(
            *cmd,
            cwd=self.temp_dir,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        
        stdout, stderr = await proc.communicate()
        
        return {
            "success": proc.returncode == 0,
            "stdout": stdout.decode(),
            "stderr": stderr.decode(),
            "return_code": proc.returncode
        }
    
    async def get_fork_url(self) -> str:
        """Get the local fork URL"""
        return f"http://localhost:{self.port}"
    
    async def cleanup(self):
        """Clean up resources"""
        if self.anvil_process:
            self.anvil_process.terminate()
            try:
                await asyncio.wait_for(
                    asyncio.create_task(self._wait_for_process()), 
                    timeout=5.0
                )
            except asyncio.TimeoutError:
                self.anvil_process.kill()
            
            self.anvil_process = None
            logger.info("Anvil process terminated")
        
        if self.temp_dir:
            import shutil
            shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    async def _wait_for_process(self):
        """Wait for process to terminate"""
        while self.anvil_process and self.anvil_process.poll() is None:
            await asyncio.sleep(0.1)
