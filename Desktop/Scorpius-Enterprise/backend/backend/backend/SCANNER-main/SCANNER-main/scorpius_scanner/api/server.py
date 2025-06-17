from fastapi import FastAPI, BackgroundTasks, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
import uuid
from typing import List, Optional, Dict, Any
from datetime import datetime
from prometheus_fastapi_instrumentator import Instrumentator

from ..core.config import settings
from ..core.logging import get_logger
from ..core.database import init_db, get_db_session, ScanResult
from ..core.stream_queue import enqueue_scan
from ..core.plugin_registry import registry
from ..core.telemetry import init_telemetry, instrument_app, tracer, scan_counter
from .models import ScanRequest, ScanResponse, ScanStatus
from .websocket import setup_websocket_routes, manager
from .security import fastapi_users, auth_backend, require_role, User, UserCreate, UserUpdate
from ..core.audit import audit_log

logger = get_logger(__name__)

# Initialize telemetry before creating app
init_telemetry()

# Create FastAPI app
app = FastAPI(
    title="Scorpius Scanner API",
    description="Enterprise blockchain vulnerability scanner with simulation",
    version="1.0.0"
)

# Add telemetry instrumentation
instrument_app(app)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add Prometheus metrics
instrumentator = Instrumentator(
    should_group_status_codes=False,
    should_ignore_untemplated=True,
    should_respect_env_var=True,
    should_instrument_requests_inprogress=True,
    excluded_handlers=["/health", "/metrics"],
    env_var_name="ENABLE_METRICS",
    inprogress_name="scorpius_requests_inprogress",
    inprogress_labels=True,
)

instrumentator.instrument(app).expose(app, endpoint="/metrics")

# Setup WebSocket routes
setup_websocket_routes(app)

# Add auth routes
app.include_router(
    fastapi_users.get_auth_router(auth_backend), 
    prefix="/auth/jwt", 
    tags=["auth"]
)
app.include_router(
    fastapi_users.get_register_router(UserCreate, User),
    prefix="/auth",
    tags=["auth"],
)
app.include_router(
    fastapi_users.get_users_router(User, UserUpdate),
    prefix="/users",
    tags=["users"],
)

# Global scan tracker
active_scans: Dict[str, Dict[str, Any]] = {}
scan_results: Dict[str, List[Dict[str, Any]]] = {}

@app.on_event("startup")
async def startup_event():
    """Initialize application on startup"""
    logger.info("Starting Scorpius Scanner API")
    await init_db()
    await registry.discover_and_load()
    logger.info(f"Loaded {len(registry.plugins)} plugins")

@app.get("/", response_class=HTMLResponse)
async def root():
    """API root with basic dashboard"""
    return """
    <html>
        <head><title>Scorpius Scanner</title></head>
        <body>
            <h1>🦂 Scorpius Scanner API</h1>
            <p>Enterprise blockchain vulnerability scanner</p>
            <ul>
                <li><a href="/docs">API Documentation</a></li>
                <li><a href="/plugins">Available Plugins</a></li>
                <li><a href="/health">Health Check</a></li>
                <li><a href="/metrics">Prometheus Metrics</a></li>
            </ul>
        </body>
    </html>
    """

@app.get("/health")
async def health_check():
    """Health check endpoint with accurate plugin count"""
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow(),
        "plugins": len(registry.plugins),
        "version": "1.0.0",
        "service": "scorpius-scanner"
    }

@app.get("/plugins")
async def list_plugins():
    """List all available plugins"""
    return registry.list_plugins()

