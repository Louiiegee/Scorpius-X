"""
Mempool event models for transaction monitoring and analysis.
"""
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, Any, Optional
import time


class MempoolEventType(Enum):
    """Types of mempool events."""
    TRANSACTION = "transaction"
    CONTRACT_DEPLOYMENT = "contract_deployment"
    MEV_OPPORTUNITY = "mev_opportunity"
    HIGH_VALUE_TRANSFER = "high_value_transfer"
    SUSPICIOUS_ACTIVITY = "suspicious_activity"


class MempoolEventSeverity(Enum):
    """Severity levels for mempool events."""
    INFO = "info"
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


@dataclass
class MempoolEvent:
    """
    Standardized mempool event for transaction monitoring.
    """
    tx_hash: str
    from_address: str
    contract_address: Optional[str]
    gas_price: int
    value: int
    timestamp: float
    network_id: int
    input_data: str
    severity: MempoolEventSeverity
    event_type: MempoolEventType
    raw_tx_data: Dict[str, Any] = field(default_factory=dict)
    first_seen: float = field(default_factory=time.time)
    last_seen: float = field(default_factory=time.time)
    
    def __post_init__(self) -> None:
        """Post-initialization validation."""
        if self.first_seen == 0:
            self.first_seen = time.time()
        if self.last_seen == 0:
            self.last_seen = time.time()
    
    def age(self) -> float:
        """Calculate the age of the event in seconds."""
        return time.time() - self.first_seen
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "tx_hash": self.tx_hash,
            "from_address": self.from_address,
            "contract_address": self.contract_address,
            "gas_price": self.gas_price,
            "value": self.value,
            "timestamp": self.timestamp,
            "network_id": self.network_id,
            "input_data": self.input_data,
            "severity": self.severity.value,
            "event_type": self.event_type.value,
            "raw_tx_data": self.raw_tx_data,
            "first_seen": self.first_seen,
            "last_seen": self.last_seen,
            "age": self.age()
        }
