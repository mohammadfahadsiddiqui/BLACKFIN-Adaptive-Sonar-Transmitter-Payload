"""
BLACKFIN — Adaptive Sonar Engine
Core adaptive algorithm that adjusts sonar parameters based on environmental conditions.
"""

import time
from typing import Dict, Optional, List
import numpy as np

from config import sonar_limits as sl, adaptive_thresholds as at
from adaptive_engine.rules import ALL_RULES
from adaptive_engine.models import (
    SonarConfiguration, AdaptationResult, AdaptationMode
)


class AdaptiveSonarEngine:
    """
    Core adaptive algorithm.

    Pipeline:
    1. Normalize environmental inputs
    2. Evaluate all rules
    3. Aggregate parameter recommendations (weighted)
    4. Apply energy constraints
    5. Clamp to safe limits
    6. Check hysteresis (avoid oscillation)
    7. Generate explanation
    """

    def __init__(self):
        self._current_config = SonarConfiguration()
        self._mode = AdaptationMode.AUTO
        self._adaptation_history: List[AdaptationResult] = []
        self._last_env: Dict = {}
        self._tick_count = 0

    @property
    def current_config(self) -> SonarConfiguration:
        return self._current_config

    @current_config.setter
    def current_config(self, config: SonarConfiguration):
        self._current_config = config

    @property
    def mode(self) -> AdaptationMode:
        return self._mode

    @mode.setter
    def mode(self, mode: AdaptationMode):
        self._mode = mode

    @property
    def adaptation_history(self) -> List[AdaptationResult]:
        return self._adaptation_history

    def set_manual_config(self, config_updates: Dict):
        """Set manual sonar configuration (only in MANUAL mode)."""
        if config_updates.get("frequency") is not None:
            self._current_config.frequency = float(config_updates["frequency"])
        if config_updates.get("bandwidth") is not None:
            self._current_config.bandwidth = float(config_updates["bandwidth"])
        if config_updates.get("pulse_duration") is not None:
            self._current_config.pulse_duration = float(config_updates["pulse_duration"])
        if config_updates.get("transmit_power") is not None:
            self._current_config.transmit_power = float(config_updates["transmit_power"])
        self._clamp_config()

    def evaluate(self, env: Dict, target_detection: Optional[Dict] = None) -> Optional[AdaptationResult]:
        """
        Evaluate current conditions and determine if adaptation is needed.

        Args:
            env: Current environment state dict
            target_detection: Latest target detection result

        Returns:
            AdaptationResult if adaptation triggered, None otherwise
        """
        self._tick_count += 1

        if self._mode != AdaptationMode.AUTO:
            return None

        # Skip first few ticks to establish baseline
        if self._tick_count < 3:
            self._last_env = env.copy()
            return None

        # Check if significant change has occurred
        if not self._significant_change(env):
            # Still evaluate every 25 ticks (~5 seconds) for periodic review
            if self._tick_count % 25 != 0:
                return None

        # Store old configuration
        old_config = self._current_config.model_copy()
        old_config_dict = old_config.to_display()

        # Evaluate all rules
        triggered_rules = []
        all_adjustments = {}
        all_explanations = []
        weights = {}

        current_config_dict = {
            "frequency": self._current_config.frequency,
            "bandwidth": self._current_config.bandwidth,
            "pulse_duration": self._current_config.pulse_duration,
            "transmit_power": self._current_config.transmit_power,
        }

        for rule in ALL_RULES:
            triggered, adjustments, explanation = rule.evaluate(
                env, current_config_dict, target_detection or {}
            )
            if triggered:
                triggered_rules.append(rule.name)
                all_explanations.append(explanation)

                # Aggregate adjustments (weighted average for same parameter)
                for param, value in adjustments.items():
                    if param not in all_adjustments:
                        all_adjustments[param] = []
                    all_adjustments[param].append(value)

        if not triggered_rules:
            self._last_env = env.copy()
            return None

        # Merge adjustments — average when multiple rules suggest same parameter
        new_config_values = current_config_dict.copy()
        for param, values in all_adjustments.items():
            new_config_values[param] = float(np.mean(values))

        # Apply new values
        self._current_config.frequency = new_config_values.get("frequency", self._current_config.frequency)
        self._current_config.bandwidth = new_config_values.get("bandwidth", self._current_config.bandwidth)
        self._current_config.pulse_duration = new_config_values.get("pulse_duration", self._current_config.pulse_duration)
        self._current_config.transmit_power = new_config_values.get("transmit_power", self._current_config.transmit_power)

        # Clamp to safe limits
        self._clamp_config()

        # Check hysteresis — only adapt if change is significant enough
        if not self._exceeds_hysteresis(old_config):
            # Revert — change too small
            self._current_config = old_config
            self._last_env = env.copy()
            return None

        # Generate combined explanation
        reason = self._build_explanation(env, old_config, all_explanations)

        # Calculate confidence
        confidence = self._calculate_confidence(env, triggered_rules)

        new_config_dict = self._current_config.to_display()

        result = AdaptationResult(
            timestamp=time.time(),
            triggered=True,
            old_config=old_config_dict,
            new_config=new_config_dict,
            reason=reason,
            triggered_rules=triggered_rules,
            confidence=confidence,
            environment_snapshot={
                "depth": round(env.get("depth", 0), 1),
                "temperature": round(env.get("temperature", 0), 1),
                "salinity": round(env.get("salinity", 0), 1),
                "turbidity": round(env.get("turbidity", 0), 1),
                "noise_level": round(env.get("noise_level", 0), 1),
                "battery": round(env.get("battery", 0), 1),
                "target_distance": round(env.get("target_distance", 0), 1),
            },
        )

        self._adaptation_history.append(result)
        # Keep last 100 adaptations
        self._adaptation_history = self._adaptation_history[-100:]

        self._last_env = env.copy()
        return result

    def _significant_change(self, env: Dict) -> bool:
        """Check if environment has changed enough to warrant re-evaluation."""
        if not self._last_env:
            return True

        checks = [
            (abs(env.get("depth", 0) - self._last_env.get("depth", 0)) > at.depth_change_threshold),
            (abs(env.get("turbidity", 0) - self._last_env.get("turbidity", 0)) > at.turbidity_change_threshold),
            (abs(env.get("noise_level", 0) - self._last_env.get("noise_level", 0)) > at.noise_change_threshold),
            (abs(env.get("battery", 0) - self._last_env.get("battery", 0)) > at.battery_change_threshold),
        ]
        return any(checks)

    def _exceeds_hysteresis(self, old_config: SonarConfiguration) -> bool:
        """Check if the configuration change exceeds hysteresis thresholds."""
        checks = [
            abs(self._current_config.frequency - old_config.frequency) > at.freq_hysteresis,
            abs(self._current_config.transmit_power - old_config.transmit_power) > at.power_hysteresis,
            abs(self._current_config.bandwidth - old_config.bandwidth) > at.bandwidth_hysteresis,
            abs(self._current_config.pulse_duration - old_config.pulse_duration) > at.pulse_hysteresis,
        ]
        return any(checks)

    def _clamp_config(self):
        """Clamp all parameters to safe operating limits."""
        self._current_config.frequency = float(np.clip(
            self._current_config.frequency, sl.freq_min, sl.freq_max
        ))
        self._current_config.bandwidth = float(np.clip(
            self._current_config.bandwidth, sl.bandwidth_min, sl.bandwidth_max
        ))
        self._current_config.pulse_duration = float(np.clip(
            self._current_config.pulse_duration, sl.pulse_min, sl.pulse_max
        ))
        self._current_config.transmit_power = float(np.clip(
            self._current_config.transmit_power, sl.power_min, sl.power_max
        ))

    def _build_explanation(self, env: Dict, old_config: SonarConfiguration, explanations: List[str]) -> str:
        """Build an explicit, quantified human-readable adaptation reason."""
        changes = []
        old_fc = old_config.frequency / 1000.0
        new_fc = self._current_config.frequency / 1000.0
        if abs(new_fc - old_fc) >= 1.0:
            changes.append(f"carrier freq {old_fc:.0f}kHz → {new_fc:.0f}kHz")

        old_pulse = old_config.pulse_duration * 1000.0
        new_pulse = self._current_config.pulse_duration * 1000.0
        if abs(new_pulse - old_pulse) >= 0.5:
            changes.append(f"pulse duration {old_pulse:.1f}ms → {new_pulse:.1f}ms")

        old_pwr = old_config.transmit_power
        new_pwr = self._current_config.transmit_power
        if abs(new_pwr - old_pwr) >= 0.3:
            changes.append(f"power {old_pwr:.1f}W → {new_pwr:.1f}W")

        change_str = ", ".join(changes) if changes else "acoustic parameters optimized"

        if explanations:
            return f"{explanations[0]} Adjusted: {change_str}."
        return f"Autonomous adaptation: {change_str} to sustain SNR under changing hydrography."

    def _calculate_confidence(self, env: Dict, triggered_rules: List[str]) -> float:
        """Calculate confidence in the adaptation decision (0-100)."""
        # Base confidence from number of agreeing rules
        rule_conf = min(len(triggered_rules) * 20, 60)

        # Bonus for clear conditions
        if env.get("turbidity", 50) < 30:
            rule_conf += 10
        if env.get("noise_level", 60) < 55:
            rule_conf += 10
        if env.get("battery", 100) > 50:
            rule_conf += 10

        # Penalty for extreme conditions
        if env.get("battery", 100) < at.battery_critical:
            rule_conf -= 10

        return float(np.clip(rule_conf, 10, 98))

    def reset(self):
        """Reset engine to default state."""
        self._current_config = SonarConfiguration()
        self._adaptation_history = []
        self._last_env = {}
        self._tick_count = 0
