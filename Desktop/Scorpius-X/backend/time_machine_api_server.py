"""
Time Machine API Server
Unified server for blockchain exploit replay functionality with FastAPI and Celery integration.
"""

import os
import sys
import asyncio
import uvicorn
import logging
from typing import Dict, Any, Optional
from contextlib import asynccontextmanager

# Add project root to path
project_root = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, project_root)

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from celery import Celery
from celery.result import AsyncResult

# Import API routes
from routes.time_machine_routes import router as time_machine_router

# Import Celery app and tasks
from celery_app import celery_app
import tasks.replay_tasks as replay_tasks
import tasks.analysis_tasks as analysis_tasks
import tasks.cleanup_tasks as cleanup_tasks

# Logging configuration
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('time_machine_api.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

# Configuration
SERVER_CONFIG = {
    "host": os.getenv("TIME_MACHINE_HOST", "0.0.0.0"),
    "port": int(os.getenv("TIME_MACHINE_PORT", "8010")),
    "debug": os.getenv("DEBUG", "false").lower() == "true",
    "workers": int(os.getenv("WORKERS", "1")),
    "reload": os.getenv("RELOAD", "false").lower() == "true"
}

CELERY_CONFIG = {
    "broker_url": os.getenv("CELERY_BROKER_URL", "redis://localhost:6379/0"),
    "result_backend": os.getenv("CELERY_RESULT_BACKEND", "redis://localhost:6379/0")
}

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Time Machine API Server starting up...")
    
    # Test Celery connection
    try:
        # Send a simple health check task
        health_result = celery_app.send_task("celery_app.health_check")
        logger.info(f"Celery health check sent: {health_result.id}")
    except Exception as e:
        logger.error(f"Celery connection test failed: {str(e)}")
        logger.warning("Continuing without Celery - background tasks will not work")
    
    logger.info("Time Machine API Server startup complete")
    
    yield
    
    # Shutdown
    logger.info("Time Machine API Server shutting down...")
    logger.info("Time Machine API Server shutdown complete")

# Create FastAPI app with lifespan
app = FastAPI(
    title="Time Machine API",
    description="Blockchain Exploit Replay System - Time travel through blockchain history",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include Time Machine router
app.include_router(time_machine_router, tags=["Time Machine"])

# Additional API endpoints for task management

@app.get("/api/system/health")
async def system_health() -> Dict[str, Any]:
    """Get system health status"""
    try:
        # Test Celery connection
        celery_health = None
        try:
            health_result = celery_app.send_task("celery_app.health_check")
            celery_health = {
                "status": "connected",
                "task_id": health_result.id,
                "broker": CELERY_CONFIG["broker_url"],
                "backend": CELERY_CONFIG["result_backend"]
            }
        except Exception as e:
            celery_health = {
                "status": "disconnected",
                "error": str(e),
                "broker": CELERY_CONFIG["broker_url"],
                "backend": CELERY_CONFIG["result_backend"]
            }
        
        return {
            "status": "healthy",
            "service": "Time Machine API",
            "version": "1.0.0",
            "celery": celery_health,
            "available_tasks": {
                "replay": [
                    "start_exploit_replay",
                    "start_transaction_replay"
                ],
                "analysis": [
                    "analyze_exploit",
                    "generate_exploit_report",
                    "batch_analyze_exploits"
                ],
                "cleanup": [
                    "cleanup_session",
                    "cleanup_old_sessions",
                    "cleanup_expired_forks",
                    "cleanup_temp_files"
                ]
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Health check failed: {str(e)}")

@app.get("/api/tasks/{task_id}/status")
async def get_task_status(task_id: str) -> Dict[str, Any]:
    """Get status of a Celery task"""
    try:
        result = AsyncResult(task_id, app=celery_app)
        
        return {
            "task_id": task_id,
            "status": result.status,
            "result": result.result if result.ready() else None,
            "info": result.info if result.info else None,
            "ready": result.ready(),
            "successful": result.successful() if result.ready() else None,
            "failed": result.failed() if result.ready() else None,
            "traceback": result.traceback if result.failed() else None,
            "date_done": result.date_done.isoformat() if result.date_done else None
        }
    except Exception as e:
        logger.error(f"Failed to get task status for {task_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get task status: {str(e)}")

@app.post("/api/tasks/{task_id}/cancel")
async def cancel_task(task_id: str) -> Dict[str, Any]:
    """Cancel a running Celery task"""
    try:
        celery_app.control.revoke(task_id, terminate=True)
        
        return {
            "task_id": task_id,
            "status": "cancelled",
            "message": "Task cancellation requested"
        }
    except Exception as e:
        logger.error(f"Failed to cancel task {task_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to cancel task: {str(e)}")

@app.get("/api/tasks/active")
async def get_active_tasks() -> Dict[str, Any]:
    """Get list of active Celery tasks"""
    try:
        inspect = celery_app.control.inspect()
        active_tasks = inspect.active()
        
        if not active_tasks:
            return {
                "active_tasks": {},
                "total_active": 0,
                "message": "No active tasks or workers not responding"
            }
        
        # Format the response
        formatted_tasks = {}
        total_count = 0
        
        for worker, tasks in active_tasks.items():
            formatted_tasks[worker] = []
            for task in tasks:
                formatted_tasks[worker].append({
                    "id": task["id"],
                    "name": task["name"],
                    "args": task["args"],
                    "kwargs": task["kwargs"],
                    "time_start": task["time_start"]
                })
                total_count += 1
        
        return {
            "active_tasks": formatted_tasks,
            "total_active": total_count,
            "workers_responding": len(formatted_tasks)
        }
    except Exception as e:
        logger.error(f"Failed to get active tasks: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get active tasks: {str(e)}")

@app.get("/api/celery/workers")
async def get_celery_workers() -> Dict[str, Any]:
    """Get information about Celery workers"""
    try:
        inspect = celery_app.control.inspect()
        
        # Get worker stats
        stats = inspect.stats()
        
        if not stats:
            return {
                "workers": {},
                "total_workers": 0,
                "message": "No workers responding"
            }
        
        # Format worker information
        workers_info = {}
        for worker, worker_stats in stats.items():
            workers_info[worker] = {
                "status": "online",
                "pool": worker_stats.get("pool", {}),
                "rusage": worker_stats.get("rusage", {}),
                "total_tasks": worker_stats.get("total", {}),
                "broker": worker_stats.get("broker", {}),
                "clock": worker_stats.get("clock", 0),
                "pid": worker_stats.get("pid", None)
            }
        
        return {
            "workers": workers_info,
            "total_workers": len(workers_info),
            "broker_url": CELERY_CONFIG["broker_url"],
            "result_backend": CELERY_CONFIG["result_backend"]
        }
    except Exception as e:
        logger.error(f"Failed to get worker info: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get worker info: {str(e)}")

@app.post("/api/cleanup/session/{session_id}")
async def trigger_session_cleanup(
    session_id: str,
    background_tasks: BackgroundTasks,
    web3_url: Optional[str] = None,
    redis_url: Optional[str] = None
) -> Dict[str, Any]:
    """Trigger cleanup for a specific session"""
    try:
        # Send cleanup task to Celery
        task_result = cleanup_tasks.cleanup_session.apply_async(
            args=[session_id],
            kwargs={
                "web3_url": web3_url,
                "redis_url": redis_url
            }
        )
        
        return {
            "message": "Session cleanup task started",
            "task_id": task_result.id,
            "session_id": session_id,
            "status": "queued"
        }
    except Exception as e:
        logger.error(f"Failed to start session cleanup: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start cleanup: {str(e)}")

@app.post("/api/cleanup/old-sessions")
async def trigger_old_sessions_cleanup(
    age_hours: int = 24,
    web3_url: Optional[str] = None,
    redis_url: Optional[str] = None
) -> Dict[str, Any]:
    """Trigger cleanup for old sessions"""
    try:
        # Send cleanup task to Celery
        task_result = cleanup_tasks.cleanup_old_sessions.apply_async(
            args=[age_hours],
            kwargs={
                "web3_url": web3_url,
                "redis_url": redis_url
            }
        )
        
        return {
            "message": "Old sessions cleanup task started",
            "task_id": task_result.id,
            "age_hours": age_hours,
            "status": "queued"
        }
    except Exception as e:
        logger.error(f"Failed to start old sessions cleanup: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start cleanup: {str(e)}")

@app.post("/api/cleanup/expired-forks")
async def trigger_expired_forks_cleanup(
    expiry_hours: int = 6,
    web3_url: Optional[str] = None
) -> Dict[str, Any]:
    """Trigger cleanup for expired blockchain forks"""
    try:
        # Send cleanup task to Celery
        task_result = cleanup_tasks.cleanup_expired_forks.apply_async(
            args=[expiry_hours],
            kwargs={
                "web3_url": web3_url
            }
        )
        
        return {
            "message": "Expired forks cleanup task started",
            "task_id": task_result.id,
            "expiry_hours": expiry_hours,
            "status": "queued"
        }
    except Exception as e:
        logger.error(f"Failed to start expired forks cleanup: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start cleanup: {str(e)}")

@app.post("/api/cleanup/temp-files")
async def trigger_temp_files_cleanup(
    temp_dir: str = "/tmp/time_machine",
    age_hours: int = 12
) -> Dict[str, Any]:
    """Trigger cleanup for temporary files"""
    try:
        # Send cleanup task to Celery
        task_result = cleanup_tasks.cleanup_temp_files.apply_async(
            args=[temp_dir, age_hours]
        )
        
        return {
            "message": "Temp files cleanup task started",
            "task_id": task_result.id,
            "temp_dir": temp_dir,
            "age_hours": age_hours,
            "status": "queued"
        }
    except Exception as e:
        logger.error(f"Failed to start temp files cleanup: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to start cleanup: {str(e)}")

# Error handlers

@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": exc.detail,
            "status_code": exc.status_code,
            "timestamp": str(asyncio.get_event_loop().time())
        }
    )

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "Internal server error",
            "message": str(exc),
            "timestamp": str(asyncio.get_event_loop().time())
        }
    )

# Startup function
def start_server():
    """Start the Time Machine API server"""
    logger.info(f"Starting Time Machine API Server on {SERVER_CONFIG['host']}:{SERVER_CONFIG['port']}")
    
    uvicorn.run(
        "time_machine_api_server:app",
        host=SERVER_CONFIG["host"],
        port=SERVER_CONFIG["port"],
        reload=SERVER_CONFIG["reload"],
        workers=SERVER_CONFIG["workers"] if not SERVER_CONFIG["reload"] else 1,
        log_level="info" if not SERVER_CONFIG["debug"] else "debug",
        access_log=True
    )

if __name__ == "__main__":
    start_server()
