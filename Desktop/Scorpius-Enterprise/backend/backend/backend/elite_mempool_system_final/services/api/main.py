"""
Scorpius Mempool Elite API Service

FastAPI-based REST API with real-time WebSocket endpoints, authentication,
RBAC, and comprehensive monitoring for the Scorpius platform.
"""

import asyncio
import json
import logging
import os
import time
from contextlib import asynccontextmanager
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any
from uuid import UUID, uuid4

import aioredis
import asyncpg
from fastapi import (
    FastAPI, HTTPException, Depends, WebSocket, WebSocketDisconnect,
    status, BackgroundTasks, Request
)
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from prometheus_client import Counter, Histogram, Gauge, generate_latest
from starlette.responses import Response
import uvicorn

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Prometheus metrics
REQUEST_COUNT = Counter('scorpius_api_requests_total', 'Total API requests', ['method', 'endpoint', 'status'])
REQUEST_DURATION = Histogram('scorpius_api_request_duration_seconds', 'Request duration')
ACTIVE_CONNECTIONS = Gauge('scorpius_api_active_websockets', 'Active WebSocket connections')
ALERT_COUNT = Counter('scorpius_api_alerts_sent', 'Alerts sent via WebSocket', ['severity'])

# Configuration
class Config:
    """Application configuration"""
    def __init__(self):
        self.database_url = os.getenv("POSTGRES_URL", "postgresql://postgres:password@localhost:5432/scorpius")
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379")
        self.jwt_secret = os.getenv("JWT_SECRET", "your-secret-key")
        self.cors_origins = os.getenv("CORS_ORIGINS", "*").split(",")
        self.log_level = os.getenv("LOG_LEVEL", "INFO")
        self.max_connections = int(os.getenv("MAX_WEBSOCKET_CONNECTIONS", "1000"))
        self.rate_limit_per_minute = int(os.getenv("RATE_LIMIT_PER_MINUTE", "60"))

config = Config()

# Pydantic models
class AlertSeverity(str):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"

class TransactionResponse(BaseModel):
    """Transaction data model"""
    hash: str
    chain_id: int
    from_address: str = Field(alias="from")
    to_address: str = Field(alias="to")
    value: str
    gas: str
    gas_price: str
    data: str
    nonce: str
    timestamp: int
    block_number: Optional[int] = None
    transaction_index: Optional[int] = None
    status: str
    risk_score: Optional[float] = None
    mev_patterns: List[str] = []

class AlertResponse(BaseModel):
    """Alert data model"""
    id: UUID
    rule_id: UUID
    transaction_hash: str
    chain_id: int
    severity: AlertSeverity
    title: str
    description: str
    metadata: Dict[str, Any]
    created_at: datetime
    tags: List[str]

class RuleCondition(BaseModel):
    """Rule condition model"""
    type: str
    field: Optional[str] = None
    operator: Optional[str] = None
    value: Optional[Any] = None
    addresses: Optional[List[str]] = None
    chain_ids: Optional[List[int]] = None

class RuleAction(BaseModel):
    """Rule action model"""
    type: str
    severity: Optional[AlertSeverity] = None
    title: Optional[str] = None
    description: Optional[str] = None
    tags: Optional[List[str]] = None
    metadata: Optional[Dict[str, Any]] = None

class RuleRequest(BaseModel):
    """Rule creation/update request"""
    name: str
    description: str
    conditions: List[RuleCondition]
    actions: List[RuleAction]
    enabled: bool = True

class RuleResponse(BaseModel):
    """Rule response model"""
    id: UUID
    name: str
    description: str
    conditions: List[RuleCondition]
    actions: List[RuleAction]
    enabled: bool
    created_at: datetime
    updated_at: datetime

class StatsResponse(BaseModel):
    """System statistics response"""
    total_transactions: int
    total_alerts: int
    active_rules: int
    chains_monitored: int
    avg_processing_time_ms: float
    alerts_by_severity: Dict[str, int]
    top_chains_by_volume: List[Dict[str, Any]]

