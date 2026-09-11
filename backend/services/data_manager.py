"""
BLACKFIN — Data Manager
Central state aggregator that coordinates all subsystems and manages the simulation tick loop.
"""

import time
import asyncio
from typing import Dict, List, Optional, Any

from services.simulation_engine import SimulationEngine
from services.sonar_generator import SonarGenerator
from signal_processing.echo_analyzer import EchoAnalyzer
from adaptive_engine.engine import AdaptiveSonarEngine
from adaptive_engine.models import (
    SystemMode, AdaptationMode, SystemStatus, EnergyMetrics,
    ComponentHealth, ComponentStatus, SystemEvent, EventCategory,
    TargetDetection, AdaptationResult,
)
from config import simulation_config as sc


class DataManager:
    """Central state manager that coordinates simulation, sonar, and adaptive engine."""

    def __init__(self):
        self.simulation = SimulationEngine()
        self.sonar_generator = SonarGenerator()
        self.echo_analyzer = EchoAnalyzer()
        self.adaptive_engine = AdaptiveSonarEngine()

        # System state
        self.system_mode = SystemMode.SIMULATION
        self.sonar_running = False
        self._start_time = time.time()

        # Latest data
        self.latest_environment: Dict = {}
        self.latest_signal: Dict = {}
        self.latest_target: Dict = {
            "detected": False, "estimated_range": 0, "signal_strength": 0,
            "snr": 0, "confidence": 0, "peak_amplitude": 0,
        }
        self.latest_adaptation: Optional[Dict] = None

        # Energy tracking
        self._power_history: List[float] = []
        self._total_energy_wh: float = 0.0
        self._max_power_no_adapt: float = 12.0  # reference: what power would be without adaptation

        # Event log
        self.events: List[Dict] = []
        self._max_events = 500

        # DB flush tracking
        self._last_db_flush = time.time()
        self._db_flush_interval = 5.0  # seconds

    def add_event(self, category: str, message: str, details: Optional[Dict] = None):
        """Add a system event."""
        event = {
            "timestamp": time.time(),
            "category": category,
            "message": message,
            "details": details,
        }
        self.events.append(event)
        if len(self.events) > self._max_events:
            self.events = self.events[-self._max_events:]
        return event

    async def tick(self) -> Dict[str, Any]:
        """
        Execute one simulation tick. Returns all data for WebSocket broadcast.

        Pipeline: Simulate → Generate → Process → Analyze → Adapt → Stream
        """
        if not self.sonar_running:
            return self._build_idle_payload()

        config = self.adaptive_engine.current_config

        # 1. Simulate environment
        env = self.simulation.tick(current_power=config.transmit_power)
        self.latest_environment = env

        # 2. Generate sonar frame
        signal_data = self.sonar_generator.generate_frame(
            frequency=config.frequency,
            bandwidth=config.bandwidth,
            pulse_duration=config.pulse_duration,
            power=config.transmit_power,
            waveform_type=config.waveform_type.value,
            target_distance=env["target_distance"],
            speed_of_sound=env["speed_of_sound"],
            depth=env["depth"],
            turbidity=env["turbidity"],
            noise_level=env["noise_level"],
        )
        self.latest_signal = signal_data

        # 3. Analyze echo for targets
        import numpy as np
        # Reconstruct full signal for echo analysis
        rx_signal = np.array(signal_data["amplitude"])
        target_result = self.echo_analyzer.analyze(
            received_signal=rx_signal,
            speed_of_sound=env["speed_of_sound"],
            noise_level=env["noise_level"],
            peaks=signal_data["peaks"],
        )
        self.latest_target = target_result

        # 4. Run adaptive engine
        adaptation = self.adaptive_engine.evaluate(env, target_result)
        new_event = None
        if adaptation and adaptation.triggered:
            self.latest_adaptation = adaptation.model_dump()
            new_event = self.add_event(
                "adaptation",
                adaptation.reason,
                {"adaptation": adaptation.model_dump()},
            )

        # 5. Track energy
        power = config.transmit_power
        self._power_history.append(power)
        if len(self._power_history) > 1000:
            self._power_history = self._power_history[-1000:]
        tick_hours = sc.tick_rate_ms / 1000 / 3600
        self._total_energy_wh += power * tick_hours

        # 6. Build payload
        return self._build_payload(env, signal_data, target_result, adaptation, new_event)

    def _build_payload(self, env, signal_data, target_result, adaptation, new_event) -> Dict:
        """Build the complete data payload for WebSocket broadcast."""
        config = self.adaptive_engine.current_config

        return {
            "dashboard": {
                "environment": env,
                "sonar_config": config.to_display(),
                "target": target_result,
                "energy": self._get_energy_metrics(env),
                "system_status": self._get_system_status(),
                "latest_adaptation": self.latest_adaptation,
            },
            "sonar": {
                "signal": {
                    "timestamp": time.time(),
                    "time_axis": signal_data["time_axis"],
                    "amplitude": signal_data["amplitude"],
                    "freq_axis": signal_data["freq_axis"],
                    "magnitude": signal_data["magnitude"],
                    "echo_peaks": signal_data["peaks"],
                },
                "waterfall_row": signal_data["waterfall_row"],
            },
            "event": new_event,
        }

    def _build_idle_payload(self) -> Dict:
        """Build payload when sonar is not running."""
        config = self.adaptive_engine.current_config
        env = self.latest_environment or {
            "timestamp": time.time(), "depth": 0, "temperature": 0,
            "salinity": 0, "turbidity": 0, "noise_level": 0,
            "target_distance": 0, "battery": 100, "speed_of_sound": 1500,
        }
        return {
            "dashboard": {
                "environment": env,
                "sonar_config": config.to_display(),
                "target": self.latest_target,
                "energy": self._get_energy_metrics(env),
                "system_status": self._get_system_status(),
                "latest_adaptation": self.latest_adaptation,
            },
            "sonar": None,
            "event": None,
        }

    def _get_energy_metrics(self, env: Dict) -> Dict:
        """Calculate energy metrics."""
        power = self.adaptive_engine.current_config.transmit_power
        avg_power = float(sum(self._power_history) / max(len(self._power_history), 1))

        # Estimated savings vs non-adaptive reference
        if self._power_history:
            actual_avg = avg_power
            savings = max(0, (self._max_power_no_adapt - actual_avg) / self._max_power_no_adapt * 100)
        else:
            savings = 0

        battery = env.get("battery", 100)
        if power > 0.01 and battery > 0:
            # Very rough estimate
            remaining_wh = battery / 100 * 50  # assume 50Wh total capacity
            remaining_hours = remaining_wh / power
        else:
            remaining_hours = 999

        return {
            "current_power": round(power, 1),
            "average_power": round(avg_power, 1),
            "total_energy": round(self._total_energy_wh, 2),
            "battery_level": round(battery, 1),
            "estimated_remaining_hours": round(remaining_hours, 1),
            "adaptive_efficiency": round(min(len(self._power_history) / max(self.simulation.tick_count, 1) * 100, 100), 1),
            "energy_saved_percent": round(savings, 1),
        }

    def _get_system_status(self) -> Dict:
        """Get current system status."""
        return {
            "mode": self.system_mode.value,
            "adaptation_mode": self.adaptive_engine.mode.value,
            "sonar_running": self.sonar_running,
            "connected": True,
            "uptime": round(time.time() - self._start_time, 1),
            "data_source": "SIMULATION" if self.system_mode == SystemMode.SIMULATION else "LIVE HARDWARE",
            "tick_count": self.simulation.tick_count,
        }

    def get_system_health(self) -> List[Dict]:
        """Get component health status."""
        now = time.time()
        running = ComponentStatus.ONLINE.value if self.sonar_running else ComponentStatus.OFFLINE.value
        return [
            {"name": "STM32 Controller", "status": "offline" if self.system_mode == SystemMode.SIMULATION else "online",
             "last_update": now, "latency_ms": 0, "details": "Simulation mode — no hardware connected"},
            {"name": "Environment Sensors", "status": "online", "last_update": now, "latency_ms": 2.1, "details": "Simulated sensor data"},
            {"name": "DAC", "status": running, "last_update": now, "latency_ms": 0.5, "details": "Digital-to-analog converter"},
            {"name": "Sonar Transducer", "status": running, "last_update": now, "latency_ms": 1.2, "details": "Simulated transducer"},
            {"name": "Signal Processor", "status": "online", "last_update": now, "latency_ms": 3.4, "details": "FFT + echo analysis running"},
            {"name": "Adaptive Engine", "status": "online", "last_update": now, "latency_ms": 1.8, "details": f"Mode: {self.adaptive_engine.mode.value}"},
            {"name": "Dashboard", "status": "online", "last_update": now, "latency_ms": 0.3, "details": "WebSocket connected"},
        ]

    def start_sonar(self):
        """Start sonar transmission."""
        self.sonar_running = True
        self.add_event("sonar", "Sonar transmission started")
        self.add_event("system", "System active — monitoring underwater environment")

    def stop_sonar(self):
        """Stop sonar transmission."""
        self.sonar_running = False
        self.add_event("sonar", "Sonar transmission stopped")

    def reset(self):
        """Full system reset."""
        self.simulation.reset()
        self.echo_analyzer.reset()
        self.adaptive_engine.reset()
        self.sonar_running = False
        self.latest_environment = {}
        self.latest_signal = {}
        self.latest_target = {"detected": False, "estimated_range": 0, "signal_strength": 0, "snr": 0, "confidence": 0, "peak_amplitude": 0}
        self.latest_adaptation = None
        self._power_history = []
        self._total_energy_wh = 0
        self.events = []
        self._start_time = time.time()
        self.add_event("system", "System reset")
