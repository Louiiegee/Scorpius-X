"""
Honeypot Detector API Server
Dedicated server for honeypot detection and analysis
"""

import asyncio
import json
import logging
import os
import sys
import time
from datetime import datetime
from typing import Dict, Any, List, Optional

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, APIRouter
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Import the honeypot detector engine
from .honeypot_detector import HoneypotDetector, HoneypotDetection, NetworkService

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Scorpius Honeypot Detector API",
    description="Advanced honeypot detection and analysis system",
    version="1.0.0"
)

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ================================
# DATA MODELS
# ================================

class HoneypotScanRequest(BaseModel):
    """Request model for honeypot scan."""
    target: str
    ports: Optional[List[int]] = None
    scan_type: str = "full"
    timeout: Optional[int] = 10

class HoneypotScanResult(BaseModel):
    """Response model for honeypot scan results."""
    scan_id: str
    target: str
    honeypot_detected: bool
    confidence: float
    honeypot_types: List[str]
    services_scanned: List[Dict[str, Any]]
    risk_score: float
    recommendations: List[str]
    timestamp: datetime
    execution_time: float

# ================================
# STORAGE (In-memory)
# ================================

# Initialize honeypot detector
detector = HoneypotDetector()
scan_history: List[Dict[str, Any]] = []
active_scans: Dict[str, Dict[str, Any]] = {}

# ================================
# API ENDPOINTS
# ================================

@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "service": "Scorpius Honeypot Detector API",
        "version": "1.0.0",
        "status": "running",
        "endpoints": {
            "scan": "/scan",
            "history": "/history",
            "status": "/status/{scan_id}",
            "websocket": "/ws/honeypot"
        },
        "detector_stats": {
            "signatures_loaded": len(detector.signatures),
            "scans_completed": len(scan_history),
            "active_scans": len(active_scans)
        }
    }

@app.post("/scan")
async def scan_target(request: HoneypotScanRequest) -> HoneypotScanResult:
    """
    Scan target for honeypot indicators.
    
    Performs comprehensive honeypot detection including:
    - Network service fingerprinting
    - Banner analysis
    - Response pattern analysis
    - SSL certificate inspection
    """
    scan_id = f"honeypot_{int(time.time())}_{hash(request.target) % 1000}"
    start_time = time.time()
    
    try:
        logger.info(f"Starting honeypot scan for: {request.target}")
        
        # Store active scan
        active_scans[scan_id] = {
            "scan_id": scan_id,
            "target": request.target,
            "status": "running",
            "progress": 0,
            "timestamp": datetime.now().isoformat()
        }
        
        # Start background scan
        asyncio.create_task(run_honeypot_scan(scan_id, request))
        
        # Return immediate response
        return HoneypotScanResult(
            scan_id=scan_id,
            target=request.target,
            honeypot_detected=False,
            confidence=0.0,
            honeypot_types=[],
            services_scanned=[],
            risk_score=0.0,
            recommendations=["Scan in progress..."],
            timestamp=datetime.now(),
            execution_time=time.time() - start_time
        )
        
    except Exception as e:
        logger.error(f"Failed to start honeypot scan: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/history")
async def get_scan_history():
    """Get history of all honeypot scans."""
    return {
        "scans": scan_history,
        "total": len(scan_history),
        "active_scans": len(active_scans)
    }

@app.get("/status/{scan_id}")
async def get_scan_status(scan_id: str):
    """Get status of a specific scan."""
    try:
        # Check active scans
        if scan_id in active_scans:
            return active_scans[scan_id]
        
        # Check completed scans
        completed_scan = next((scan for scan in scan_history if scan["scan_id"] == scan_id), None)
        if completed_scan:
            return completed_scan
        
        raise HTTPException(status_code=404, detail="Scan not found")
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get scan status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/signatures")
async def get_signatures():
    """Get all loaded honeypot signatures."""
    return {
        "signatures": [
            {
                "name": sig.name,
                "type": sig.type,
                "confidence_weight": sig.confidence_weight,
                "severity": sig.severity,
                "description": sig.description
            }
            for sig in detector.signatures
        ],
        "total": len(detector.signatures)
    }

# ================================
# HONEYPOT SCANNING ENGINE
# ================================

