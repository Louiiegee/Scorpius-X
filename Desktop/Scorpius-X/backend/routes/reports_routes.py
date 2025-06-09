#!/usr/bin/env python3
"""
Reports API Routes - Comprehensive Report Management for Scorpius
Provides REST endpoints for managing, serving, and organizing vulnerability scan reports.
"""

import os
import json
import asyncio
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, Response, BackgroundTasks
from fastapi.responses import FileResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc, func
from pydantic import BaseModel, Field

from core.db import get_db
from models.scorpius_models import ScorpiusScan
from modules.report_generator import ScorpiusReportGenerator, generate_scan_report


# API Response Models
class ReportMetadata(BaseModel):
    """Report metadata response model"""
    report_id: str = Field(..., description="Unique report identifier")
    scan_id: str = Field(..., description="Associated scan ID")
    title: str = Field(..., description="Report title")
    created_at: datetime = Field(..., description="Report creation timestamp")
    file_size: Optional[int] = Field(None, description="Report file size in bytes")
    format: str = Field(..., description="Report format (PDF, HTML, JSON)")
    status: str = Field(..., description="Report generation status")
    vulnerability_count: int = Field(..., description="Number of vulnerabilities found")
    risk_level: str = Field(..., description="Overall risk assessment")
    target_contract: str = Field(..., description="Scanned contract address")
    scan_duration: Optional[float] = Field(None, description="Scan duration in seconds")


class ReportAnalytics(BaseModel):
    """Report analytics and statistics"""
    total_reports: int = Field(..., description="Total number of reports")
    reports_today: int = Field(..., description="Reports generated today")
    reports_this_week: int = Field(..., description="Reports generated this week")
    avg_vulnerabilities: float = Field(..., description="Average vulnerabilities per scan")
    critical_findings: int = Field(..., description="Total critical vulnerabilities")
    high_findings: int = Field(..., description="Total high-risk vulnerabilities")
    medium_findings: int = Field(..., description="Total medium-risk vulnerabilities")
    low_findings: int = Field(..., description="Total low-risk vulnerabilities")
    most_common_vuln: Optional[str] = Field(None, description="Most common vulnerability type")
    total_contracts_scanned: int = Field(..., description="Total contracts analyzed")


class ReportGenerationRequest(BaseModel):
    """Request model for generating new reports"""
    scan_id: str = Field(..., description="Scan ID to generate report for")
    format: str = Field(default="pdf", description="Report format (pdf, html, json)")
    include_technical_details: bool = Field(default=True, description="Include technical analysis")
    include_ai_analysis: bool = Field(default=True, description="Include AI-powered insights")


class ReportListResponse(BaseModel):
    """Response model for report listings"""
    reports: List[ReportMetadata] = Field(..., description="List of report metadata")
    total_count: int = Field(..., description="Total number of reports")
    page: int = Field(..., description="Current page number")
    per_page: int = Field(..., description="Results per page")
    has_next: bool = Field(..., description="Whether more pages exist")


# Initialize router
router = APIRouter(prefix="/api/reports", tags=["Reports"])


@router.get("/health", response_model=Dict[str, Any])
async def health_check() -> Dict[str, Any]:
    """
    Health check endpoint for reports service
    
    Returns:
        Service status and configuration
    """
    reports_dir = Path("reports")
    reports_exist = reports_dir.exists()
    report_count = len(list(reports_dir.glob("*.pdf"))) if reports_exist else 0
    
    return {
        "status": "healthy",
        "service": "scorpius-reports",
        "version": "2.1.0",
        "timestamp": datetime.now().isoformat(),
        "reports_directory": str(reports_dir),
        "reports_available": reports_exist,
        "total_reports": report_count,
        "supported_formats": ["pdf", "html", "json"],
        "features": {
            "pdf_generation": True,
            "ai_analysis": True,
            "vulnerability_matrix": True,
            "attack_flow_diagram": True,
            "real_time_generation": True
        }
    }


