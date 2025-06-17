#!/usr/bin/env python3
"""
Scorpius Report Generator - PDF Report Generation Module
Generates detailed security reports using the exact styling from POC template.
"""

import os
import json
import asyncio
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional
from pathlib import Path
from dataclasses import dataclass

# Make WeasyPrint optional for Windows compatibility
try:
    import weasyprint
    WEASYPRINT_AVAILABLE = True
except ImportError:
    WEASYPRINT_AVAILABLE = False
    weasyprint = None

from jinja2 import Template
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from models.scorpius_models import ScorpiusScan


@dataclass
class VulnerabilityFinding:
    """Data structure for vulnerability findings"""
    vuln_type: str
    severity: str
    title: str
    description: str
    function_name: str
    risk_score: float
    value_at_risk: str
    mitigation: str
    code_snippet: str
    exploit_vector: str


@dataclass
class AIAnalysis:
    """Data structure for AI analysis results"""
    model_used: str
    confidence_score: float
    risk_assessment: str
    attack_vectors: List[str]
    exploitation_complexity: str
    business_impact: str
    recommendations: List[str]


@dataclass
class ScanMetrics:
    """Data structure for scan performance metrics"""
    scan_duration: float
    vulnerabilities_found: int
    critical_count: int
    high_count: int
    medium_count: int
    low_count: int
    functions_analyzed: int
    lines_of_code: int
    complexity_score: float


