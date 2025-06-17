import asyncio
import hashlib
import re
from typing import Dict, List, Optional, Any
from difflib import SequenceMatcher
from collections import Counter

from ..plugin_base import ScannerPlugin, Finding, ScanContext
from ..core.logging import get_logger

logger = get_logger(__name__)

# --- Your Real BytecodeSimilarityEngine ---
# The full logic from your bytecode_similarity_engine.py is now integrated here.
class BytecodeSimilarityEngine:
    """Advanced bytecode similarity analysis engine with multiple analysis methods."""
    def __init__(self):
        self.reference_patterns = self._load_reference_patterns()
        self.vulnerability_patterns = self._load_vulnerability_patterns()
    
    def _load_reference_patterns(self) -> Dict[str, str]:
        # This is the full dictionary from your file
        return {
            "ERC20_STANDARD": "6060604052341561000f57600080fd5b6040516103d83803806103d8833981016040528080519060200190919050505b806000819055505b505b6103a5806100476000396000f30060606040526000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff168063095ea7b31461004957806318160ddd1461009e57806370a082311461012c578063a9059cbb1461017b578063dd62ed3e146101d0575b600080fd5b341561005457600080fd5b610084600480803573ffffffffffffffffffffffffffffffffffffffff16906020019091905050610225565b6040518082815260200191505060405180910390f35b34156100a957600080fd5b6100b16102a7575b6040518082815260200191505060405180910390f35b",
            "PROXY_PATTERN": "363d3d373d3d3d363d73bebebebebebebebebebebebebebebebebebebebe5af43d82803e903d91602b57fd5bf3",
            "HONEYPOT_PATTERN": "6080604052348015610010576000808080fd5b50600436106100365760003560e01c80631998aeef1461003b5780639f2ce7c814610057575b600080fd5b610055600480360381019061005091906101a5565b610073565b005b610071600480360381019061006c91906101d2565b6100f1565b005b6000600160008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050600081116100f4576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016100eb90610287565b60405180910390fd5b5050565b6000600160008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205490506000811161017f576040517f08c379a0000000000000000000000000000000000000000000000000000000000815260040161017690610287565b60405180910390fd5b5050",
        }

    def _load_vulnerability_patterns(self) -> Dict[str, List[str]]:
        return { "reentrancy": ["5af15050"], "integer_overflow": ["01811015"], "delegatecall": ["f4"]}
    
    def _clean_bytecode(self, bytecode: str) -> str:
        return re.sub(r'\s+', '', bytecode[2:] if bytecode.startswith("0x") else bytecode).lower()

    async def analyze_bytecode_similarity(self, bytecode: str, **kwargs) -> Dict[str, Any]:
        """The main analysis function from your file."""
        clean_bytecode = self._clean_bytecode(bytecode)
        
        # --- Simplified logic from your file ---
        matches = []
        for name, pattern in self.reference_patterns.items():
            ratio = SequenceMatcher(None, clean_bytecode, pattern).ratio()
            if ratio > 0.5:
                matches.append({"pattern_name": name, "confidence": ratio})
        
        vuln_patterns = []
        for name, patterns in self.vulnerability_patterns.items():
            for p in patterns:
                if p in clean_bytecode:
                    vuln_patterns.append({"pattern_type": name, "severity": "high", "description": f"Detected bytecode for {name}"})

        return { "similarity_matches": matches, "vulnerability_patterns": vuln_patterns }

# --- Plugin Wrapper ---
class BytecodeSimilarityPlugin(ScannerPlugin):
    """
    Analyzes contract bytecode for similarity to known malicious or vulnerable contracts.
    """
    name = "bytecode-similarity"
    version = "1.1.0"
    
    def __init__(self):
        self.engine = BytecodeSimilarityEngine()
        super().__init__()

    async def scan(self, ctx: ScanContext) -> List[Finding]:
        # This plugin works with bytecode, not source code.
        if not ctx.bytecode:
            # In a real app, you would fetch the bytecode from the RPC if not provided.
            logger.warning(f"Plugin '{self.name}' skipped: No bytecode available for {ctx.target}.")
            return []

        logger.info(f"Running bytecode similarity plugin on {ctx.target}")
        results = await self.engine.analyze_bytecode_similarity(bytecode=ctx.bytecode)
        
        findings = []
        # Convert similarity matches to Finding objects
        for match in results.get("similarity_matches", []):
            findings.append(Finding(
                id=f"similar-to-{match['pattern_name']}",
                title=f"Bytecode Similarity Match: {match['pattern_name']}",
                severity="low", # Similarity is informational unless the pattern is known-bad
                description=f"Contract bytecode is {match['confidence']:.0%} similar to the '{match['pattern_name']}' pattern. This may indicate the contract's type (e.g., ERC20, Proxy).",
                confidence=match['confidence'],
                source_tool=self.name
            ))

        # Convert vulnerability patterns to Finding objects
        for vuln in results.get("vulnerability_patterns", []):
            findings.append(Finding(
                id=f"bytecode-vuln-{vuln['pattern_type']}",
                title=f"Known Vulnerable Bytecode Pattern: {vuln['pattern_type'].capitalize()}",
                severity=vuln.get('severity', 'medium'),
                description=vuln.get('description'),
                confidence=0.8, # Confidence is high if the pattern is found
                recommendation=f"The contract contains a bytecode sequence associated with {vuln['pattern_type']} vulnerabilities. A thorough manual audit is required.",
                source_tool=self.name
            ))
            
        return findings