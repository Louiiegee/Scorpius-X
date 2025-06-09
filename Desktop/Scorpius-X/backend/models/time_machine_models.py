"""
Time Machine specific models for frontend integration
"""
from datetime import datetime
from typing import Dict, List, Optional, Any
from dataclasses import dataclass, asdict
from enum import Enum


class EventType(str, Enum):
    """Event types for time machine events"""
    VULNERABILITY = "vulnerability"
    MEV = "mev"
    HONEYPOT = "honeypot"
    TRANSACTION = "transaction"
    EXPLOIT = "exploit"


class SeverityLevel(str, Enum):
    """Severity levels for events"""
    CRITICAL = "critical"
    HIGH = "high"
    MEDIUM = "medium"
    WARNING = "warning"
    LOW = "low"


@dataclass
class TimeEvent:
    """Time machine event for frontend display"""
    id: str
    type: EventType
    severity: SeverityLevel
    title: str
    timestamp: datetime
    description: str
    contract: str
    value: float  # ETH value
    metadata: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization"""
        data = asdict(self)
        data['timestamp'] = self.timestamp.isoformat()
        return data


@dataclass
class TimelineStats:
    """Statistics for the timeline view"""
    total_events: int
    critical_incidents: int
    blocks_analyzed: int
    time_span_days: int


@dataclass
class TimelineFilters:
    """Filters for timeline events"""
    event_type: Optional[str] = None
    severity: Optional[str] = None
    contract: Optional[str] = None
    min_value: Optional[str] = None


@dataclass
class TimelineRequest:
    """Request for timeline data"""
    time_range: str  # "1h", "24h", "7d", "30d", "all"
    filters: Optional[TimelineFilters] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None


@dataclass
class TimelineResponse:
    """Response containing timeline data"""
    events: List[TimeEvent]
    stats: TimelineStats
    time_range: str
    total_count: int
    filtered_count: int
