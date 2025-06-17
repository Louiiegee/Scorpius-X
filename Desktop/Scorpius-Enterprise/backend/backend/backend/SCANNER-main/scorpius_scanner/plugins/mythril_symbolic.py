import asyncio
from typing import List

from ..plugin_base import ScannerPlugin, Finding, ScanContext
from ..core.logging import get_logger

logger = get_logger(__name__)

class MythrilSymbolic(ScannerPlugin):
    """Performs symbolic execution using the Mythril tool (mocked)."""
    name = "mythril-symbolic"
    version = "0.1.0"
    
    async def scan(self, ctx: ScanContext) -> List[Finding]:
        if not ctx.source_code and not ctx.bytecode:
            logger.warning(f"Plugin '{self.name}' skipped: No source or bytecode for {ctx.target}.")
            return []

        logger.info(f"Running MOCKED Mythril analysis on {ctx.target}")
        await asyncio.sleep(5) 

        if ctx.source_code and "call.value" in ctx.source_code:
            return [Finding(id="mythril-reentrancy-potential", title="Potential Reentrancy via Unchecked Call", severity="high", description="Symbolic execution identified a potential reentrancy path.", confidence=0.8, recommendation="Use the 'checks-effects-interactions' pattern or a reentrancy guard.", source_tool=self.name)]
        
        return []