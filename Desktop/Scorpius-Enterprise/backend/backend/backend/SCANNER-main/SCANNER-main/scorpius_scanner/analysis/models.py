from pydantic import BaseModel, Field
from typing import List, Optional

class AIAnalysis(BaseModel):
    """Model for the overall AI analysis summary."""
    model_used: Optional[str] = None
    confidence_score: float = 0.0
    risk_assessment: str = "Not Assessed"
    summary: str = "No summary provided."
    attack_vectors: List[str] = Field(default_factory=list)

    def to_dict(self):
        return self.model_dump()