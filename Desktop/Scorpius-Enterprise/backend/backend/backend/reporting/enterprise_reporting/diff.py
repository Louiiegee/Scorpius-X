"""
Enterprise Reporting Diff Engine
===============================

Smart diffing system for comparing reports and highlighting changes in findings,
risk scores, and other metrics between scan runs.
"""

import json
import hashlib
from typing import Dict, List, Any, Optional, Tuple, Set
from dataclasses import dataclass, asdict
from datetime import datetime, timezone
from enum import Enum


class ChangeType(str, Enum):
    """Types of changes detected in diff"""
    ADDED = "added"
    REMOVED = "removed"
    MODIFIED = "modified"
    UNCHANGED = "unchanged"


class FieldType(str, Enum):
    """Types of fields that can be diffed"""
    VULNERABILITY = "vulnerability"
    METRIC = "metric"
    METADATA = "metadata"
    CONFIGURATION = "configuration"


@dataclass
class FieldChange:
    """Represents a change in a specific field"""
    field_name: str
    field_type: FieldType
    change_type: ChangeType
    old_value: Any = None
    new_value: Any = None
    context: Optional[Dict[str, Any]] = None


@dataclass
class FindingChange:
    """Represents a change in a vulnerability finding"""
    finding_id: str
    change_type: ChangeType
    old_finding: Optional[Dict[str, Any]] = None
    new_finding: Optional[Dict[str, Any]] = None
    field_changes: List[FieldChange] = None

    def __post_init__(self):
        if self.field_changes is None:
            self.field_changes = []


@dataclass
class DiffSummary:
    """Summary of differences between two reports"""
    base_report_id: str
    compare_report_id: str
    total_changes: int
    findings_added: int
    findings_removed: int
    findings_modified: int
    risk_score_change: float
    severity_changes: Dict[str, int]
    generated_at: datetime


@dataclass
class DetailedDiff:
    """Detailed comparison results"""
    summary: DiffSummary
    finding_changes: List[FindingChange]
    metric_changes: List[FieldChange]
    metadata_changes: List[FieldChange]
    recommendations: List[str]


