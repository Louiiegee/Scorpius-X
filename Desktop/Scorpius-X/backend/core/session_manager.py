import asyncio
from typing import Dict, Optional
from aiohttp import ClientSession, ClientTimeout, TCPConnector
import logging

logger = logging.getLogger(__name__)

class SessionManager:
    """
    Manages HTTP client sessions with connection pooling and timeout handling.
    """
    
    def __init__(self, timeout_seconds: float = 30.0, connector_limit: int = 100):
        """
        Initialize the session manager.
        
        Args:
            timeout_seconds: Default timeout for requests
            connector_limit: Maximum number of connections in the pool
        """
        self._sessions: Dict[str, ClientSession] = {}
        self._timeout = ClientTimeout(total=timeout_seconds)
        self._connector_limit = connector_limit
        self._lock = asyncio.Lock()

    async def get_session(self, key: str = "default") -> ClientSession:
        """
        Get or create a client session for the given key.
        
        Args:
            key: Unique identifier for the session
            
        Returns:
            ClientSession instance
        """
        async with self._lock:
            if key not in self._sessions or self._sessions[key].closed:
                logger.info(f"Creating new ClientSession for key '{key}'")
                connector = TCPConnector(limit=self._connector_limit, ttl_dns_cache=300)
                self._sessions[key] = ClientSession(timeout=self._timeout, connector=connector)
        return self._sessions[key]

    async def close_all(self) -> None:
        """Close all active sessions."""
        async with self._lock:
            for key, session in list(self._sessions.items()):
                if not session.closed:
                    logger.info(f"Closing ClientSession for key '{key}'")
                    await session.close()
                    del self._sessions[key]
            logger.info("All ClientSessions closed.")

    async def close_session(self, key: str) -> None:
        """
        Close a specific session.
        
        Args:
            key: Session key to close
        """
        async with self._lock:
            session = self._sessions.pop(key, None)
            if session and not session.closed:
                logger.info(f"Closing ClientSession for key '{key}'")
                await session.close()