@app.post("/scan", response_model=ScanResponse)
async def create_scan(
    request: ScanRequest, 
    background_tasks: BackgroundTasks,
    user: User = Depends(require_role("analyst"))
):
    """Create a new vulnerability scan (requires analyst role)"""
    
    with tracer.start_as_current_span("create_scan") as span:
        scan_id = str(uuid.uuid4())
        
        span.set_attribute("scan.id", scan_id)
        span.set_attribute("scan.target", request.target)
        span.set_attribute("scan.enable_simulation", request.enable_simulation)
        
        try:
            # Validate plugins if specified
            if request.plugins:
                available_plugins = set(registry.plugins.keys())
                invalid_plugins = set(request.plugins) - available_plugins
                if invalid_plugins:
                    raise HTTPException(
                        status_code=400,
                        detail=f"Invalid plugins: {list(invalid_plugins)}"
                    )
            
            # Log audit event
            await audit_log.log_event(
                event_type="scan",
                action="create",
                resource_type="scan",
                resource_id=scan_id,
                user_id=str(user.id),
                details={
                    "target": request.target,
                    "enable_simulation": request.enable_simulation,
                    "plugins": request.plugins
                }
            )
            
            # Enqueue scan
            job_id = await enqueue_scan(
                scan_id=scan_id,
                target=request.target,
                rpc_url=request.rpc_url or settings.default_rpc,
                block_number=request.block_number,
                selected_plugins=request.plugins,
                enable_simulation=request.enable_simulation
            )
            
            # Increment scan counter
            scan_counter.add(1, {"status": "created"})
            
            logger.info(f"Created scan {scan_id} for target {request.target}")
            span.set_attribute("scan.status", "queued")
            
            return ScanResponse(
                scan_id=scan_id,
                job_id=job_id,
                status="queued",
                message="Scan queued successfully"
            )
            
        except Exception as e:
            span.record_exception(e)
            span.set_attribute("scan.status", "failed")
            scan_counter.add(1, {"status": "failed"})
            
            await audit_log.log_event(
                event_type="scan",
                action="create_failed", 
                resource_type="scan",
                resource_id=scan_id,
                user_id=str(user.id),
                details={"error": str(e)}
            )
            
            logger.error(f"Failed to create scan: {e}")
            raise HTTPException(status_code=500, detail=str(e))

@app.get("/scan/{scan_id}", response_model=ScanStatus)
async def get_scan_status(scan_id: str, db = Depends(get_db_session)):
    """Get scan status and results"""
    try:
        # Try to get from database first
        async with db as session:
            result = await session.get(ScanResult, scan_id)
            if result:
                return ScanStatus(
                    scan_id=scan_id,
                    status=result.status,
                    target=result.target,
                    findings=result.findings.get("findings", []),
                    created_at=result.created_at,
                    completed_at=result.completed_at
                )
        
        # If not in database, check active scans
        if scan_id in active_scans:
            scan_data = active_scans[scan_id]
            return ScanStatus(
                scan_id=scan_id,
                status=scan_data["status"],
                target=scan_data["target"],
                findings=scan_results.get(scan_id, [])
            )
        
        raise HTTPException(status_code=404, detail="Scan not found")
        
    except Exception as e:
        logger.error(f"Failed to get scan status: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.delete("/scan/{scan_id}")
async def cancel_scan(scan_id: str, user: User = Depends(require_role("analyst"))):
    """Cancel a running scan"""
    if scan_id not in active_scans:
        raise HTTPException(status_code=404, detail="Scan not found")
    
    # Mark as cancelled
    active_scans[scan_id]["status"] = "cancelled"
    
    await audit_log.log_event(
        event_type="scan",
        action="cancel",
        resource_type="scan", 
        resource_id=scan_id,
        user_id=str(user.id)
    )
    
    return {"message": "Scan cancelled"}

@app.get("/scans")
async def list_scans(db = Depends(get_db_session)):
    """List recent scans"""
    try:
        async with db as session:
            from sqlalchemy import select
            result = await session.execute(
                select(ScanResult).order_by(ScanResult.created_at.desc()).limit(50)
            )
            scans = result.scalars().all()
            
            return [
                {
                    "scan_id": scan.scan_id,
                    "target": scan.target,
                    "status": scan.status,
                    "created_at": scan.created_at,
                    "findings_count": len(scan.findings.get("findings", []))
                }
                for scan in scans
            ]
    except Exception as e:
        logger.error(f"Failed to list scans: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/audit/verify")
async def verify_audit_log(user: User = Depends(require_role("admin"))):
    """Verify audit log integrity (admin only)"""
    is_valid = await audit_log.verify_integrity()
    return {"valid": is_valid}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host=settings.api_host, port=settings.api_port)