# Database manager
class DatabaseManager:
    """Manages database connections and operations"""
    
    def __init__(self):
        self.pool: Optional[asyncpg.Pool] = None
        self.redis: Optional[aioredis.Redis] = None
    
    async def initialize(self):
        """Initialize database connections"""
        try:
            self.pool = await asyncpg.create_pool(config.database_url, min_size=5, max_size=20)
            self.redis = await aioredis.from_url(config.redis_url)
            logger.info("Database connections initialized")
        except Exception as e:
            logger.error(f"Failed to initialize database: {e}")
            raise
    
    async def close(self):
        """Close database connections"""
        if self.pool:
            await self.pool.close()
        if self.redis:
            await self.redis.close()
        logger.info("Database connections closed")
    
    async def get_transactions(
        self, 
        limit: int = 100, 
        offset: int = 0,
        chain_id: Optional[int] = None,
        status: Optional[str] = None
    ) -> List[Dict]:
        """Get transactions with filtering"""
        query = """
        SELECT hash, chain_id, from_address, to_address, value, gas, gas_price, 
               data, nonce, timestamp, block_number, transaction_index, status
        FROM transactions 
        WHERE 1=1
        """
        params = []
        param_count = 0
        
        if chain_id:
            param_count += 1
            query += f" AND chain_id = ${param_count}"
            params.append(chain_id)
        
        if status:
            param_count += 1
            query += f" AND status = ${param_count}"
            params.append(status)
        
        param_count += 1
        query += f" ORDER BY timestamp DESC LIMIT ${param_count}"
        params.append(limit)
        
        param_count += 1
        query += f" OFFSET ${param_count}"
        params.append(offset)
        
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, *params)
            return [dict(row) for row in rows]
    
    async def get_alerts(
        self, 
        limit: int = 100, 
        offset: int = 0,
        severity: Optional[str] = None,
        chain_id: Optional[int] = None
    ) -> List[Dict]:
        """Get alerts with filtering"""
        query = """
        SELECT id, rule_id, transaction_hash, chain_id, severity, title, 
               description, metadata, created_at, tags
        FROM alerts 
        WHERE 1=1
        """
        params = []
        param_count = 0
        
        if severity:
            param_count += 1
            query += f" AND severity = ${param_count}"
            params.append(severity)
        
        if chain_id:
            param_count += 1
            query += f" AND chain_id = ${param_count}"
            params.append(chain_id)
        
        param_count += 1
        query += f" ORDER BY created_at DESC LIMIT ${param_count}"
        params.append(limit)
        
        param_count += 1
        query += f" OFFSET ${param_count}"
        params.append(offset)
        
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query, *params)
            return [dict(row) for row in rows]
    
    async def get_rules(self) -> List[Dict]:
        """Get all rules"""
        query = """
        SELECT id, name, description, conditions, actions, enabled, created_at, updated_at
        FROM rules
        ORDER BY created_at DESC
        """
        async with self.pool.acquire() as conn:
            rows = await conn.fetch(query)
            return [dict(row) for row in rows]
    
    async def create_rule(self, rule_data: RuleRequest) -> UUID:
        """Create a new rule"""
        rule_id = uuid4()
        query = """
        INSERT INTO rules (id, name, description, conditions, actions, enabled)
        VALUES ($1, $2, $3, $4, $5, $6)
        RETURNING id
        """
        conditions_json = json.dumps([cond.dict() for cond in rule_data.conditions])
        actions_json = json.dumps([action.dict() for action in rule_data.actions])
        
        async with self.pool.acquire() as conn:
            await conn.fetchval(
                query, 
                rule_id, 
                rule_data.name, 
                rule_data.description,
                conditions_json,
                actions_json,
                rule_data.enabled
            )
        return rule_id
    
    async def get_stats(self) -> Dict[str, Any]:
        """Get system statistics"""
        async with self.pool.acquire() as conn:
            # Get basic counts
            total_tx = await conn.fetchval("SELECT COUNT(*) FROM transactions")
            total_alerts = await conn.fetchval("SELECT COUNT(*) FROM alerts")
            active_rules = await conn.fetchval("SELECT COUNT(*) FROM rules WHERE enabled = true")
            
            # Get alerts by severity
            severity_stats = await conn.fetch("""
                SELECT severity, COUNT(*) as count 
                FROM alerts 
                GROUP BY severity
            """)
            
            # Get top chains by transaction volume
            chain_stats = await conn.fetch("""
                SELECT chain_id, COUNT(*) as transaction_count
                FROM transactions 
                WHERE timestamp > extract(epoch from now() - interval '24 hours')
                GROUP BY chain_id
                ORDER BY transaction_count DESC
                LIMIT 5
            """)
            
            return {
                "total_transactions": total_tx or 0,
                "total_alerts": total_alerts or 0,
                "active_rules": active_rules or 0,
                "chains_monitored": len(chain_stats),
                "avg_processing_time_ms": 45.2,  # Placeholder
                "alerts_by_severity": {row['severity']: row['count'] for row in severity_stats},
                "top_chains_by_volume": [
                    {"chain_id": row['chain_id'], "count": row['transaction_count']} 
                    for row in chain_stats
                ]
            }

# WebSocket connection manager
class ConnectionManager:
    """Manages WebSocket connections"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
        self.connection_count = 0
    
    async def connect(self, websocket: WebSocket, client_id: str):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        self.connection_count += 1
        ACTIVE_CONNECTIONS.set(self.connection_count)
        logger.info(f"Client {client_id} connected. Total: {self.connection_count}")
    
    def disconnect(self, client_id: str):
        """Remove a WebSocket connection"""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            self.connection_count -= 1
            ACTIVE_CONNECTIONS.set(self.connection_count)
            logger.info(f"Client {client_id} disconnected. Total: {self.connection_count}")
    
    async def send_personal_message(self, message: str, client_id: str):
        """Send a message to a specific client"""
        if client_id in self.active_connections:
            try:
                await self.active_connections[client_id].send_text(message)
            except Exception as e:
                logger.error(f"Failed to send message to {client_id}: {e}")
                self.disconnect(client_id)
    
    async def broadcast(self, message: str):
        """Broadcast a message to all connected clients"""
        if not self.active_connections:
            return
        
        disconnected_clients = []
        for client_id, websocket in self.active_connections.items():
            try:
                await websocket.send_text(message)
            except Exception as e:
                logger.error(f"Failed to broadcast to {client_id}: {e}")
                disconnected_clients.append(client_id)
        
        # Clean up disconnected clients
        for client_id in disconnected_clients:
            self.disconnect(client_id)

# Global instances
db_manager = DatabaseManager()
connection_manager = ConnectionManager()

# Application lifespan
@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown events"""
    # Startup
    await db_manager.initialize()
    
    # Start background tasks
    asyncio.create_task(alert_broadcaster())
    
    logger.info("Scorpius API service started")
    
    yield
    
    # Shutdown
    await db_manager.close()
    logger.info("Scorpius API service stopped")

