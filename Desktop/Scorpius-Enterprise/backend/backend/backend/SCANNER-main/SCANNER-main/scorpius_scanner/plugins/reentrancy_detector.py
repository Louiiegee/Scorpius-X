from typing import List

from ..plugin_base import ScannerPlugin, Finding, ScanContext
from ..simulation.advanced_runner import AdvancedSimulationRunner
from ..core.logging import get_logger

logger = get_logger(__name__)

class ReentrancyDetector(ScannerPlugin):
    """Detects reentrancy vulnerabilities using simulation."""
    name = "reentrancy-detector"
    version = "1.0.1"
    requires_simulation = True
    
    async def scan(self, ctx: ScanContext) -> List[Finding]:
        logger.info(f"Running reentrancy simulation on {ctx.target}")
        
        async with AdvancedSimulationRunner(ctx.chain_rpc, ctx.workdir, ctx.block_number) as sim:
            test_contract = self._generate_reentrancy_test(ctx.target)
            try:
                result = await sim.run_forge_test(test_contract)
                if "EXPLOIT_SUCCESSFUL" in result["stdout"]:
                    return [Finding(id="reentrancy-exploitable", title="Exploitable Reentrancy Vulnerability Confirmed", severity="critical", description="A simulated attack successfully demonstrated a reentrancy vulnerability.", confidence=1.0, recommendation="Implement the 'checks-effects-interactions' pattern or OpenZeppelin's ReentrancyGuard.", source_tool=self.name, metadata={"simulation_output": result["stdout"]})]
                elif result["success"]:
                    logger.info("Reentrancy simulation test passed - no vulnerability detected.")
                else:
                    logger.warning(f"Reentrancy simulation test failed to compile/run: {result['stderr']}")
            except Exception as e:
                logger.error(f"Reentrancy simulation failed with an exception: {e}", exc_info=True)
                return [Finding(id="reentrancy-simulation-error", title="Reentrancy Simulation Error", severity="info", description=f"The simulation failed to execute the test. Error: {e}", confidence=1.0, source_tool=self.name, metadata={"error": str(e)})]
        return []
    
    def _generate_reentrancy_test(self, target: str) -> str:
        return f'''
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.18;
import "forge-std/Test.sol";
interface IVulnerable {{ function withdraw() external; function deposit() external payable; }}
contract ReentrancyExploitTest is Test {{
    IVulnerable constant TARGET = IVulnerable(payable({target}));
    function setUp() public {{
        vm.deal(address(this), 1 ether);
        TARGET.deposit{{value: 1 ether}}();
    }}
    function testAttemptReentrancy() public {{
        uint256 balanceBefore = address(this).balance;
        TARGET.withdraw();
        if (address(this).balance > balanceBefore) emit log("EXPLOIT_SUCCESSFUL");
    }}
    receive() external payable {{
        if (address(TARGET).balance >= 0.1 ether) TARGET.withdraw();
    }}
}}'''