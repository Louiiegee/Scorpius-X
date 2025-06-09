"""
Scorpius API Routes
Advanced AI-Powered Vulnerability Scanner endpoints
"""
import asyncio
import logging
from typing import Dict, List, Optional, Any
from datetime import datetime
from pathlib import Path

from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from fastapi.responses import FileResponse, JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, desc
from pydantic import BaseModel, Field

from models.scorpius_models import (
    ScorpiusScan, ScanStatus, ScanType, VulnerabilityLevel,
    ScanRequest, ScanResponse, ScanProgress
)
from core.scorpius.report_generator import ReportGenerator
from core.scorpius.vulnerability_scanner import ScorpiusVulnerabilityScanner
from core.db import get_db
import os
from modules.scan_completion_handler import ScanCompletionHandler
from modules.report_generator import generate_scan_report

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/scorpius", tags=["Scorpius Security Scanner"])


class ScanHistoryResponse(BaseModel):
    """Response model for scan history"""
    scans: List[Dict[str, Any]]
    total: int
    page: int
    per_page: int


class ScanStatsResponse(BaseModel):
    """Response model for scan statistics"""
    total_scans: int
    completed_scans: int
    failed_scans: int
    total_vulnerabilities: int
    critical_vulns: int
    high_vulns: int
    medium_vulns: int
    low_vulns: int
    avg_scan_duration: float
    most_common_vuln_types: List[Dict[str, Any]]


@router.get("/health")
async def health_check():
    """Health check endpoint for Scorpius scanner"""
    return {
        "status": "healthy",
        "service": "Scorpius AI Security Scanner",
        "version": "1.0.0",
        "timestamp": datetime.utcnow().isoformat(),
        "ai_model": "claude-3-opus",
        "capabilities": [
            "Smart Contract Analysis",
            "AI-Powered Vulnerability Detection",
            "Exploit Suite Integration",
            "Comprehensive Reporting",
            "Real-time Scanning"
        ]
    }


@router.post("/scan/start", response_model=ScanResponse)
async def start_scan(
    request: ScanRequest,
    db: AsyncSession = Depends(get_db)
):
    """
    Start a new Scorpius vulnerability scan
    
    Args:
        request: Scan configuration
        
    Returns:
        ScanResponse with scan_id and status
    """
    try:
        # Get API key from environment
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise HTTPException(
                status_code=500,
                detail="AI analyzer not configured. Please set ANTHROPIC_API_KEY environment variable."
            )
        
        # Initialize scanner
        scanner = ScorpiusVulnerabilityScanner(db, api_key)
        
        # Start scan
        response = await scanner.start_scan(request)
        
        if response.status == ScanStatus.FAILED:
            raise HTTPException(status_code=500, detail=response.message)
        
        return response
        
    except Exception as e:
        logger.error(f"Failed to start scan: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scan/{scan_id}/progress", response_model=ScanProgress)
