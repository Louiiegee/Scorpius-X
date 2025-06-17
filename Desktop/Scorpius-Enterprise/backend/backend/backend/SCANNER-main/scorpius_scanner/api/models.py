from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime

class ScanRequest(BaseModel):
    """Model for initiating a new scan."""
    target: str = Field(..., description="The contract address, file path, or bytecode to scan.")
    rpc_url: Optional[str] = Field(None, description="Blockchain RPC URL. Defaults to the one in settings.")
    block_number: Optional[int] = Field(None, description="Fork from a specific block number for simulation.")
    source_code: Optional[str] = Field(None, description="Optional source code for deeper analysis.")
    plugins: Optional[List[str]] = Field(None, description="A specific list of plugins to run. Runs all by default.")
    enable_simulation: bool = Field(True, description="Enable plugins that require blockchain simulation.")
    enable_ai: bool = Field(True, description="Enable AI-powered analysis.")

class ScanResponse(BaseModel):
    """Response after submitting a scan."""
    scan_id: str
    job_id: str
    status: str
    message: str

class FindingModel(BaseModel):
    """API model for a single finding."""
    id: str
    title: str
    severity: str
    description: str
    confidence: float
    recommendation: Optional[str] = None
    source_tool: str
    metadata: Dict[str, Any]

class ScanStatus(BaseModel):
    """Detailed status and results of a scan."""
    scan_id: str
    status: str
    target: str
    findings: List[FindingModel]
    metadata: Dict[str, Any]
    created_at: datetime
    completed_at: Optional[datetime] = None