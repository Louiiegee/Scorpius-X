from dataclasses import dataclass, field
from typing import Dict, Any, Optional

@dataclass
class Finding:
    id: str
    title: str
    severity: str  # info | low | medium | high | critical
    description: str
    metadata: Dict[str, Any] = field(default_factory=dict)

    def to_dict(self) -> Dict[str, Any]:
        return {
            "id": self.id,
            "title": self.title,
            "severity": self.severity,
            "description": self.description,
            "metadata": self.metadata
        }

@dataclass
class ScanContext:
    chain_rpc: str
    workdir: str
    block_number: Optional[int] = None
    extra: Dict[str, Any] = field(default_factory=dict)