class ScorpiusReportGenerator:
    """Advanced PDF report generator for Scorpius vulnerability scans"""
    
    def __init__(self, reports_dir: str = "reports"):
        """
        Initialize the report generator
        
        Args:
            reports_dir: Directory to store generated reports
        """
        self.reports_dir = Path(reports_dir)
        self.reports_dir.mkdir(exist_ok=True)
        
        # Initialize report template
        self.template = self._load_template()
    
    def _load_template(self) -> Template:
        """Load and return the Jinja2 template for reports"""
        template_content = """
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Scorpius Scanner - Vulnerability Assessment Report</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #ffffff;
            background: #0a0a0a;
            padding: 20px;
        }
        
        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: #1a1a1a;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.5);
            border: 1px solid #333;
        }
        
        .header {
            text-align: center;
            margin-bottom: 40px;
            padding: 30px;
            background: linear-gradient(135deg, #2a2a2a 0%, #1a1a1a 100%);
            border-radius: 8px;
            color: #ffffff;
            border: 1px solid #444;
        }
        
        .header h1 {
            font-size: 2.5em;
            margin-bottom: 10px;
            font-weight: 700;
            color: #ffffff;
        }
        
        .metadata {
            background: #222;
            padding: 20px;
            border-radius: 8px;
            margin-bottom: 30px;
            border-left: 4px solid #666;
            border: 1px solid #444;
        }
        
        .metadata strong {
            color: #ffffff;
        }
        
        h2 {
            color: #ffffff;
            font-size: 1.8em;
            margin: 30px 0 15px 0;
            padding-bottom: 10px;
            border-bottom: 2px solid #444;
        }
        
        h3 {
            color: #cccccc;
            font-size: 1.4em;
            margin: 25px 0 10px 0;
        }
        
        .code-block {
            background: #0d1117;
            color: #e6edf3;
            padding: 20px;
            border-radius: 8px;
            margin: 15px 0;
            overflow-x: auto;
            font-family: 'Fira Code', 'Monaco', 'Consolas', monospace;
            font-size: 0.9em;
            border: 1px solid #30363d;
        }
        
        .success-metric {
            background: #1a2f1a;
            border: 1px solid #2ea043;
            padding: 15px;
            border-radius: 8px;
            margin: 10px 0;
            color: #ffffff;
        }
        
        .success-metric::before {
            content: "✅ ";
            color: #2ea043;
            font-weight: bold;
        }
        
        .warning-box {
            background: #2d1a00;
            border: 1px solid #fb8500;
            padding: 15px;
            border-radius: 8px;
            margin: 15px 0;
            color: #ffffff;
        }
        
        .warning-box::before {
            content: "⚠️ ";
            color: #fb8500;
            font-weight: bold;
        }
        
        .attack-phase {
            background: #2a1616;
            border: 1px solid #da3633;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            color: #ffffff;
        }
        
        .attack-phase h4 {
            color: #ff6b6b;
            margin-bottom: 10px;
        }
        
        .metrics-grid {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        
        .metric-card {
            background: #2a2a2a;
            border: 1px solid #444;
            padding: 20px;
            border-radius: 8px;
            text-align: center;
        }
        
        .metric-value {
            font-size: 2.5em;
            font-weight: bold;
            color: #4ecdc4;
            margin-bottom: 5px;
        }
        
        .metric-label {
            color: #cccccc;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        .vulnerability-chart {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 30px 0;
        }
        
        .vuln-card {
            background: #2a2a2a;
            border: 1px solid #444;
            border-radius: 12px;
            padding: 25px;
            position: relative;
        }
        
        .risk-level {
            display: inline-block;
            padding: 8px 16px;
            border-radius: 20px;
            font-weight: bold;
            font-size: 0.8em;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 15px;
        }
        
        .risk-critical {
            background: #da3633;
            color: #ffffff;
        }
        
        .risk-high {
            background: #fb8500;
            color: #ffffff;
        }
        
        .risk-medium {
            background: #fdcb6e;
            color: #2d3436;
        }
        
        .risk-low {
            background: #00b894;
            color: #ffffff;
        }
        
        .attack-flow {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin: 30px 0;
            padding: 30px;
            background: #1a1a1a;
            border-radius: 12px;
            border: 1px solid #444;
        }
        
        .flow-step {
            text-align: center;
            flex: 1;
            padding: 15px;
            position: relative;
        }
        
        .flow-step:not(:last-child)::after {
            content: '→';
            position: absolute;
            right: -15px;
            top: 50%;
            transform: translateY(-50%);
            font-size: 24px;
            color: #ff6b6b;
            font-weight: bold;
        }
        
        .flow-icon {
            width: 60px;
            height: 60px;
            border-radius: 50%;
            background: linear-gradient(135deg, #ff6b6b, #ee5a52);
            color: white;
            display: flex;
            align-items: center;
            justify-content: center;
            margin: 0 auto 10px;
            font-size: 24px;
            font-weight: bold;
        }
        
        .flow-title {
            font-weight: bold;
            margin-bottom: 5px;
            color: #ffffff;
        }
        
        .flow-desc {
            font-size: 0.9em;
            color: #cccccc;
        }
        
        .technical-details {
            background: #111;
            border-left: 4px solid #ff6b6b;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
        }
        
        .timeline {
            position: relative;
            padding-left: 30px;
            margin: 30px 0;
        }
        
        .timeline::before {
            content: '';
            position: absolute;
            left: 10px;
            top: 0;
            bottom: 0;
            width: 2px;
            background: linear-gradient(to bottom, #ff6b6b, #4ecdc4);
        }
        
        .timeline-item {
            position: relative;
            margin-bottom: 30px;
            padding: 20px;
            background: #1a1a1a;
            border-radius: 8px;
            border: 1px solid #333;
        }
        
        .timeline-item::before {
            content: '';
            position: absolute;
            left: -25px;
            top: 25px;
            width: 12px;
            height: 12px;
            border-radius: 50%;
            background: #ff6b6b;
            border: 3px solid #0a0a0a;
        }
        
        .ai-analysis {
            background: #1a1a2e;
            border: 1px solid #4a4a7a;
            border-radius: 12px;
            padding: 25px;
            margin: 30px 0;
        }
        
        .confidence-score {
            display: inline-block;
            padding: 10px 20px;
            background: linear-gradient(135deg, #4ecdc4, #44a08d);
            border-radius: 25px;
            font-weight: bold;
            margin: 10px 0;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>Scorpius Scanner</h1>
            <p>Advanced Vulnerability Assessment Report</p>
        </div>
        
        <div class="metadata">
            <strong>Scan ID:</strong> {{ scan.scan_id }}<br>
            <strong>Date:</strong> {{ scan.created_at.strftime('%B %d, %Y at %H:%M UTC') }}<br>
            <strong>Target Contract:</strong> {{ scan.contract_address }}<br>
            <strong>Blockchain:</strong> {{ scan.chain.title() }}<br>
            <strong>Scan Type:</strong> {{ scan.scan_type.replace('_', ' ').title() }}<br>
            <strong>Duration:</strong> {{ "%.1f"|format(scan.scan_duration or 0) }} seconds<br>
            <strong>AI Model:</strong> {{ scan.ai_model or 'claude-3-opus' }}
        </div>
        
        <h2>🔥 Advanced Attack Chain Flow</h2>
        <div class="attack-flow">
            <div class="flow-step">
                <div class="flow-icon">🕵️</div>
                <div class="flow-title">Discovery</div>
                <div class="flow-desc">Contract analysis & vulnerability scanning</div>
            </div>
            <div class="flow-step">
                <div class="flow-icon">⚡</div>
                <div class="flow-title">Technical Exploitation</div>
                <div class="flow-desc">Multi-vector attack simulation</div>
            </div>
            <div class="flow-step">
                <div class="flow-icon">🎯</div>
                <div class="flow-title">Risk Assessment</div>
                <div class="flow-desc">AI-powered impact analysis</div>
            </div>
            <div class="flow-step">
                <div class="flow-icon">🔐</div>
                <div class="flow-title">Verification</div>
                <div class="flow-desc">Exploit validation & testing</div>
            </div>
            <div class="flow-step">
                <div class="flow-icon">📊</div>
                <div class="flow-title">Reporting</div>
                <div class="flow-desc">Comprehensive documentation</div>
            </div>
        </div>
        
        <h2>📊 Scan Performance Metrics</h2>
        <div class="metrics-grid">
            <div class="metric-card">
                <div class="metric-value">{{ metrics.vulnerabilities_found }}</div>
                <div class="metric-label">Vulnerabilities Found</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">{{ metrics.critical_count }}</div>
                <div class="metric-label">Critical Issues</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">{{ metrics.high_count }}</div>
                <div class="metric-label">High Risk</div>
            </div>
            <div class="metric-card">
                <div class="metric-value">{{ "%.1f"|format(metrics.scan_duration) }}s</div>
                <div class="metric-label">Scan Duration</div>
            </div>
        </div>
        
        {% if vulnerabilities %}
        <h2>🚨 Vulnerability Discovery Matrix</h2>
        <div class="vulnerability-chart">
            {% for vuln in vulnerabilities %}
            <div class="vuln-card">
                <div class="risk-level risk-{{ vuln.severity.lower() }}">{{ vuln.severity.upper() }}</div>
                <h4>{{ vuln.title }}</h4>
                <p><strong>Type:</strong> {{ vuln.vuln_type }}</p>
                <p><strong>Function:</strong> {{ vuln.function_name }}</p>
                <p><strong>Risk Score:</strong> {{ "%.1f"|format(vuln.risk_score) }}/10</p>
                <p><strong>Description:</strong> {{ vuln.description }}</p>
                
                {% if vuln.code_snippet %}
                <div class="code-block">{{ vuln.code_snippet }}</div>
                {% endif %}
                
                <div class="technical-details">
                    <strong>Exploit Vector:</strong> {{ vuln.exploit_vector }}<br>
                    <strong>Mitigation:</strong> {{ vuln.mitigation }}
                </div>
            </div>
            {% endfor %}
        </div>
        {% endif %}
        
        {% if ai_analysis %}
        <h2>🤖 AI Security Analysis</h2>
        <div class="ai-analysis">
            <h3>Claude AI Assessment</h3>
            <div class="confidence-score">Confidence: {{ "%.0f"|format(ai_analysis.confidence_score * 100) }}%</div>
            
            <div class="success-metric">
                <strong>Risk Level:</strong> {{ ai_analysis.risk_assessment }}
            </div>
            
            <div class="warning-box">
                <strong>Business Impact:</strong> {{ ai_analysis.business_impact }}
            </div>
            
            <h4>Attack Vectors Identified:</h4>
            <ul>
                {% for vector in ai_analysis.attack_vectors %}
                <li>{{ vector }}</li>
                {% endfor %}
            </ul>
            
            <h4>Exploitation Complexity:</h4>
            <p>{{ ai_analysis.exploitation_complexity }}</p>
            
            {% if ai_analysis.recommendations %}
            <h4>Security Recommendations:</h4>
            <ul>
                {% for rec in ai_analysis.recommendations %}
                <li>{{ rec }}</li>
                {% endfor %}
            </ul>
            {% endif %}
        </div>
        {% endif %}
        
        <h2>📋 Executive Summary</h2>
        <div class="timeline">
            <div class="timeline-item">
                <h4>Scan Initiated</h4>
                <p>{{ scan.created_at.strftime('%H:%M:%S UTC') }} - Automated vulnerability scanning commenced</p>
            </div>
            {% if scan.started_at %}
            <div class="timeline-item">
                <h4>Analysis Phase</h4>
                <p>{{ scan.started_at.strftime('%H:%M:%S UTC') }} - Deep contract analysis and threat detection</p>
            </div>
            {% endif %}
            {% if scan.completed_at %}
            <div class="timeline-item">
                <h4>Scan Completed</h4>
                <p>{{ scan.completed_at.strftime('%H:%M:%S UTC') }} - {{ metrics.vulnerabilities_found }} vulnerabilities identified</p>
            </div>
            {% endif %}
        </div>
        
        <div class="attack-phase">
            <h4>⚠️ Security Assessment Summary</h4>
            <p>This smart contract has been analyzed for potential security vulnerabilities using advanced static analysis, 
            symbolic execution, and AI-powered threat detection. {% if metrics.vulnerabilities_found > 0 %}
            <strong>{{ metrics.vulnerabilities_found }} security issues</strong> were identified that require immediate attention.
            {% else %}
            No critical vulnerabilities were detected during this scan.
            {% endif %}</p>
        </div>
        
        <div class="metadata">
            <strong>Report Generated:</strong> {{ datetime.now().strftime('%B %d, %Y at %H:%M UTC') }}<br>
            <strong>Scorpius Version:</strong> v2.1.0<br>
            <strong>Analysis Engine:</strong> Advanced Multi-Vector Scanner<br>
            <strong>Next Recommended Scan:</strong> {{ (scan.created_at + timedelta(days=7)).strftime('%B %d, %Y') }}
        </div>
    </div>
</body>
</html>
        """
        return Template(template_content)
    
    async def generate_report(
        self, 
        db: AsyncSession, 
        scan_id: str
    ) -> Optional[str]:
        """
        Generate a comprehensive PDF report for a completed scan
        
        Args:
            db: Database session
            scan_id: Unique scan identifier
            
        Returns:
            Path to generated PDF report or None if failed
        """
        try:
            # Fetch scan data
            result = await db.execute(
                select(ScorpiusScan).filter(ScorpiusScan.scan_id == scan_id)
            )
            scan = result.scalar_one_or_none()
            
            if not scan:
                raise ValueError(f"Scan {scan_id} not found")
            
            if scan.status != "completed":
                raise ValueError(f"Scan {scan_id} is not completed")
            
            # Parse findings and AI analysis
            vulnerabilities = self._parse_vulnerabilities(scan.findings)
            ai_analysis = self._parse_ai_analysis(scan.ai_analysis)
            metrics = self._calculate_metrics(scan)
            
            # Generate HTML content
            html_content = self.template.render(
                scan=scan,
                vulnerabilities=vulnerabilities,
                ai_analysis=ai_analysis,
                metrics=metrics,
                datetime=datetime,
                timedelta=lambda days: datetime.now() + 
                    asyncio.create_task(asyncio.sleep(0)).get_loop().time() * days
            )
            
            # Generate PDF
            pdf_path = self._generate_pdf(scan_id, html_content)
            
            # Update scan record with report path
            scan.report_paths = json.dumps({
                "pdf": str(pdf_path),
                "html": str(pdf_path).replace('.pdf', '.html'),
                "json": str(pdf_path).replace('.pdf', '.json')
            })
            await db.commit()
            
            return str(pdf_path)
            
        except Exception as e:
            print(f"❌ Report generation failed: {e}")
            return None
    
    def _parse_vulnerabilities(self, findings_json: str) -> List[VulnerabilityFinding]:
        """Parse vulnerability findings from JSON string"""
        try:
            if not findings_json:
                return []
            
            findings_data = json.loads(findings_json)
            vulnerabilities = []
            
            for finding in findings_data:
                vuln = VulnerabilityFinding(
                    vuln_type=finding.get('vuln_type', 'unknown'),
                    severity=finding.get('severity', 'medium'),
                    title=finding.get('title', 'Security Issue'),
                    description=finding.get('description', ''),
                    function_name=finding.get('function_name', 'N/A'),
                    risk_score=finding.get('risk_score', 5.0),
                    value_at_risk=finding.get('value_at_risk', 'Unknown'),
                    mitigation=finding.get('mitigation', 'Review and fix the identified issue'),
                    code_snippet=finding.get('code_snippet', ''),
                    exploit_vector=finding.get('exploit_vector', 'Manual exploitation')
                )
                vulnerabilities.append(vuln)
            
            return vulnerabilities
            
        except Exception as e:
            print(f"⚠️ Error parsing vulnerabilities: {e}")
            return []
    
    def _parse_ai_analysis(self, ai_analysis_json: str) -> Optional[AIAnalysis]:
        """Parse AI analysis from JSON string"""
        try:
            if not ai_analysis_json:
                return None
            
            analysis_data = json.loads(ai_analysis_json)
            
            return AIAnalysis(
                model_used=analysis_data.get('model_used', 'claude-3-opus'),
                confidence_score=analysis_data.get('confidence_score', 0.8),
                risk_assessment=analysis_data.get('risk_assessment', 'MEDIUM'),
                attack_vectors=analysis_data.get('attack_vectors', []),
                exploitation_complexity=analysis_data.get('exploitation_complexity', 'MEDIUM'),
                business_impact=analysis_data.get('business_impact', 'MEDIUM'),
                recommendations=analysis_data.get('recommendations', [])
            )
            
        except Exception as e:
            print(f"⚠️ Error parsing AI analysis: {e}")
            return None
    
    def _calculate_metrics(self, scan: ScorpiusScan) -> ScanMetrics:
        """Calculate scan performance metrics"""
        return ScanMetrics(
            scan_duration=scan.scan_duration or 0.0,
            vulnerabilities_found=scan.vulnerabilities_found,
            critical_count=scan.critical_count,
            high_count=scan.high_count,
            medium_count=scan.medium_count,
            low_count=scan.low_count,
        )
    
    def _generate_pdf(self, scan_id: str, html_content: str) -> Path:
        """Generate PDF from HTML content using WeasyPrint"""
        try:
            # Save HTML version
            html_path = self.reports_dir / f"scorpius_report_{scan_id}.html"
            with open(html_path, 'w', encoding='utf-8') as f:
                f.write(html_content)
            
            # Generate PDF
            pdf_path = self.reports_dir / f"scorpius_report_{scan_id}.pdf"
            
            if WEASYPRINT_AVAILABLE:
                # Use WeasyPrint to convert HTML to PDF
                weasyprint.HTML(string=html_content).write_pdf(str(pdf_path))
            else:
                print("⚠️ WeasyPrint not available, skipping PDF generation")
            
            print(f"✅ PDF report generated: {pdf_path}")
            return pdf_path
            
        except Exception as e:
            print(f"❌ PDF generation failed: {e}")
            return html_path


async def generate_scan_report(db: AsyncSession, scan_id: str) -> Optional[str]:
    """
    Convenience function to generate a report for a completed scan
    
    Args:
        db: Database session
        scan_id: Scan identifier
        
    Returns:
        Path to generated report or None if failed
    """
    generator = ScorpiusReportGenerator()
    return await generator.generate_report(db, scan_id)


if __name__ == "__main__":
    # Test report generation
    import asyncio
    from core.db import get_db
    
    async def test_generate():
        async for db in get_db():
            # Test with sample scan
            report_path = await generate_scan_report(db, "sample-scan-001")
            if report_path:
                print(f"✅ Test report generated: {report_path}")
            else:
                print("❌ Test report generation failed")
            break
    
    asyncio.run(test_generate())
