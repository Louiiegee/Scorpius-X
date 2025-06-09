"""
Advanced Bytecode Similarity Analysis Engine

This module provides comprehensive bytecode similarity analysis including:
- Fuzzy string matching for bytecode similarity
- Opcode-level analysis and pattern detection
- Known vulnerability pattern matching
- Contract family classification
- Bytecode fingerprinting
"""

import asyncio
import hashlib
import re
from typing import Dict, List, Optional, Tuple, Any, Set
from difflib import SequenceMatcher
from collections import Counter
import logging

logger = logging.getLogger(__name__)


class BytecodeSimilarityEngine:
    """Advanced bytecode similarity analysis engine with multiple analysis methods."""
    
    def __init__(self):
        """Initialize the bytecode similarity engine with reference patterns."""
        self.reference_patterns = self._load_reference_patterns()
        self.vulnerability_patterns = self._load_vulnerability_patterns()
        self.opcode_map = self._build_opcode_map()
        
    def _load_reference_patterns(self) -> Dict[str, str]:
        """Load known contract patterns for similarity comparison."""
        return {
            "ERC20_STANDARD": "6060604052341561000f57600080fd5b6040516103d83803806103d8833981016040528080519060200190919050505b806000819055505b505b6103a5806100476000396000f30060606040526000357c0100000000000000000000000000000000000000000000000000000000900463ffffffff168063095ea7b31461004957806318160ddd1461009e57806370a082311461012c578063a9059cbb1461017b578063dd62ed3e146101d0575b600080fd5b341561005457600080fd5b610084600480803573ffffffffffffffffffffffffffffffffffffffff16906020019091905050610225565b6040518082815260200191505060405180910390f35b34156100a957600080fd5b6100b16102a7575b6040518082815260200191505060405180910390f35b",
            
            "UNISWAP_V2_PAIR": "608060405234801561001057600080fd5b50600436106101425760003560e01c80636a627842116100b8578063ba9a7a561161007c578063ba9a7a5614610320578063c45a015514610328578063d0e30db014610330578063d21220a714610338578063dd62ed3e14610340578063fff6cae91461036e57610142565b80636a627842146102a057806370a08231146102c65780637ecebe00146102ec57806395d89b4114610312578063a9059cbb1461031a57610142565b",
            
            "PROXY_PATTERN": "363d3d373d3d3d363d73bebebebebebebebebebebebebebebebebebebebe5af43d82803e903d91602b57fd5bf3",
            
            "HONEYPOT_PATTERN": "6080604052348015610010576000808080fd5b50600436106100365760003560e01c80631998aeef1461003b5780639f2ce7c814610057575b600080fd5b610055600480360381019061005091906101a5565b610073565b005b610071600480360381019061006c91906101d2565b6100f1565b005b6000600160008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff168152602001908152602001600020549050600081116100f4576040517f08c379a00000000000000000000000000000000000000000000000000000000081526004016100eb90610287565b60405180910390fd5b5050565b6000600160008373ffffffffffffffffffffffffffffffffffffffff1673ffffffffffffffffffffffffffffffffffffffff1681526020019081526020016000205490506000811161017f576040517f08c379a000000000000000000000000000000000000000000000000000000000815260040161017690610287565b60405180910390fd5b5050",
            
            "SELFDESTRUCT_PATTERN": "ff", # SELFDESTRUCT opcode
            
            "DELEGATECALL_PATTERN": "f4", # DELEGATECALL opcode
        }
    
    def _load_vulnerability_patterns(self) -> Dict[str, List[str]]:
        """Load known vulnerability patterns in bytecode."""
        return {
            "reentrancy": [
                "5af15050",  # CALL followed by checks
                "6000526020600020f35af1",  # Common reentrancy pattern
            ],
            "integer_overflow": [
                "01811015",  # ADD followed by LT check (overflow detection)
                "03811015",  # SUB followed by LT check
            ],
            "access_control": [
                "33141561",  # caller() == check pattern
                "3314600a57",  # Basic access control
            ],
            "selfdestruct": [
                "ff",  # SELFDESTRUCT opcode
            ],
            "delegatecall": [
                "f4",  # DELEGATECALL opcode
                "3d3d3d3d363d3d37363d73",  # Proxy pattern with delegatecall
            ]
        }
    
    def _build_opcode_map(self) -> Dict[str, str]:
        """Build mapping of opcode values to names."""
        return {
            "00": "STOP", "01": "ADD", "02": "MUL", "03": "SUB", "04": "DIV",
            "05": "SDIV", "06": "MOD", "07": "SMOD", "08": "ADDMOD", "09": "MULMOD",
            "0a": "EXP", "0b": "SIGNEXTEND", "10": "LT", "11": "GT", "12": "SLT",
            "13": "SGT", "14": "EQ", "15": "ISZERO", "16": "AND", "17": "OR",
            "18": "XOR", "19": "NOT", "1a": "BYTE", "1b": "SHL", "1c": "SHR",
            "1d": "SAR", "20": "SHA3", "30": "ADDRESS", "31": "BALANCE",
            "32": "ORIGIN", "33": "CALLER", "34": "CALLVALUE", "35": "CALLDATALOAD",
            "36": "CALLDATASIZE", "37": "CALLDATACOPY", "38": "CODESIZE",
            "39": "CODECOPY", "3a": "GASPRICE", "3b": "EXTCODESIZE",
            "3c": "EXTCODECOPY", "3d": "RETURNDATASIZE", "3e": "RETURNDATACOPY",
            "3f": "EXTCODEHASH", "40": "BLOCKHASH", "41": "COINBASE",
            "42": "TIMESTAMP", "43": "NUMBER", "44": "DIFFICULTY", "45": "GASLIMIT",
            "46": "CHAINID", "47": "SELFBALANCE", "50": "POP", "51": "MLOAD",
            "52": "MSTORE", "53": "MSTORE8", "54": "SLOAD", "55": "SSTORE",
            "56": "JUMP", "57": "JUMPI", "58": "PC", "59": "MSIZE", "5a": "GAS",
            "5b": "JUMPDEST", "80": "DUP1", "81": "DUP2", "82": "DUP3",
            "83": "DUP4", "84": "DUP5", "85": "DUP6", "86": "DUP7",
            "87": "DUP8", "88": "DUP9", "89": "DUP10", "8a": "DUP11",
            "8b": "DUP12", "8c": "DUP13", "8d": "DUP14", "8e": "DUP15",
            "8f": "DUP16", "90": "SWAP1", "91": "SWAP2", "92": "SWAP3",
            "93": "SWAP4", "94": "SWAP5", "95": "SWAP6", "96": "SWAP7",
            "97": "SWAP8", "98": "SWAP9", "99": "SWAP10", "9a": "SWAP11",
            "9b": "SWAP12", "9c": "SWAP13", "9d": "SWAP14", "9e": "SWAP15",
            "9f": "SWAP16", "a0": "LOG0", "a1": "LOG1", "a2": "LOG2",
            "a3": "LOG3", "a4": "LOG4", "f0": "CREATE", "f1": "CALL",
            "f2": "CALLCODE", "f3": "RETURN", "f4": "DELEGATECALL",
            "f5": "CREATE2", "fa": "STATICCALL", "fd": "REVERT", "ff": "SELFDESTRUCT"
        }

    async def analyze_bytecode_similarity(
        self, 
        bytecode: str,
        include_opcode_analysis: bool = True,
        include_vulnerability_patterns: bool = True,
        include_fingerprinting: bool = True
    ) -> Dict[str, Any]:
        """
        Comprehensive bytecode similarity analysis.
        
        Args:
            bytecode: Contract bytecode (hex string, with or without 0x prefix)
            include_opcode_analysis: Whether to include opcode-level analysis
            include_vulnerability_patterns: Whether to check for vulnerability patterns
            include_fingerprinting: Whether to generate bytecode fingerprints
            
        Returns:
            Dictionary containing all analysis results
        """
        logger.info(f"Starting comprehensive bytecode similarity analysis for {len(bytecode)} bytes")
        
        # Clean bytecode
        clean_bytecode = self._clean_bytecode(bytecode)
        
        # Initialize results
        results = {
            "bytecode_hash": hashlib.sha256(clean_bytecode.encode()).hexdigest(),
            "bytecode_length": len(clean_bytecode),
            "similarity_matches": [],
            "vulnerability_patterns": [],
            "opcode_analysis": {},
            "fingerprint": {},
            "classification": {},
            "risk_score": 0.0,
            "analysis_timestamp": asyncio.get_event_loop().time()
        }
        
        # Run similarity analysis against reference patterns
        results["similarity_matches"] = await self._analyze_pattern_similarity(clean_bytecode)
        
        # Vulnerability pattern detection
        if include_vulnerability_patterns:
            results["vulnerability_patterns"] = await self._detect_vulnerability_patterns(clean_bytecode)
        
        # Opcode analysis
        if include_opcode_analysis:
            results["opcode_analysis"] = await self._analyze_opcodes(clean_bytecode)
        
        # Bytecode fingerprinting
        if include_fingerprinting:
            results["fingerprint"] = await self._generate_fingerprint(clean_bytecode)
        
        # Classification and risk scoring
        results["classification"] = await self._classify_contract(results)
        results["risk_score"] = await self._calculate_risk_score(results)
        
        logger.info(f"Bytecode analysis complete. Risk score: {results['risk_score']}")
        return results

    def _clean_bytecode(self, bytecode: str) -> str:
        """Clean and normalize bytecode for analysis."""
        # Remove 0x prefix if present
        if bytecode.startswith("0x"):
            bytecode = bytecode[2:]
        
        # Convert to lowercase for consistency
        bytecode = bytecode.lower()
        
        # Remove any whitespace
        bytecode = re.sub(r'\s+', '', bytecode)
        
        return bytecode

    async def _analyze_pattern_similarity(self, bytecode: str) -> List[Dict[str, Any]]:
        """Analyze similarity against known patterns."""
        similarities = []
        
        for pattern_name, pattern_code in self.reference_patterns.items():
            similarity_ratio = self._calculate_similarity_ratio(bytecode, pattern_code)
            
            # Get detailed diff if similarity is significant
            diff_analysis = None
            if similarity_ratio > 0.3:  # Only analyze diffs for meaningful similarities
                diff_analysis = await self._calculate_detailed_diff(bytecode, pattern_code)
            
            similarities.append({
                "pattern_name": pattern_name,
                "similarity_ratio": similarity_ratio,
                "confidence": self._calculate_confidence(similarity_ratio, len(bytecode), len(pattern_code)),
                "diff_analysis": diff_analysis
            })
        
        # Sort by similarity ratio
        similarities.sort(key=lambda x: x["similarity_ratio"], reverse=True)
        return similarities

    def _calculate_similarity_ratio(self, bytecode1: str, bytecode2: str) -> float:
        """Calculate similarity ratio between two bytecode strings."""
        return SequenceMatcher(None, bytecode1, bytecode2).ratio()

    async def _calculate_detailed_diff(self, bytecode1: str, bytecode2: str) -> Dict[str, Any]:
        """Calculate detailed differences between bytecode strings."""
        def run_diff():
            matcher = SequenceMatcher(None, bytecode1, bytecode2)
            opcodes = matcher.get_opcodes()
            
            diff_blocks = []
            for tag, i1, i2, j1, j2 in opcodes:
                diff_blocks.append({
                    "operation": tag,  # 'equal', 'delete', 'insert', 'replace'
                    "source_range": [i1, i2],
                    "target_range": [j1, j2],
                    "source_content": bytecode1[i1:i2] if i1 < len(bytecode1) else "",
                    "target_content": bytecode2[j1:j2] if j1 < len(bytecode2) else ""
                })
            
            return {
                "diff_blocks": diff_blocks,
                "total_changes": len([block for block in diff_blocks if block["operation"] != "equal"]),
                "change_ratio": 1.0 - matcher.ratio()
            }
        
        return await asyncio.to_thread(run_diff)

    async def _detect_vulnerability_patterns(self, bytecode: str) -> List[Dict[str, Any]]:
        """Detect known vulnerability patterns in bytecode."""
        detected_patterns = []
        
        for vuln_type, patterns in self.vulnerability_patterns.items():
            for pattern in patterns:
                matches = await self._find_pattern_matches(bytecode, pattern)
                if matches:
                    detected_patterns.append({
                        "vulnerability_type": vuln_type,
                        "pattern": pattern,
                        "matches": matches,
                        "severity": self._get_vulnerability_severity(vuln_type),
                        "description": self._get_vulnerability_description(vuln_type)
                    })
        
        return detected_patterns

    async def _find_pattern_matches(self, bytecode: str, pattern: str) -> List[Dict[str, int]]:
        """Find all matches of a pattern in bytecode."""
        def find_matches():
            matches = []
            start = 0
            while True:
                pos = bytecode.find(pattern, start)
                if pos == -1:
                    break
                matches.append({
                    "position": pos,
                    "length": len(pattern)
                })
                start = pos + 1
            return matches
        
        return await asyncio.to_thread(find_matches)

    def _get_vulnerability_severity(self, vuln_type: str) -> str:
        """Get severity level for vulnerability type."""
        severity_map = {
            "reentrancy": "High",
            "integer_overflow": "Medium",
            "access_control": "High",
            "selfdestruct": "Critical",
            "delegatecall": "High"
        }
        return severity_map.get(vuln_type, "Low")

    def _get_vulnerability_description(self, vuln_type: str) -> str:
        """Get description for vulnerability type."""
        descriptions = {
            "reentrancy": "Potential reentrancy vulnerability detected",
            "integer_overflow": "Potential integer overflow/underflow detected",
            "access_control": "Potential access control bypass detected",
            "selfdestruct": "Selfdestruct functionality detected",
            "delegatecall": "Delegatecall usage detected (proxy pattern or potential vulnerability)"
        }
        return descriptions.get(vuln_type, "Unknown vulnerability pattern")

    async def _analyze_opcodes(self, bytecode: str) -> Dict[str, Any]:
        """Analyze opcode distribution and patterns."""
        def analyze_opcodes_sync():
            # Extract opcodes (each opcode is 2 hex characters)
            opcodes = [bytecode[i:i+2] for i in range(0, len(bytecode), 2)]
            
            # Count opcode frequencies
            opcode_counts = Counter(opcodes)
            
            # Map to opcode names
            named_opcodes = {}
            for opcode, count in opcode_counts.items():
                name = self.opcode_map.get(opcode, f"UNKNOWN_{opcode}")
                named_opcodes[name] = count
            
            # Calculate statistics
            total_opcodes = len(opcodes)
            unique_opcodes = len(opcode_counts)
            complexity_score = unique_opcodes / total_opcodes if total_opcodes > 0 else 0
            
            # Identify suspicious patterns
            suspicious_opcodes = []
            if opcode_counts.get("ff", 0) > 0:  # SELFDESTRUCT
                suspicious_opcodes.append("SELFDESTRUCT")
            if opcode_counts.get("f4", 0) > 0:  # DELEGATECALL
                suspicious_opcodes.append("DELEGATECALL")
            if opcode_counts.get("f1", 0) > 10:  # High number of CALL opcodes
                suspicious_opcodes.append("HIGH_CALL_USAGE")
            
            return {
                "total_opcodes": total_opcodes,
                "unique_opcodes": unique_opcodes,
                "complexity_score": complexity_score,
                "opcode_distribution": dict(sorted(named_opcodes.items(), key=lambda x: x[1], reverse=True)[:20]),
                "suspicious_opcodes": suspicious_opcodes,
                "raw_opcode_counts": dict(opcode_counts.most_common(50))
            }
        
        return await asyncio.to_thread(analyze_opcodes_sync)

    async def _generate_fingerprint(self, bytecode: str) -> Dict[str, Any]:
        """Generate unique fingerprint for bytecode."""
        def generate_fingerprint_sync():
            # Hash-based fingerprints
            sha256_hash = hashlib.sha256(bytecode.encode()).hexdigest()
            md5_hash = hashlib.md5(bytecode.encode()).hexdigest()
            
            # Structural fingerprint (first/last N bytes, length)
            prefix = bytecode[:100] if len(bytecode) >= 100 else bytecode
            suffix = bytecode[-100:] if len(bytecode) >= 100 else bytecode
            
            # Opcode frequency fingerprint
            opcodes = [bytecode[i:i+2] for i in range(0, len(bytecode), 2)]
            opcode_counts = Counter(opcodes)
            top_opcodes = dict(opcode_counts.most_common(10))
            
            return {
                "sha256": sha256_hash,
                "md5": md5_hash,
                "length": len(bytecode),
                "prefix": prefix,
                "suffix": suffix,
                "opcode_signature": top_opcodes,
                "entropy": self._calculate_entropy(bytecode)
            }
        
        return await asyncio.to_thread(generate_fingerprint_sync)

    def _calculate_entropy(self, bytecode: str) -> float:
        """Calculate Shannon entropy of bytecode."""
        if not bytecode:
            return 0.0
        
        # Count character frequencies
        counts = Counter(bytecode)
        length = len(bytecode)
        
        # Calculate entropy
        entropy = 0.0
        for count in counts.values():
            p = count / length
            if p > 0:
                entropy -= p * (p ** 0.5)  # Simplified entropy calculation
        
        return entropy

    async def _classify_contract(self, analysis_results: Dict[str, Any]) -> Dict[str, Any]:
        """Classify contract based on analysis results."""
        classification = {
            "contract_type": "Unknown",
            "confidence": 0.0,
            "characteristics": [],
            "family": "Unknown"
        }
        
        # Check similarity matches for classification
        similarities = analysis_results.get("similarity_matches", [])
        if similarities:
            top_match = similarities[0]
            if top_match["similarity_ratio"] > 0.8:
                classification["contract_type"] = top_match["pattern_name"]
                classification["confidence"] = top_match["similarity_ratio"]
        
        # Add characteristics based on analysis
        vulnerability_patterns = analysis_results.get("vulnerability_patterns", [])
        if vulnerability_patterns:
            classification["characteristics"].extend([
                f"Contains {vuln['vulnerability_type']} patterns" 
                for vuln in vulnerability_patterns
            ])
        
        opcode_analysis = analysis_results.get("opcode_analysis", {})
        suspicious_opcodes = opcode_analysis.get("suspicious_opcodes", [])
        if suspicious_opcodes:
            classification["characteristics"].extend([
                f"Uses {opcode}" for opcode in suspicious_opcodes
            ])
        
        return classification

    async def _calculate_risk_score(self, analysis_results: Dict[str, Any]) -> float:
        """Calculate overall risk score based on analysis results."""
        risk_score = 0.0
        
        # Risk from vulnerability patterns
        vulnerability_patterns = analysis_results.get("vulnerability_patterns", [])
        for vuln in vulnerability_patterns:
            severity = vuln.get("severity", "Low")
            if severity == "Critical":
                risk_score += 3.0
            elif severity == "High":
                risk_score += 2.0
            elif severity == "Medium":
                risk_score += 1.0
            else:
                risk_score += 0.5
        
        # Risk from suspicious opcodes
        opcode_analysis = analysis_results.get("opcode_analysis", {})
        suspicious_opcodes = opcode_analysis.get("suspicious_opcodes", [])
        for opcode in suspicious_opcodes:
            if opcode == "SELFDESTRUCT":
                risk_score += 2.0
            elif opcode == "DELEGATECALL":
                risk_score += 1.5
            else:
                risk_score += 0.5
        
        # Risk from low similarity to known patterns
        similarities = analysis_results.get("similarity_matches", [])
        if similarities:
            max_similarity = max(sim["similarity_ratio"] for sim in similarities)
            if max_similarity < 0.3:  # Very different from known patterns
                risk_score += 1.0
        
        # Normalize to 0-10 scale
        return min(risk_score, 10.0)

    def _calculate_confidence(self, similarity_ratio: float, len1: int, len2: int) -> float:
        """Calculate confidence score for similarity match."""
        # Base confidence on similarity ratio
        confidence = similarity_ratio
        
        # Adjust for length differences
        length_ratio = min(len1, len2) / max(len1, len2) if max(len1, len2) > 0 else 0
        confidence *= (0.5 + 0.5 * length_ratio)  # Penalize large length differences
        
        return confidence


# Convenience function for quick analysis
async def analyze_contract_bytecode(
    bytecode: str,
    engine: Optional[BytecodeSimilarityEngine] = None
) -> Dict[str, Any]:
    """
    Quick analysis function for contract bytecode.
    
    Args:
        bytecode: Contract bytecode to analyze
        engine: Optional pre-initialized engine instance
        
    Returns:
        Complete analysis results
    """
    if engine is None:
        engine = BytecodeSimilarityEngine()
    
    return await engine.analyze_bytecode_similarity(bytecode)
