"""
Scorpius AI-Powered Vulnerability Analyzer
Advanced smart contract analysis using Claude AI
"""
import asyncio
import json
import logging
import time
from typing import Dict, List, Optional, Any, Tuple
from dataclasses import asdict
import aiohttp
import os
from models.scorpius_models import (
    VulnerabilityFinding, VulnerabilityType, VulnerabilityLevel,
    ScorpiusAnalysis, ContractInfo
)

logger = logging.getLogger(__name__)


class ClaudeAnalyzer:
    """AI-powered vulnerability analyzer using Claude"""
    
    def __init__(self, api_key: Optional[str] = None):
        self.api_key = api_key or os.getenv("ANTHROPIC_API_KEY")
        self.base_url = "https://api.anthropic.com/v1/messages"
        self.model = "claude-3-opus-20240229"
        self.max_tokens = 4000
        
        if not self.api_key:
            logger.warning("No Anthropic API key provided - AI analysis will be disabled")
    
    async def analyze_contract(
        self,
        contract_address: str,
        source_code: Optional[str] = None,
        bytecode: Optional[str] = None,
        contract_info: Optional[ContractInfo] = None,
        vulnerability_context: Optional[List[Dict]] = None
    ) -> Tuple[List[VulnerabilityFinding], ScorpiusAnalysis]:
        """
        Comprehensive AI analysis of smart contract
        
        Args:
            contract_address: Contract address
            source_code: Contract source code (if available)
            bytecode: Contract bytecode
            contract_info: Contract metadata
            vulnerability_context: Previous vulnerability scan results
            
        Returns:
            Tuple of (vulnerabilities, ai_analysis)
        """
        if not self.api_key:
            logger.warning("AI analysis skipped - no API key")
            return [], ScorpiusAnalysis()
        
        try:
            # Prepare analysis prompt
            prompt = self._build_analysis_prompt(
                contract_address, source_code, bytecode, 
                contract_info, vulnerability_context
            )
            
            # Get AI analysis
            ai_response = await self._call_claude_api(prompt)
            
            # Parse AI response
            vulnerabilities, analysis = self._parse_ai_response(ai_response)
            
            return vulnerabilities, analysis
            
        except Exception as e:
            logger.error(f"AI analysis failed: {e}")
            return [], ScorpiusAnalysis(
                model_used=self.model,
                confidence_score=0.0,
                risk_assessment="Analysis failed",
                ai_reasoning=f"Error: {str(e)}"
            )
    
    def _build_analysis_prompt(
        self,
        contract_address: str,
        source_code: Optional[str],
        bytecode: Optional[str],
        contract_info: Optional[ContractInfo],
        vulnerability_context: Optional[List[Dict]]
    ) -> str:
        """Build comprehensive analysis prompt for Claude"""
        
        prompt = f"""You are Scorpius, the world's most advanced smart contract security analyzer. Analyze this Ethereum contract for vulnerabilities with extreme precision.

CONTRACT ADDRESS: {contract_address}

ADVANCED VULNERABILITY PATTERNS TO DETECT:
1. **Supply Chain Library Compromise** - Check for malicious library dependencies
2. **Advanced Persistent Smart Contract Threats** - Hidden backdoors with time delays
3. **Race Condition Exploits** - Payment processing duplication vulnerabilities
4. **Multi-Signature Wallet Library Dependencies** - Shared library destruction risks
5. **Advanced Oracle Manipulation** - Infrastructure targeting beyond price feeds
6. **Proxy Contract Tampering** - Upgradeable contract exploitation
7. **Cross-Function Reentrancy** - Complex entrypoint vulnerabilities
8. **Cross-Chain Verification Exploits** - Bridge protocol vulnerabilities
9. **Delegatecall Exploitation** - Malicious logic injection
10. **Access Control Bypass** - Admin privilege escalation
11. **Flash Loan Attacks** - Price manipulation and arbitrage
12. **MEV Vulnerabilities** - Sandwich attacks and front-running
13. **Upgrade Mechanism Flaws** - Implementation swap attacks
14. **Storage Collision** - Proxy storage layout conflicts
15. **Signature Replay** - Cross-chain signature reuse

"""

        if contract_info:
            prompt += f"""
CONTRACT METADATA:
- Verified: {contract_info.verified}
- Proxy: {contract_info.proxy}
- Implementation: {contract_info.implementation}
- Balance: {contract_info.balance} ETH
- Transaction Count: {contract_info.tx_count}
- Compiler: {contract_info.compiler_version}
- Optimization: {contract_info.optimization}
"""

        if source_code:
            prompt += f"""
SOURCE CODE ANALYSIS:
```solidity
{source_code[:8000]}  # Truncate if too long
```
"""

        if bytecode:
            prompt += f"""
BYTECODE ANALYSIS:
```
{bytecode[:2000]}  # Truncate if too long
```
"""

        if vulnerability_context:
            prompt += f"""
PREVIOUS SCAN RESULTS:
{json.dumps(vulnerability_context, indent=2)[:2000]}
"""

        prompt += """
ANALYSIS REQUIREMENTS:
1. **Identify ALL vulnerabilities** with exact function names and line numbers
2. **Generate working exploit code** for each vulnerability found
3. **Assess business impact** in dollar terms where possible
4. **Provide specific mitigation steps** for each issue
5. **Rate exploitation complexity** (Trivial/Easy/Medium/Hard/Expert)
6. **Calculate confidence scores** (0.0-1.0) for each finding

OUTPUT FORMAT (JSON):
{
  "vulnerabilities": [
    {
      "vuln_type": "backdoor|reentrancy|access_control|proxy_tampering|oracle_manipulation|cross_chain_exploit|supply_chain_attack|race_condition|library_dependency|upgrade_vulnerability|delegatecall_exploit|flash_loan_attack|sandwich_attack|mev_vulnerability|admin_privilege_abuse",
      "severity": "critical|high|medium|low|info",
      "title": "Precise vulnerability title",
      "description": "Detailed technical description",
      "function_name": "vulnerable_function_name",
      "function_signature": "function(uint256,address)",
      "line_number": 123,
      "code_snippet": "Exact vulnerable code",
      "exploit_code": "Working exploit in Solidity/JavaScript",
      "mitigation": "Specific fix instructions",
      "references": ["CVE-2023-xxxx", "https://example.com"],
      "confidence": 0.95,
      "ai_analysis": "Detailed reasoning for this finding"
    }
  ],
  "analysis": {
    "confidence_score": 0.92,
    "risk_assessment": "CRITICAL - Contract has multiple high-severity vulnerabilities",
    "attack_vectors": ["Direct exploitation", "Flash loan manipulation"],
    "exploitation_complexity": "Easy",
    "business_impact": "Potential loss of $X million in user funds",
    "recommendations": [
      "Implement reentrancy guards",
      "Add proper access controls"
    ],
    "ai_reasoning": "Detailed analysis of contract security posture"
  }
}

BE EXTREMELY THOROUGH. This is for enterprise security - accuracy is critical.
"""
        
        return prompt
    
    async def _call_claude_api(self, prompt: str) -> str:
        """Call Claude API for analysis"""
        headers = {
            "x-api-key": self.api_key,
            "content-type": "application/json",
            "anthropic-version": "2023-06-01"
        }
        
        payload = {
            "model": self.model,
            "max_tokens": self.max_tokens,
            "messages": [
                {
                    "role": "user",
                    "content": prompt
                }
            ],
            "temperature": 0.1  # Low temperature for consistent analysis
        }
        
        async with aiohttp.ClientSession() as session:
            async with session.post(
                self.base_url,
                headers=headers,
                json=payload,
                timeout=aiohttp.ClientTimeout(total=60)
            ) as response:
                if response.status == 200:
                    result = await response.json()
                    return result["content"][0]["text"]
                else:
                    error_text = await response.text()
                    raise Exception(f"Claude API error {response.status}: {error_text}")
    
    def _parse_ai_response(self, ai_response: str) -> Tuple[List[VulnerabilityFinding], ScorpiusAnalysis]:
        """Parse Claude's JSON response into structured data"""
        try:
            # Extract JSON from response (Claude sometimes adds extra text)
            json_start = ai_response.find('{')
            json_end = ai_response.rfind('}') + 1
            
            if json_start == -1 or json_end == 0:
                raise ValueError("No JSON found in AI response")
            
            json_str = ai_response[json_start:json_end]
            data = json.loads(json_str)
            
            # Parse vulnerabilities
            vulnerabilities = []
            for vuln_data in data.get("vulnerabilities", []):
                vuln = VulnerabilityFinding(
                    vuln_type=VulnerabilityType(vuln_data.get("vuln_type", "backdoor")),
                    severity=VulnerabilityLevel(vuln_data.get("severity", "medium")),
                    title=vuln_data.get("title", "Unknown vulnerability"),
                    description=vuln_data.get("description", ""),
                    function_name=vuln_data.get("function_name"),
                    function_signature=vuln_data.get("function_signature"),
                    line_number=vuln_data.get("line_number"),
                    code_snippet=vuln_data.get("code_snippet"),
                    exploit_code=vuln_data.get("exploit_code"),
                    mitigation=vuln_data.get("mitigation"),
                    references=vuln_data.get("references", []),
                    confidence=vuln_data.get("confidence", 0.5),
                    ai_analysis=vuln_data.get("ai_analysis")
                )
                vulnerabilities.append(vuln)
            
            # Parse analysis
            analysis_data = data.get("analysis", {})
            analysis = ScorpiusAnalysis(
                model_used=self.model,
                confidence_score=analysis_data.get("confidence_score", 0.0),
                risk_assessment=analysis_data.get("risk_assessment", "Unknown risk"),
                attack_vectors=analysis_data.get("attack_vectors", []),
                exploitation_complexity=analysis_data.get("exploitation_complexity", "Unknown"),
                business_impact=analysis_data.get("business_impact", "Unknown impact"),
                recommendations=analysis_data.get("recommendations", []),
                ai_reasoning=analysis_data.get("ai_reasoning", "")
            )
            
            return vulnerabilities, analysis
            
        except Exception as e:
            logger.error(f"Failed to parse AI response: {e}")
            logger.debug(f"AI response was: {ai_response}")
            
            # Return fallback analysis
            return [], ScorpiusAnalysis(
                model_used=self.model,
                confidence_score=0.0,
                risk_assessment="Analysis parsing failed",
                ai_reasoning=f"Failed to parse AI response: {str(e)}"
            )


async def test_ai_analyzer():
    """Test the AI analyzer"""
    analyzer = ClaudeAnalyzer()
    
    # Test with a known vulnerable contract
    test_address = "0xA69babEF1cA67A37Ffaf7a485DfFF3382056e78C"
    
    contract_info = ContractInfo(
        address=test_address,
        verified=False,
        proxy=False,
        balance="290.68"
    )
    
    vulnerabilities, analysis = await analyzer.analyze_contract(
        test_address,
        contract_info=contract_info
    )
    
    print(f"Found {len(vulnerabilities)} vulnerabilities")
    for vuln in vulnerabilities:
        print(f"- {vuln.severity.upper()}: {vuln.title}")
    
    print(f"Overall risk: {analysis.risk_assessment}")


if __name__ == "__main__":
    asyncio.run(test_ai_analyzer())
