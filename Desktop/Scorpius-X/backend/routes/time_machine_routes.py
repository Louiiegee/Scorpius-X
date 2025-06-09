"""
Time Machine API routes for frontend integration
"""
from datetime import datetime, timedelta
from typing import List, Optional, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, and_, or_

from models.time_machine_models import (
    TimeEvent, TimelineStats, TimelineFilters, 
    TimelineRequest, TimelineResponse, EventType, SeverityLevel
)
from models.replay_models import ReplaySession, Exploit, Transaction, TransactionTrace, SessionStatus
from database.database import get_async_db
from core.engine.replay_manager import ReplayManager, ReplayRequest
import logging
import json
import uuid

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/api/time-machine", tags=["time-machine"])


async def convert_exploit_to_time_event(exploit: Exploit) -> TimeEvent:
    """Convert database exploit to time event"""
    # Parse affected_contracts JSON string to get the first contract
    affected_contracts = []
    if exploit.affected_contracts:
        try:
            import json
            affected_contracts = json.loads(exploit.affected_contracts) if isinstance(exploit.affected_contracts, str) else exploit.affected_contracts
        except (json.JSONDecodeError, TypeError):
            affected_contracts = []
    
    primary_contract = affected_contracts[0] if affected_contracts else "0x" + "0" * 40
    
    return TimeEvent(
        id=str(exploit.id),
        type=EventType.EXPLOIT,
        severity=SeverityLevel.CRITICAL if exploit.financial_impact and exploit.financial_impact > 100 else 
                 SeverityLevel.HIGH if exploit.financial_impact and exploit.financial_impact > 10 else
                 SeverityLevel.MEDIUM,
        title=f"{exploit.name} Exploit",
        timestamp=exploit.created_at,
        description=exploit.description or f"Exploit detected on {exploit.chain}",
        contract=primary_contract,
        value=float(exploit.financial_impact or 0),
        metadata={
            "chain": exploit.chain,
            "block_number": exploit.block_number,
            "attack_vector": exploit.attack_vector,
            "tags": exploit.tags,
            "affected_contracts": affected_contracts
        }
    )


async def convert_replay_session_to_time_event(session: ReplaySession) -> TimeEvent:
    """Convert replay session to time event"""
    event_type = EventType.VULNERABILITY if session.session_type == "exploit" else EventType.TRANSACTION
    
    # Determine severity based on session results
    severity = SeverityLevel.MEDIUM
    if session.results and isinstance(session.results, dict):
        if session.results.get("vulnerability_found"):
            severity = SeverityLevel.HIGH
        elif session.results.get("mev_opportunity"):
            severity = SeverityLevel.WARNING
    
    return TimeEvent(
        id=str(session.id),
        type=event_type,
        severity=severity,
        title=f"Replay Session - {session.session_type.title()}",
        timestamp=session.created_at,
        description=f"Replay session on {session.chain} at block {session.fork_block}",
        contract="0x" + "0" * 40,  # Default contract if none specified
        value=0.0,  # Default value
        metadata={
            "chain": session.chain,
            "fork_block": session.fork_block,
            "status": session.status,
            "execution_time": session.execution_time,
            "parameters": session.parameters
        }
    )


def parse_time_range(time_range: str) -> tuple[datetime, datetime]:
    """Parse time range string to start and end datetime"""
    now = datetime.utcnow()
    
    if time_range == "1h":
        start_time = now - timedelta(hours=1)
    elif time_range == "24h":
        start_time = now - timedelta(hours=24)
    elif time_range == "7d":
        start_time = now - timedelta(days=7)
    elif time_range == "30d":
        start_time = now - timedelta(days=30)
    elif time_range == "all":
        start_time = datetime(2020, 1, 1)  # Start from 2020
    else:
        start_time = now - timedelta(hours=24)  # Default to 24h
    
    return start_time, now


@router.get("/events", response_model=TimelineResponse)
async def get_timeline_events(
    time_range: str = Query(default="24h", description="Time range: 1h, 24h, 7d, 30d, all"),
    event_type: Optional[str] = Query(default=None, description="Filter by event type"),
    severity: Optional[str] = Query(default=None, description="Filter by severity"),
    contract: Optional[str] = Query(default=None, description="Filter by contract address"),
    min_value: Optional[float] = Query(default=None, description="Minimum ETH value"),
    db: AsyncSession = Depends(get_async_db)
) -> TimelineResponse:
    """
    Get timeline events for the specified time range and filters
    """
    try:
        start_time, end_time = parse_time_range(time_range)
        
        events: List[TimeEvent] = []
        
        # Get exploits
        exploit_query = select(Exploit).where(
            and_(
                Exploit.created_at >= start_time,
                Exploit.created_at <= end_time
            )
        )
        
        # Apply contract filter for exploits
        if contract:
            exploit_query = exploit_query.where(
                Exploit.contract_address.ilike(f"%{contract}%")
            )
        
        result = await db.execute(exploit_query)
        exploits = result.scalars().all()
        
        for exploit in exploits:
            event = await convert_exploit_to_time_event(exploit)
            
            # Apply additional filters
            if event_type and event.type != event_type:
                continue
            if severity and event.severity != severity:
                continue
            if min_value and event.value < min_value:
                continue
                
            events.append(event)
        
        # Get replay sessions
        session_query = select(ReplaySession).where(
            and_(
                ReplaySession.created_at >= start_time,
                ReplaySession.created_at <= end_time
            )
        )
        
        result = await db.execute(session_query)
        sessions = result.scalars().all()
        
        for session in sessions:
            event = await convert_replay_session_to_time_event(session)
            
            # Apply filters
            if event_type and event.type != event_type:
                continue
            if severity and event.severity != severity:
                continue
            if min_value and event.value < min_value:
                continue
                
            events.append(event)
        
        # Sort events by timestamp (newest first)
        events.sort(key=lambda x: x.timestamp, reverse=True)
        
        # Calculate statistics
        critical_count = len([e for e in events if e.severity == SeverityLevel.CRITICAL])
        days_span = (end_time - start_time).days
        
        stats = TimelineStats(
            total_events=len(events),
            critical_incidents=critical_count,
            blocks_analyzed=len(set(e.metadata.get("block_number", 0) for e in events if e.metadata)),
            time_span_days=max(1, days_span)
        )
        
        return TimelineResponse(
            events=events,
            stats=stats,
            time_range=time_range,
            total_count=len(events),
            filtered_count=len(events)
        )
        
    except Exception as e:
        logger.error(f"Error fetching timeline events: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch timeline events: {str(e)}")