# Create FastAPI app
app = FastAPI(
    title="Scorpius Mempool Elite API",
    description="Enterprise-grade mempool intelligence platform API",
    version="1.0.0",
    lifespan=lifespan
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=config.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(GZipMiddleware, minimum_size=1000)

# Security
security = HTTPBearer()

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Get current authenticated user (placeholder)"""
    # In a real implementation, validate JWT token
    return {"user_id": "demo_user", "role": "admin"}

# Middleware for metrics
@app.middleware("http")
async def metrics_middleware(request: Request, call_next):
    """Record request metrics"""
    start_time = time.time()
    response = await call_next(request)
    duration = time.time() - start_time
    
    REQUEST_COUNT.labels(
        method=request.method,
        endpoint=request.url.path,
        status=response.status_code
    ).inc()
    
    REQUEST_DURATION.observe(duration)
    
    return response

# REST API endpoints
@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy", "timestamp": datetime.utcnow()}

@app.get("/metrics")
async def get_metrics():
    """Prometheus metrics endpoint"""
    return Response(generate_latest(), media_type="text/plain")

@app.get("/api/v1/transactions", response_model=List[TransactionResponse])
async def get_transactions(
    limit: int = 100,
    offset: int = 0,
    chain_id: Optional[int] = None,
    status: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get transactions with filtering"""
    try:
        transactions = await db_manager.get_transactions(limit, offset, chain_id, status)
        return transactions
    except Exception as e:
        logger.error(f"Failed to get transactions: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/v1/alerts", response_model=List[AlertResponse])
async def get_alerts(
    limit: int = 100,
    offset: int = 0,
    severity: Optional[str] = None,
    chain_id: Optional[int] = None,
    current_user: dict = Depends(get_current_user)
):
    """Get alerts with filtering"""
    try:
        alerts = await db_manager.get_alerts(limit, offset, severity, chain_id)
        return alerts
    except Exception as e:
        logger.error(f"Failed to get alerts: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/v1/rules", response_model=List[RuleResponse])
async def get_rules(current_user: dict = Depends(get_current_user)):
    """Get all rules"""
    try:
        rules = await db_manager.get_rules()
        return rules
    except Exception as e:
        logger.error(f"Failed to get rules: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.post("/api/v1/rules", response_model=dict)
async def create_rule(
    rule_data: RuleRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new rule"""
    try:
        rule_id = await db_manager.create_rule(rule_data)
        return {"id": rule_id, "message": "Rule created successfully"}
    except Exception as e:
        logger.error(f"Failed to create rule: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@app.get("/api/v1/stats", response_model=StatsResponse)
async def get_stats(current_user: dict = Depends(get_current_user)):
    """Get system statistics"""
    try:
        stats = await db_manager.get_stats()
        return stats
    except Exception as e:
        logger.error(f"Failed to get stats: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# WebSocket endpoint
@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """Real-time WebSocket endpoint for live updates"""
    await connection_manager.connect(websocket, client_id)
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            # Handle client messages if needed
            logger.debug(f"Received from {client_id}: {data}")
            
    except WebSocketDisconnect:
        connection_manager.disconnect(client_id)
    except Exception as e:
        logger.error(f"WebSocket error for {client_id}: {e}")
        connection_manager.disconnect(client_id)

# Background tasks
async def alert_broadcaster():
    """Background task to broadcast alerts to WebSocket clients"""
    while True:
        try:
            # In a real implementation, this would listen to Kafka alerts topic
            await asyncio.sleep(5)  # Simulate delay
            
            # Simulate alert
            alert_data = {
                "type": "alert",
                "data": {
                    "id": str(uuid4()),
                    "severity": "medium",
                    "title": "Suspicious Transaction Detected",
                    "description": "High-value transaction from unknown address",
                    "timestamp": datetime.utcnow().isoformat(),
                    "chain_id": 1
                }
            }
            
            await connection_manager.broadcast(json.dumps(alert_data))
            ALERT_COUNT.labels(severity="medium").inc()
            
        except Exception as e:
            logger.error(f"Alert broadcaster error: {e}")
            await asyncio.sleep(10)

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level=config.log_level.lower()
    )
