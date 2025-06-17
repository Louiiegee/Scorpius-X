#!/usr/bin/env python3
"""
Scorpius Backend API Server - Complete MEV & Security Platform
Integrated vulnerability scanning, MEV detection, and monitoring system
"""

import asyncio
import json
import logging
import os
import sys
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import time

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, BackgroundTasks, Query as QueryParam, Request, Response
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Add current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import our modules
from modules.elite_mev_bot import get_mev_bot, start_mev_monitoring, stop_mev_monitoring, get_mev_status, get_mev_opportunities
# from modules.real_vulnerability_scanner import scan_contract_for_vulnerabilities
from modules.bytecode_similarity_engine import BytecodeSimilarityEngine, analyze_contract_bytecode
from modules.honeypot_detector import HoneypotDetector, analyze_honeypot_target
from modules.recon_vault import ReconVault, search_bug_bounty_programs
from engine.engine import ScorpiusEngine
from core.enhanced_mempool_monitor import EnhancedMempoolMonitor
from models.mempool_event import MempoolEvent, MempoolEventType, MempoolEventSeverity

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Scorpius Backend API",
    description="Complete MEV Detection & Smart Contract Security Platform",
    version="3.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global instances
scorpius_engine = ScorpiusEngine()
honeypot_detector = HoneypotDetector()
recon_vault = ReconVault()
similarity_engine = BytecodeSimilarityEngine()
mempool_monitor = EnhancedMempoolMonitor()

# WebSocket connections
websocket_connections = set()

# Pydantic models
class ContractScanRequest(BaseModel):
    contract_address: str
    contract_source: Optional[str] = None
    analysis_types: Optional[List[str]] = ["static", "symbolic"]

class ContractScanResponse(BaseModel):
    job_id: str
    status: str
    message: str

class ScanStatusResponse(BaseModel):
    job_id: str
    status: str
    progress: int
    vulnerabilities: Optional[List[Dict[str, Any]]] = None
    risk_score: Optional[float] = None
    total_vulnerabilities: Optional[int] = None

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "version": "3.0.0",
        "services": {
            "vulnerability_scanner": "active",
            "mev_detector": "active",
            "engine": "active"
        }
    }

# Vulnerability Scanning Endpoints
@app.post("/api/scan/submit", response_model=ContractScanResponse)
async def submit_scan(request: ContractScanRequest):
    """Submit a contract for security analysis."""
    try:
        job_id = await scorpius_engine.submit_scan(
            contract_address=request.contract_address,
            contract_source=request.contract_source,
            analysis_types=request.analysis_types
        )
        
        return ContractScanResponse(
            job_id=job_id,
            status="submitted",
            message=f"Scan submitted successfully for {request.contract_address}"
        )
    except Exception as e:
        logger.error(f"Failed to submit scan: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scan/{job_id}/status", response_model=ScanStatusResponse)
