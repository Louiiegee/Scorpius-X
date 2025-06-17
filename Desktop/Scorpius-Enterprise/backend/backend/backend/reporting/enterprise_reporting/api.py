"""
Enterprise Reporting API Routes
==============================

FastAPI routes for the enterprise reporting system providing endpoints for
report generation, management, publishing, and client portal access.
"""

from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, File, UploadFile
from fastapi.responses import StreamingResponse, HTMLResponse
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, and_, or_
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
from pathlib import Path
import json
import uuid
import asyncio
from io import BytesIO

from .models import (
    ReportTemplate, ReportJob, ReportAuditLog, ReportAccessLog, ReportDiff,
    ReportFormat, ReportStatus, ReportJobCreate, ReportJobUpdate, 
    ReportJobResponse, ReportTemplateResponse, ReportDiffResponse,
    ReportExportRequest, ReportPublishRequest
)
from .core import ReportEngine, ReportBuilder, ReportExporter
from .themes import ThemeManager
from .widgets import WidgetRegistry
from .diff import ReportDiffEngine
from ...database import get_db  # Assuming database connection utility exists
from ...auth import get_current_user  # Assuming auth utility exists


# Create router
router = APIRouter(prefix="/api/v1/reporting", tags=["Enterprise Reporting"])
security = HTTPBearer()


