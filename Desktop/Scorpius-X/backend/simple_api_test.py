"""
Simple API server test to verify the bytecode endpoint works
"""

import asyncio
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any, List
import uvicorn
import sys
import os

# Add current directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from modules.bytecode_similarity_engine import BytecodeSimilarityEngine

app = FastAPI(title="Simple Bytecode Test API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize engine
similarity_engine = BytecodeSimilarityEngine()

# Models
class BytecodeSimilarityRequest(BaseModel):
    bytecode: str
    include_opcode_analysis: bool = True
    include_vulnerability_patterns: bool = True
    include_fingerprinting: bool = True

class BytecodeSimilarityResponse(BaseModel):
    bytecode_hash: str
    bytecode_length: int
    similarity_matches: List[Dict[str, Any]]
    vulnerability_patterns: List[Dict[str, Any]]
    opcode_analysis: Dict[str, Any]
    fingerprint: Dict[str, Any]
    classification: Dict[str, Any]
    risk_score: float
    analysis_timestamp: float

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Simple API test server running"}

@app.post("/api/bytecode/analyze", response_model=BytecodeSimilarityResponse)
async def analyze_bytecode_similarity(request: BytecodeSimilarityRequest):
    """Analyze bytecode for similarity patterns and vulnerabilities."""
    print(f"Received request for bytecode analysis: {len(request.bytecode)} bytes")
    
    try:
        results = await similarity_engine.analyze_bytecode_similarity(
            bytecode=request.bytecode,
            include_opcode_analysis=request.include_opcode_analysis,
            include_vulnerability_patterns=request.include_vulnerability_patterns,
            include_fingerprinting=request.include_fingerprinting
        )
        
        print(f"Analysis complete. Results keys: {list(results.keys())}")
        return BytecodeSimilarityResponse(**results)
    except Exception as e:
        print(f"Error during analysis: {e}")
        raise

if __name__ == "__main__":
    print("Starting simple API test server on port 9000...")
    uvicorn.run(
        "simple_api_test:app",
        host="0.0.0.0",
        port=9000,
        reload=False,
        log_level="info"
    )
