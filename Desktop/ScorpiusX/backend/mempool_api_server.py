"""
Mempool Monitor API Server
Dedicated server for mempool transaction monitoring and analysis
"""

import asyncio
import json
import logging
import os
import sys
import time
import random
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from collections import deque

from fastapi import FastAPI, HTTPException, WebSocket, WebSocketDisconnect, Query
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import uvicorn

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Scorpius Mempool Monitor API",
    description="Real-time mempool transaction monitoring and analysis",
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

class MempoolTransaction(BaseModel):
    """Model for mempool transaction."""
    hash: str
    from_address: str
    to_address: str
    value: float
    gas_price: float
    gas_limit: int
    method: str
    timestamp: datetime
    status: str = "pending"

class MonitorRequest(BaseModel):
    """Request to monitor specific address."""
    address: str
    alert_threshold: Optional[float] = 1.0  # ETH
    notification_method: Optional[str] = "websocket"

class AlertConfig(BaseModel):
    """Alert configuration."""
    min_value: Optional[float] = None
    max_gas_price: Optional[float] = None
    methods: Optional[List[str]] = None
    addresses: Optional[List[str]] = None

# ================================
# STORAGE (In-memory)
# ================================

# Transaction storage (limited to last 1000)
mempool_transactions = deque(maxlen=1000)
transaction_history = []

# Monitoring configurations
monitored_addresses: Dict[str, MonitorRequest] = {}
alerts: List[Dict[str, Any]] = []

# Real-time stats
mempool_stats = {
    "pending_txs": 0,
    "avg_gas_price": 0,
    "avg_block_time": 12.3,
    "total_value": 0,
    "last_update": datetime.now()
}

# Simulation state
is_monitoring = True
simulation_task = None

# ================================
# API ENDPOINTS
# ================================

@app.get("/")
async def root():
    """Root endpoint with API info."""
    return {
        "service": "Scorpius Mempool Monitor API",
        "version": "1.0.0",
        "endpoints": {
            "GET /api/mempool/transactions": "Get pending transactions",
            "GET /api/mempool/alerts": "Get alerts",
            "POST /api/mempool/monitor/{address}": "Monitor specific address",
            "GET /api/mempool/live": "Get live mempool data",
            "WS /ws/mempool": "Real-time mempool stream"
        }
    }

@app.get("/api/mempool/transactions")
async def get_pending_transactions(
    limit: int = Query(50, ge=1, le=200),
    min_value: Optional[float] = None,
    max_gas: Optional[float] = None
):
    """Get pending mempool transactions with optional filters."""
    try:
        # Convert deque to list for filtering
        txs = list(mempool_transactions)
        
        # Apply filters
        if min_value is not None:
            txs = [tx for tx in txs if tx.get("value", 0) >= min_value]
        
        if max_gas is not None:
            txs = [tx for tx in txs if tx.get("gas_price", 0) <= max_gas]
        
        # Sort by timestamp (newest first)
        txs.sort(key=lambda x: x.get("timestamp", ""), reverse=True)
        
        return {
            "transactions": txs[:limit],
            "total": len(txs),
            "filters_applied": {
                "min_value": min_value,
                "max_gas": max_gas
            }
        }
        
    except Exception as e:
        logger.error(f"Failed to get transactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/mempool/alerts")
async def get_alerts(severity: Optional[str] = None):
    """Get mempool alerts."""
    try:
        filtered_alerts = alerts
        
        if severity:
            filtered_alerts = [a for a in alerts if a.get("severity") == severity]
        
        return {
            "alerts": filtered_alerts[-100:],  # Last 100 alerts
            "total": len(filtered_alerts),
            "severity_filter": severity
        }
        
    except Exception as e:
        logger.error(f"Failed to get alerts: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/mempool/monitor/{address}")