@router.post("/templates", response_model=ReportTemplateResponse)
async def create_report_template(
    template_data: Dict[str, Any],
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> ReportTemplateResponse:
    """
    Create a new report template.
    
    Args:
        template_data: Template configuration and Jinja2 template
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Created template response
    """
    try:
        # Validate template data
        required_fields = ['name', 'template_content', 'output_formats']
        for field in required_fields:
            if field not in template_data:
                raise HTTPException(status_code=400, detail=f"Missing required field: {field}")
        
        # Create template record
        template = ReportTemplate(
            id=str(uuid.uuid4()),
            name=template_data['name'],
            description=template_data.get('description', ''),
            template_content=template_data['template_content'],
            output_formats=template_data['output_formats'],
            theme_config=template_data.get('theme_config', {}),
            widget_config=template_data.get('widget_config', {}),
            created_by=current_user['user_id'],
            is_active=True
        )
        
        db.add(template)
        await db.commit()
        await db.refresh(template)
        
        # Log template creation
        audit_log = ReportAuditLog(
            report_id=None,
            template_id=template.id,
            action="template_created",
            user_id=current_user['user_id'],
            details={"template_name": template.name}
        )
        db.add(audit_log)
        await db.commit()
        
        return ReportTemplateResponse.from_orm(template)
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create template: {str(e)}")


@router.get("/templates", response_model=List[ReportTemplateResponse])
async def list_report_templates(
    skip: int = 0,
    limit: int = 100,
    active_only: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> List[ReportTemplateResponse]:
    """
    List available report templates.
    
    Args:
        skip: Number of records to skip
        limit: Maximum number of records to return
        active_only: Only return active templates
        db: Database session
        current_user: Authenticated user
        
    Returns:
        List of report templates
    """
    query = select(ReportTemplate)
    
    if active_only:
        query = query.where(ReportTemplate.is_active == True)
    
    query = query.offset(skip).limit(limit)
    result = await db.execute(query)
    templates = result.scalars().all()
    
    return [ReportTemplateResponse.from_orm(template) for template in templates]


@router.post("/jobs", response_model=ReportJobResponse)
async def create_report_job(
    job_request: ReportJobCreate,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> ReportJobResponse:
    """
    Create a new report generation job.
    
    Args:
        job_request: Report job configuration
        background_tasks: FastAPI background tasks
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Created job response
    """
    try:
        # Validate template exists
        template_query = select(ReportTemplate).where(
            and_(
                ReportTemplate.id == job_request.template_id,
                ReportTemplate.is_active == True
            )
        )
        result = await db.execute(template_query)
        template = result.scalar_one_or_none()
        
        if not template:
            raise HTTPException(status_code=404, detail="Template not found")
        
        # Create job record
        job = ReportJob(
            id=str(uuid.uuid4()),
            template_id=job_request.template_id,
            scan_id=job_request.scan_id,
            title=job_request.title,
            output_format=job_request.output_format,
            theme_name=job_request.theme_name,
            parameters=job_request.parameters,
            status=ReportStatus.PENDING,
            created_by=current_user['user_id']
        )
        
        db.add(job)
        await db.commit()
        await db.refresh(job)
        
        # Start background report generation
        background_tasks.add_task(
            generate_report_background,
            job.id,
            template,
            job_request.parameters
        )
        
        return ReportJobResponse.from_orm(job)
        
    except HTTPException:
        raise
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to create job: {str(e)}")


@router.get("/jobs/{job_id}", response_model=ReportJobResponse)
async def get_report_job(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> ReportJobResponse:
    """
    Get report job details.
    
    Args:
        job_id: Job identifier
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Report job details
    """
    query = select(ReportJob).where(ReportJob.id == job_id)
    result = await db.execute(query)
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    return ReportJobResponse.from_orm(job)


@router.get("/jobs/{job_id}/download")
async def download_report(
    job_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Download completed report.
    
    Args:
        job_id: Job identifier
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Report file download
    """
    query = select(ReportJob).where(ReportJob.id == job_id)
    result = await db.execute(query)
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status != ReportStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Report not ready for download")
    
    if not job.output_path or not Path(job.output_path).exists():
        raise HTTPException(status_code=404, detail="Report file not found")
    
    # Log access
    access_log = ReportAccessLog(
        report_id=job.id,
        user_id=current_user['user_id'],
        access_type="download",
        ip_address=None,  # Would extract from request
        user_agent=None   # Would extract from request
    )
    db.add(access_log)
    await db.commit()
    
    # Stream file
    def file_generator():
        with open(job.output_path, 'rb') as f:
            while True:
                chunk = f.read(8192)
                if not chunk:
                    break
                yield chunk
    
    # Determine content type
    content_type = {
        ReportFormat.PDF: "application/pdf",
        ReportFormat.HTML: "text/html",
        ReportFormat.MARKDOWN: "text/markdown",
        ReportFormat.CSV: "text/csv",
        ReportFormat.JSON: "application/json",
        ReportFormat.SARIF: "application/json"
    }.get(job.output_format, "application/octet-stream")
    
    filename = f"{job.title}_{job.created_at.strftime('%Y%m%d_%H%M%S')}.{job.output_format.value}"
    
    return StreamingResponse(
        file_generator(),
        media_type=content_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )


@router.post("/jobs/{job_id}/publish")
async def publish_report(
    job_id: str,
    publish_request: ReportPublishRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Publish report to client portal.
    
    Args:
        job_id: Job identifier
        publish_request: Publishing configuration
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Published report access details
    """
    query = select(ReportJob).where(ReportJob.id == job_id)
    result = await db.execute(query)
    job = result.scalar_one_or_none()
    
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    
    if job.status != ReportStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Report not ready for publishing")
    
    try:
        # Initialize exporter
        exporter = ReportExporter(db)
        
        # Generate signed URL
        signed_url = await exporter.generate_signed_url(
            report_id=job.id,
            expires_in=timedelta(days=publish_request.expires_days),
            watermark_text=publish_request.watermark_text,
            recipient_email=publish_request.recipient_email
        )
        
        # Update job status
        job.status = ReportStatus.PUBLISHED
        job.published_at = datetime.utcnow()
        await db.commit()
        
        # Log publishing
        audit_log = ReportAuditLog(
            report_id=job.id,
            action="report_published",
            user_id=current_user['user_id'],
            details={
                "recipient": publish_request.recipient_email,
                "expires_days": publish_request.expires_days
            }
        )
        db.add(audit_log)
        await db.commit()
        
        return {
            "message": "Report published successfully",
            "access_url": signed_url,
            "expires_at": datetime.utcnow() + timedelta(days=publish_request.expires_days)
        }
        
    except Exception as e:
        await db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to publish report: {str(e)}")


@router.post("/diff", response_model=ReportDiffResponse)
async def compare_reports(
    base_job_id: str,
    compare_job_id: str,
    include_details: bool = True,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
) -> ReportDiffResponse:
    """
    Compare two reports and generate diff.
    
    Args:
        base_job_id: Base report job ID
        compare_job_id: Comparison report job ID
        include_details: Include detailed field-level changes
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Report comparison results
    """
    try:
        # Get both jobs
        base_query = select(ReportJob).where(ReportJob.id == base_job_id)
        compare_query = select(ReportJob).where(ReportJob.id == compare_job_id)
        
        base_result = await db.execute(base_query)
        compare_result = await db.execute(compare_query)
        
        base_job = base_result.scalar_one_or_none()
        compare_job = compare_result.scalar_one_or_none()
        
        if not base_job or not compare_job:
            raise HTTPException(status_code=404, detail="One or both jobs not found")
        
        if base_job.status != ReportStatus.COMPLETED or compare_job.status != ReportStatus.COMPLETED:
            raise HTTPException(status_code=400, detail="Both reports must be completed")
        
        # Load report data (would integrate with actual data loading)
        base_data = await load_report_data(base_job.scan_id)
        compare_data = await load_report_data(compare_job.scan_id)
        
        # Generate diff
        diff_engine = ReportDiffEngine()
        diff_result = await diff_engine.compare_reports(
            base_data, compare_data, include_details
        )
        
        # Save diff to database
        report_diff = ReportDiff(
            id=str(uuid.uuid4()),
            base_report_id=base_job_id,
            compare_report_id=compare_job_id,
            diff_summary=diff_result.summary.__dict__,
            diff_details=diff_result.__dict__ if include_details else None,
            created_by=current_user['user_id']
        )
        
        db.add(report_diff)
        await db.commit()
        
        return ReportDiffResponse(
            diff_id=report_diff.id,
            base_report_id=base_job_id,
            compare_report_id=compare_job_id,
            summary=diff_result.summary,
            details=diff_result if include_details else None,
            created_at=report_diff.created_at
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to compare reports: {str(e)}")


@router.get("/themes")
async def list_themes(
    current_user: dict = Depends(get_current_user)
):
    """
    List available report themes.
    
    Args:
        current_user: Authenticated user
        
    Returns:
        List of available themes
    """
    theme_manager = ThemeManager()
    themes = await theme_manager.list_themes()
    
    return {
        "themes": [
            {
                "name": name,
                "display_name": theme.display_name,
                "description": theme.description,
                "colors": theme.colors.__dict__,
                "typography": theme.typography.__dict__
            }
            for name, theme in themes.items()
        ]
    }


@router.get("/widgets")
async def list_widgets(
    current_user: dict = Depends(get_current_user)
):
    """
    List available report widgets.
    
    Args:
        current_user: Authenticated user
        
    Returns:
        List of available widgets
    """
    widget_registry = WidgetRegistry()
    widgets = widget_registry.list_widgets()
    
    return {
        "widgets": [
            {
                "name": name,
                "display_name": widget_class.display_name,
                "description": widget_class.description,
                "config_schema": widget_class.get_config_schema()
            }
            for name, widget_class in widgets.items()
        ]
    }


@router.post("/export")
async def export_report(
    export_request: ReportExportRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """
    Export report with specific configuration.
    
    Args:
        export_request: Export configuration
        db: Database session
        current_user: Authenticated user
        
    Returns:
        Export details and access URL
    """
    try:
        exporter = ReportExporter(db)
        
        # Generate export
        export_result = await exporter.export_report(
            report_id=export_request.report_id,
            export_format=export_request.format,
            include_watermark=export_request.include_watermark,
            watermark_text=export_request.watermark_text,
            webhook_url=export_request.webhook_url
        )
        
        return export_result
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to export report: {str(e)}")


# Client Portal Routes (Public access with signed URLs)

@router.get("/portal/{access_token}")
async def portal_access(
    access_token: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Access report through client portal.
    
    Args:
        access_token: Signed access token
        db: Database session
        
    Returns:
        Report portal page
    """
    try:
        exporter = ReportExporter(db)
        
        # Validate token and get report
        report_data = await exporter.validate_signed_url(access_token)
        
        if not report_data:
            raise HTTPException(status_code=404, detail="Invalid or expired access token")
        
        # Log access
        access_log = ReportAccessLog(
            report_id=report_data['report_id'],
            access_type="portal_view",
            ip_address=None,  # Would extract from request
            user_agent=None   # Would extract from request
        )
        db.add(access_log)
        await db.commit()
        
        # Return portal HTML
        return HTMLResponse(
            content=generate_portal_html(report_data),
            status_code=200
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Portal access failed: {str(e)}")


# Background Tasks


async def generate_report_background(
    job_id: str,
    template: ReportTemplate,
    parameters: Dict[str, Any]
):
    """
    Background task for report generation.
    
    Args:
        job_id: Job identifier
        template: Report template
        parameters: Generation parameters
    """
    from ...database import get_async_session  # Assuming this exists
    
    async with get_async_session() as db:
        try:
            # Update job status
            job_query = select(ReportJob).where(ReportJob.id == job_id)
            result = await db.execute(job_query)
            job = result.scalar_one()
            
            job.status = ReportStatus.PROCESSING
            job.started_at = datetime.utcnow()
            await db.commit()
            
            # Initialize report engine
            engine = ReportEngine(db)
            
            # Generate report
            report_result = await engine.generate_report(
                template_id=template.id,
                scan_id=job.scan_id,
                output_format=job.output_format,
                theme_name=job.theme_name,
                parameters=parameters
            )
            
            # Update job with results
            job.status = ReportStatus.COMPLETED
            job.completed_at = datetime.utcnow()
            job.output_path = report_result.output_path
            job.content_hash = report_result.content_hash
            job.file_size = report_result.file_size
            job.metadata = report_result.metadata
            
            await db.commit()
            
        except Exception as e:
            # Update job with error
            job.status = ReportStatus.FAILED
            job.error_message = str(e)
            job.completed_at = datetime.utcnow()
            await db.commit()


# Utility Functions


async def load_report_data(scan_id: str) -> Dict[str, Any]:
    """
    Load report data for a specific scan.
    
    Args:
        scan_id: Scan identifier
        
    Returns:
        Report data dictionary
    """
    # This would integrate with actual data loading from
    # scan_results, tx_alerts, time_machine tables
    
    # Placeholder implementation
    return {
        "metadata": {
            "scan_id": scan_id,
            "report_id": str(uuid.uuid4()),
            "overall_risk_score": 7.5
        },
        "findings": [
            {
                "id": "finding_1",
                "title": "Reentrancy Vulnerability",
                "severity": "high",
                "function_name": "withdraw",
                "vulnerability_type": "reentrancy",
                "location": "line 45"
            }
        ],
        "metrics": {
            "total_functions": 25,
            "vulnerabilities_found": 3,
            "gas_usage": 150000
        }
    }


def generate_portal_html(report_data: Dict[str, Any]) -> str:
    """
    Generate HTML for client portal.
    
    Args:
        report_data: Report data
        
    Returns:
        HTML content
    """
    return f"""
    <!DOCTYPE html>
    <html>
    <head>
        <title>Scorpius Security Report</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
            body {{ font-family: Arial, sans-serif; margin: 0; padding: 20px; }}
            .header {{ background: #1a1a1a; color: white; padding: 20px; margin: -20px -20px 20px -20px; }}
            .report-content {{ max-width: 800px; margin: 0 auto; }}
            .download-button {{ background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; }}
        </style>
    </head>
    <body>
        <div class="header">
            <h1>Scorpius Security Report</h1>
            <p>Report ID: {report_data.get('report_id', 'N/A')}</p>
        </div>
        <div class="report-content">
            <h2>Report Summary</h2>
            <p>This is your security analysis report. Click the button below to download the full report.</p>
            <a href="/api/v1/reporting/portal/{report_data.get('access_token', '')}/download" class="download-button">
                Download Report
            </a>
        </div>
    </body>
    </html>
    """