@router.get("/stats")
async def get_timeline_stats(
    time_range: str = Query(default="24h", description="Time range: 1h, 24h, 7d, 30d, all"),
    db: AsyncSession = Depends(get_async_db)
) -> TimelineStats:
    """
    Get timeline statistics
    """
    try:
        start_time, end_time = parse_time_range(time_range)
        
        # Count exploits
        exploit_count_result = await db.execute(
            select(func.count(Exploit.id)).where(
                and_(
                    Exploit.created_at >= start_time,
                    Exploit.created_at <= end_time
                )
            )
        )
        exploit_count = exploit_count_result.scalar() or 0
        
        # Count critical exploits (high financial impact)
        critical_count_result = await db.execute(
            select(func.count(Exploit.id)).where(
                and_(
                    Exploit.created_at >= start_time,
                    Exploit.created_at <= end_time,
                    Exploit.financial_impact > 100
                )
            )
        )
        critical_count = critical_count_result.scalar() or 0
        
        # Count replay sessions
        session_count_result = await db.execute(
            select(func.count(ReplaySession.id)).where(
                and_(
                    ReplaySession.created_at >= start_time,
                    ReplaySession.created_at <= end_time
                )
            )
        )
        session_count = session_count_result.scalar() or 0
        
        # Count unique blocks
        unique_blocks_result = await db.execute(
            select(func.count(func.distinct(Exploit.block_number))).where(
                and_(
                    Exploit.created_at >= start_time,
                    Exploit.created_at <= end_time
                )
            )
        )
        unique_blocks = unique_blocks_result.scalar() or 0
        
        days_span = (end_time - start_time).days
        
        return TimelineStats(
            total_events=exploit_count + session_count,
            critical_incidents=critical_count,
            blocks_analyzed=unique_blocks,
            time_span_days=max(1, days_span)
        )
        
    except Exception as e:
        logger.error(f"Error fetching timeline stats: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to fetch timeline stats: {str(e)}")


@router.post("/replay/start")
async def start_time_machine_replay(
    request: TimelineRequest,
    db: AsyncSession = Depends(get_async_db)
) -> Dict[str, Any]:
    """
    Start a time machine replay for a specific time range
    """
    try:
        start_time, end_time = parse_time_range(request.time_range)
        
        # For now, return a simulation response since ReplayManager requires complex setup
        # Find exploits in the time range
        exploit_query = select(Exploit).where(
            and_(
                Exploit.created_at >= start_time,
                Exploit.created_at <= end_time
            )
        ).limit(10)  # Limit to prevent overwhelming
        
        result = await db.execute(exploit_query)
        exploits = result.scalars().all()
        
        # Simulate replay session creation for demo purposes
        import uuid
        replay_sessions = []
        
        for exploit in exploits:
            # Create a simulated replay session in the database
            replay_session = ReplaySession(
                id=str(uuid.uuid4()),
                exploit_id=str(exploit.id),
                session_type="time_machine_replay",
                status=SessionStatus.PENDING,
                fork_block=exploit.block_number,
                chain=exploit.chain,
                parameters=json.dumps({"time_range": request.time_range, "automated": True}),
                results=json.dumps({}),
                user_id="time_machine_user"
            )
            
            db.add(replay_session)
            replay_sessions.append(str(replay_session.id))
        
        await db.commit()
        
        return {
            "success": True,
            "message": f"Started {len(replay_sessions)} replay sessions",
            "session_ids": replay_sessions,
            "time_range": request.time_range,
            "exploits_found": len(exploits),
            "note": "Replay sessions created in simulation mode - full replay requires Web3 and StateManager setup"
        }
        
    except Exception as e:
        logger.error(f"Error starting time machine replay: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to start replay: {str(e)}")


@router.get("/health")
async def time_machine_health() -> Dict[str, Any]:
    """
    Health check for time machine API
    """
    return {
        "status": "healthy",
        "timestamp": datetime.utcnow().isoformat(),
        "service": "time-machine-api"
    }
