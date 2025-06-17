"""Lightweight system/dashboard statistics endpoints."""
import datetime
import psutil
import random
from fastapi import APIRouter

router = APIRouter(prefix="/dashboard", tags=["Dashboard"])


@router.get("/stats")
async def stats():
    return {
        "timestamp": datetime.datetime.utcnow().isoformat(),
        "cpu": psutil.cpu_percent(interval=0.2),
        "mem": psutil.virtual_memory().percent,
        "open_scans": random.randint(0, 5),
        "mev_profit": round(random.uniform(0, 4), 4),
    }
