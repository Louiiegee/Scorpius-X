import os
import tempfile
from typing import List

try:
    from slither import Slither
    from slither.exceptions import SlitherError
    SLITHER_AVAILABLE = True
except ImportError:
    SLITHER_AVAILABLE = False

from ..plugin_base import ScannerPlugin, Finding, ScanContext
from ..core.logging import get_logger

logger = get_logger(__name__)

class SlitherStatic(ScannerPlugin):
    """Performs static analysis using the Slither tool."""
    name = "slither-static"
    version = "0.1.0"
    
    async def scan(self, ctx: ScanContext) -> List[Finding]:
        if not SLITHER_AVAILABLE:
            logger.warning("Slither is not installed, skipping slither-static plugin.")
            return []
        if not ctx.source_code:
            logger.warning(f"Plugin '{self.name}' skipped: No source code provided for {ctx.target}.")
            return []
        
        findings = []
        with tempfile.NamedTemporaryFile(mode='w', suffix='.sol', delete=False, dir=ctx.workdir) as f:
            f.write(ctx.source_code)
            temp_path = f.name
        
        try:
            logger.info(f"Running Slither on {temp_path}")
            slither = Slither(temp_path)
            
            for detector_name, results in slither.results.items():
                for result in results:
                    findings.append(self._format_slither_result(result))
            logger.info(f"Slither analysis for {ctx.target} completed with {len(findings)} findings.")
        except SlitherError as e:
            logger.error(f"Slither analysis failed for {ctx.target}: {e}")
            findings.append(Finding(id="slither-execution-error", title="Slither Execution Error", severity="info", description=f"Slither failed: {e}", confidence=1.0, source_tool=self.name))
        finally:
            os.unlink(temp_path)
            
        return findings

    def _format_slither_result(self, result: Dict) -> Finding:
        impact_map = {"High": "high", "Medium": "medium", "Low": "low", "Informational": "info"}
        return Finding(
            id=result['check'],
            title=result['description'].splitlines()[0].strip(),
            severity=impact_map.get(result['impact'], "medium"),
            description=result['description'],
            confidence=float(result.get('confidence', 0.8)),
            recommendation=result.get('background'),
            source_tool=self.name,
            metadata={"elements": [elem.get('name', 'N/A') for elem in result.get('elements', [])]}
        )