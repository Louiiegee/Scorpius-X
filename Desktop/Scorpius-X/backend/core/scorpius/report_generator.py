"""
Scorpius Report Generator
Creates comprehensive HTML and PDF vulnerability reports
"""
import json
import logging
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Optional, Any
import uuid
import base64
import os

from models.scorpius_models import (
    VulnerabilityFinding, ScorpiusAnalysis, ContractInfo,
    VulnerabilityLevel, VulnerabilityType
)

logger = logging.getLogger(__name__)


class ReportGenerator:
    """Generate comprehensive vulnerability reports"""
    
    def __init__(self, reports_dir: Optional[str] = None):
        self.reports_dir = Path(reports_dir or "reports/scorpius")
        self.reports_dir.mkdir(parents=True, exist_ok=True)
        
        # Load the existing HTML template from advanced_exploit_suite
        self.template_path = Path("C:/Users/ADMIN/Desktop/advanced_exploit_suite/reports/Scorpius_POC_Report.html")
    
    async def generate_report(
        self,
        scan_id: str,
        contract_address: str,
        contract_info: ContractInfo,
        vulnerabilities: List[VulnerabilityFinding],
        ai_analysis: ScorpiusAnalysis,
        scan_config: Dict[str, Any]
    ) -> Dict[str, str]:
        """
        Generate comprehensive vulnerability report
        
        Returns:
            Dict with paths to generated reports
        """
        try:
            # Generate HTML report
            html_path = await self._generate_html_report(
                scan_id, contract_address, contract_info,
                vulnerabilities, ai_analysis, scan_config
            )
            
            # Generate JSON report
            json_path = await self._generate_json_report(
                scan_id, contract_address, contract_info,
                vulnerabilities, ai_analysis, scan_config
            )
            
            # TODO: Generate PDF report (requires additional libraries)
            pdf_path = None
            
            return {
                "html": str(html_path),
                "json": str(json_path),
                "pdf": pdf_path
            }
            
        except Exception as e:
            logger.error(f"Report generation failed: {e}")
            return {}
    
    async def _generate_html_report(
        self,
        scan_id: str,
        contract_address: str,
        contract_info: ContractInfo,
        vulnerabilities: List[VulnerabilityFinding],
        ai_analysis: ScorpiusAnalysis,
        scan_config: Dict[str, Any]
    ) -> Path:
        """Generate HTML vulnerability report"""
        
        # Calculate statistics
        total_vulns = len(vulnerabilities)
        critical_count = sum(1 for v in vulnerabilities if v.severity == VulnerabilityLevel.CRITICAL)
        high_count = sum(1 for v in vulnerabilities if v.severity == VulnerabilityLevel.HIGH)
        medium_count = sum(1 for v in vulnerabilities if v.severity == VulnerabilityLevel.MEDIUM)
        low_count = sum(1 for v in vulnerabilities if v.severity == VulnerabilityLevel.LOW)
        
        # Calculate risk score
        risk_score = self._calculate_risk_score(vulnerabilities)
        risk_level = self._get_risk_level(risk_score)
        
        # Generate vulnerability sections
        vuln_sections = self._generate_vulnerability_sections(vulnerabilities)
        
        # Create HTML content
        html_content = f"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scorpius Security Scan - {contract_address}</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #ffffff;
            background: #0a0a0a;
            padding: 20px;
        }}
        
        .container {{
            max-width: 1200px;
            margin: 0 auto;
            background: #1a1a1a;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            border: 1px solid #333;
        }}
        
        .header {{
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
            border-radius: 8px;
            border: 1px solid #444;
        }}
        
        .header h1 {{
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 700;
            color: #00ffff;
            text-shadow: 0 0 10px #00ffff;
        }}
        
        .metadata {{
            background: #222;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #00ffff;
        }}
        
        .stats-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }}
        
        .stat-card {{
            background: #222;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
            border: 1px solid #444;
        }}
        
        .stat-number {{
            font-size: 2em;
            font-weight: bold;
            color: #00ffff;
        }}
        
        .critical {{ color: #ff4757; }}
        .high {{ color: #ff6b35; }}
        .medium {{ color: #ffa502; }}
        .low {{ color: #26de81; }}
        
        .vulnerability {{
            background: #1e1e1e;
            margin: 20px 0;
            border-radius: 8px;
            border-left: 4px solid;
            overflow: hidden;
        }}
        
        .vulnerability.critical {{ border-left-color: #ff4757; }}
        .vulnerability.high {{ border-left-color: #ff6b35; }}
        .vulnerability.medium {{ border-left-color: #ffa502; }}
        .vulnerability.low {{ border-left-color: #26de81; }}
        
        .vuln-header {{
            background: #2a2a2a;
            padding: 15px 20px;
            border-bottom: 1px solid #444;
        }}
        
        .vuln-title {{
            font-size: 1.4em;
            margin-bottom: 5px;
        }}
        
        .vuln-meta {{
            color: #888;
            font-size: 0.9em;
        }}
        
        .vuln-body {{
            padding: 20px;
        }}
        
        .code-block {{
            background: #0d1117;
            color: #e6edf3;
            padding: 15px;
            border-radius: 6px;
            margin: 10px 0;
            overflow-x: auto;
            font-family: 'Monaco', 'Menlo', monospace;
            font-size: 0.9em;
            border: 1px solid #30363d;
        }}
        
        .ai-analysis {{
            background: #1a2f3a;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #00ffff;
        }}
        
        .exploit-code {{
            background: #2d1b1b;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #ff4757;
            margin: 10px 0;
        }}
        
        .mitigation {{
            background: #1b2d1b;
            padding: 15px;
            border-radius: 6px;
            border-left: 4px solid #26de81;
            margin: 10px 0;
        }}
        
        h2 {{
            color: #00ffff;
            font-size: 1.8em;
            margin: 30px 0 15px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid #444;
        }}
        
        h3 {{
            color: #cccccc;
            font-size: 1.4em;
            margin: 25px 0 10px 0;
        }}
        
        .risk-indicator {{
            display: inline-block;
            padding: 5px 10px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.9em;
        }}
        
        .risk-critical {{ background: #ff4757; color: white; }}
        .risk-high {{ background: #ff6b35; color: white; }}
        .risk-medium {{ background: #ffa502; color: white; }}
        .risk-low {{ background: #26de81; color: white; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🦂 SCORPIUS SECURITY SCAN</h1>
            <p>Advanced AI-Powered Smart Contract Vulnerability Analysis</p>
        </div>
        
        <div class="metadata">
            <h3>📊 Scan Overview</h3>
            <p><strong>Contract:</strong> {contract_address}</p>
            <p><strong>Scan ID:</strong> {scan_id}</p>
            <p><strong>Timestamp:</strong> {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC</p>
            <p><strong>AI Model:</strong> {ai_analysis.model_used}</p>
            <p><strong>Overall Risk:</strong> <span class="risk-indicator risk-{risk_level.lower()}">{risk_level}</span></p>
        </div>
        
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-number">{total_vulns}</div>
                <div>Total Vulnerabilities</div>
            </div>
            <div class="stat-card">
                <div class="stat-number critical">{critical_count}</div>
                <div>Critical</div>
            </div>
            <div class="stat-card">
                <div class="stat-number high">{high_count}</div>
                <div>High</div>
            </div>
            <div class="stat-card">
                <div class="stat-number medium">{medium_count}</div>
                <div>Medium</div>
            </div>
            <div class="stat-card">
                <div class="stat-number low">{low_count}</div>
                <div>Low</div>
            </div>
            <div class="stat-card">
                <div class="stat-number">{risk_score:.1f}/10</div>
                <div>Risk Score</div>
            </div>
        </div>
        
        <div class="ai-analysis">
            <h3>🤖 AI Analysis Summary</h3>
            <p><strong>Risk Assessment:</strong> {ai_analysis.risk_assessment}</p>
            <p><strong>Exploitation Complexity:</strong> {ai_analysis.exploitation_complexity}</p>
            <p><strong>Business Impact:</strong> {ai_analysis.business_impact}</p>
            <p><strong>Confidence Score:</strong> {ai_analysis.confidence_score:.2f}/1.0</p>
            
            {self._format_ai_recommendations(ai_analysis.recommendations)}
            
            <h4>AI Reasoning:</h4>
            <p>{ai_analysis.ai_reasoning}</p>
        </div>
        
        <h2>🚨 Vulnerability Details</h2>
        {vuln_sections}
        
        <h2>📈 Contract Information</h2>
        <div class="metadata">
            <p><strong>Address:</strong> {contract_info.address}</p>
            <p><strong>Verified:</strong> {'Yes' if contract_info.verified else 'No'}</p>
            <p><strong>Proxy Contract:</strong> {'Yes' if contract_info.proxy else 'No'}</p>
            <p><strong>Balance:</strong> {contract_info.balance} ETH</p>
            <p><strong>Transaction Count:</strong> {contract_info.tx_count:,}</p>
            {f'<p><strong>Implementation:</strong> {contract_info.implementation}</p>' if contract_info.implementation else ''}
        </div>
        
        <div style="margin-top: 40px; text-align: center; color: #666; font-size: 0.9em;">
            <p>Generated by Scorpius AI Security Scanner | {datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S')} UTC</p>
            <p>This report contains confidential security information. Handle with care.</p>
        </div>
    </div>
</body>
</html>"""
        
        # Save HTML report
        report_path = self.reports_dir / f"scorpius_scan_{scan_id}.html"
        with open(report_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        logger.info(f"HTML report generated: {report_path}")
        return report_path
    
    async def _generate_json_report(
        self,
        scan_id: str,
        contract_address: str,
        contract_info: ContractInfo,
        vulnerabilities: List[VulnerabilityFinding],
        ai_analysis: ScorpiusAnalysis,
        scan_config: Dict[str, Any]
    ) -> Path:
        """Generate JSON vulnerability report"""
        
        report_data = {
            "scan_id": scan_id,
            "contract_address": contract_address,
            "timestamp": datetime.utcnow().isoformat(),
            "scan_config": scan_config,
            "contract_info": {
                "address": contract_info.address,
                "verified": contract_info.verified,
                "proxy": contract_info.proxy,
                "balance": contract_info.balance,
                "tx_count": contract_info.tx_count,
                "implementation": contract_info.implementation
            },
            "summary": {
                "total_vulnerabilities": len(vulnerabilities),
                "critical_count": sum(1 for v in vulnerabilities if v.severity == VulnerabilityLevel.CRITICAL),
                "high_count": sum(1 for v in vulnerabilities if v.severity == VulnerabilityLevel.HIGH),
                "medium_count": sum(1 for v in vulnerabilities if v.severity == VulnerabilityLevel.MEDIUM),
                "low_count": sum(1 for v in vulnerabilities if v.severity == VulnerabilityLevel.LOW),
                "risk_score": self._calculate_risk_score(vulnerabilities)
            },
            "vulnerabilities": [
                {
                    "id": str(uuid.uuid4()),
                    "type": vuln.vuln_type.value,
                    "severity": vuln.severity.value,
                    "title": vuln.title,
                    "description": vuln.description,
                    "function_name": vuln.function_name,
                    "function_signature": vuln.function_signature,
                    "line_number": vuln.line_number,
                    "code_snippet": vuln.code_snippet,
                    "exploit_code": vuln.exploit_code,
                    "mitigation": vuln.mitigation,
                    "references": vuln.references or [],
                    "confidence": vuln.confidence,
                    "ai_analysis": vuln.ai_analysis
                }
                for vuln in vulnerabilities
            ],
            "ai_analysis": {
                "model_used": ai_analysis.model_used,
                "confidence_score": ai_analysis.confidence_score,
                "risk_assessment": ai_analysis.risk_assessment,
                "attack_vectors": ai_analysis.attack_vectors or [],
                "exploitation_complexity": ai_analysis.exploitation_complexity,
                "business_impact": ai_analysis.business_impact,
                "recommendations": ai_analysis.recommendations or [],
                "ai_reasoning": ai_analysis.ai_reasoning
            }
        }
        
        # Save JSON report
        report_path = self.reports_dir / f"scorpius_scan_{scan_id}.json"
        with open(report_path, 'w', encoding='utf-8') as f:
            json.dump(report_data, f, indent=2, ensure_ascii=False)
        
        logger.info(f"JSON report generated: {report_path}")
        return report_path
    
    def _generate_vulnerability_sections(self, vulnerabilities: List[VulnerabilityFinding]) -> str:
        """Generate HTML sections for each vulnerability"""
        if not vulnerabilities:
            return "<div class='metadata'><p>✅ No vulnerabilities detected</p></div>"
        
        sections = []
        
        for i, vuln in enumerate(vulnerabilities, 1):
            severity_class = vuln.severity.value.lower()
            
            section = f"""
            <div class="vulnerability {severity_class}">
                <div class="vuln-header">
                    <div class="vuln-title">
                        {i}. {vuln.title}
                        <span class="risk-indicator risk-{severity_class}">{vuln.severity.value.upper()}</span>
                    </div>
                    <div class="vuln-meta">
                        Type: {vuln.vuln_type.value.replace('_', ' ').title()} | 
                        Confidence: {vuln.confidence:.1%}
                        {f' | Function: {vuln.function_name}' if vuln.function_name else ''}
                    </div>
                </div>
                <div class="vuln-body">
                    <p><strong>Description:</strong> {vuln.description}</p>
                    
                    {f'<div class="code-block"><strong>Vulnerable Code:</strong><br>{vuln.code_snippet}</div>' if vuln.code_snippet else ''}
                    
                    {f'<div class="exploit-code"><strong>⚠️ Exploit Code:</strong><br><pre>{vuln.exploit_code}</pre></div>' if vuln.exploit_code else ''}
                    
                    {f'<div class="mitigation"><strong>🛡️ Mitigation:</strong><br>{vuln.mitigation}</div>' if vuln.mitigation else ''}
                    
                    {f'<div class="ai-analysis"><strong>🤖 AI Analysis:</strong><br>{vuln.ai_analysis}</div>' if vuln.ai_analysis else ''}
                    
                    {self._format_references(vuln.references) if vuln.references else ''}
                </div>
            </div>
            """
            sections.append(section)
        
        return ''.join(sections)
    
    def _format_ai_recommendations(self, recommendations: Optional[List[str]]) -> str:
        """Format AI recommendations as HTML"""
        if not recommendations:
            return ""
        
        items = ''.join(f'<li>{rec}</li>' for rec in recommendations)
        return f"""
        <h4>AI Recommendations:</h4>
        <ul style="margin-left: 20px;">
            {items}
        </ul>
        """
    
    def _format_references(self, references: List[str]) -> str:
        """Format vulnerability references as HTML"""
        if not references:
            return ""
        
        links = []
        for ref in references:
            if ref.startswith('http'):
                links.append(f'<a href="{ref}" target="_blank" style="color: #00ffff;">{ref}</a>')
            else:
                links.append(ref)
        
        return f'<p><strong>References:</strong> {", ".join(links)}</p>'
    
    def _calculate_risk_score(self, vulnerabilities: List[VulnerabilityFinding]) -> float:
        """Calculate overall risk score (0-10)"""
        if not vulnerabilities:
            return 0.0
        
        severity_weights = {
            VulnerabilityLevel.CRITICAL: 4.0,
            VulnerabilityLevel.HIGH: 3.0,
            VulnerabilityLevel.MEDIUM: 2.0,
            VulnerabilityLevel.LOW: 1.0,
            VulnerabilityLevel.INFO: 0.5
        }
        
        total_score = 0.0
        max_possible = 0.0
        
        for vuln in vulnerabilities:
            weight = severity_weights.get(vuln.severity, 1.0)
            confidence = vuln.confidence or 0.5
            
            total_score += weight * confidence
            max_possible += weight
        
        if max_possible == 0:
            return 0.0
        
        # Normalize to 0-10 scale
        normalized = (total_score / max_possible) * 10
        return min(normalized, 10.0)
    
    def _get_risk_level(self, risk_score: float) -> str:
        """Get risk level based on score"""
        if risk_score >= 8.0:
            return "CRITICAL"
        elif risk_score >= 6.0:
            return "HIGH"
        elif risk_score >= 4.0:
            return "MEDIUM"
        elif risk_score >= 2.0:
            return "LOW"
        else:
            return "MINIMAL"
