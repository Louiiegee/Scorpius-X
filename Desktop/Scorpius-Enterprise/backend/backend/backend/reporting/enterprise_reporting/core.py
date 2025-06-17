"""
Enterprise Reporting Core Engine
=================================

Core components for the enterprise reporting system including the main report engine,
builder, and exporter classes.
"""

import os
import json
import asyncio
import hashlib
import tempfile
from datetime import datetime, timezone
from typing import Dict, List, Any, Optional, Union, AsyncGenerator
from pathlib import Path
from dataclasses import dataclass
import uuid

# Import async libraries
import aiofiles
import asyncpg
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_

# Template and rendering
import jinja2
from jinja2 import Environment, FileSystemLoader, select_autoescape

# Report formats
try:
    import weasyprint
    WEASYPRINT_AVAILABLE = True
except ImportError:
    WEASYPRINT_AVAILABLE = False

try:
    from playwright.async_api import async_playwright
    PLAYWRIGHT_AVAILABLE = True
except ImportError:
    PLAYWRIGHT_AVAILABLE = False

import markdown
import csv
from io import StringIO, BytesIO

# Internal imports
from .models import ReportJob, ReportTemplate, ReportAuditLog
from .themes import ThemeManager
from .widgets import WidgetRegistry


@dataclass
class ReportContext:
    """Report generation context data"""
    scan_results: List[Dict[str, Any]]
    tx_alerts: List[Dict[str, Any]]
    time_machine_data: List[Dict[str, Any]]
    metadata: Dict[str, Any]
    config: Dict[str, Any]
    watermark: Optional[Dict[str, Any]] = None


