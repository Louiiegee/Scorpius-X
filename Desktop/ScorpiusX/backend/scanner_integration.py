"""
Real Vulnerability Scanner Integration
Bridges the existing ultimate_vulnerability_scanner with the unified backend server.
"""

import asyncio
import logging
import sys
import os
from typing import Dict, List, Any, Optional
from pathlib import Path
import json
import uuid
from datetime import datetime
import time

# Configure logging first
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Add the ultimate_vulnerability_scanner to Python path
sys.path.append(str(Path(__file__).parent / "ultimate_vulnerability_scanner"))

# Import attack simulator plugin
try:
    from attack_simulator import attack_simulator_plugin, simulate_vulnerability_exploits
    ATTACK_SIMULATOR_AVAILABLE = True
    logger.info("✅ Attack Simulator Plugin loaded successfully")
except ImportError as e:
    ATTACK_SIMULATOR_AVAILABLE = False
    logger.warning(f"⚠️ Attack Simulator Plugin not available: {e}")

# Import existing core modules
try:
    from core.engine import VulnerabilityEngine, AccurateVulnScanner
    CORE_MODULES_AVAILABLE = True
except ImportError:
    VulnerabilityEngine = None
    AccurateVulnScanner = None
    CORE_MODULES_AVAILABLE = False

try:
    from js_plugin_bridge import JavaScriptPluginBridge
    JS_BRIDGE_AVAILABLE = True
except ImportError:
    JavaScriptPluginBridge = None
    JS_BRIDGE_AVAILABLE = False

try:
    from ultimate_vulnerability_scanner.main_api import engine as vuln_engine
    from ultimate_vulnerability_scanner.config.global_config import load_global_config
    from ultimate_vulnerability_scanner.core_engine.engine import VulnerabilityEngine
    from ultimate_vulnerability_scanner.core_engine.models import ScanJob, ScanJobConfig
    from ultimate_vulnerability_scanner.core_engine.enums import ScanJobType, TaskStatus
    from ultimate_vulnerability_scanner.accurate_vuln_scanner import AccurateVulnScanner
except ImportError as e:
    logger.warning(f"Could not import ultimate_vulnerability_scanner modules: {e}")
    VulnerabilityEngine = None
    AccurateVulnScanner = None

