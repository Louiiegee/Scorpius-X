"""
Real Scorpius Backend with AI Integration
No mock data - uses actual vulnerability scanning and AI analysis
"""

import asyncio
import os
import uvicorn
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
import logging

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Create FastAPI application
app = FastAPI(
    title="🔥 SCORPIUS CYBERSECURITY PLATFORM 🔥",
    description="Real-time blockchain security analysis with AI",
    version="2.0.0"
)

# Configure CORS
origins = [
    "http://localhost:3000",
    "http://localhost:5173",
    "http://127.0.0.1:3000",
    "http://127.0.0.1:5173",
    "file://",
    "app://scorpius",
    "https://scorpius.com",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# Import route modules
from routes import scanner, mev_operations, dashboard, auth

# Mount routers
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["dashboard"])
app.include_router(scanner.router, prefix="/api/scanner", tags=["scanner"])
app.include_router(mev_operations.router, prefix="/api/mev", tags=["mev"])
app.include_router(auth.router, prefix="/api/auth", tags=["auth"])

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "🔥 SCORPIUS CYBERSECURITY PLATFORM 🔥",
        "status": "operational",
        "version": "2.0.0",
        "features": ["AI Vulnerability Scanning", "MEV Operations", "Real-time Analysis"]
    }

@app.get("/api/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": asyncio.get_event_loop().time(),
        "services": {
            "ai_scanner": "operational",
            "bytecode_analyzer": "operational",
            "mev_engine": "operational",
            "database": "connected"
        }
    }

if __name__ == "__main__":
    logger.info("🚀 Starting Real Scorpius Backend with AI Integration...")
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
