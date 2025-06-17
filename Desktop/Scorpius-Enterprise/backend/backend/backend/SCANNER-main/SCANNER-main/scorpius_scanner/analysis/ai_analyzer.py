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

        Returns:
            A dictionary mapping report format to its file path.
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
            with open(json_path, 'w') as f:
                json.dump(report_data, f, indent=2)
            report_paths["json"] = str(json_path)
            logger.info(f"Generated JSON report for {scan_id} at {json_path}")
        except Exception as e:
            logger.error(f"Failed to generate JSON report for {scan_id}: {e}")

        # Generate text report
        txt_path = self.reports_dir / f"{scan_id}.txt"
        try:
            with open(txt_path, 'w') as f:
                f.write(self._format_text_report(report_data))
            report_paths["txt"] = str(txt_path)
            logger.info(f"Generated TXT report for {scan_id} at {txt_path}")
        except Exception as e:
            logger.error(f"Failed to generate TXT report for {scan_id}: {e}")

        return report_paths

    def _format_text_report(self, data: Dict[str, Any]) -> str:
        """Formats the scan data into a human-readable text string."""
        report = [
            "=" * 60,
            "SCORPIUS SCAN REPORT",
            "=" * 60,
            f"Scan ID:      {data['scan_id']}",
            f"Target:       {data['target']}",
            f"Timestamp:    {data['timestamp']}",
            f"Risk Score:   {data['risk_score']:.2f} / 100.0",
            f"Total Issues: {data['findings_count']}",
            "-" * 60,
        ]

        if data.get('ai_analysis'):
            ai = data['ai_analysis']
            report.append("AI-Powered Summary:")
            report.append(f"  Risk Assessment: {ai.get('risk_assessment', 'N/A')}")
            report.append(f"  Summary: {ai.get('summary', 'N/A')}")
            report.append("-" * 60)

        report.append("FINDINGS:")
        if not data['findings']:
            report.append("\n  No findings were reported.")
        else:
            for finding in sorted(data['findings'], key=lambda x: ['critical', 'high', 'medium', 'low', 'info'].index(x['severity'])):
                report.extend([
                    f"\n  [{finding['severity'].upper()}] {finding['title']}",
                    f"    Confidence: {finding['confidence']:.0%}",
                    f"    Tool: {finding['source_tool']}",
                    f"    Description: {finding['description']}",
                ])
                if finding.get('recommendation'):
                    report.append(f"    Recommendation: {finding['recommendation']}")

        return "\n".join(report)