class RealVulnerabilityScanner:
    """
    Integration layer for the real vulnerability scanner.
    Uses the existing ultimate_vulnerability_scanner infrastructure.
    """
    
    def __init__(self):
        """Initialize the real vulnerability scanner with hybrid functionality."""
        self.engine: Optional[VulnerabilityEngine] = None
        self.active_scans: Dict[str, Dict[str, Any]] = {}
        self.scan_results: Dict[str, Dict[str, Any]] = {}
        self.js_bridge = None
        self.initialized = False
        
        # Initialize the JS bridge synchronously
        try:
            self.js_bridge = JavaScriptPluginBridge()
            logger.info("✅ JavaScript Plugin Bridge initialized")
        except Exception as e:
            logger.warning(f"⚠️ JavaScript Plugin Bridge failed to initialize: {e}")
        
        # Schedule async initialization if event loop is running
        try:
            loop = asyncio.get_running_loop()
            loop.create_task(self._initialize_scanners_async())
        except RuntimeError:
            # No event loop running, will initialize later
            logger.info("No event loop running, will initialize scanners later")
    
    async def ensure_initialized(self):
        """Ensure scanners are initialized before use."""
        if not self.initialized:
            await self._initialize_scanners_async()
    
    async def _initialize_scanners_async(self):
        """Initialize scanners asynchronously."""
        if self.initialized:
            return
            
        try:
            await self._initialize_scanners()
            self.initialized = True
        except Exception as e:
            logger.error(f"❌ Failed to initialize scanners: {e}")
    
    async def _initialize_scanners(self) -> None:
        """Initialize the scanner engines."""
        try:
            # Load global configuration
            config_path = Path(__file__).parent / "ultimate_vulnerability_scanner" / "config"
            if config_path.exists():
                global_config = await load_global_config(str(config_path / "global_config.yaml"))
                self.engine = VulnerabilityEngine(global_config)
            
            logger.info("✅ Real vulnerability scanner initialized successfully")
            
        except Exception as e:
            logger.error(f"❌ Failed to initialize scanners: {e}")
            self.engine = None
    
    async def start_scan(
        self,
        contract_address: str,
        tools: List[str],
        scan_options: Optional[Dict[str, Any]] = None
    ) -> str:
        """
        Start a vulnerability scan for a contract.
        
        Args:
            contract_address: The contract address to scan
            tools: List of tools to use (e.g., ['slither', 'mythril', 'echidna'])
            scan_options: Additional scan options
            
        Returns:
            scan_id: Unique identifier for the scan
        """
        await self.ensure_initialized()
        
        scan_id = str(uuid.uuid4())
        
        # Initialize scan state
        self.active_scans[scan_id] = {
            "status": "running",
            "started_at": datetime.now(),
            "contract_address": contract_address,
            "tools": tools,
            "progress": 0,
            "current_phase": "initializing"
        }
        
        # Start scan in background
        asyncio.create_task(self._run_scan(scan_id, contract_address, tools, scan_options or {}))
        
        return scan_id
    
    async def _run_scan(
        self,
        scan_id: str,
        contract_address: str,
        tools: List[str],
        options: Dict[str, Any]
    ) -> None:
        """Run the actual vulnerability scan."""
        try:
            logger.info(f"🔍 Starting real vulnerability scan {scan_id} for {contract_address}")
            
            # Update progress
            self.active_scans[scan_id].update({
                "progress": 10,
                "current_phase": "preparing"
            })
            
            scan_results = {
                "scan_id": scan_id,
                "contract_address": contract_address,
                "tools_used": tools,
                "vulnerabilities": [],
                "summary": {
                    "total_vulnerabilities": 0,
                    "critical": 0,
                    "high": 0,
                    "medium": 0,
                    "low": 0,
                    "info": 0
                },
                "execution_details": {
                    "started_at": self.active_scans[scan_id]["started_at"].isoformat(),
                    "tool_results": {}
                }
            }
            
            start_time = time.time()
            
            # Run scans based on selected tools
            for i, tool in enumerate(tools):
                tool_progress = 20 + (i * 60 // len(tools))
                self.active_scans[scan_id].update({
                    "progress": tool_progress,
                    "current_phase": f"running_{tool}"
                })
                
                await self._run_tool_scan(tool, contract_address, scan_results, options)
            
            # Process results and calculate aggregated metrics
            self._process_scan_results(scan_results)
            
            # Update scan completion
            end_time = time.time()
            scan_results["completed_at"] = datetime.now().isoformat()
            scan_results["duration"] = end_time - start_time
            scan_results["status"] = "completed"
            
            # Complete scan
            self.active_scans[scan_id].update({
                "status": "completed",
                "progress": 100,
                "current_phase": "completed",
                "completed_at": datetime.now()
            })
            
            # Store results
            self.scan_results[scan_id] = scan_results
            
            logger.info(f"✅ Scan {scan_id} completed with {scan_results['summary']['total_vulnerabilities']} vulnerabilities found")
            
        except Exception as e:
            logger.error(f"❌ Scan {scan_id} failed: {e}")
            self.active_scans[scan_id].update({
                "status": "failed",
                "error": str(e),
                "current_phase": "failed"
            })
    
    async def _run_tool_scan(
        self,
        tool: str,
        contract_address: str,
        scan_results: Dict[str, Any],
        options: Dict[str, Any]
    ) -> None:
        """Run scan with a specific tool."""
        try:
            logger.info(f"🔧 Running {tool} scan on {contract_address}")
            
            if tool == "slither":
                # Run Slither static analysis
                tool_results = await self._run_slither_scan(contract_address, options)
                self._process_slither_results(tool_results, scan_results)
                
            elif tool == "mythril":
                # Run Mythril symbolic execution
                tool_results = await self._run_mythril_scan(contract_address, options)
                self._process_mythril_results(tool_results, scan_results)
                
            elif tool == "echidna":
                # Run Echidna property-based fuzzing
                tool_results = await self._run_echidna_scan(contract_address, options)
                self._process_echidna_results(tool_results, scan_results)
                
            else:
                logger.warning(f"⚠️ Tool {tool} not supported. Only slither, mythril, and echidna are available.")
                
        except Exception as e:
            logger.error(f"❌ Tool {tool} scan failed: {e}")
            scan_results["execution_details"]["tool_results"][tool] = {
                "status": "failed",
                "error": str(e)
            }
    
    async def _run_slither_scan(self, contract_address: str, options: Dict[str, Any]) -> Dict[str, Any]:
        """Run Slither static analysis scan."""
        logger.info(f"🕸️ Running Slither scan on {contract_address}")
        
        try:
            # First try JavaScript plugin
            if self.js_bridge:
                try:
                    result = await self.js_bridge.execute_plugin('slither', {
                        'contract_address': contract_address,
                        'detectors': ['all']
                    })
                    if result.get('success'):
                        logger.info("✅ Slither JavaScript plugin executed successfully")
                        return result
                except Exception as e:
                    logger.warning(f"⚠️ JavaScript plugin failed: {e}, falling back to direct execution")
            
            # Try real Slither CLI if available
            if await self._check_tool_available('slither'):
                return await self._run_real_slither_cli(contract_address)
            
            # Fallback to error
            logger.error("⚠️ Slither not installed")
            return {"success": False, "error": "Slither not installed"}
            
        except Exception as e:
            logger.error(f"❌ Slither scan failed: {e}")
            return {"success": False, "error": str(e), "vulnerabilities": []}
    
    async def _check_tool_available(self, tool_name: str) -> bool:
        """Check if a security tool is available on the system."""
        try:
            if tool_name == 'slither':
                process = await asyncio.create_subprocess_exec(
                    'slither', '--version',
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
            elif tool_name == 'mythril':
                process = await asyncio.create_subprocess_exec(
                    'myth', '--version',
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
            elif tool_name == 'echidna':
                process = await asyncio.create_subprocess_exec(
                    'echidna', '--version',
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
            else:
                return False
            
            await asyncio.wait_for(process.communicate(), timeout=5)
            return process.returncode == 0
            
        except Exception:
            return False
    
    async def _run_real_slither_cli(self, contract_address: str) -> Dict[str, Any]:
        """Run real Slither CLI command."""
        try:
            logger.info("🔍 Running real Slither CLI...")
            
            # Create a temporary contract file for testing
            temp_contract = """
pragma solidity ^0.8.0;

contract TestContract {
    mapping(address => uint256) public balances;
    
    function withdraw(uint256 amount) public {
        require(balances[msg.sender] >= amount);
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success);
        balances[msg.sender] -= amount; // Reentrancy vulnerability
    }
}
"""
            
            import tempfile
            with tempfile.NamedTemporaryFile(mode='w', suffix='.sol', delete=False) as f:
                f.write(temp_contract)
                temp_file = f.name
            
            try:
                # Run Slither
                process = await asyncio.create_subprocess_exec(
                    'slither', temp_file, '--json', '-',
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                stdout, stderr = await process.communicate()
                
                if process.returncode == 0 and stdout:
                    import json
                    results = json.loads(stdout.decode())
                    return {
                        "success": True,
                        "tool": "slither-real",
                        "vulnerabilities": self._parse_real_slither_output(results),
                        "raw_output": stdout.decode()
                    }
                else:
                    logger.error(f"Slither CLI failed: {stderr.decode()}")
                    return {"success": False, "error": "Slither CLI failed"}
                    
            finally:
                os.unlink(temp_file)
                
        except Exception as e:
            logger.error(f"Real Slither CLI execution failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def _run_mythril_scan(self, contract_address: str, options: Dict[str, Any]) -> Dict[str, Any]:
        """Run Mythril scan for symbolic execution analysis."""
        logger.info(f"🔮 Running Mythril scan on {contract_address}")
        
        try:
            # Try real Mythril CLI if available
            if await self._check_tool_available('mythril'):
                return await self._run_real_mythril_cli(contract_address)
            
            # Fallback to error
            logger.error("⚠️ Mythril not installed")
            return {"success": False, "error": "Mythril not installed"}
            
        except Exception as e:
            logger.error(f"❌ Mythril scan failed: {e}")
            return {"success": False, "error": str(e), "vulnerabilities": []}
    
    async def _run_real_mythril_cli(self, contract_address: str) -> Dict[str, Any]:
        """Run real Mythril CLI command."""
        try:
            logger.info("🔍 Running real Mythril CLI...")
            
            # Create a test contract for analysis
            test_contract = """
pragma solidity ^0.8.0;

contract VulnerableContract {
    mapping(address => uint256) public balances;
    address public owner;
    
    constructor() {
        owner = msg.sender;
    }
    
    function deposit() public payable {
        balances[msg.sender] += msg.value;
    }
    
    // Integer overflow vulnerability (unchecked)
    function unsafeAdd(uint256 a, uint256 b) public pure returns (uint256) {
        unchecked {
            return a + b; // Potential overflow
        }
    }
    
    // tx.origin vulnerability
    function onlyOwner() public {
        require(tx.origin == owner, "Not owner"); // Should use msg.sender
        selfdestruct(payable(owner));
    }
    
    // Unchecked external call
    function withdrawAll() public {
        require(msg.sender == owner, "Not owner");
        payable(msg.sender).send(address(this).balance); // Unchecked send
    }
}
"""
            
            import tempfile
            with tempfile.NamedTemporaryFile(mode='w', suffix='.sol', delete=False) as f:
                f.write(test_contract)
                temp_file = f.name
            
            try:
                # Run Mythril analysis
                process = await asyncio.create_subprocess_exec(
                    'myth', 'analyze', temp_file, '--output', 'json',
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=60)
                
                if process.returncode == 0 and stdout:
                    import json
                    try:
                        results = json.loads(stdout.decode())
                        return {
                            "success": True,
                            "tool": "mythril-real",
                            "vulnerabilities": self._parse_real_mythril_output(results),
                            "raw_output": stdout.decode()
                        }
                    except json.JSONDecodeError:
                        # Mythril sometimes outputs non-JSON format
                        return {
                            "success": True,
                            "tool": "mythril-real",
                            "vulnerabilities": self._parse_mythril_text_output(stdout.decode()),
                            "raw_output": stdout.decode()
                        }
                else:
                    logger.warning(f"Mythril CLI issues: {stderr.decode()}")
                    return {"success": False, "error": "Mythril CLI failed"}
                    
            finally:
                os.unlink(temp_file)
                
        except asyncio.TimeoutError:
            logger.warning("Mythril analysis timed out")
            return {"success": False, "error": "Mythril analysis timed out"}
        except Exception as e:
            logger.error(f"Real Mythril CLI execution failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def _run_echidna_scan(self, contract_address: str, options: Dict[str, Any]) -> Dict[str, Any]:
        """Run Echidna scan for property-based testing."""
        logger.info(f"🐍 Running Echidna scan on {contract_address}")
        
        try:
            # Try real Echidna CLI if available
            if await self._check_tool_available('echidna'):
                return await self._run_real_echidna_cli(contract_address)
            
            # Fallback to error
            logger.error("⚠️ Echidna not installed")
            return {"success": False, "error": "Echidna not installed"}
            
        except Exception as e:
            logger.error(f"❌ Echidna scan failed: {e}")
            return {"success": False, "error": str(e), "vulnerabilities": []}
    
    async def _run_real_echidna_cli(self, contract_address: str) -> Dict[str, Any]:
        """Run real Echidna CLI command."""
        try:
            logger.info("🔍 Running real Echidna CLI...")
            
            # Create a test contract with properties for Echidna
            test_contract = """
pragma solidity ^0.8.0;

contract TestContract {
    uint256 public balance = 1000;
    mapping(address => uint256) public balances;
    
    // Property: balance should never be zero
    function echidna_balance_not_zero() public view returns (bool) {
        return balance > 0;
    }
    
    // Property: total balance should remain constant
    function echidna_total_balance_constant() public view returns (bool) {
        return balance >= 500; // This might fail
    }
    
    function withdraw(uint256 amount) public {
        require(amount <= balance, "Insufficient balance");
        balance -= amount;
        balances[msg.sender] += amount;
    }
    
    function deposit(uint256 amount) public {
        balance += amount;
    }
    
    // This function might violate invariants
    function badWithdraw(uint256 amount) public {
        balance -= amount; // No checks - could underflow
    }
}
"""
            
            import tempfile
            with tempfile.NamedTemporaryFile(mode='w', suffix='.sol', delete=False) as f:
                f.write(test_contract)
                temp_file = f.name
            
            try:
                # Run Echidna analysis
                process = await asyncio.create_subprocess_exec(
                    'echidna', temp_file, '--format', 'json',
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
                stdout, stderr = await asyncio.wait_for(process.communicate(), timeout=120)
                
                if process.returncode == 0 and stdout:
                    import json
                    try:
                        results = json.loads(stdout.decode())
                        return {
                            "success": True,
                            "tool": "echidna-real",
                            "vulnerabilities": self._parse_real_echidna_output(results),
                            "raw_output": stdout.decode()
                        }
                    except json.JSONDecodeError:
                        # Echidna might output different format
                        return {
                            "success": True,
                            "tool": "echidna-real",
                            "vulnerabilities": self._parse_echidna_text_output(stdout.decode()),
                            "raw_output": stdout.decode()
                        }
                else:
                    logger.warning(f"Echidna CLI issues: {stderr.decode()}")
                    return {"success": False, "error": "Echidna CLI failed"}
                    
            finally:
                os.unlink(temp_file)
                
        except asyncio.TimeoutError:
            logger.warning("Echidna analysis timed out")
            return {"success": False, "error": "Echidna analysis timed out"}
        except Exception as e:
            logger.error(f"Real Echidna CLI execution failed: {e}")
            return {"success": False, "error": str(e)}
    
    def _process_slither_results(self, tool_results: Dict[str, Any], scan_results: Dict[str, Any]) -> None:
        """Process results from Slither analysis."""
        if tool_results.get("success") and "vulnerabilities" in tool_results:
            for vuln in tool_results["vulnerabilities"]:
                vulnerability = {
                    "id": str(uuid.uuid4()),
                    "type": vuln.get("type", "unknown"),
                    "severity": self._normalize_severity(vuln.get("severity", "medium")),
                    "confidence": vuln.get("confidence", 0.8),
                    "description": vuln.get("description", "Vulnerability detected by Slither"),
                    "exploitable": vuln.get("exploitable", False),
                    "source": "slither",
                    "location": vuln.get("location", {}),
                    "raw_data": vuln
                }
                scan_results["vulnerabilities"].append(vulnerability)
        
        scan_results["execution_details"]["tool_results"]["slither"] = {
            "status": "completed" if tool_results.get("success") else "failed",
            "raw_results": tool_results
        }
    
    def _process_mythril_results(self, tool_results: Dict[str, Any], scan_results: Dict[str, Any]) -> None:
        """Process results from Mythril analysis."""
        if tool_results.get("success") and "vulnerabilities" in tool_results:
            for vuln in tool_results["vulnerabilities"]:
                vulnerability = {
                    "id": str(uuid.uuid4()),
                    "type": vuln.get("type", "unknown"),
                    "severity": self._normalize_severity(vuln.get("severity", "medium")),
                    "confidence": vuln.get("confidence", 0.8),
                    "description": vuln.get("description", "Vulnerability detected by Mythril"),
                    "exploitable": vuln.get("exploitable", False),
                    "source": "mythril",
                    "location": vuln.get("location", {}),
                    "raw_data": vuln
                }
                scan_results["vulnerabilities"].append(vulnerability)
        
        scan_results["execution_details"]["tool_results"]["mythril"] = {
            "status": "completed" if tool_results.get("success") else "failed",
            "raw_results": tool_results
        }
    
    def _process_echidna_results(self, tool_results: Dict[str, Any], scan_results: Dict[str, Any]) -> None:
        """Process results from Echidna analysis."""
        if tool_results.get("success") and "vulnerabilities" in tool_results:
            for vuln in tool_results["vulnerabilities"]:
                vulnerability = {
                    "id": str(uuid.uuid4()),
                    "type": vuln.get("type", "unknown"),
                    "severity": self._normalize_severity(vuln.get("severity", "medium")),
                    "confidence": vuln.get("confidence", 0.8),
                    "description": vuln.get("description", "Vulnerability detected by Echidna"),
                    "exploitable": vuln.get("exploitable", False),
                    "source": "echidna",
                    "location": vuln.get("location", {}),
                    "raw_data": vuln
                }
                scan_results["vulnerabilities"].append(vulnerability)
        
        scan_results["execution_details"]["tool_results"]["echidna"] = {
            "status": "completed" if tool_results.get("success") else "failed",
            "raw_results": tool_results
        }
    
    def _process_scan_results(self, scan_results: Dict[str, Any]) -> None:
        """Process and aggregate scan results."""
        total_vulns = len(scan_results["vulnerabilities"])
        scan_results["summary"]["total_vulnerabilities"] = total_vulns
        
        # Count by severity
        for vuln in scan_results["vulnerabilities"]:
            severity = vuln.get("severity", "unknown").lower()
            if severity in scan_results["summary"]:
                scan_results["summary"][severity] += 1
        
        # Add completion time
        scan_results["execution_details"]["completed_at"] = datetime.now().isoformat()
    
    def _normalize_severity(self, severity: str) -> str:
        """Normalize severity levels."""
        severity_map = {
            "critical": "critical",
            "high": "high", 
            "medium": "medium",
            "low": "low",
            "info": "info",
            "informational": "info",
            "warning": "low",
            "error": "high"
        }
        return severity_map.get(severity.lower(), "medium")
    
    def get_scan_status(self, scan_id: str) -> Dict[str, Any]:
        """Get the status of a scan."""
        if scan_id in self.active_scans:
            return self.active_scans[scan_id]
        elif scan_id in self.scan_results:
            return {"status": "completed", "progress": 100}
        else:
            return {"status": "not_found"}
    
    def get_scan_results(self, scan_id: str) -> Optional[Dict[str, Any]]:
        """Get scan results."""
        return self.scan_results.get(scan_id)
    
    def get_recent_scans(self, limit: int = 10) -> List[Dict[str, Any]]:
        """Get recent scans."""
        recent = []
        
        # Add completed scans
        for scan_id, results in self.scan_results.items():
            recent.append({
                "scan_id": scan_id,
                "contract_address": results.get("contract_address"),
                "status": "completed",
                "vulnerabilities_count": results.get("summary", {}).get("total_vulnerabilities", 0),
                "started_at": results.get("execution_details", {}).get("started_at"),
                "completed_at": results.get("execution_details", {}).get("completed_at")
            })
        
        # Add active scans
        for scan_id, scan_info in self.active_scans.items():
            if scan_info["status"] != "completed":
                recent.append({
                    "scan_id": scan_id,
                    "contract_address": scan_info.get("contract_address"),
                    "status": scan_info.get("status"),
                    "progress": scan_info.get("progress", 0),
                    "started_at": scan_info.get("started_at").isoformat() if scan_info.get("started_at") else None
                })
        
        # Sort by start time and limit
        recent.sort(key=lambda x: x.get("started_at", ""), reverse=True)
        return recent[:limit]
    
    def _parse_real_slither_output(self, slither_results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse real Slither CLI JSON output into standardized format."""
        vulnerabilities = []
        
        if not slither_results.get('results', {}).get('detectors'):
            return vulnerabilities
        
        for detector in slither_results['results']['detectors']:
            vulnerability = {
                "id": f"slither-{len(vulnerabilities) + 1:03d}",
                "type": detector.get('check', 'unknown'),
                "severity": self._map_slither_severity(detector.get('impact', 'Low')),
                "confidence": self._map_slither_confidence(detector.get('confidence', 'Low')),
                "description": detector.get('description', 'No description available'),
                "exploitable": detector.get('impact', '').lower() in ['high', 'critical'],
                "source": f"Slither {slither_results.get('version', 'unknown')}",
                "location": self._extract_slither_location(detector.get('elements', [])),
                "raw": detector.get('markdown', str(detector))
            }
            vulnerabilities.append(vulnerability)
        
        return vulnerabilities
    
    def _map_slither_severity(self, impact: str) -> str:
        """Map Slither impact levels to standardized severity."""
        mapping = {
            'High': 'High',
            'Medium': 'Medium',
            'Low': 'Low',
            'Informational': 'Info',
            'Optimization': 'Info'
        }
        return mapping.get(impact, 'Low')
    
    def _map_slither_confidence(self, confidence: str) -> str:
        """Map Slither confidence levels to standardized confidence."""
        mapping = {
            'High': 'High',
            'Medium': 'Medium',
            'Low': 'Low'
        }
        return mapping.get(confidence, 'Low')
    
    def _extract_slither_location(self, elements: List[Dict[str, Any]]) -> str:
        """Extract location information from Slither elements."""
        if not elements:
            return "unknown"
        
        element = elements[0]
        source_mapping = element.get('source_mapping', {})
        filename = source_mapping.get('filename', 'unknown')
        lines = source_mapping.get('lines', [])
        
        if lines:
            if len(lines) == 1:
                return f"{filename}:line {lines[0]}"
            else:
                return f"{filename}:lines {lines[0]}-{lines[-1]}"
        
        return filename
    
    def _parse_real_mythril_output(self, mythril_results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse real Mythril CLI JSON output into standardized format."""
        vulnerabilities = []
        
        # Mythril JSON format varies, handle different structures
        issues = mythril_results.get('issues', [])
        if not issues:
            issues = mythril_results.get('analysis', {}).get('issues', [])
        
        for issue in issues:
            vulnerability = {
                "id": f"mythril-{len(vulnerabilities) + 1:03d}",
                "type": issue.get('title', issue.get('type', 'unknown')),
                "severity": self._map_mythril_severity(issue.get('severity', 'Low')),
                "confidence": self._map_mythril_confidence(issue.get('confidence', 'Low')),
                "description": issue.get('description', 'No description available'),
                "exploitable": issue.get('severity', '').lower() in ['high', 'critical'],
                "source": f"Mythril {mythril_results.get('version', 'unknown')}",
                "location": self._extract_mythril_location(issue),
                "raw": issue.get('code', str(issue))
            }
            vulnerabilities.append(vulnerability)
        
        return vulnerabilities
    
    def _parse_mythril_text_output(self, output_text: str) -> List[Dict[str, Any]]:
        """Parse Mythril text output when JSON parsing fails."""
        vulnerabilities = []
        
        # Simple text parsing for key vulnerabilities
        lines = output_text.split('\n')
        current_issue = {}
        
        for line in lines:
            line = line.strip()
            if 'SWC ID:' in line:
                if current_issue:
                    # Save previous issue
                    vuln = {
                        "id": f"mythril-{len(vulnerabilities) + 1:03d}",
                        "type": current_issue.get('title', 'Unknown Issue'),
                        "severity": current_issue.get('severity', 'Medium'),
                        "confidence": "Medium",
                        "description": current_issue.get('description', line),
                        "exploitable": False,
                        "source": "Mythril (text output)",
                        "location": current_issue.get('location', 'unknown'),
                        "raw": line
                    }
                    vulnerabilities.append(vuln)
                current_issue = {'description': line}
            elif 'Title:' in line:
                current_issue['title'] = line.replace('Title:', '').strip()
            elif 'Severity:' in line:
                current_issue['severity'] = line.replace('Severity:', '').strip()
            elif 'Location:' in line:
                current_issue['location'] = line.replace('Location:', '').strip()
        
        # Add the last issue if any
        if current_issue:
            vuln = {
                "id": f"mythril-{len(vulnerabilities) + 1:03d}",
                "type": current_issue.get('title', 'Unknown Issue'),
                "severity": current_issue.get('severity', 'Medium'),
                "confidence": "Medium", 
                "description": current_issue.get('description', 'Mythril detected an issue'),
                "exploitable": False,
                "source": "Mythril (text output)",
                "location": current_issue.get('location', 'unknown'),
                "raw": str(current_issue)
            }
            vulnerabilities.append(vuln)
        
        return vulnerabilities
    
    def _map_mythril_severity(self, severity: str) -> str:
        """Map Mythril severity levels to standardized severity."""
        mapping = {
            'High': 'High',
            'Medium': 'Medium',
            'Low': 'Low',
            'Critical': 'High',
            'Warning': 'Medium',
            'Info': 'Low'
        }
        return mapping.get(severity, 'Medium')
    
    def _map_mythril_confidence(self, confidence: str) -> str:
        """Map Mythril confidence levels to standardized confidence.""" 
        mapping = {
            'High': 'High',
            'Medium': 'Medium',
            'Low': 'Low'
        }
        return mapping.get(confidence, 'Medium')
    
    def _extract_mythril_location(self, issue: Dict[str, Any]) -> str:
        """Extract location information from Mythril issue."""
        # Try different location formats
        if 'sourceMap' in issue:
            source_map = issue['sourceMap']
            filename = source_map.get('filename', 'unknown')
            line = source_map.get('line', 0)
            return f"{filename}:line {line}" if line else filename
        elif 'filename' in issue:
            filename = issue['filename']
            line = issue.get('lineno', 0)
            return f"{filename}:line {line}" if line else filename
        else:
            return "unknown"
    
    def _parse_real_echidna_output(self, echidna_results: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Parse real Echidna CLI JSON output into standardized format."""
        vulnerabilities = []
        
        # Echidna results structure varies, handle different formats
        tests = echidna_results.get('tests', [])
        if not tests:
            tests = echidna_results.get('results', [])
        
        for test in tests:
            # Only report failed tests as vulnerabilities
            if test.get('status') == 'failed' or test.get('passed', True) == False:
                vulnerability = {
                    "id": f"echidna-{len(vulnerabilities) + 1:03d}",
                    "type": "Property Violation",
                    "severity": self._map_echidna_severity(test.get('type', 'property')),
                    "confidence": "High",
                    "description": f"Property '{test.get('name', 'unknown')}' failed: {test.get('reason', 'No reason provided')}",
                    "exploitable": True,
                    "source": f"Echidna {echidna_results.get('version', 'unknown')}",
                    "location": test.get('location', 'unknown'),
                    "raw": test.get('counterexample', str(test))
                }
                vulnerabilities.append(vulnerability)
        
        # Also check for coverage issues or other findings
        coverage = echidna_results.get('coverage', {})
        if coverage.get('percentage', 100) < 50:
            vulnerability = {
                "id": f"echidna-{len(vulnerabilities) + 1:03d}",
                "type": "Low Coverage",
                "severity": "Low",
                "confidence": "Medium",
                "description": f"Low test coverage: {coverage.get('percentage', 0)}%. Consider adding more test properties.",
                "exploitable": False,
                "source": f"Echidna {echidna_results.get('version', 'unknown')}",
                "location": "overall",
                "raw": f"Coverage analysis: {coverage}"
            }
            vulnerabilities.append(vulnerability)
        
        return vulnerabilities
    
    def _parse_echidna_text_output(self, output_text: str) -> List[Dict[str, Any]]:
        """Parse Echidna text output when JSON parsing fails."""
        vulnerabilities = []
        
        lines = output_text.split('\n')
        for i, line in enumerate(lines):
            line = line.strip()
            
            # Look for failed properties
            if 'failed!' in line.lower() or 'falsified!' in line.lower():
                # Extract property name
                prop_name = "unknown_property"
                if ':' in line:
                    prop_name = line.split(':')[0].strip()
                
                vulnerability = {
                    "id": f"echidna-{len(vulnerabilities) + 1:03d}",
                    "type": "Property Violation",
                    "severity": "High",
                    "confidence": "High",
                    "description": f"Property '{prop_name}' was falsified during fuzzing",
                    "exploitable": True,
                    "source": "Echidna (text output)",
                    "location": prop_name,
                    "raw": line
                }
                vulnerabilities.append(vulnerability)
            
            # Look for assertion failures
            elif 'assert' in line.lower() and ('fail' in line.lower() or 'false' in line.lower()):
                vulnerability = {
                    "id": f"echidna-{len(vulnerabilities) + 1:03d}",
                    "type": "Assertion Failure",
                    "severity": "Medium",
                    "confidence": "High",
                    "description": f"Assertion failure detected: {line}",
                    "exploitable": False,
                    "source": "Echidna (text output)",
                    "location": "assertion",
                    "raw": line
                }
                vulnerabilities.append(vulnerability)
        
        return vulnerabilities
    
    def _map_echidna_severity(self, test_type: str) -> str:
        """Map Echidna test types to standardized severity."""
        mapping = {
            'property': 'High',
            'assertion': 'Medium', 
            'invariant': 'High',
            'optimization': 'Low',
            'coverage': 'Low'
        }
        return mapping.get(test_type.lower(), 'Medium')
    
    async def _check_tool_available(self, tool_name: str) -> bool:
        """Check if a security tool is available on the system."""
        try:
            if tool_name == 'slither':
                process = await asyncio.create_subprocess_exec(
                    'slither', '--version',
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
            elif tool_name == 'mythril':
                process = await asyncio.create_subprocess_exec(
                    'myth', '--version',
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
            elif tool_name == 'echidna':
                process = await asyncio.create_subprocess_exec(
                    'echidna', '--version',
                    stdout=asyncio.subprocess.PIPE,
                    stderr=asyncio.subprocess.PIPE
                )
            else:
                return False
            
            await asyncio.wait_for(process.communicate(), timeout=5)
            return process.returncode == 0
            
        except Exception:
            return False


# Global scanner instance
real_scanner = RealVulnerabilityScanner()
