"""
Data models for mempool events.
"""
from dataclasses import dataclass, asdict, field
from enum import Enum
from typing import Optional, Dict, Any
import time


class MempoolEventType(Enum):
    """Types of mempool events."""
    TRANSACTION = "transaction"
    CONTRACT_DEPLOYMENT = "contract_deployment"
    TOKEN_TRANSFER = "token_transfer"
    DEX_SWAP = "dex_swap"
    ARBITRAGE = "arbitrage"
    LIQUIDATION = "liquidation"
    MEV_BUNDLE = "mev_bundle"
    UNKNOWN = "unknown"


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
    Represents a mempool event with comprehensive metadata.
    """
    tx_hash: str
    from_address: str
    contract_address: Optional[str] = None
    gas_price: int = 0
    value: int = 0
    timestamp: float = field(default_factory=time.time)
    network_id: int = 1
    input_data: str = "0x"
    severity: MempoolEventSeverity = MempoolEventSeverity.INFO
    event_type: MempoolEventType = MempoolEventType.TRANSACTION
    raw_tx_data: Dict[str, Any] = field(default_factory=dict)
    first_seen: float = field(default_factory=time.time)
    last_seen: float = field(default_factory=time.time)
    decoded_function: Optional[str] = None
    decoded_params: Dict[str, Any] = field(default_factory=dict)
    tags: list[str] = field(default_factory=list)
    gas_limit: Optional[int] = None
    nonce: Optional[int] = None
    to_address: Optional[str] = None
    block_number: Optional[int] = None
    transaction_index: Optional[int] = None
    max_fee_per_gas: Optional[int] = None
    max_priority_fee_per_gas: Optional[int] = None
    
    def __post_init__(self):
        """Validate the data after initialization."""
        if not self.tx_hash or not self.tx_hash.startswith('0x'):
            raise ValueError("Invalid transaction hash")
        if not self.from_address or not self.from_address.startswith('0x'):
            raise ValueError("Invalid from_address")
        if self.gas_price < 0:
            raise ValueError("Gas price cannot be negative")
        if self.value < 0:
            raise ValueError("Value cannot be negative")
        if self.network_id <= 0:
            raise ValueError("Network ID must be positive")
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary format."""
        data = asdict(self)
        # Convert enums to their values
        data['severity'] = self.severity.value
        data['event_type'] = self.event_type.value
        return data
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> 'MempoolEvent':
        """Create instance from dictionary."""
        # Convert enum values back to enums
        if 'severity' in data and isinstance(data['severity'], str):
            data['severity'] = MempoolEventSeverity(data['severity'])
        if 'event_type' in data and isinstance(data['event_type'], str):
            data['event_type'] = MempoolEventType(data['event_type'])
        
        return cls(**data)
    
    @property
    def age_seconds(self) -> float:
        """Get the age of this event in seconds."""
        return time.time() - self.timestamp
    
    @property
    def is_contract_call(self) -> bool:
        """Check if this is a contract call (has input data)."""
        return len(self.input_data) > 2  # More than just '0x'
    
    @property
    def gas_price_gwei(self) -> float:
        """Get gas price in Gwei."""
        return self.gas_price / 1e9
    
    def add_tag(self, tag: str) -> None:
        """
        Add a tag to the event if not already present.
        
        Args:
            tag: Tag to add
        """
        if tag not in self.tags:
            self.tags.append(tag)