@router.get("/list", response_model=ReportListResponse)
async def list_reports(
    page: int = 1,
    per_page: int = 20,
    format_filter: Optional[str] = None,
    risk_level: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
) -> ReportListResponse:
    """
    List all available reports with pagination and filtering
    
    Args:
        page: Page number for pagination
        per_page: Results per page
        format_filter: Filter by report format
        risk_level: Filter by risk level
        db: Database session
        
    Returns:
        Paginated list of report metadata
    """
    try:
        # Calculate offset
        offset = (page - 1) * per_page
        
        # Build query
        query = select(ScorpiusScan).filter(
            ScorpiusScan.status == "completed",
            ScorpiusScan.report_paths.isnot(None)
        )
        
        # Apply filters
        if risk_level:
            # This would need to be implemented based on stored risk assessments
            pass
        
        # Get total count
        count_query = select(func.count(ScorpiusScan.id)).filter(
            ScorpiusScan.status == "completed",
            ScorpiusScan.report_paths.isnot(None)
        )
        total_result = await db.execute(count_query)
        total_count = total_result.scalar() or 0
        
        # Get paginated results
        query = query.order_by(desc(ScorpiusScan.created_at)).offset(offset).limit(per_page)
        result = await db.execute(query)
        scans = result.scalars().all()
        
        # Convert to report metadata
        reports = []
        for scan in scans:
            try:
                # Parse report paths
                report_paths = json.loads(scan.report_paths) if scan.report_paths else {}
                pdf_path = report_paths.get('pdf', '')
                
                # Get file size if file exists
                file_size = None
                if pdf_path and os.path.exists(pdf_path):
                    file_size = os.path.getsize(pdf_path)
                
                # Determine risk level from vulnerability counts
                if scan.critical_count > 0:
                    risk_level = "CRITICAL"
                elif scan.high_count > 0:
                    risk_level = "HIGH"
                elif scan.medium_count > 0:
                    risk_level = "MEDIUM"
                else:
                    risk_level = "LOW"
                
                report = ReportMetadata(
                    report_id=f"report_{scan.scan_id}",
                    scan_id=scan.scan_id,
                    title=f"Vulnerability Assessment - {scan.contract_address[:10]}...",
                    created_at=scan.created_at,
                    file_size=file_size,
                    format="pdf",
                    status="completed",
                    vulnerability_count=scan.vulnerabilities_found,
                    risk_level=risk_level,
                    target_contract=scan.contract_address,
                    scan_duration=scan.scan_duration
                )
                reports.append(report)
                
            except Exception as e:
                print(f"⚠️ Error processing scan {scan.scan_id}: {e}")
                continue
        
        return ReportListResponse(
            reports=reports,
            total_count=total_count,
            page=page,
            per_page=per_page,
            has_next=(offset + per_page) < total_count
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list reports: {str(e)}")


@router.get("/analytics", response_model=ReportAnalytics)
async def get_report_analytics(db: AsyncSession = Depends(get_db)) -> ReportAnalytics:
    """
    Get comprehensive analytics about generated reports
    
    Args:
        db: Database session
        
    Returns:
        Detailed analytics and statistics
    """
    try:
        # Calculate date ranges
        today = datetime.now().date()
        week_ago = today - timedelta(days=7)
        
        # Get all completed scans with reports
        scans_query = select(ScorpiusScan).filter(
            ScorpiusScan.status == "completed",
            ScorpiusScan.report_paths.isnot(None)
        )
        result = await db.execute(scans_query)
        scans = result.scalars().all()
        
        # Calculate analytics
        total_reports = len(scans)
        reports_today = len([s for s in scans if s.created_at.date() == today])
        reports_this_week = len([s for s in scans if s.created_at.date() >= week_ago])
        
        # Vulnerability statistics
        total_vulnerabilities = sum(s.vulnerabilities_found for s in scans)
        avg_vulnerabilities = total_vulnerabilities / total_reports if total_reports > 0 else 0
        
        critical_findings = sum(s.critical_count for s in scans)
        high_findings = sum(s.high_count for s in scans)
        medium_findings = sum(s.medium_count for s in scans)
        low_findings = sum(s.low_count for s in scans)
        
        # Get unique contracts scanned
        unique_contracts = len(set(s.contract_address for s in scans))
        
        # Most common vulnerability type (simplified)
        most_common_vuln = "Access Control Vulnerability"  # Could be enhanced with actual analysis
        
        return ReportAnalytics(
            total_reports=total_reports,
            reports_today=reports_today,
            reports_this_week=reports_this_week,
            avg_vulnerabilities=round(avg_vulnerabilities, 1),
            critical_findings=critical_findings,
            high_findings=high_findings,
            medium_findings=medium_findings,
            low_findings=low_findings,
            most_common_vuln=most_common_vuln,
            total_contracts_scanned=unique_contracts
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get analytics: {str(e)}")


@router.post("/generate")
async def generate_report(
    request: ReportGenerationRequest,
    background_tasks: BackgroundTasks,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Generate a new report for a completed scan
    
    Args:
        request: Report generation parameters
        background_tasks: FastAPI background tasks
        db: Database session
        
    Returns:
        Report generation status and metadata
    """
    try:
        # Verify scan exists and is completed
        result = await db.execute(
            select(ScorpiusScan).filter(ScorpiusScan.scan_id == request.scan_id)
        )
        scan = result.scalar_one_or_none()
        
        if not scan:
            raise HTTPException(status_code=404, detail=f"Scan {request.scan_id} not found")
        
        if scan.status != "completed":
            raise HTTPException(
                status_code=400, 
                detail=f"Scan {request.scan_id} is not completed (status: {scan.status})"
            )
        
        # Check if report already exists
        if scan.report_paths:
            report_paths = json.loads(scan.report_paths)
            if request.format in report_paths:
                existing_path = report_paths[request.format]
                if os.path.exists(existing_path):
                    return {
                        "status": "already_exists",
                        "message": f"Report already exists for scan {request.scan_id}",
                        "report_path": existing_path,
                        "scan_id": request.scan_id,
                        "format": request.format
                    }
        
        # Start report generation in background
        if request.format == "pdf":
            background_tasks.add_task(generate_scan_report, db, request.scan_id)
        
        return {
            "status": "generating",
            "message": f"Report generation started for scan {request.scan_id}",
            "scan_id": request.scan_id,
            "format": request.format,
            "estimated_completion": (datetime.now() + timedelta(minutes=2)).isoformat()
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate report: {str(e)}")


@router.get("/download/{scan_id}")
async def download_report(
    scan_id: str,
    format: str = "pdf",
    db: AsyncSession = Depends(get_db)
) -> FileResponse:
    """
    Download a generated report file
    
    Args:
        scan_id: Scan identifier
        format: Report format (pdf, html, json)
        db: Database session
        
    Returns:
        File download response
    """
    try:
        # Get scan record
        result = await db.execute(
            select(ScorpiusScan).filter(ScorpiusScan.scan_id == scan_id)
        )
        scan = result.scalar_one_or_none()
        
        if not scan:
            raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")
        
        if not scan.report_paths:
            raise HTTPException(status_code=404, detail=f"No reports available for scan {scan_id}")
        
        # Parse report paths
        report_paths = json.loads(scan.report_paths)
        
        if format not in report_paths:
            raise HTTPException(
                status_code=404, 
                detail=f"Report format '{format}' not available for scan {scan_id}"
            )
        
        file_path = report_paths[format]
        
        if not os.path.exists(file_path):
            raise HTTPException(
                status_code=404, 
                detail=f"Report file not found: {file_path}"
            )
        
        # Determine filename and media type
        filename = f"scorpius_report_{scan_id}.{format}"
        if format == "pdf":
            media_type = "application/pdf"
        elif format == "html":
            media_type = "text/html"
        elif format == "json":
            media_type = "application/json"
        else:
            media_type = "application/octet-stream"
        
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type=media_type
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to download report: {str(e)}")


@router.get("/view/{scan_id}")
async def view_report_metadata(
    scan_id: str,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get detailed metadata for a specific report
    
    Args:
        scan_id: Scan identifier
        db: Database session
        
    Returns:
        Detailed report metadata and statistics
    """
    try:
        # Get scan record
        result = await db.execute(
            select(ScorpiusScan).filter(ScorpiusScan.scan_id == scan_id)
        )
        scan = result.scalar_one_or_none()
        
        if not scan:
            raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")
        
        # Parse report paths and findings
        report_paths = json.loads(scan.report_paths) if scan.report_paths else {}
        findings = json.loads(scan.findings) if scan.findings else []
        ai_analysis = json.loads(scan.ai_analysis) if scan.ai_analysis else {}
        
        # Calculate file sizes
        file_info = {}
        for format_type, path in report_paths.items():
            if os.path.exists(path):
                file_info[format_type] = {
                    "path": path,
                    "size": os.path.getsize(path),
                    "modified": datetime.fromtimestamp(os.path.getmtime(path)).isoformat()
                }
        
        return {
            "scan_id": scan_id,
            "contract_address": scan.contract_address,
            "created_at": scan.created_at.isoformat(),
            "completed_at": scan.completed_at.isoformat() if scan.completed_at else None,
            "scan_duration": scan.scan_duration,
            "status": scan.status,
            "scan_type": scan.scan_type,
            "chain": scan.chain,
            "ai_model": scan.ai_model,
            "vulnerabilities": {
                "total": scan.vulnerabilities_found,
                "critical": scan.critical_count,
                "high": scan.high_count,
                "medium": scan.medium_count,
                "low": scan.low_count,
                "details": findings[:5]  # First 5 findings for preview
            },
            "ai_analysis": {
                "confidence_score": ai_analysis.get('confidence_score', 0),
                "risk_assessment": ai_analysis.get('risk_assessment', 'UNKNOWN'),
                "model_used": ai_analysis.get('model_used', 'claude-3-opus')
            },
            "available_formats": list(report_paths.keys()),
            "file_info": file_info,
            "report_metadata": {
                "total_pages": 1,  # Could be enhanced
                "sections": ["Executive Summary", "Vulnerability Matrix", "Technical Details", "AI Analysis"],
                "size_estimate": sum(info.get('size', 0) for info in file_info.values())
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get report metadata: {str(e)}")


@router.delete("/delete/{scan_id}")
async def delete_report(
    scan_id: str,
    db: AsyncSession = Depends(get_db)
) -> Dict[str, Any]:
    """
    Delete report files for a scan (keeps scan data)
    
    Args:
        scan_id: Scan identifier
        db: Database session
        
    Returns:
        Deletion status
    """
    try:
        # Get scan record
        result = await db.execute(
            select(ScorpiusScan).filter(ScorpiusScan.scan_id == scan_id)
        )
        scan = result.scalar_one_or_none()
        
        if not scan:
            raise HTTPException(status_code=404, detail=f"Scan {scan_id} not found")
        
        if not scan.report_paths:
            return {
                "status": "no_reports",
                "message": f"No reports found for scan {scan_id}",
                "scan_id": scan_id
            }
        
        # Delete report files
        report_paths = json.loads(scan.report_paths)
        deleted_files = []
        
        for format_type, path in report_paths.items():
            if os.path.exists(path):
                try:
                    os.remove(path)
                    deleted_files.append(f"{format_type}: {path}")
                except Exception as e:
                    print(f"⚠️ Failed to delete {path}: {e}")
        
        # Clear report paths from database
        scan.report_paths = None
        await db.commit()
        
        return {
            "status": "deleted",
            "message": f"Reports deleted for scan {scan_id}",
            "scan_id": scan_id,
            "deleted_files": deleted_files
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete report: {str(e)}")


# Auto-generate reports for completed scans
async def auto_generate_reports():
    """Background task to auto-generate reports for completed scans"""
    try:
        from core.db import get_db
        
        async for db in get_db():
            # Find completed scans without reports
            result = await db.execute(
                select(ScorpiusScan).filter(
                    ScorpiusScan.status == "completed",
                    ScorpiusScan.report_paths.is_(None)
                )
            )
            scans = result.scalars().all()
            
            for scan in scans:
                print(f"🔄 Auto-generating report for scan {scan.scan_id}")
                report_path = await generate_scan_report(db, scan.scan_id)
                if report_path:
                    print(f"✅ Auto-generated report: {report_path}")
                else:
                    print(f"❌ Failed to auto-generate report for scan {scan.scan_id}")
            
            break  # Exit after first db session
            
    except Exception as e:
        print(f"❌ Auto-report generation failed: {e}")


if __name__ == "__main__":
    # Test report generation
    import asyncio
    
    asyncio.run(auto_generate_reports())