async def run_honeypot_scan(scan_id: str, request: HoneypotScanRequest):
    """Run the actual honeypot scan."""
    try:
        start_time = time.time()
        
        # Update progress
        active_scans[scan_id]["progress"] = 10
        
        # Perform the scan
        results = await detector.scan_target_async(
            request.target,
            ports=request.ports,
            timeout=request.timeout
        )
        
        # Update progress
        active_scans[scan_id]["progress"] = 70
        
        # Analyze results
        honeypot_detected = any(detection.confidence > 0.5 for detection in results.detections)
        overall_confidence = max((d.confidence for d in results.detections), default=0.0)
        honeypot_types = [d.honeypot_type for d in results.detections if d.confidence > 0.3]
        
        # Calculate risk score
        risk_score = min(overall_confidence * 100, 100.0)
        
        # Generate recommendations
        recommendations = generate_recommendations(results, honeypot_detected, risk_score)
        
        # Update progress
        active_scans[scan_id]["progress"] = 90
        
        execution_time = time.time() - start_time
        
        # Prepare final result
        scan_result = {
            "scan_id": scan_id,
            "target": request.target,
            "honeypot_detected": honeypot_detected,
            "confidence": overall_confidence,
            "honeypot_types": honeypot_types,
            "services_scanned": [
                {
                    "host": service.host,
                    "port": service.port,
                    "protocol": service.protocol,
                    "banner": service.banner,
                    "response_time": service.response_time
                }
                for service in results.services_scanned
            ],
            "detections": [
                {
                    "honeypot_type": d.honeypot_type,
                    "confidence": d.confidence,
                    "indicators": d.indicators,
                    "severity": d.severity
                }
                for d in results.detections
            ],
            "risk_score": risk_score,
            "recommendations": recommendations,
            "timestamp": datetime.now().isoformat(),
            "execution_time": execution_time,
            "status": "completed"
        }
        
        # Move to history and remove from active
        scan_history.append(scan_result)
        if scan_id in active_scans:
            del active_scans[scan_id]
        
        logger.info(f"Honeypot scan completed: {scan_id}")
        
    except Exception as e:
        logger.error(f"Honeypot scan failed: {e}")
        
        # Update scan with error status
        error_result = {
            "scan_id": scan_id,
            "target": request.target,
            "status": "failed",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }
        
        scan_history.append(error_result)
        if scan_id in active_scans:
            del active_scans[scan_id]

def generate_recommendations(results, honeypot_detected: bool, risk_score: float) -> List[str]:
    """Generate security recommendations based on scan results."""
    recommendations = []
    
    if honeypot_detected:
        recommendations.extend([
            "🚨 HONEYPOT DETECTED - Avoid interacting with this target",
            "📍 Target appears to be a honeypot or deception system",
            "🔍 Review network traffic patterns to this target",
            "⚠️ Consider updating threat intelligence feeds"
        ])
        
        if risk_score > 80:
            recommendations.extend([
                "🚫 HIGH CONFIDENCE honeypot - Do not proceed",
                "📋 Document this finding for security team review"
            ])
    else:
        recommendations.extend([
            "✅ No strong honeypot indicators detected",
            "🔍 Continue with standard security assessment procedures",
            "📊 Monitor for unusual response patterns during testing"
        ])
    
    return recommendations

# ================================
# WEBSOCKET ENDPOINT
# ================================

@app.websocket("/ws/honeypot")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for real-time honeypot scan updates."""
    await websocket.accept()
    try:
        logger.info("WebSocket client connected")
        
        while True:
            # Send current scan status
            await websocket.send_json({
                "type": "honeypot_update",
                "active_scans": list(active_scans.values()),
                "recent_scans": scan_history[-5:],
                "stats": {
                    "total_scans": len(scan_history),
                    "active_scans": len(active_scans),
                    "signatures_loaded": len(detector.signatures)
                },
                "timestamp": datetime.now().isoformat()
            })
            
            await asyncio.sleep(2)  # Update every 2 seconds
            
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.close()

# ================================
# MAIN ENTRY POINT
# ================================

# Export router for main.py integration
router = APIRouter()

# Include all routes from the app into the router
for route in app.routes:
    router.routes.append(route)

if __name__ == "__main__":
    port = int(os.environ.get("HONEYPOT_PORT", 8003))
    logger.info(f"Starting Honeypot Detector API Server on port {port}")
    
    uvicorn.run(
        "honeypot_api_server:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
