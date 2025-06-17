"""Lightweight system/dashboard statistics endpoints."""
import datetime
import psutil
import os
import time
from fastapi import APIRouter
from typing import Dict, Any

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])

# Track historical data
_performance_history = {
    "cpu_history": [],
    "mem_history": []
}

def get_disk_stats() -> Dict[str, Any]:
    """Get real disk statistics."""
    disk_usage = psutil.disk_usage('/')
    return {
        "total_gb": round(disk_usage.total / (1024**3), 2),
        "used_gb": round(disk_usage.used / (1024**3), 2),
        "free_gb": round(disk_usage.free / (1024**3), 2),
        "percent": disk_usage.percent
    }

def get_network_stats() -> Dict[str, Any]:
    """Get real network statistics."""
    net_io = psutil.net_io_counters()
    return {
        "bytes_sent": net_io.bytes_sent,
        "bytes_recv": net_io.bytes_recv,
        "packets_sent": net_io.packets_sent, 
        "packets_recv": net_io.packets_recv
    }

@router.get("/stats")
async def stats():
    """Get real system statistics without mock data."""
    # Get current CPU and memory stats
    cpu_percent = psutil.cpu_percent(interval=0.2)
    mem = psutil.virtual_memory()
    
    # Update history (keep last 60 data points)
    timestamp = datetime.datetime.utcnow()
    _performance_history["cpu_history"].append({
        "timestamp": timestamp.isoformat(),
        "value": cpu_percent
    })
    _performance_history["mem_history"].append({
        "timestamp": timestamp.isoformat(), 
        "value": mem.percent
    })
    
    # Keep history limited to 60 data points
    if len(_performance_history["cpu_history"]) > 60:
        _performance_history["cpu_history"].pop(0)
    if len(_performance_history["mem_history"]) > 60:
        _performance_history["mem_history"].pop(0)
    
    return {
        "timestamp": timestamp.isoformat(),
        "cpu": cpu_percent,
        "mem": mem.percent,
        "mem_available_gb": round(mem.available / (1024**3), 2),
        "mem_total_gb": round(mem.total / (1024**3), 2),
        "disk": get_disk_stats(),
        "network": get_network_stats(),
        "uptime_seconds": int(time.time() - psutil.boot_time()),
        "history": {
            "cpu": _performance_history["cpu_history"][-10:],  # Last 10 points
            "memory": _performance_history["mem_history"][-10:]
        }
    }
