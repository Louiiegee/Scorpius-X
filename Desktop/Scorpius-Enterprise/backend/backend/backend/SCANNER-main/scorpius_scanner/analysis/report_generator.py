import json
import logging
from datetime import datetime
from pathlib import Path
from typing import List, Dict, Any

from ..core.config import settings
from ..plugin_base import Finding

logger = logging.getLogger(__name__)

class ReportGenerator:
    """Generates scan reports in various formats."""

    def __init__(self):
        self.reports_dir = Path(settings.workdir) / "reports"
        self.reports_dir.mkdir(exist_ok=True, parents=True)

    async def generate(
        self,
        scan_id: str,
        target: str,
        findings: List[Finding],
        ai_analysis: Dict[str, Any],
        risk_score: float
    ) -> Dict[str, str]:
        """
        Generate all report formats for a completed scan.

        Args:
            scan_id: The unique ID of the scan.
            target: The contract address that was scanned.
            findings: A list of all detected Finding objects.
            ai_analysis: The summary dictionary from the AI analyzer.
            risk_score: The final calculated risk score.

        Returns:
            A dictionary mapping report format (e.g., "json", "txt") to its file path.
        """
        report_paths = {}
        report_data = {
            "scan_id": scan_id,
            "target": target,
            "timestamp": datetime.utcnow().isoformat(),
            "risk_score": risk_score,
            "findings_count": len(findings),
            "ai_analysis": ai_analysis,
            "findings": [f.to_dict() for f in findings],
        }

        # Generate JSON report
        json_path = self.reports_dir / f"{scan_id}.json"
        try:
            with open(json_path, 'w', encoding='utf-8') as f:
                json.dump(report_data, f, indent=2)
            report_paths["json"] = str(json_path)
            logger.info(f"Generated JSON report for {scan_id} at {json_path}")
        except Exception as e:
            logger.error(f"Failed to generate JSON report for {scan_id}: {e}")

        # Generate text report
        txt_path = self.reports_dir / f"{scan_id}.txt"
        try:
            with open(txt_path, 'w', encoding='utf-8') as f:
                f.write(self._format_text_report(report_data))
            report_paths["txt"] = str(txt_path)
            logger.info(f"Generated TXT report for {scan_id} at {txt_path}")
        except Exception as e:
            logger.error(f"Failed to generate TXT report for {scan_id}: {e}")

        # Placeholder for future PDF report generation
        # pdf_path = await self._generate_pdf_report(report_data)
        # if pdf_path:
        #     report_paths["pdf"] = pdf_path

        return report_paths

    def _format_text_report(self, data: Dict[str, Any]) -> str:
        """Formats the scan data into a human-readable text string."""
        report = [
            "=" * 80,
            " " * 28 + "SCORPIUS SCAN REPORT",
            "=" * 80,
            f"Scan ID:      {data['scan_id']}",
            f"Target:       {data['target']}",
            f"Timestamp:    {data['timestamp']}",
            f"Risk Score:   {data['risk_score']:.2f} / 100.0",
            f"Total Issues: {data['findings_count']}",
            "-" * 80,
        ]

        if data.get('ai_analysis'):
            ai = data['ai_analysis']
            report.append("AI-Powered Assessment:")
            report.append(f"  Risk Level: {ai.get('risk_assessment', 'N/A')}")
            report.append(f"  Summary: {ai.get('summary', 'N/A')}")
            report.append(f"  Potential Attack Vectors: {', '.join(ai.get('attack_vectors', ['N/A']))}")
            report.append("-" * 80)

        report.append("FINDINGS:")
        if not data['findings']:
            report.append("\n  No vulnerabilities or informational issues were found.")
        else:
            # Sort findings by severity: critical > high > medium > low > info
            severity_order = {'critical': 0, 'high': 1, 'medium': 2, 'low': 3, 'info': 4}
            sorted_findings = sorted(data['findings'], key=lambda x: severity_order.get(x['severity'], 99))
            
            for finding in sorted_findings:
                report.extend([
                    f"\n[{finding['severity'].upper()}] {finding['title']}",
                    "-" * len(f"[{finding['severity'].upper()}] {finding['title']}"),
                    f"  Confidence:     {finding['confidence']:.0%}",
                    f"  Source Tool:    {finding['source_tool']}",
                    f"  Description:    {finding['description']}",
                ])
                if finding.get('recommendation'):
                    report.append(f"  Recommendation: {finding['recommendation']}")

        report.append("\n" + "=" * 80)
        report.append("End of Report")
        report.append("=" * 80)

        return "\n".join(report)

    # async def _generate_pdf_report(self, data: Dict[str, Any]) -> Optional[str]:
    #     """
    #     (Placeholder) Generates a PDF report.
    #     This would require a library like reportlab or weasyprint.
    #     """
    #     logger.info("PDF report generation is not yet implemented.")
    #     return None