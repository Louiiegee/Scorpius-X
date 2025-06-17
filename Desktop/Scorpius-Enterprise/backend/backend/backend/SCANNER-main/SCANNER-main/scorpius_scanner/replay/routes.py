from fastapi import APIRouter, Depends, HTTPException
from typing import List, Dict, Any, Optional
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from ..core.database import get_db_session, Exploit, ReplaySession
from .manager import ReplayManager

router = APIRouter()
# This manager could be a more sophisticated dependency in a real app
replay_manager = ReplayManager() 

@router.post("/start", summary="Start a New Replay Session")
async def start_replay(
    exploit_id: str,
    session: AsyncSession = Depends(get_db_session)
):
    """Initiates an asynchronous replay of a specific historical exploit."""
    exploit = await session.get(Exploit, exploit_id)
    if not exploit:
        raise HTTPException(status_code=404, detail="Exploit not found")
    
    session_id = await replay_manager.start_exploit_replay(exploit)
    return {"message": "Replay session initiated.", "session_id": session_id}

@router.get("/{session_id}/status", summary="Get Replay Status")
async def get_replay_status(session_id: str, session: AsyncSession = Depends(get_db_session)):
    """Retrieves the status and results of a replay session."""
    replay_session = await session.get(ReplaySession, session_id)
    if not replay_session:
        # Check the manager for in-progress status as a fallback
        status = await replay_manager.get_session_status(session_id)
        if not status:
            raise HTTPException(status_code=404, detail="Replay session not found")
        return status
    return {"status": replay_session.status, "results": replay_session.results}

@router.get("/exploits", summary="List Available Exploits")
async def list_exploits(
    skip: int = 0, limit: int = 20, session: AsyncSession = Depends(get_db_session)
):
    """Lists historical exploits available for replay."""
    result = await session.execute(
        select(Exploit).order_by(Exploit.created_at.desc()).offset(skip).limit(limit)
    )
    return result.scalars().all()