"""
BLACKFIN — WebSocket Handlers
Real-time data streaming via WebSocket connections.
"""

import asyncio
import json
import time
from typing import Set
from fastapi import WebSocket, WebSocketDisconnect


class ConnectionManager:
    """Manages WebSocket connections for broadcast."""

    def __init__(self):
        self.active_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.add(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.discard(websocket)

    async def broadcast(self, data: dict):
        """Broadcast JSON data to all connected clients."""
        if not self.active_connections:
            return
        message = json.dumps(data)
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception:
                disconnected.add(connection)
        for conn in disconnected:
            self.active_connections.discard(conn)


# Three broadcast channels
dashboard_manager = ConnectionManager()
sonar_manager = ConnectionManager()
events_manager = ConnectionManager()


async def websocket_dashboard(websocket: WebSocket):
    """Handle /ws/dashboard connections."""
    await dashboard_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive — listen for client messages
            data = await websocket.receive_text()
            # Client can send pings or control messages
    except WebSocketDisconnect:
        dashboard_manager.disconnect(websocket)
    except Exception:
        dashboard_manager.disconnect(websocket)


async def websocket_sonar(websocket: WebSocket):
    """Handle /ws/sonar connections."""
    await sonar_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        sonar_manager.disconnect(websocket)
    except Exception:
        sonar_manager.disconnect(websocket)


async def websocket_events(websocket: WebSocket):
    """Handle /ws/events connections."""
    await events_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_text()
    except WebSocketDisconnect:
        events_manager.disconnect(websocket)
    except Exception:
        events_manager.disconnect(websocket)


async def broadcast_tick_data(tick_data: dict):
    """Broadcast tick data to all appropriate WebSocket channels."""
    # Dashboard payload
    if "dashboard" in tick_data:
        await dashboard_manager.broadcast({
            "type": "dashboard_update",
            "data": tick_data["dashboard"],
        })

    # Sonar signal payload
    if tick_data.get("sonar"):
        await sonar_manager.broadcast({
            "type": "sonar_update",
            "data": tick_data["sonar"],
        })

    # Event payload (only if new event)
    if tick_data.get("event"):
        await events_manager.broadcast({
            "type": "event",
            "data": tick_data["event"],
        })
