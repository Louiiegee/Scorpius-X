
from pydantic import BaseModel
from typing import List, Optional
from .enums import ScanStatus, SeverityLevel

class Finding(BaseModel):
    id: str
    title: str
    severity: SeverityLevel
    description: str
    source: str
    location: Optional[str] = None

class ScanJob(BaseModel):
    job_id: str
    contract_address: str
    status: ScanStatus
    findings: List[Finding] = []