async def get_scan_progress(
    scan_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get scan progress information
    
    Args:
        scan_id: Unique scan identifier
        
    Returns:
        ScanProgress with current status and progress
    """
    try:
        scanner = ScorpiusVulnerabilityScanner(db)
        progress = await scanner.get_scan_progress(scan_id)
        
        if not progress:
            raise HTTPException(status_code=404, detail="Scan not found")
        
        return progress
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get scan progress: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scan/{scan_id}/results")
async def get_scan_results(
    scan_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Get completed scan results
    
    Args:
        scan_id: Unique scan identifier
        
    Returns:
        Complete scan results with vulnerabilities
    """
    try:
        scanner = ScorpiusVulnerabilityScanner(db)
        scan = await scanner.get_scan_results(scan_id)
        
        if not scan:
            raise HTTPException(status_code=404, detail="Scan not found")
        
        if scan.status not in [ScanStatus.COMPLETED.value, ScanStatus.FAILED.value]:
            raise HTTPException(
                status_code=400, 
                detail=f"Scan is still {scan.status}. Use /progress endpoint to check status."
            )
        
        # Convert to response format
        response = {
            "scan_id": scan.id,
            "contract_address": scan.contract_address,
            "chain": scan.chain,
            "status": scan.status,
            "started_at": scan.started_at.isoformat() if scan.started_at else None,
            "completed_at": scan.completed_at.isoformat() if scan.completed_at else None,
            "scan_duration": scan.scan_duration,
            "ai_model": scan.ai_model,
            "vulnerabilities_found": scan.vulnerabilities_found,
            "critical_count": scan.critical_count,
            "high_count": scan.high_count,
            "medium_count": scan.medium_count,
            "low_count": scan.low_count,
            "findings": scan.findings,
            "ai_analysis": scan.ai_analysis,
            "contract_info": scan.contract_info,
            "report_paths": {
                "html": scan.report_html_path,
                "pdf": scan.report_pdf_path,
                "json": scan.report_json_path
            },
            "notes": scan.notes
        }
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get scan results: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scan/{scan_id}/report/{report_type}")
async def download_report(
    scan_id: str,
    report_type: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Download scan report
    
    Args:
        scan_id: Unique scan identifier
        report_type: Report format (html, pdf, json)
        
    Returns:
        File download response
    """
    try:
        if report_type not in ["html", "pdf", "json"]:
            raise HTTPException(status_code=400, detail="Invalid report type. Use: html, pdf, json")
        
        # Get scan
        result = await db.execute(select(ScorpiusScan).filter(ScorpiusScan.id == scan_id))
        scan = result.scalar_one_or_none()
        
        if not scan:
            raise HTTPException(status_code=404, detail="Scan not found")
        
        # Get report path
        report_path = None
        if report_type == "html":
            report_path = scan.report_html_path
        elif report_type == "pdf":
            report_path = scan.report_pdf_path
        elif report_type == "json":
            report_path = scan.report_json_path
        
        if not report_path or not Path(report_path).exists():
            raise HTTPException(status_code=404, detail=f"{report_type.upper()} report not found")
        
        # Determine media type
        media_types = {
            "html": "text/html",
            "pdf": "application/pdf",
            "json": "application/json"
        }
        
        filename = f"scorpius_scan_{scan_id}.{report_type}"
        
        return FileResponse(
            path=report_path,
            media_type=media_types[report_type],
            filename=filename
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to download report: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/scans/history", response_model=ScanHistoryResponse)
async def get_scan_history(
    page: int = 1,
    per_page: int = 20,
    status: Optional[str] = None,
    db: AsyncSession = Depends(get_db)
):
    """
    Get scan history with pagination
    
    Args:
        page: Page number (1-based)
        per_page: Items per page (1-100)
        status: Filter by scan status
        
    Returns:
        Paginated scan history
    """
    try:
        # Validate parameters
        if page < 1:
            page = 1
        if per_page < 1 or per_page > 100:
            per_page = 20
        
        # Build query
        query = select(ScorpiusScan).order_by(desc(ScorpiusScan.created_at))
        
        if status:
            if status not in [s.value for s in ScanStatus]:
                raise HTTPException(status_code=400, detail="Invalid status filter")
            query = query.filter(ScorpiusScan.status == status)
        
        # Count total
        count_query = select(ScorpiusScan)
        if status:
            count_query = count_query.filter(ScorpiusScan.status == status)
        
        total_result = await db.execute(count_query)
        total = len(total_result.scalars().all())
        
        # Get page
        offset = (page - 1) * per_page
        query = query.offset(offset).limit(per_page)
        
        result = await db.execute(query)
        scans = result.scalars().all()
        
        # Format response
        scan_data = []
        for scan in scans:
            scan_data.append({
                "scan_id": scan.id,
                "contract_address": scan.contract_address,
                "chain": scan.chain,
                "scan_type": scan.scan_type,
                "status": scan.status,
                "created_at": scan.created_at.isoformat(),
                "started_at": scan.started_at.isoformat() if scan.started_at else None,
                "completed_at": scan.completed_at.isoformat() if scan.completed_at else None,
                "vulnerabilities_found": scan.vulnerabilities_found,
                "critical_count": scan.critical_count,
                "high_count": scan.high_count,
                "medium_count": scan.medium_count,
                "low_count": scan.low_count,
                "scan_duration": scan.scan_duration,
                "ai_model": scan.ai_model
            })
        
        return ScanHistoryResponse(
            scans=scan_data,
            total=total,
            page=page,
            per_page=per_page
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get scan history: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/stats", response_model=ScanStatsResponse)
async def get_scan_stats(db: AsyncSession = Depends(get_db)):
    """
    Get scan statistics and analytics
    
    Returns:
        Comprehensive scan statistics
    """
    try:
        # Get all scans
        result = await db.execute(select(ScorpiusScan))
        scans = result.scalars().all()
        
        total_scans = len(scans)
        completed_scans = sum(1 for s in scans if s.status == ScanStatus.COMPLETED.value)
        failed_scans = sum(1 for s in scans if s.status == ScanStatus.FAILED.value)
        
        # Calculate vulnerability statistics
        total_vulnerabilities = sum(s.vulnerabilities_found or 0 for s in scans)
        critical_vulns = sum(s.critical_count or 0 for s in scans)
        high_vulns = sum(s.high_count or 0 for s in scans)
        medium_vulns = sum(s.medium_count or 0 for s in scans)
        low_vulns = sum(s.low_count or 0 for s in scans)
        
        # Calculate average scan duration
        completed_with_duration = [s for s in scans if s.scan_duration is not None]
        avg_scan_duration = (
            sum(s.scan_duration for s in completed_with_duration) / len(completed_with_duration)
            if completed_with_duration else 0.0
        )
        
        # Get most common vulnerability types
        vuln_type_counts = {}
        for scan in scans:
            if scan.findings:
                for finding in scan.findings:
                    vuln_type = finding.get("vuln_type", "unknown")
                    vuln_type_counts[vuln_type] = vuln_type_counts.get(vuln_type, 0) + 1
        
        most_common_vuln_types = [
            {"type": vtype, "count": count}
            for vtype, count in sorted(vuln_type_counts.items(), key=lambda x: x[1], reverse=True)[:10]
        ]
        
        return ScanStatsResponse(
            total_scans=total_scans,
            completed_scans=completed_scans,
            failed_scans=failed_scans,
            total_vulnerabilities=total_vulnerabilities,
            critical_vulns=critical_vulns,
            high_vulns=high_vulns,
            medium_vulns=medium_vulns,
            low_vulns=low_vulns,
            avg_scan_duration=avg_scan_duration,
            most_common_vuln_types=most_common_vuln_types
        )
        
    except Exception as e:
        logger.error(f"Failed to get scan stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.delete("/scan/{scan_id}")
async def delete_scan(
    scan_id: str,
    delete_reports: bool = False,
    db: AsyncSession = Depends(get_db)
):
    """
    Delete a scan record
    
    Args:
        scan_id: Unique scan identifier
        delete_reports: Whether to delete associated report files
        
    Returns:
        Success confirmation
    """
    try:
        # Get scan
        result = await db.execute(select(ScorpiusScan).filter(ScorpiusScan.id == scan_id))
        scan = result.scalar_one_or_none()
        
        if not scan:
            raise HTTPException(status_code=404, detail="Scan not found")
        
        # Delete report files if requested
        if delete_reports:
            for report_path in [scan.report_html_path, scan.report_pdf_path, scan.report_json_path]:
                if report_path and Path(report_path).exists():
                    try:
                        Path(report_path).unlink()
                        logger.info(f"Deleted report file: {report_path}")
                    except Exception as e:
                        logger.warning(f"Failed to delete report file {report_path}: {e}")
        
        # Delete scan record
        await db.delete(scan)
        await db.commit()
        
        return {
            "message": "Scan deleted successfully",
            "scan_id": scan_id,
            "reports_deleted": delete_reports
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete scan: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/scan/{scan_id}/cancel")
async def cancel_scan(
    scan_id: str,
    db: AsyncSession = Depends(get_db)
):
    """
    Cancel a running scan
    
    Args:
        scan_id: Unique scan identifier
        
    Returns:
        Cancellation confirmation
    """
    try:
        # Get scan
        result = await db.execute(select(ScorpiusScan).filter(ScorpiusScan.id == scan_id))
        scan = result.scalar_one_or_none()
        
        if not scan:
            raise HTTPException(status_code=404, detail="Scan not found")
        
        if scan.status not in [ScanStatus.PENDING.value, ScanStatus.RUNNING.value, ScanStatus.ANALYZING.value]:
            raise HTTPException(
                status_code=400,
                detail=f"Cannot cancel scan with status: {scan.status}"
            )
        
        # Update status to cancelled
        scan.status = ScanStatus.FAILED.value
        scan.completed_at = datetime.utcnow()
        scan.notes = "Scan cancelled by user"
        
        await db.commit()
        
        return {
            "message": "Scan cancelled successfully",
            "scan_id": scan_id,
            "status": "cancelled"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to cancel scan: {e}")
        raise HTTPException(status_code=500, detail=str(e))
