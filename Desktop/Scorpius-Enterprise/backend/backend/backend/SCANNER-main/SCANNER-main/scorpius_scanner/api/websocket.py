from fastapi import WebSocket, WebSocketDisconnect
from typing import List, Dict, Any
import json
import asyncio
from datetime import datetime
from ..core.logging import get_logger

logger = get_logger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.scan_subscribers: Dict[str, List[WebSocket]] = {}
    
    async def connect(self, websocket: WebSocket, scan_id: str = None):
        """Connect a WebSocket client"""
        await websocket.accept()
        self.active_connections.append(websocket)
        
        if scan_id:
            if scan_id not in self.scan_subscribers:
                self.scan_subscribers[scan_id] = []
            self.scan_subscribers[scan_id].append(websocket)
        
        logger.info(f"WebSocket connected. Total: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket, scan_id: str = None):
        """Disconnect a WebSocket client"""
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        
        if scan_id and scan_id in self.scan_subscribers:
            if websocket in self.scan_subscribers[scan_id]:
                self.scan_subscribers[scan_id].remove(websocket)
            if not self.scan_subscribers[scan_id]:
                del self.scan_subscribers[scan_id]
        
        logger.info(f"WebSocket disconnected. Total: {len(self.active_connections)}")
    
    async def send_to_scan(self, scan_id: str, message: Dict[str, Any]):
        """Send message to all subscribers of a specific scan"""
        if scan_id not in self.scan_subscribers:
            return
        
        message_str = json.dumps({
            **message,
            "timestamp": datetime.utcnow().isoformat(),
            "scan_id": scan_id
        })
        
        disconnected = []
        for connection in self.scan_subscribers[scan_id]:
            try:
                await connection.send_text(message_str)
            except Exception as e:
                logger.warning(f"Failed to send message to websocket: {e}")
                disconnected.append(connection)
        
        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn, scan_id)
    
    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast message to all connected clients"""
        message_str = json.dumps({
            **message,
            "timestamp": datetime.utcnow().isoformat()
        })
        
        disconnected = []
        for connection in self.active_connections:
            try:
                await connection.send_text(message_str)
            except Exception as e:
                logger.warning(f"Failed to broadcast message: {e}")
                disconnected.append(connection)
        
        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn)

manager = ConnectionManager()

def setup_websocket_routes(app):
    """Setup WebSocket routes"""
    
    @app.websocket("/ws/{scan_id}")
    async def websocket_endpoint(websocket: WebSocket, scan_id: str):
        """WebSocket endpoint for real-time scan updates"""
        await manager.connect(websocket, scan_id)
        try:
            while True:
                # Keep connection alive
                data = await websocket.receive_text()
                if data == "ping":
                    await websocket.send_text("pong")
        except WebSocketDisconnect:
            manager.disconnect(websocket, scan_id)