class ReportDiffEngine:
    """
    Advanced report comparison engine with smart diffing capabilities.
    
    Features:
    - Vulnerability finding comparison
    - Risk score analysis
    - Severity distribution changes
    - Function-level change tracking
    - Intelligent change categorization
    - Performance optimization for large reports
    """

    def __init__(self):
        """Initialize diff engine"""
        self.similarity_threshold = 0.8  # Threshold for finding similarity matching
        self.ignore_fields = {'timestamp', 'scan_duration', 'report_id'}

    async def compare_reports(
        self,
        base_report: Dict[str, Any],
        compare_report: Dict[str, Any],
        include_details: bool = True
    ) -> DetailedDiff:
        """
        Compare two reports and generate comprehensive diff.
        
        Args:
            base_report: Base report data (earlier scan)
            compare_report: Comparison report data (newer scan)
            include_details: Whether to include detailed field-level changes
            
        Returns:
            DetailedDiff with comparison results
        """
        # Extract findings from reports
        base_findings = self._extract_findings(base_report)
        compare_findings = self._extract_findings(compare_report)
        
        # Generate finding changes
        finding_changes = await self._compare_findings(base_findings, compare_findings)
        
        # Calculate summary metrics
        summary = self._generate_summary(
            base_report.get('metadata', {}).get('report_id', ''),
            compare_report.get('metadata', {}).get('report_id', ''),
            finding_changes,
            base_report,
            compare_report
        )
        
        # Generate detailed changes if requested
        metric_changes = []
        metadata_changes = []
        
        if include_details:
            metric_changes = await self._compare_metrics(
                base_report.get('metrics', {}),
                compare_report.get('metrics', {})
            )
            
            metadata_changes = await self._compare_metadata(
                base_report.get('metadata', {}),
                compare_report.get('metadata', {})
            )
        
        # Generate recommendations
        recommendations = self._generate_recommendations(finding_changes, summary)
        
        return DetailedDiff(
            summary=summary,
            finding_changes=finding_changes,
            metric_changes=metric_changes,
            metadata_changes=metadata_changes,
            recommendations=recommendations
        )

    def _extract_findings(self, report: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Extract vulnerability findings from report"""
        return report.get('findings', report.get('vulnerabilities', []))

    async def _compare_findings(
        self,
        base_findings: List[Dict[str, Any]],
        compare_findings: List[Dict[str, Any]]
    ) -> List[FindingChange]:
        """
        Compare findings between two reports.
        
        Args:
            base_findings: Findings from base report
            compare_findings: Findings from comparison report
            
        Returns:
            List of finding changes
        """
        changes = []
        
        # Create lookup maps for efficient comparison
        base_map = {self._generate_finding_key(f): f for f in base_findings}
        compare_map = {self._generate_finding_key(f): f for f in compare_findings}
        
        # Find removed findings
        for key, finding in base_map.items():
            if key not in compare_map:
                changes.append(FindingChange(
                    finding_id=key,
                    change_type=ChangeType.REMOVED,
                    old_finding=finding
                ))
        
        # Find added findings
        for key, finding in compare_map.items():
            if key not in base_map:
                changes.append(FindingChange(
                    finding_id=key,
                    change_type=ChangeType.ADDED,
                    new_finding=finding
                ))
        
        # Find modified findings
        for key in base_map.keys() & compare_map.keys():
            base_finding = base_map[key]
            compare_finding = compare_map[key]
            
            field_changes = self._compare_finding_fields(base_finding, compare_finding)
            
            if field_changes:
                changes.append(FindingChange(
                    finding_id=key,
                    change_type=ChangeType.MODIFIED,
                    old_finding=base_finding,
                    new_finding=compare_finding,
                    field_changes=field_changes
                ))
            else:
                changes.append(FindingChange(
                    finding_id=key,
                    change_type=ChangeType.UNCHANGED,
                    old_finding=base_finding,
                    new_finding=compare_finding
                ))
        
        return changes

    def _generate_finding_key(self, finding: Dict[str, Any]) -> str:
        """
        Generate unique key for finding identification.
        
        Args:
            finding: Vulnerability finding
            
        Returns:
            Unique identifier string
        """
        # Use combination of function name, vulnerability type, and location
        key_parts = [
            finding.get('function_name', ''),
            finding.get('vulnerability_type', finding.get('vuln_type', '')),
            finding.get('location', finding.get('line_number', '')),
            finding.get('title', '')
        ]
        
        key_string = '|'.join(str(part) for part in key_parts)
        return hashlib.md5(key_string.encode()).hexdigest()[:16]

    def _compare_finding_fields(
        self,
        base_finding: Dict[str, Any],
        compare_finding: Dict[str, Any]
    ) -> List[FieldChange]:
        """
        Compare individual fields within a finding.
        
        Args:
            base_finding: Original finding
            compare_finding: Updated finding
            
        Returns:
            List of field changes
        """
        changes = []
        
        # Get all fields from both findings
        all_fields = set(base_finding.keys()) | set(compare_finding.keys())
        
        for field in all_fields:
            if field in self.ignore_fields:
                continue
                
            base_value = base_finding.get(field)
            compare_value = compare_finding.get(field)
            
            if base_value != compare_value:
                change_type = ChangeType.MODIFIED
                
                if field not in base_finding:
                    change_type = ChangeType.ADDED
                elif field not in compare_finding:
                    change_type = ChangeType.REMOVED
                
                changes.append(FieldChange(
                    field_name=field,
                    field_type=FieldType.VULNERABILITY,
                    change_type=change_type,
                    old_value=base_value,
                    new_value=compare_value,
                    context={
                        'finding_id': self._generate_finding_key(base_finding),
                        'function_name': base_finding.get('function_name')
                    }
                ))
        
        return changes

    async def _compare_metrics(
        self,
        base_metrics: Dict[str, Any],
        compare_metrics: Dict[str, Any]
    ) -> List[FieldChange]:
        """
        Compare metrics between reports.
        
        Args:
            base_metrics: Base report metrics
            compare_metrics: Comparison report metrics
            
        Returns:
            List of metric changes
        """
        changes = []
        all_metrics = set(base_metrics.keys()) | set(compare_metrics.keys())
        
        for metric in all_metrics:
            if metric in self.ignore_fields:
                continue
                
            base_value = base_metrics.get(metric)
            compare_value = compare_metrics.get(metric)
            
            if base_value != compare_value:
                change_type = ChangeType.MODIFIED
                
                if metric not in base_metrics:
                    change_type = ChangeType.ADDED
                elif metric not in compare_metrics:
                    change_type = ChangeType.REMOVED
                
                changes.append(FieldChange(
                    field_name=metric,
                    field_type=FieldType.METRIC,
                    change_type=change_type,
                    old_value=base_value,
                    new_value=compare_value
                ))
        
        return changes

    async def _compare_metadata(
        self,
        base_metadata: Dict[str, Any],
        compare_metadata: Dict[str, Any]
    ) -> List[FieldChange]:
        """
        Compare metadata between reports.
        
        Args:
            base_metadata: Base report metadata
            compare_metadata: Comparison report metadata
            
        Returns:
            List of metadata changes
        """
        changes = []
        comparable_fields = ['target_contract', 'scan_type', 'configuration']
        
        for field in comparable_fields:
            base_value = base_metadata.get(field)
            compare_value = compare_metadata.get(field)
            
            if base_value != compare_value:
                changes.append(FieldChange(
                    field_name=field,
                    field_type=FieldType.METADATA,
                    change_type=ChangeType.MODIFIED,
                    old_value=base_value,
                    new_value=compare_value
                ))
        
        return changes

    def _generate_summary(
        self,
        base_report_id: str,
        compare_report_id: str,
        finding_changes: List[FindingChange],
        base_report: Dict[str, Any],
        compare_report: Dict[str, Any]
    ) -> DiffSummary:
        """
        Generate summary of changes.
        
        Args:
            base_report_id: Base report identifier
            compare_report_id: Comparison report identifier
            finding_changes: List of finding changes
            base_report: Full base report data
            compare_report: Full comparison report data
            
        Returns:
            DiffSummary object
        """
        # Count changes by type
        findings_added = len([c for c in finding_changes if c.change_type == ChangeType.ADDED])
        findings_removed = len([c for c in finding_changes if c.change_type == ChangeType.REMOVED])
        findings_modified = len([c for c in finding_changes if c.change_type == ChangeType.MODIFIED])
        
        total_changes = findings_added + findings_removed + findings_modified
        
        # Calculate risk score change
        base_risk = base_report.get('metadata', {}).get('overall_risk_score', 0)
        compare_risk = compare_report.get('metadata', {}).get('overall_risk_score', 0)
        risk_score_change = compare_risk - base_risk
        
        # Calculate severity changes
        severity_changes = self._calculate_severity_changes(finding_changes)
        
        return DiffSummary(
            base_report_id=base_report_id,
            compare_report_id=compare_report_id,
            total_changes=total_changes,
            findings_added=findings_added,
            findings_removed=findings_removed,
            findings_modified=findings_modified,
            risk_score_change=risk_score_change,
            severity_changes=severity_changes,
            generated_at=datetime.now(timezone.utc)
        )

    def _calculate_severity_changes(self, finding_changes: List[FindingChange]) -> Dict[str, int]:
        """
        Calculate changes in severity distribution.
        
        Args:
            finding_changes: List of finding changes
            
        Returns:
            Dictionary with severity change counts
        """
        severity_changes = {
            'critical': 0,
            'high': 0,
            'medium': 0,
            'low': 0
        }
        
        for change in finding_changes:
            if change.change_type == ChangeType.ADDED and change.new_finding:
                severity = change.new_finding.get('severity', '').lower()
                if severity in severity_changes:
                    severity_changes[severity] += 1
            
            elif change.change_type == ChangeType.REMOVED and change.old_finding:
                severity = change.old_finding.get('severity', '').lower()
                if severity in severity_changes:
                    severity_changes[severity] -= 1
            
            elif change.change_type == ChangeType.MODIFIED:
                # Check if severity changed
                for field_change in change.field_changes:
                    if field_change.field_name == 'severity':
                        old_severity = str(field_change.old_value).lower()
                        new_severity = str(field_change.new_value).lower()
                        
                        if old_severity in severity_changes:
                            severity_changes[old_severity] -= 1
                        if new_severity in severity_changes:
                            severity_changes[new_severity] += 1
        
        return severity_changes

    def _generate_recommendations(
        self,
        finding_changes: List[FindingChange],
        summary: DiffSummary
    ) -> List[str]:
        """
        Generate actionable recommendations based on changes.
        
        Args:
            finding_changes: List of finding changes
            summary: Diff summary
            
        Returns:
            List of recommendation strings
        """
        recommendations = []
        
        # Overall trend analysis
        if summary.total_changes == 0:
            recommendations.append("No changes detected. Security posture remains stable.")
        
        elif summary.findings_added > summary.findings_removed:
            recommendations.append(
                f"Security posture degraded: {summary.findings_added} new vulnerabilities found. "
                "Immediate review and remediation required."
            )
        
        elif summary.findings_removed > summary.findings_added:
            recommendations.append(
                f"Security posture improved: {summary.findings_removed} vulnerabilities resolved. "
                "Continue monitoring for new issues."
            )
        
        # Risk score analysis
        if summary.risk_score_change > 1.0:
            recommendations.append(
                f"Risk score increased significantly (+{summary.risk_score_change:.1f}). "
                "Prioritize critical and high-severity findings."
            )
        elif summary.risk_score_change < -1.0:
            recommendations.append(
                f"Risk score decreased ({summary.risk_score_change:.1f}). "
                "Good progress on vulnerability remediation."
            )
        
        # Severity-specific recommendations
        if summary.severity_changes.get('critical', 0) > 0:
            recommendations.append(
                f"Critical vulnerabilities increased by {summary.severity_changes['critical']}. "
                "Address immediately to prevent potential exploits."
            )
        
        if summary.severity_changes.get('high', 0) > 2:
            recommendations.append(
                f"High-severity findings increased by {summary.severity_changes['high']}. "
                "Schedule remediation within next sprint cycle."
            )
        
        # Function-specific analysis
        function_changes = {}
        for change in finding_changes:
            if change.change_type in [ChangeType.ADDED, ChangeType.MODIFIED]:
                finding = change.new_finding or change.old_finding
                if finding:
                    func_name = finding.get('function_name', 'unknown')
                    function_changes[func_name] = function_changes.get(func_name, 0) + 1
        
        # Find functions with multiple new issues
        problematic_functions = [
            func for func, count in function_changes.items() 
            if count >= 3
        ]
        
        if problematic_functions:
            recommendations.append(
                f"Functions with multiple new issues: {', '.join(problematic_functions)}. "
                "Consider refactoring or additional code review."
            )
        
        return recommendations

    def generate_diff_report_html(self, diff: DetailedDiff) -> str:
        """
        Generate HTML report for diff results.
        
        Args:
            diff: Detailed diff results
            
        Returns:
            HTML representation of diff
        """
        # This would generate a comprehensive HTML diff report
        # with color-coded changes, charts, and detailed analysis
        
        html = f"""
        <div class="diff-report">
            <div class="diff-header">
                <h2>Report Comparison</h2>
                <div class="diff-metadata">
                    <span>Base: {diff.summary.base_report_id}</span>
                    <span>Compare: {diff.summary.compare_report_id}</span>
                    <span>Generated: {diff.summary.generated_at}</span>
                </div>
            </div>
            
            <div class="diff-summary">
                <h3>Summary</h3>
                <div class="summary-metrics">
                    <div class="metric added">
                        <span class="value">{diff.summary.findings_added}</span>
                        <span class="label">Added</span>
                    </div>
                    <div class="metric removed">
                        <span class="value">{diff.summary.findings_removed}</span>
                        <span class="label">Removed</span>
                    </div>
                    <div class="metric modified">
                        <span class="value">{diff.summary.findings_modified}</span>
                        <span class="label">Modified</span>
                    </div>
                    <div class="metric risk-change">
                        <span class="value">{diff.summary.risk_score_change:+.1f}</span>
                        <span class="label">Risk Score Change</span>
                    </div>
                </div>
            </div>
            
            <div class="diff-recommendations">
                <h3>Recommendations</h3>
                <ul>
                    {"".join(f"<li>{rec}</li>" for rec in diff.recommendations)}
                </ul>
            </div>
            
            <div class="diff-details">
                <h3>Detailed Changes</h3>
                {self._render_finding_changes(diff.finding_changes)}
            </div>
        </div>
        """
        
        return html

    def _render_finding_changes(self, finding_changes: List[FindingChange]) -> str:
        """Render finding changes as HTML"""
        changes_html = []
        
        for change in finding_changes:
            if change.change_type == ChangeType.UNCHANGED:
                continue
                
            change_class = f"change-{change.change_type.value}"
            finding = change.new_finding or change.old_finding
            
            changes_html.append(f"""
                <div class="finding-change {change_class}">
                    <div class="change-header">
                        <span class="change-type">{change.change_type.value.title()}</span>
                        <span class="finding-title">{finding.get('title', 'Unknown')}</span>
                        <span class="finding-function">{finding.get('function_name', '')}</span>
                    </div>
                    <div class="change-details">
                        {self._render_field_changes(change.field_changes)}
                    </div>
                </div>
            """)
        
        return "".join(changes_html)

    def _render_field_changes(self, field_changes: List[FieldChange]) -> str:
        """Render field changes as HTML"""
        if not field_changes:
            return ""
        
        changes_html = []
        for field_change in field_changes:
            changes_html.append(f"""
                <div class="field-change">
                    <span class="field-name">{field_change.field_name}:</span>
                    <span class="old-value">{field_change.old_value}</span>
                    <span class="arrow">→</span>
                    <span class="new-value">{field_change.new_value}</span>
                </div>
            """)
        
        return "".join(changes_html)

    def export_diff_json(self, diff: DetailedDiff) -> str:
        """
        Export diff results as JSON.
        
        Args:
            diff: Detailed diff results
            
        Returns:
            JSON string representation
        """
        diff_dict = asdict(diff)
        return json.dumps(diff_dict, indent=2, default=str)
