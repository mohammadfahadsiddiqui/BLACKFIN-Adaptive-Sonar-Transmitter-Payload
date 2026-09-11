"""
BLACKFIN — Main Application Entry
FastAPI application with simulation loop, REST APIs, and WebSocket endpoints.
"""

import asyncio
import time
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from services.data_manager import DataManager
from api.routes import router as api_router, set_data_manager
from api.websocket import (
    websocket_dashboard, websocket_sonar, websocket_events,
    broadcast_tick_data,
)
from database.db import init_db
from config import simulation_config as sc

# Global data manager
data_manager = DataManager()


async def simulation_loop():
    """Main simulation tick loop — runs continuously in background."""
    tick_interval = sc.tick_rate_ms / 1000.0
    while True:
        try:
            tick_data = await data_manager.tick()
            await broadcast_tick_data(tick_data)
        except Exception as e:
            print(f"[BLACKFIN] Tick error: {e}")
        await asyncio.sleep(tick_interval)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup and shutdown."""
    # Startup
    print("=" * 60)
    print("  BLACKFIN — Adaptive Sonar Mission Control")
    print("  Initializing systems...")
    print("=" * 60)

    await init_db()
    set_data_manager(data_manager)

    # Start simulation loop as background task
    loop_task = asyncio.create_task(simulation_loop())

    # Auto-start sonar for immediate demo experience
    data_manager.start_sonar()

    print("[BLACKFIN] All systems online. Sonar active.")
    print(f"[BLACKFIN] Tick rate: {sc.tick_rate_ms}ms")
    print(f"[BLACKFIN] API: http://localhost:8000/api")
    print(f"[BLACKFIN] WebSocket: ws://localhost:8000/ws/dashboard")
    print("=" * 60)

    yield

    # Shutdown
    loop_task.cancel()
    print("[BLACKFIN] System shutdown.")


app = FastAPI(
    title="BLACKFIN",
    description="Intelligent Adaptive Sonar Transmitter for AUVs",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS for frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount REST routes
app.include_router(api_router)

# Mount WebSocket endpoints
app.add_api_websocket_route("/ws/dashboard", websocket_dashboard)
app.add_api_websocket_route("/ws/sonar", websocket_sonar)
app.add_api_websocket_route("/ws/events", websocket_events)


@app.get("/")
async def root():
    return {
        "name": "BLACKFIN",
        "version": "1.0.0",
        "status": "online",
        "description": "Intelligent Adaptive Sonar Transmitter for AUVs",
    }
