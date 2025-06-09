"""
Dedicated API server for bytecode similarity analysis
"""

import asyncio
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List
import uvicorn
import sys
import os
import logging

# Add current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from modules.bytecode_similarity_engine import BytecodeSimilarityEngine

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="Bytecode Similarity Analysis API", version="1.0.0")

# Enable CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize bytecode engine
logger.info("Initializing Bytecode Similarity Engine...")
similarity_engine = BytecodeSimilarityEngine()
logger.info("Bytecode Similarity Engine initialized successfully")

# Request/Response Models
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

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy", 
        "service": "bytecode_analysis",
        "message": "Bytecode Analysis API running successfully"
    }

# Main bytecode analysis endpoint
@app.post("/api/bytecode/analyze", response_model=BytecodeSimilarityResponse)
async def analyze_bytecode_similarity(request: BytecodeSimilarityRequest):
    """Analyze bytecode for similarity patterns and vulnerabilities."""
    logger.info(f"Received bytecode analysis request: {len(request.bytecode)} bytes")
    
    try:
        # Perform comprehensive bytecode analysis
        results = await similarity_engine.analyze_bytecode_similarity(
            bytecode=request.bytecode,
            include_opcode_analysis=request.include_opcode_analysis,
            include_vulnerability_patterns=request.include_vulnerability_patterns,
            include_fingerprinting=request.include_fingerprinting
        )
        
        logger.info(f"Analysis complete. Risk score: {results.get('risk_score', 'N/A')}")
        logger.info(f"Similarity matches found: {len(results.get('similarity_matches', []))}")
        logger.info(f"Vulnerability patterns detected: {len(results.get('vulnerability_patterns', []))}")
        
        return BytecodeSimilarityResponse(**results)
    except Exception as e:
        logger.error(f"Bytecode analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

# Additional utility endpoints
@app.get("/api/bytecode/patterns")
async def get_available_patterns():
    """Get available reference patterns."""
    try:
        return {
            "reference_patterns": list(similarity_engine.reference_patterns.keys()),
            "vulnerability_patterns": list(similarity_engine.vulnerability_patterns.keys()),
            "total_patterns": len(similarity_engine.reference_patterns)
        }
    except Exception as e:
        logger.error(f"Failed to get patterns: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    logger.info("🚀 Starting Bytecode Analysis API Server...")
    logger.info("📊 Bytecode Similarity Engine ready for analysis")
    
    uvicorn.run(
        "bytecode_api_server:app",
        host="0.0.0.0",
        port=8000,
        reload=False,
        log_level="info"
    )