async def monitor_address(address: str, config: Optional[MonitorRequest] = None):
    """Start monitoring a specific address."""
    try:
        if not address.startswith("0x") or len(address) != 42:
            raise HTTPException(status_code=400, detail="Invalid Ethereum address")
        
        # Create monitor config
        monitor_config = config or MonitorRequest(address=address)
        monitor_config.address = address.lower()
        
        # Store configuration
        monitored_addresses[address.lower()] = monitor_config
        
        logger.info(f"Started monitoring address: {address}")
        
        return {
            "status": "monitoring",
            "address": address,
            "config": monitor_config.dict(),
            "message": f"Now monitoring {address}"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to monitor address: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/mempool/live")
async def get_live_data():
    """Get live mempool statistics and recent transactions."""
    try:
        # Update stats
        current_txs = list(mempool_transactions)
        
        if current_txs:
            total_value = sum(tx.get("value", 0) for tx in current_txs)
            avg_gas = sum(tx.get("gas_price", 0) for tx in current_txs) / len(current_txs)
        else:
            total_value = 0
            avg_gas = 0
        
        mempool_stats.update({
            "pending_txs": len(current_txs),
            "avg_gas_price": round(avg_gas, 2),
            "total_value": round(total_value, 2),
            "last_update": datetime.now().isoformat()
        })
        
        return {
            "stats": mempool_stats,
            "recent_transactions": current_txs[-10:],  # Last 10 transactions
            "monitored_addresses": list(monitored_addresses.keys()),
            "active_alerts": len([a for a in alerts if a.get("active", True)])
        }
        
    except Exception as e:
        logger.error(f"Failed to get live data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ================================
# MEMPOOL SIMULATION
# ================================

async def simulate_mempool_activity():
    """Simulate realistic mempool activity."""
    methods = ["transfer", "swap", "approve", "mint", "burn", "stake", "unstake", "claim"]
    
    while is_monitoring:
        try:
            # Generate random transaction
            tx = {
                "hash": f"0x{os.urandom(32).hex()}",
                "from": f"0x{os.urandom(20).hex()}",
                "to": f"0x{os.urandom(20).hex()}",
                "value": round(random.uniform(0.001, 50.0), 4),
                "gas_price": round(random.uniform(15, 150), 2),
                "gas_limit": random.randint(21000, 500000),
                "method": random.choice(methods),
                "timestamp": datetime.now().isoformat(),
                "status": "pending",
                "nonce": random.randint(0, 10000)
            }
            
            # Add to mempool
            mempool_transactions.append(tx)
            
            # Check for alerts
            await check_alerts(tx)
            
            # Random delay between transactions
            await asyncio.sleep(random.uniform(0.1, 2.0))
            
        except Exception as e:
            logger.error(f"Simulation error: {e}")
            await asyncio.sleep(1)

async def check_alerts(tx: Dict[str, Any]):
    """Check if transaction triggers any alerts."""
    # Check monitored addresses
    for address, config in monitored_addresses.items():
        if tx["from"].lower() == address or tx["to"].lower() == address:
            if tx["value"] >= config.alert_threshold:
                alert = {
                    "id": f"alert_{int(time.time())}_{len(alerts)}",
                    "type": "high_value_transaction",
                    "severity": "high" if tx["value"] > 10 else "medium",
                    "message": f"High value transaction: {tx['value']} ETH",
                    "transaction": tx,
                    "monitored_address": address,
                    "timestamp": datetime.now().isoformat(),
                    "active": True
                }
                alerts.append(alert)
                logger.info(f"Alert triggered: {alert['message']}")
    
    # Check for suspicious gas prices
    if tx["gas_price"] > 500:
        alert = {
            "id": f"alert_{int(time.time())}_{len(alerts)}",
            "type": "high_gas_price",
            "severity": "warning",
            "message": f"Unusually high gas price: {tx['gas_price']} Gwei",
            "transaction": tx,
            "timestamp": datetime.now().isoformat(),
            "active": True
        }
        alerts.append(alert)

# ================================
# WEBSOCKET ENDPOINT
# ================================

@app.websocket("/ws/mempool")
async def websocket_endpoint(websocket: WebSocket):
    """WebSocket for real-time mempool updates."""
    await websocket.accept()
    try:
        logger.info("WebSocket client connected")
        
        while True:
            # Send latest transactions
            recent_txs = list(mempool_transactions)[-5:]  # Last 5 transactions
            
            await websocket.send_json({
                "type": "mempool_update",
                "transactions": recent_txs,
                "stats": mempool_stats,
                "alerts": [a for a in alerts if a.get("active", True)][-5:],
                "timestamp": datetime.now().isoformat()
            })
            
            await asyncio.sleep(1)  # Update every second
            
    except WebSocketDisconnect:
        logger.info("WebSocket client disconnected")
    except Exception as e:
        logger.error(f"WebSocket error: {e}")
        await websocket.close()

# ================================
# STARTUP/SHUTDOWN EVENTS
# ================================

@app.on_event("startup")
async def startup_event():
    """Start mempool simulation on startup."""
    global simulation_task
    simulation_task = asyncio.create_task(simulate_mempool_activity())
    logger.info("Mempool simulation started")

@app.on_event("shutdown")
async def shutdown_event():
    """Stop mempool simulation on shutdown."""
    global is_monitoring
    is_monitoring = False
    
    if simulation_task:
        simulation_task.cancel()
        try:
            await simulation_task
        except asyncio.CancelledError:
            pass
    
    logger.info("Mempool simulation stopped")

# ================================
# MAIN ENTRY POINT
# ================================

if __name__ == "__main__":
    port = int(os.environ.get("MEMPOOL_PORT", 8002))
    logger.info(f"Starting Mempool Monitor API Server on port {port}")
    
    uvicorn.run(
        "mempool_api_server:app",
        host="0.0.0.0",
        port=port,
        reload=True,
        log_level="info"
    )
