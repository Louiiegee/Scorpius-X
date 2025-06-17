import time
from dataclasses import dataclass, field
from enum import Enum
from typing import Dict, List, Optional, Any

class OpportunityStatus(Enum):
    """Status of an MEV opportunity."""
    PENDING = "pending"
    ANALYZING = "analyzing"
    READY_FOR_EXECUTION = "ready_for_execution"
    SUBMITTED = "submitted"
    CONFIRMED_SUCCESS = "confirmed_success"
    CONFIRMED_FAILED_BOT_TX = "confirmed_failed_bot_tx"
    FAILED_EXECUTION = "failed_execution"
    EXPIRED = "expired"

class MEVStrategyType(Enum):
    """Types of MEV strategies."""
    ARBITRAGE = "arbitrage"
    SANDWICH = "sandwich"
    LIQUIDATION = "liquidation"
    FRONTRUN = "frontrun"
    BACKRUN = "backrun"
    JIT_LIQUIDITY = "jit_liquidity"
    NFT_SNIPE = "nft_snipe"
    UNKNOWN = "unknown"

@dataclass
class MEVOpportunity:
    """Represents an MEV opportunity with execution tracking."""
    
    opportunity_id: str
    strategy_type: MEVStrategyType
    estimated_profit_usd: float
    estimated_gas_cost_usd: float
    confidence_score: float
    protocol: Optional[str] = None
    target_tx_hash: Optional[str] = None
    status: OpportunityStatus = OpportunityStatus.PENDING
    timestamp: float = field(default_factory=time.time)
    expiry_timestamp: Optional[float] = None
    execution_params: Dict[str, Any] = field(default_factory=dict)
    simulation_results: Dict[str, Any] = field(default_factory=dict)
    executed_tx_hashes: List[str] = field(default_factory=list)
    actual_profit_usd: Optional[float] = None
    actual_gas_cost_usd: Optional[float] = None
    status_history: List[Dict[str, Any]] = field(default_factory=list)
    tags: List[str] = field(default_factory=list)
    
    def update_status(self, new_status: OpportunityStatus, reason: str = "") -> None:
        """
        Update the opportunity status with history tracking.
        
        Args:
            new_status: New status to set
            reason: Reason for the status change
        """
        old_status = self.status
        self.status = new_status
        self.status_history.append({
            "timestamp": time.time(),
            "old_status": old_status.value,
            "new_status": new_status.value,
            "reason": reason
        })
    
    def set_expiry(self, ttl_seconds: float) -> None:
        """
        Set expiry timestamp based on TTL.
        
        Args:
            ttl_seconds: Time to live in seconds
        """
        self.expiry_timestamp = time.time() + ttl_seconds
    
    def is_expired(self) -> bool:
        """Check if the opportunity has expired."""
        return self.expiry_timestamp is not None and time.time() > self.expiry_timestamp
    
    def net_profit_usd(self) -> float:
        """Calculate net profit (estimated or actual)."""
        if self.actual_profit_usd is not None and self.actual_gas_cost_usd is not None:
            return self.actual_profit_usd - self.actual_gas_cost_usd
        return self.estimated_profit_usd - self.estimated_gas_cost_usd
    
    def add_tag(self, tag: str) -> None:
        """Add a tag if not already present."""
        if tag not in self.tags:
            self.tags.append(tag)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert opportunity to dictionary representation."""
        return {
            "opportunity_id": self.opportunity_id,
            "strategy_type": self.strategy_type.value,
            "estimated_profit_usd": self.estimated_profit_usd,
            "estimated_gas_cost_usd": self.estimated_gas_cost_usd,
            "confidence_score": self.confidence_score,
            "protocol": self.protocol,
            "target_tx_hash": self.target_tx_hash,
            "status": self.status.value,
            "timestamp": self.timestamp,
            "expiry_timestamp": self.expiry_timestamp,
            "execution_params": self.execution_params,
            "simulation_results": self.simulation_results,
            "executed_tx_hashes": self.executed_tx_hashes,
            "actual_profit_usd": self.actual_profit_usd,
            "actual_gas_cost_usd": self.actual_gas_cost_usd,
            "net_profit_usd": self.net_profit_usd(),
            "status_history": self.status_history,
            "tags": self.tags,
            "is_expired": self.is_expired()
        }
