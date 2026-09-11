"""
BLACKFIN — REST API Routes
All HTTP endpoints for the dashboard.
"""

from fastapi import APIRouter, HTTPException
from typing import Optional

from adaptive_engine.models import SimulationUpdate, ManualSonarConfig, PresetRequest, AdaptationMode
from config import ENVIRONMENT_PRESETS

router = APIRouter(prefix="/api")

# Data manager reference — set by main.py
data_manager = None


def set_data_manager(dm):
    global data_manager
    data_manager = dm


@router.get("/system/status")
async def get_system_status():
    """Get current system status."""
    return data_manager._get_system_status()


@router.get("/sensors/latest")
async def get_latest_sensors():
    """Get latest environmental sensor readings."""
    return data_manager.latest_environment or {}


@router.get("/sonar/configuration")
async def get_sonar_config():
    """Get current sonar configuration."""
    return data_manager.adaptive_engine.current_config.to_display()


@router.get("/sonar/signal")
async def get_sonar_signal():
    """Get latest sonar signal data."""
    return data_manager.latest_signal or {}


@router.get("/targets")
async def get_targets():
    """Get latest target detection results."""
    return data_manager.latest_target


@router.get("/events")
async def get_events(category: Optional[str] = None, limit: int = 100):
    """Get event log with optional filtering."""
    events = data_manager.events
    if category and category != "all":
        events = [e for e in events if e.get("category") == category]
    return events[-limit:]


@router.get("/energy")
async def get_energy():
    """Get energy metrics."""
    env = data_manager.latest_environment or {"battery": 100}
    return data_manager._get_energy_metrics(env)


@router.get("/health")
async def get_health():
    """Get system component health."""
    return data_manager.get_system_health()


@router.get("/adaptation/history")
async def get_adaptation_history(limit: int = 50):
    """Get adaptation history."""
    history = data_manager.adaptive_engine.adaptation_history
    return [a.model_dump() for a in history[-limit:]]


@router.get("/presets")
async def get_presets():
    """Get available environment presets."""
    return {name: preset for name, preset in ENVIRONMENT_PRESETS.items()}


# --- POST Endpoints ---

@router.post("/sonar/start")
async def start_sonar():
    """Start sonar transmission."""
    data_manager.start_sonar()
    return {"status": "started"}


@router.post("/sonar/stop")
async def stop_sonar():
    """Stop sonar transmission."""
    data_manager.stop_sonar()
    return {"status": "stopped"}


@router.post("/sonar/manual")
async def set_manual_config(config: ManualSonarConfig):
    """Set manual sonar configuration."""
    if data_manager.adaptive_engine.mode != AdaptationMode.MANUAL:
        raise HTTPException(400, "Switch to MANUAL mode first")
    updates = config.model_dump(exclude_none=True)
    data_manager.adaptive_engine.set_manual_config(updates)
    data_manager.add_event("sonar", f"Manual configuration updated: {updates}")
    return {"status": "updated", "config": data_manager.adaptive_engine.current_config.to_display()}


@router.post("/adaptation/configure")
async def configure_adaptation(mode: str = "auto"):
    """Set adaptation mode (auto/manual)."""
    if mode not in ("auto", "manual"):
        raise HTTPException(400, "Mode must be 'auto' or 'manual'")
    data_manager.adaptive_engine.mode = AdaptationMode(mode)
    data_manager.add_event("system", f"Adaptation mode changed to {mode.upper()}")
    return {"status": "updated", "mode": mode}


@router.post("/simulation/environment")
async def update_simulation(update: SimulationUpdate):
    """Update simulation environment parameters."""
    updates = update.model_dump(exclude_none=True)
    data_manager.simulation.set_environment(updates)
    data_manager.add_event("environment", f"Environment parameters updated: {list(updates.keys())}")
    return {"status": "updated"}


@router.post("/simulation/preset")
async def apply_preset(request: PresetRequest):
    """Apply an environment preset."""
    if not data_manager.simulation.apply_preset(request.preset_name):
        raise HTTPException(400, f"Unknown preset: {request.preset_name}")
    data_manager.add_event("environment", f"Preset applied: {request.preset_name}")
    return {"status": "applied", "preset": request.preset_name}


@router.post("/system/reset")
async def reset_system():
    """Full system reset."""
    data_manager.reset()
    return {"status": "reset"}