async def get_scan_status(job_id: str):
    """Get the status of a scan job."""
    try:
        status = scorpius_engine.get_scan_status(job_id)
        
        return ScanStatusResponse(
            job_id=job_id,
            status=status["status"],
            progress=status.get("progress", 0),
            vulnerabilities=status.get("vulnerabilities"),
            risk_score=status.get("risk_score"),
            total_vulnerabilities=status.get("total_vulnerabilities")
        )
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Failed to get scan status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/scan/list")
async def list_scans(status: Optional[str] = None):
    """List all scans, optionally filtered by status."""
    try:
        scans = scorpius_engine.list_scans(status_filter=status)
        return {"scans": scans}
    except Exception as e:
        logger.error(f"Failed to list scans: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# MEV Bot Endpoints
@app.post("/api/mev/start")
async def start_mev_bot():
    """Start the MEV monitoring bot."""
    try:
        await start_mev_monitoring()
        return {"status": "started", "message": "MEV bot started successfully"}
    except Exception as e:
        logger.error(f"Failed to start MEV bot: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/mev/stop")
async def stop_mev_bot():
    """Stop the MEV monitoring bot."""
    try:
        stop_mev_monitoring()
        return {"status": "stopped", "message": "MEV bot stopped successfully"}
    except Exception as e:
        logger.error(f"Failed to stop MEV bot: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/mev/status")
async def mev_bot_status():
    """Get MEV bot status and statistics."""
    try:
        status = await get_mev_status()
        return status
    except Exception as e:
        logger.error(f"Failed to get MEV status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/mev/opportunities")
async def mev_opportunities():
    """Get recent MEV opportunities."""
    try:
        opportunities = await get_mev_opportunities()
        return {"opportunities": opportunities}
    except Exception as e:
        logger.error(f"Failed to get MEV opportunities: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Direct vulnerability scanning endpoint
@app.post("/api/vulnerability/scan")
async def direct_vulnerability_scan(request: ContractScanRequest):
    """Direct vulnerability scan without job queuing."""
    try:
        if not request.contract_source:
            raise HTTPException(
                status_code=400, 
                detail="Contract source code is required for direct scanning"
            )
        
        results = await scan_contract_for_vulnerabilities(
            contract_source=request.contract_source,
            analysis_types=request.analysis_types or ["static", "symbolic"]
        )
        
        return results
    except Exception as e:
        logger.error(f"Direct vulnerability scan failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Bytecode Similarity Analysis Endpoints
class BytecodeSimilarityRequest(BaseModel):
    """Request model for bytecode similarity analysis."""
    bytecode: str
    include_opcode_analysis: bool = True
    include_vulnerability_patterns: bool = True
    include_fingerprinting: bool = True

class BytecodeSimilarityResponse(BaseModel):
    """Response model for bytecode similarity analysis."""
    bytecode_hash: str
    bytecode_length: int
    similarity_matches: List[Dict[str, Any]]
    vulnerability_patterns: List[Dict[str, Any]]
    opcode_analysis: Dict[str, Any]
    fingerprint: Dict[str, Any]
    classification: Dict[str, Any]
    risk_score: float
    analysis_timestamp: float

@app.post("/api/bytecode/analyze", response_model=BytecodeSimilarityResponse)
async def analyze_bytecode_similarity(request: BytecodeSimilarityRequest):
    """Analyze bytecode for similarity patterns and vulnerabilities."""
    try:
        logger.info(f"Starting bytecode similarity analysis for {len(request.bytecode)} bytes")
        
        results = await similarity_engine.analyze_bytecode_similarity(
            bytecode=request.bytecode,
            include_opcode_analysis=request.include_opcode_analysis,
            include_vulnerability_patterns=request.include_vulnerability_patterns,
            include_fingerprinting=request.include_fingerprinting
        )
        
        return BytecodeSimilarityResponse(**results)
    except Exception as e:
        logger.error(f"Bytecode similarity analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/bytecode/patterns")
async def get_reference_patterns():
    """Get available reference patterns for similarity comparison."""
    try:
        patterns = {
            "reference_patterns": list(similarity_engine.reference_patterns.keys()),
            "vulnerability_patterns": list(similarity_engine.vulnerability_patterns.keys()),
            "total_patterns": len(similarity_engine.reference_patterns) + len(similarity_engine.vulnerability_patterns)
        }
        return patterns
    except Exception as e:
        logger.error(f"Failed to get reference patterns: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/bytecode/compare")
async def compare_bytecodes(request: dict):
    """Compare two bytecode strings for similarity."""
    try:
        # Validate input
        if "bytecode1" not in request or "bytecode2" not in request:
            raise HTTPException(status_code=400, detail="Both bytecode1 and bytecode2 are required")
        
        # Clean both bytecodes
        clean_bytecode1 = similarity_engine._clean_bytecode(request["bytecode1"])
        clean_bytecode2 = similarity_engine._clean_bytecode(request["bytecode2"])
        
        # Calculate similarity
        similarity_ratio = similarity_engine._calculate_similarity_ratio(clean_bytecode1, clean_bytecode2)
        
        # Get detailed diff
        diff_analysis = await similarity_engine._calculate_detailed_diff(clean_bytecode1, clean_bytecode2)
        
        return {
            "bytecode1_length": len(clean_bytecode1),
            "bytecode2_length": len(clean_bytecode2),
            "similarity_ratio": similarity_ratio,
            "confidence": similarity_engine._calculate_confidence(
                similarity_ratio, len(clean_bytecode1), len(clean_bytecode2)
            ),
            "diff_analysis": diff_analysis,
            "analysis_timestamp": asyncio.get_event_loop().time()
        }
    except Exception as e:
        logger.error(f"Bytecode comparison failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/bytecode/contract/{address}")
async def analyze_contract_bytecode_by_address(address: str):
    """Fetch and analyze contract bytecode by Ethereum address."""
    try:
        # Placeholder for real Web3 integration
        web3_provider_url = "https://mainnet.infura.io/v3/YOUR_PROJECT_ID"
        
        # Simulate fetching bytecode (replace with real Web3 call)
        simulated_bytecode = "0x608060405234801561001057600080fd5b50600436106100415760003560e01c8063a9059cbb14610046578063dd62ed3e1461007657806370a08231146100a6575b600080fd5b"
        
        # Perform analysis
        results = await similarity_engine.analyze_bytecode_similarity(
            bytecode=simulated_bytecode,
            include_opcode_analysis=True,
            include_vulnerability_patterns=True,
            include_fingerprinting=True
        )
        
        return {
            "contract_address": address,
            "bytecode_length": len(simulated_bytecode),
            "analysis_results": results,
            "web3_provider": web3_provider_url,
            "analysis_timestamp": asyncio.get_event_loop().time()
        }
    except Exception as e:
        logger.error(f"Contract bytecode analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ================== HONEYPOT DETECTION ENDPOINTS ==================

@app.post("/api/honeypot/analyze")
async def analyze_honeypot_target_endpoint(request: dict):
    """Analyze target for honeypot indicators."""
    try:
        # Validate input
        if "target" not in request:
            raise HTTPException(status_code=400, detail="Target IP or hostname is required")
        
        target = request["target"]
        ports = request.get("ports")  # Optional port list
        include_service_detection = request.get("include_service_detection", True)
        include_behavioral_analysis = request.get("include_behavioral_analysis", True)
        include_timing_analysis = request.get("include_timing_analysis", True)
        
        # Perform comprehensive honeypot analysis
        results = await honeypot_detector.analyze_target(
            target=target,
            ports=ports,
            include_service_detection=include_service_detection,
            include_behavioral_analysis=include_behavioral_analysis,
            include_timing_analysis=include_timing_analysis
        )
        
        return {
            "status": "success",
            "analysis_results": results,
            "analysis_timestamp": asyncio.get_event_loop().time()
        }
    except Exception as e:
        logger.error(f"Honeypot analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/honeypot/signatures")
async def get_honeypot_signatures():
    """Get available honeypot signatures and detection patterns."""
    try:
        signatures_info = []
        for signature in honeypot_detector.signatures:
            signatures_info.append({
                "name": signature.name,
                "type": signature.type,
                "indicator_count": len(signature.indicators),
                "confidence_weight": signature.confidence_weight,
                "severity": signature.severity,
                "description": signature.description
            })
        
        return {
            "signatures": signatures_info,
            "total_signatures": len(signatures_info),
            "supported_types": list(set(sig["type"] for sig in signatures_info))
        }
    except Exception as e:
        logger.error(f"Failed to get honeypot signatures: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/honeypot/quick-scan")
async def quick_honeypot_scan(request: dict):
    """Quick honeypot scan with common ports."""
    try:
        if "target" not in request:
            raise HTTPException(status_code=400, detail="Target IP or hostname is required")
        
        target = request["target"]
        
        # Quick scan with most common honeypot ports
        common_ports = [21, 22, 23, 80, 443, 2222, 8080]
        
        results = await analyze_honeypot_target(
            target=target,
            ports=common_ports,
            include_service_detection=True,
            include_behavioral_analysis=False,  # Skip for quick scan
            include_timing_analysis=False       # Skip for quick scan
        )
        
        # Simplified response for quick scan
        return {
            "target": target,
            "scan_type": "quick",
            "honeypot_detected": len(results.get("honeypot_detections", [])) > 0,
            "risk_score": results.get("risk_score", 0.0),
            "confidence": results.get("confidence", 0.0),
            "detections_count": len(results.get("honeypot_detections", [])),
            "top_detections": results.get("honeypot_detections", [])[:3],  # Top 3
            "analysis_time": results.get("analysis_time", 0.0)
        }
    except Exception as e:
        logger.error(f"Quick honeypot scan failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/honeypot/batch-analyze")
async def batch_honeypot_analysis(request: dict):
    """Analyze multiple targets for honeypot indicators."""
    try:
        if "targets" not in request or not isinstance(request["targets"], list):
            raise HTTPException(status_code=400, detail="List of targets is required")
        
        targets = request["targets"]
        if len(targets) > 50:  # Limit batch size
            raise HTTPException(status_code=400, detail="Maximum 50 targets per batch")
        
        ports = request.get("ports")
        quick_scan = request.get("quick_scan", True)
        
        results = []
        
        # Analyze each target
        for target in targets:
            try:
                if quick_scan:
                    target_results = await analyze_honeypot_target(
                        target=target,
                        ports=[22, 80, 443, 2222] if ports is None else ports,
                        include_behavioral_analysis=False,
                        include_timing_analysis=False
                    )
                else:
                    target_results = await honeypot_detector.analyze_target(target, ports)
                
                results.append({
                    "target": target,
                    "status": "completed",
                    "results": target_results
                })
            except Exception as e:
                results.append({
                    "target": target,
                    "status": "failed",
                    "error": str(e)
                })
        
        # Summary statistics
        completed = sum(1 for r in results if r["status"] == "completed")
        failed = len(results) - completed
        honeypot_detected = sum(1 for r in results 
                              if r["status"] == "completed" and 
                              len(r["results"].get("honeypot_detections", [])) > 0)
        
        return {
            "batch_results": results,
            "summary": {
                "total_targets": len(targets),
                "completed": completed,
                "failed": failed,
                "honeypots_detected": honeypot_detected,
                "detection_rate": round(honeypot_detected / completed * 100, 2) if completed > 0 else 0
            },
            "analysis_timestamp": asyncio.get_event_loop().time()
        }
    except Exception as e:
        logger.error(f"Batch honeypot analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Analytics endpoint
@app.get("/api/analytics/dashboard")
async def get_dashboard_analytics():
    """Get analytics data for the dashboard."""
    try:
        # Get recent scans
        recent_scans = scorpius_engine.list_scans()
        completed_scans = [s for s in recent_scans if s.get("status") == "completed"]
        
        # Get MEV data
        mev_status = await get_mev_status()
        
        # Calculate stats
        total_vulnerabilities = sum(
            s.get("total_vulnerabilities", 0) for s in completed_scans
        )
        
        avg_risk_score = 0
        if completed_scans:
            risk_scores = [s.get("risk_score", 0) for s in completed_scans if s.get("risk_score")]
            avg_risk_score = sum(risk_scores) / len(risk_scores) if risk_scores else 0
        
        return {
            "scans": {
                "total": len(recent_scans),
                "completed": len(completed_scans),
                "pending": len([s for s in recent_scans if s.get("status") == "pending"]),
                "running": len([s for s in recent_scans if s.get("status") == "running"])
            },
            "vulnerabilities": {
                "total_found": total_vulnerabilities,
                "average_risk_score": round(avg_risk_score, 2)
            },
            "mev": mev_status.get("detector_stats", {}),
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get dashboard analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# WebSocket for real-time updates
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket endpoint for real-time updates."""
    await websocket.accept()
    logger.info("WebSocket connection established")
    
    try:
        while True:
            # Send periodic updates
            status_update = {
                "type": "status_update",
                "timestamp": datetime.utcnow().isoformat(),
                "data": {
                    "active_scans": len([s for s in scorpius_engine.list_scans() if s.get("status") in ["pending", "running"]]),
                    "mev_status": await get_mev_status()
                }
            }
            
            await websocket.send_text(json.dumps(status_update))
            await asyncio.sleep(5)  # Send updates every 5 seconds
            
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
    finally:
        logger.info("WebSocket connection closed")

# Recon Vault API Endpoints
@app.get("/api/recon/programs")
async def get_bug_bounty_programs(
    ecosystem: Optional[str] = None,
    min_bounty: Optional[int] = None,
    max_bounty: Optional[int] = None,
    program_type: Optional[str] = None,
    status: Optional[str] = None,
    page: int = 1,
    limit: int = 20
):
    """Get bug bounty programs with optional filtering."""
    try:
        # Sync programs if needed
        await recon_vault.sync_programs()
        
        # Apply filters
        filters = {}
        if ecosystem:
            filters["ecosystem"] = ecosystem
        if min_bounty:
            filters["min_bounty"] = min_bounty
        if max_bounty:
            filters["max_bounty"] = max_bounty
        if program_type:
            filters["program_type"] = program_type
        if status:
            filters["status"] = status
            
        programs = await recon_vault.search_programs(
            filters=filters,
            page=page,
            limit=limit
        )
        
        return {
            "programs": programs["programs"],
            "pagination": programs["pagination"],
            "filters_applied": filters,
            "timestamp": datetime.utcnow().isoformat()
        }
    except Exception as e:
        logger.error(f"Failed to get bug bounty programs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/recon/programs/{program_id}")
async def get_program_details(program_id: str):
    """Get detailed information about a specific bug bounty program."""
    try:
        program = await recon_vault.get_program_details(program_id)
        if not program:
            raise HTTPException(status_code=404, detail="Program not found")
        return program
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get program details: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recon/sessions")
async def create_hunting_session(
    program_id: str,
    name: str,
    description: Optional[str] = None,
    user_id: str = "default_user"
):
    """Create a new bug hunting session."""
    try:
        session = await recon_vault.create_hunting_session(
            program_id=program_id,
            name=name,
            description=description,
            user_id=user_id
        )
        return {
            "session": session,
            "message": "Hunting session created successfully"
        }
    except Exception as e:
        logger.error(f"Failed to create hunting session: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/recon/sessions")  
async def get_hunting_sessions(
    user_id: str = "default_user",
    status: Optional[str] = None
):
    """Get hunting sessions for a user."""
    try:
        sessions = await recon_vault.get_user_sessions(user_id, status)
        return {
            "sessions": sessions,
            "total": len(sessions)
        }
    except Exception as e:
        logger.error(f"Failed to get hunting sessions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recon/sessions/{session_id}/findings")
async def add_vulnerability_finding(
    session_id: str,
    title: str,
    description: str,
    severity: str,
    vulnerability_type: str,
    poc_url: Optional[str] = None,
    bounty_amount: Optional[float] = None
):
    """Add a vulnerability finding to a hunting session."""
    try:
        finding = await recon_vault.add_finding(
            session_id=session_id,
            title=title,
            description=description,
            severity=severity,
            vulnerability_type=vulnerability_type,
            poc_url=poc_url,
            bounty_amount=bounty_amount
        )
        return {
            "finding": finding,
            "message": "Vulnerability finding added successfully"
        }
    except Exception as e:
        logger.error(f"Failed to add vulnerability finding: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recon/sessions/{session_id}/notes")
async def add_session_note(
    session_id: str,
    content: str,
    note_type: str = "general"
):
    """Add a note to a hunting session."""
    try:
        note = await recon_vault.add_session_note(
            session_id=session_id,
            content=content,
            note_type=note_type
        )
        return {
            "note": note,
            "message": "Note added successfully"
        }
    except Exception as e:
        logger.error(f"Failed to add session note: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/recon/reports/generate")
async def generate_report(
    template_type: str,
    session_ids: Optional[List[str]] = None,
    date_range: Optional[Dict[str, str]] = None,
    include_findings: bool = True,
    include_analytics: bool = True
):
    """Generate a bug bounty report."""
    try:
        report = await recon_vault.generate_report(
            template_type=template_type,
            session_ids=session_ids,
            date_range=date_range,
            include_findings=include_findings,
            include_analytics=include_analytics
        )
        return {
            "report": report,
            "download_url": f"/api/recon/reports/{report['id']}/download",
            "message": "Report generated successfully"
        }
    except Exception as e:
        logger.error(f"Failed to generate report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/recon/reports")
async def get_reports(
    user_id: str = "default_user",
    template_type: Optional[str] = None
):
    """Get available reports."""
    try:
        reports = await recon_vault.get_reports(user_id, template_type)
        return {
            "reports": reports,
            "total": len(reports)
        }
    except Exception as e:
        logger.error(f"Failed to get reports: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/recon/reports/{report_id}/download")
async def download_report(report_id: str):
    """Download a generated report."""
    try:
        report_data = await recon_vault.download_report(report_id)
        if not report_data:
            raise HTTPException(status_code=404, detail="Report not found")
            
        return Response(
            content=report_data["content"],
            media_type=report_data["content_type"],
            headers={"Content-Disposition": f"attachment; filename={report_data['filename']}"}
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to download report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/recon/analytics/dashboard")
async def get_recon_analytics():
    """Get analytics data for the recon vault dashboard."""
    try:
        analytics = await recon_vault.get_analytics_dashboard()
        return analytics
    except Exception as e:
        logger.error(f"Failed to get recon analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/recon/search")
async def search_programs(
    query: str,
    filters: Optional[Dict[str, Any]] = None,
    page: int = 1,
    limit: int = 10
):
    """Search bug bounty programs."""
    try:
        results = await recon_vault.search_programs(
            query=query,
            filters=filters or {},
            page=page,
            limit=limit
        )
        return results
    except Exception as e:
        logger.error(f"Failed to search programs: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# WebSocket endpoint for real-time updates
@app.websocket("/ws/recon")
async def recon_websocket(websocket: WebSocket):
    """WebSocket for real-time recon vault updates."""
    await websocket.accept()
    websocket_connections.add(websocket)
    
    try:
        while True:
            # Keep connection alive and send periodic updates
            await asyncio.sleep(30)
            await websocket.send_json({
                "type": "heartbeat",
                "timestamp": datetime.utcnow().isoformat()
            })
    except WebSocketDisconnect:
        websocket_connections.discard(websocket)
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        websocket_connections.discard(websocket)

# Error handlers
@app.exception_handler(404)
async def not_found_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=404,
        content={"error": "Endpoint not found", "path": str(request.url.path)}
    )

@app.exception_handler(500)
async def internal_error_handler(request: Request, exc: Exception):
    logger.error(f"Internal server error: {exc}")
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "message": str(exc)}
    )

if __name__ == "__main__":
    logger.info("Starting Scorpius Backend API Server")
    uvicorn.run(
        "api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