class ReportEngine:
    """
    Core report generation engine that orchestrates the entire reporting pipeline.
    
    Features:
    - Multi-format output support
    - Async template rendering
    - Live data binding
    - Performance optimization
    - Error handling and recovery
    """

    def __init__(
        self,
        db_session: AsyncSession,
        templates_dir: Optional[str] = None,
        output_dir: Optional[str] = None,
        theme_manager: Optional[ThemeManager] = None,
        widget_registry: Optional[WidgetRegistry] = None
    ):
        """
        Initialize the report engine.
        
        Args:
            db_session: Database session for data access
            templates_dir: Directory containing Jinja2 templates
            output_dir: Directory for generated reports
            theme_manager: Theme management instance
            widget_registry: Widget registry for custom widgets
        """
        self.db_session = db_session
        self.templates_dir = Path(templates_dir or "templates")
        self.output_dir = Path(output_dir or "reports")
        self.output_dir.mkdir(exist_ok=True)
        
        # Initialize components
        self.theme_manager = theme_manager or ThemeManager()
        self.widget_registry = widget_registry or WidgetRegistry()
        
        # Setup Jinja2 environment
        self.jinja_env = Environment(
            loader=FileSystemLoader(str(self.templates_dir)),
            autoescape=select_autoescape(['html', 'xml']),
            enable_async=True
        )
        
        # Register custom filters and functions
        self._register_template_functions()

    def _register_template_functions(self) -> None:
        """Register custom Jinja2 filters and functions"""
        
        @self.jinja_env.filter
        def format_datetime(value: datetime, format_str: str = "%Y-%m-%d %H:%M:%S") -> str:
            """Format datetime for templates"""
            if isinstance(value, str):
                value = datetime.fromisoformat(value.replace('Z', '+00:00'))
            return value.strftime(format_str)
        
        @self.jinja_env.filter
        def severity_color(severity: str) -> str:
            """Get color for severity level"""
            colors = {
                "critical": "#dc2626",
                "high": "#ea580c", 
                "medium": "#d97706",
                "low": "#65a30d",
                "info": "#0891b2"
            }
            return colors.get(severity.lower(), "#6b7280")
        
        @self.jinja_env.filter
        def format_risk_score(score: float) -> str:
            """Format risk score with appropriate styling"""
            if score >= 9.0:
                return f'<span class="risk-critical">{score:.1f}</span>'
            elif score >= 7.0:
                return f'<span class="risk-high">{score:.1f}</span>'
            elif score >= 4.0:
                return f'<span class="risk-medium">{score:.1f}</span>'
            else:
                return f'<span class="risk-low">{score:.1f}</span>'
        
        @self.jinja_env.global_function
        def render_widget(widget_type: str, data: Dict[str, Any], **kwargs) -> str:
            """Render a widget within the template"""
            return self.widget_registry.render_widget(widget_type, data, **kwargs)

    async def generate_report(
        self,
        job_id: str,
        progress_callback: Optional[callable] = None
    ) -> Dict[str, Any]:
        """
        Generate a complete report from a report job.
        
        Args:
            job_id: Report job ID
            progress_callback: Optional callback for progress updates
            
        Returns:
            Dict containing generation results
        """
        try:
            # Load job details
            job = await self._load_job(job_id)
            if not job:
                raise ValueError(f"Report job {job_id} not found")
            
            await self._update_progress(job_id, 0.1, "Loading template...")
            
            # Load template
            template = await self._load_template(job.template_id)
            if not template:
                raise ValueError(f"Template {job.template_id} not found")
            
            await self._update_progress(job_id, 0.2, "Gathering data...")
            
            # Gather report data
            context = await self._gather_report_data(job)
            
            await self._update_progress(job_id, 0.4, "Rendering template...")
            
            # Render template
            rendered_content = await self._render_template(template, context, job.config)
            
            await self._update_progress(job_id, 0.7, "Generating output...")
            
            # Generate final output
            output_path = await self._generate_output(
                rendered_content,
                job.format,
                job_id,
                job.config
            )
            
            await self._update_progress(job_id, 0.9, "Finalizing...")
            
            # Add watermark and signature if required
            if job.watermark_config:
                output_path = await self._add_watermark(output_path, job.watermark_config)
            
            if job.signature_required:
                output_path = await self._add_signature_block(output_path, job.signature_data)
            
            # Calculate file hash and size
            file_hash = await self._calculate_file_hash(output_path)
            file_size = os.path.getsize(output_path)
            
            # Update job with results
            await self._update_job_completion(job_id, output_path, file_hash, file_size)
            
            await self._update_progress(job_id, 1.0, "Complete")
            
            # Log completion
            await self._log_audit_event(job_id, "report_generated", {
                "file_path": str(output_path),
                "file_size": file_size,
                "file_hash": file_hash
            })
            
            return {
                "success": True,
                "job_id": job_id,
                "file_path": str(output_path),
                "file_size": file_size,
                "file_hash": file_hash
            }
            
        except Exception as e:
            await self._update_job_error(job_id, str(e))
            await self._log_audit_event(job_id, "report_generation_failed", {
                "error": str(e)
            })
            raise

    async def _load_job(self, job_id: str) -> Optional[ReportJob]:
        """Load report job from database"""
        result = await self.db_session.execute(
            select(ReportJob).where(ReportJob.id == job_id)
        )
        return result.scalar_one_or_none()

    async def _load_template(self, template_id: str) -> Optional[ReportTemplate]:
        """Load report template from database"""
        result = await self.db_session.execute(
            select(ReportTemplate).where(ReportTemplate.id == template_id)
        )
        return result.scalar_one_or_none()

    async def _gather_report_data(self, job: ReportJob) -> ReportContext:
        """
        Gather all data needed for report generation.
        
        Args:
            job: Report job configuration
            
        Returns:
            ReportContext with all necessary data
        """
        # This would be implemented to pull from your specific database tables
        # Based on the scan_ids and alert_ids in the job
        
        scan_results = []
        tx_alerts = []
        time_machine_data = []
        
        # Example query structure - you'd implement based on your actual schema
        if job.scan_ids:
            # Query scan_results table
            pass
            
        if job.alert_ids:
            # Query tx_alerts table  
            pass
        
        # Query time_machine table for historical data
        # This would be based on date ranges in job.config
        
        return ReportContext(
            scan_results=scan_results,
            tx_alerts=tx_alerts,
            time_machine_data=time_machine_data,
            metadata=job.metadata,
            config=job.config,
            watermark=job.watermark_config
        )

    async def _render_template(
        self,
        template: ReportTemplate,
        context: ReportContext,
        config: Dict[str, Any]
    ) -> str:
        """
        Render the Jinja2 template with provided context.
        
        Args:
            template: Template configuration
            context: Report data context
            config: Rendering configuration
            
        Returns:
            Rendered template content
        """
        jinja_template = self.jinja_env.from_string(template.template_content)
        
        # Apply theme
        theme_config = self.theme_manager.get_theme_config(template.theme_pack)
        
        template_vars = {
            'scan_results': context.scan_results,
            'tx_alerts': context.tx_alerts,
            'time_machine_data': context.time_machine_data,
            'metadata': context.metadata,
            'config': {**template.default_config, **config},
            'theme': theme_config,
            'generated_at': datetime.now(timezone.utc),
            'watermark': context.watermark
        }
        
        return await jinja_template.render_async(**template_vars)

    async def _generate_output(
        self,
        content: str,
        format: str,
        job_id: str,
        config: Dict[str, Any]
    ) -> Path:
        """
        Generate final output in the specified format.
        
        Args:
            content: Rendered template content
            format: Output format (pdf, html, etc.)
            job_id: Job ID for filename
            config: Format-specific configuration
            
        Returns:
            Path to generated file
        """
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        base_filename = f"report_{job_id}_{timestamp}"
        
        if format == "html":
            output_path = self.output_dir / f"{base_filename}.html"
            async with aiofiles.open(output_path, 'w', encoding='utf-8') as f:
                await f.write(content)
                
        elif format == "pdf":
            if not WEASYPRINT_AVAILABLE and not PLAYWRIGHT_AVAILABLE:
                raise RuntimeError("Neither WeasyPrint nor Playwright available for PDF generation")
            
            output_path = self.output_dir / f"{base_filename}.pdf"
            
            if PLAYWRIGHT_AVAILABLE:
                await self._generate_pdf_playwright(content, output_path, config)
            else:
                await self._generate_pdf_weasyprint(content, output_path, config)
                
        elif format == "markdown":
            # Convert HTML to Markdown
            import html2text
            h = html2text.HTML2Text()
            h.ignore_links = False
            markdown_content = h.handle(content)
            
            output_path = self.output_dir / f"{base_filename}.md"
            async with aiofiles.open(output_path, 'w', encoding='utf-8') as f:
                await f.write(markdown_content)
                
        elif format == "sarif_v2":
            # Convert to SARIF v2.1.0 format
            sarif_data = await self._convert_to_sarif(content, config)
            
            output_path = self.output_dir / f"{base_filename}.sarif"
            async with aiofiles.open(output_path, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(sarif_data, indent=2))
                
        elif format == "csv":
            # Extract tabular data and generate CSV
            csv_data = await self._convert_to_csv(content, config)
            
            output_path = self.output_dir / f"{base_filename}.csv"
            async with aiofiles.open(output_path, 'w', encoding='utf-8', newline='') as f:
                await f.write(csv_data)
                
        elif format == "json":
            # Convert to structured JSON
            json_data = await self._convert_to_json(content, config)
            
            output_path = self.output_dir / f"{base_filename}.json"
            async with aiofiles.open(output_path, 'w', encoding='utf-8') as f:
                await f.write(json.dumps(json_data, indent=2, default=str))
                
        else:
            raise ValueError(f"Unsupported format: {format}")
        
        return output_path

    async def _generate_pdf_playwright(
        self,
        html_content: str,
        output_path: Path,
        config: Dict[str, Any]
    ) -> None:
        """Generate PDF using Playwright for high-performance rendering"""
        async with async_playwright() as p:
            browser = await p.chromium.launch()
            page = await browser.new_page()
            
            await page.set_content(html_content)
            
            pdf_config = {
                'path': str(output_path),
                'format': 'A4',
                'print_background': True,
                'margin': {
                    'top': '1in',
                    'right': '1in', 
                    'bottom': '1in',
                    'left': '1in'
                }
            }
            
            # Apply custom config
            pdf_config.update(config.get('pdf_options', {}))
            
            await page.pdf(**pdf_config)
            await browser.close()

    async def _generate_pdf_weasyprint(
        self,
        html_content: str,
        output_path: Path,
        config: Dict[str, Any]
    ) -> None:
        """Generate PDF using WeasyPrint"""
        html_doc = weasyprint.HTML(string=html_content)
        html_doc.write_pdf(str(output_path))

    async def _convert_to_sarif(self, content: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Convert report content to SARIF v2.1.0 format"""
        # Implementation would parse the HTML/data and convert to SARIF
        # This is a complex conversion that would need to map your findings
        # to SARIF result objects
        return {
            "$schema": "https://raw.githubusercontent.com/oasis-tcs/sarif-spec/master/Schemata/sarif-schema-2.1.0.json",
            "version": "2.1.0",
            "runs": []
        }

    async def _convert_to_csv(self, content: str, config: Dict[str, Any]) -> str:
        """Convert report data to CSV format"""
        # Extract tabular data from content and convert to CSV
        # This would parse findings and create rows
        output = StringIO()
        writer = csv.writer(output)
        
        # Write headers
        writer.writerow(['ID', 'Severity', 'Title', 'Description', 'Function', 'Risk Score'])
        
        # This would be implemented to extract actual data
        # writer.writerow([...])
        
        return output.getvalue()

    async def _convert_to_json(self, content: str, config: Dict[str, Any]) -> Dict[str, Any]:
        """Convert report data to structured JSON"""
        # Convert report data to structured JSON format
        return {
            "report_metadata": {},
            "scan_results": [],
            "findings": [],
            "generated_at": datetime.now(timezone.utc).isoformat()
        }

    async def _add_watermark(self, file_path: Path, watermark_config: Dict[str, Any]) -> Path:
        """Add watermark to generated report"""
        # Implementation would depend on file format
        # For PDF, could use PyPDF2 or similar
        # For now, return original path
        return file_path

    async def _add_signature_block(self, file_path: Path, signature_data: Dict[str, Any]) -> Path:
        """Add digital signature block to report"""
        # Implementation would add signature metadata and verification info
        return file_path

    async def _calculate_file_hash(self, file_path: Path) -> str:
        """Calculate SHA-256 hash of file"""
        hash_sha256 = hashlib.sha256()
        async with aiofiles.open(file_path, 'rb') as f:
            async for chunk in self._file_chunks(f):
                hash_sha256.update(chunk)
        return hash_sha256.hexdigest()

    async def _file_chunks(self, file_handle, chunk_size: int = 8192):
        """Async generator for file chunks"""
        while True:
            chunk = await file_handle.read(chunk_size)
            if not chunk:
                break
            yield chunk

    async def _update_progress(self, job_id: str, progress: float, status: str) -> None:
        """Update job progress in database"""
        stmt = select(ReportJob).where(ReportJob.id == job_id)
        result = await self.db_session.execute(stmt)
        job = result.scalar_one_or_none()
        
        if job:
            job.progress = progress
            job.status = status
            await self.db_session.commit()

    async def _update_job_completion(
        self,
        job_id: str,
        file_path: Path,
        file_hash: str,
        file_size: int
    ) -> None:
        """Update job with completion details"""
        stmt = select(ReportJob).where(ReportJob.id == job_id)
        result = await self.db_session.execute(stmt)
        job = result.scalar_one_or_none()
        
        if job:
            job.status = "completed"
            job.progress = 1.0
            job.file_path = str(file_path)
            job.file_hash = file_hash
            job.file_size = file_size
            job.updated_at = datetime.now(timezone.utc)
            await self.db_session.commit()

    async def _update_job_error(self, job_id: str, error_message: str) -> None:
        """Update job with error information"""
        stmt = select(ReportJob).where(ReportJob.id == job_id)
        result = await self.db_session.execute(stmt)
        job = result.scalar_one_or_none()
        
        if job:
            job.status = "failed"
            job.error_message = error_message
            job.updated_at = datetime.now(timezone.utc)
            await self.db_session.commit()

    async def _log_audit_event(
        self,
        job_id: str,
        action: str,
        details: Dict[str, Any],
        user_id: str = "system"
    ) -> None:
        """Log audit event"""
        audit_log = ReportAuditLog(
            job_id=job_id,
            action=action,
            user_id=user_id,
            details=details,
            timestamp=datetime.now(timezone.utc)
        )
        self.db_session.add(audit_log)
        await self.db_session.commit()


class ReportBuilder:
    """
    Report builder for interactive report creation and editing.
    
    Provides utilities for building reports through a UI interface.
    """
    
    def __init__(self, engine: ReportEngine):
        """Initialize report builder with engine reference"""
        self.engine = engine
    
    async def create_draft_report(
        self,
        template_id: str,
        title: str,
        config: Dict[str, Any],
        user_id: str
    ) -> str:
        """
        Create a new draft report.
        
        Args:
            template_id: Template to use for report
            title: Report title
            config: Initial configuration
            user_id: User creating the report
            
        Returns:
            New report job ID
        """
        job = ReportJob(
            template_id=template_id,
            title=title,
            config=config,
            created_by=user_id,
            status="draft"
        )
        
        self.engine.db_session.add(job)
        await self.engine.db_session.commit()
        
        # Log creation
        await self.engine._log_audit_event(
            str(job.id),
            "report_created",
            {"template_id": template_id, "title": title},
            user_id
        )
        
        return str(job.id)

    async def update_report_config(
        self,
        job_id: str,
        config: Dict[str, Any],
        user_id: str
    ) -> bool:
        """
        Update report configuration.
        
        Args:
            job_id: Report job ID
            config: Updated configuration
            user_id: User making changes
            
        Returns:
            True if successful
        """
        job = await self.engine._load_job(job_id)
        if not job:
            return False
        
        old_config = job.config.copy()
        job.config = config
        job.updated_at = datetime.now(timezone.utc)
        
        await self.engine.db_session.commit()
        
        # Log update
        await self.engine._log_audit_event(
            job_id,
            "config_updated",
            {"old_config": old_config, "new_config": config},
            user_id
        )
        
        return True


class ReportExporter:
    """
    Report export utilities for generating signed URLs, managing access, etc.
    """
    
    def __init__(self, engine: ReportEngine, s3_client=None):
        """Initialize exporter with engine and optional S3 client"""
        self.engine = engine
        self.s3_client = s3_client
    
    async def generate_signed_url(
        self,
        job_id: str,
        expires_in: int = 3600,
        recipient_email: Optional[str] = None
    ) -> str:
        """
        Generate a signed URL for report access.
        
        Args:
            job_id: Report job ID
            expires_in: URL expiration time in seconds
            recipient_email: Optional recipient email for tracking
            
        Returns:
            Signed URL for report access
        """
        # Implementation would generate cryptographically signed URLs
        # For now, return placeholder
        token = str(uuid.uuid4())
        return f"/api/v1/reports/{job_id}/download?token={token}&expires={expires_in}"
    
    async def revoke_access(self, job_id: str, user_id: str) -> bool:
        """
        Revoke access to a report.
        
        Args:
            job_id: Report job ID to revoke
            user_id: User performing revocation
            
        Returns:
            True if successful
        """
        job = await self.engine._load_job(job_id)
        if not job:
            return False
        
        job.status = "revoked"
        job.updated_at = datetime.now(timezone.utc)
        
        await self.engine.db_session.commit()
        
        # Log revocation
        await self.engine._log_audit_event(
            job_id,
            "access_revoked",
            {},
            user_id
        )
        
        return True
