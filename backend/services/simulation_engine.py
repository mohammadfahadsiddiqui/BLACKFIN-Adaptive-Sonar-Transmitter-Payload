"""
BLACKFIN — Underwater Environment Simulation Engine
Generates dynamic, continuously varying environmental sensor data with autonomous mission profiles.
"""

import numpy as np
import time
import math
from typing import Dict, Optional

from config import (
    environment_limits as el,
    DEFAULT_ENVIRONMENT,
    ENVIRONMENT_PRESETS,
    simulation_config as sc,
)


class SimulationEngine:
    """
    Simulates realistic underwater environmental conditions with autonomous
    dynamic mission trajectories, natural drift, and interactive slider overrides.
    """

    def __init__(self):
        self._start_time = time.time()
        self._tick_count = 0

        # Current values
        self._current: Dict[str, float] = {
            "depth": 22.0,
            "temperature": 21.5,
            "salinity": 35.0,
            "turbidity": 12.0,
            "noise_level": 46.0,
            "target_distance": 52.0,
            "battery": 95.0,
            "speed_of_sound": 1526.4,
        }

        # Target values
        self._target: Dict[str, float] = self._current.copy()

        # User overrides
        self._user_override: Dict[str, bool] = {k: False for k in self._current}

        # Battery drain rate
        self._battery_drain_per_tick = 0.0015

    @property
    def tick_count(self) -> int:
        return self._tick_count

    def set_environment(self, updates: Dict[str, Optional[float]]):
        """Update target values from user sliders and lock override."""
        for key, value in updates.items():
            if value is not None and key in self._target:
                self._target[key] = float(value)
                self._current[key] = float(value)
                self._user_override[key] = True

    def apply_preset(self, preset_name: str) -> bool:
        """Apply an environment preset and lock parameters."""
        if preset_name not in ENVIRONMENT_PRESETS:
            return False
        preset = ENVIRONMENT_PRESETS[preset_name]
        for key, value in preset.items():
            if key in self._target:
                self._target[key] = value
                self._current[key] = value
                self._user_override[key] = True
        return True

    def reset(self):
        """Reset to initial mission baseline and clear overrides."""
        self._tick_count = 0
        self._start_time = time.time()
        self._current = {
            "depth": 22.0,
            "temperature": 21.5,
            "salinity": 35.0,
            "turbidity": 12.0,
            "noise_level": 46.0,
            "target_distance": 52.0,
            "battery": 95.0,
            "speed_of_sound": 1526.4,
        }
        self._target = self._current.copy()
        self._user_override = {k: False for k in self._current}

    def _mackenzie_speed_of_sound(self, temperature: float, salinity: float, depth: float) -> float:
        """Mackenzie (1981) equation for sound speed in seawater (m/s)."""
        T = temperature
        S = salinity
        D = depth
        c = (1448.96 + 4.591 * T - 5.304e-2 * T**2 + 2.374e-4 * T**3
             + 1.340 * (S - 35.0) + 1.630e-2 * D + 1.675e-7 * D**2
             - 1.025e-2 * T * (S - 35.0) - 7.139e-13 * T * D**3)
        return max(1400.0, min(1600.0, c))

    def tick(self, current_power: float = 8.0) -> Dict[str, float]:
        """
        Advance autonomous simulation by one tick (200ms).
        Simulates an active AUV mission profile with dynamic hydrography.
        """
        self._tick_count += 1
        # Elapsed mission time in seconds
        mission_sec = self._tick_count * 0.2
        # Repeatable mission phase cycle: 80-second loop
        phase_t = mission_sec % 80.0

        # Autonomous mission trajectory calculations
        if not self._user_override.get("depth", False):
            if phase_t < 20.0:
                # Shallow coastal cruise (20m to 28m)
                base_depth = 20.0 + (phase_t / 20.0) * 8.0
            elif phase_t < 45.0:
                # Descent down shelf (28m to 92m) -> triggers depth adaptation rule (>80m)!
                p = (phase_t - 20.0) / 25.0
                base_depth = 28.0 + p * 64.0
            elif phase_t < 60.0:
                # Deep water trench (92m to 125m)
                p = (phase_t - 45.0) / 15.0
                base_depth = 92.0 + math.sin(p * math.pi) * 33.0
            else:
                # Ascent back to shelf (125m to 20m)
                p = (phase_t - 60.0) / 20.0
                base_depth = 125.0 - p * 105.0
            # Add subtle hydrographic undulation
            self._current["depth"] = round(base_depth + math.sin(mission_sec * 0.4) * 1.2, 1)

        if not self._user_override.get("turbidity", False):
            if 15.0 <= phase_t < 40.0:
                # Enters river silt plume -> crosses 40% threshold!
                p = (phase_t - 15.0) / 25.0
                turb = 12.0 + math.sin(p * math.pi) * 44.0  # peaks at 56%
            elif 55.0 <= phase_t < 70.0:
                # Secondary mild sediment drift (up to 32%)
                p = (phase_t - 55.0) / 15.0
                turb = 10.0 + math.sin(p * math.pi) * 22.0
            else:
                turb = 10.0 + math.sin(mission_sec * 0.3) * 3.0
            self._current["turbidity"] = round(max(5.0, min(95.0, turb)), 1)

        if not self._user_override.get("target_distance", False):
            if phase_t < 25.0:
                # Target cruising at mid-range 52m -> 38m
                target_d = 52.0 - (phase_t / 25.0) * 14.0
            elif phase_t < 45.0:
                # Target approaches close (38m -> 22m) -> crosses 30m proximity threshold!
                p = (phase_t - 25.0) / 20.0
                target_d = 38.0 - p * 16.0
            elif phase_t < 65.0:
                # Target opens distance (22m -> 68m)
                p = (phase_t - 45.0) / 20.0
                target_d = 22.0 + p * 46.0
            else:
                # Returns to mid-range cruise (68m -> 52m)
                target_d = 68.0 - ((phase_t - 65.0) / 15.0) * 16.0
            self._current["target_distance"] = round(max(15.0, min(70.0, target_d)), 1)


        if not self._user_override.get("temperature", False):
            # Thermocline drops with depth: warm at surface (22C) down to 8C in deep water
            depth_ratio = min(1.0, self._current["depth"] / 150.0)
            temp = 22.0 - depth_ratio * 13.0 + math.sin(mission_sec * 0.1) * 0.4
            self._current["temperature"] = round(temp, 1)

        if not self._user_override.get("salinity", False):
            sal = 35.0 + math.sin(mission_sec * 0.08) * 0.4
            self._current["salinity"] = round(sal, 1)

        if not self._user_override.get("noise_level", False):
            # Ambient acoustic noise with realistic organic variations
            noise = 45.0 + math.sin(mission_sec * 0.5) * 3.0 + np.random.normal(0, 0.8)
            self._current["noise_level"] = round(max(40.0, min(95.0, noise)), 1)

        # Battery depletion based on actual transmit power
        power_factor = max(0.2, current_power) / 8.0
        if not self._user_override.get("battery", False):
            self._current["battery"] -= self._battery_drain_per_tick * power_factor
            self._current["battery"] = max(5.0, min(100.0, self._current["battery"]))

        # Calculate speed of sound in seawater (Mackenzie 1981)
        c = self._mackenzie_speed_of_sound(
            self._current["temperature"],
            self._current["salinity"],
            self._current["depth"],
        )
        self._current["speed_of_sound"] = round(c, 1)

        return {
            "timestamp": time.time(),
            **{k: round(v, 2) for k, v in self._current.items()},
        }
