"""
BLACKFIN — Adaptive Rule Set
Transparent, configurable rules for sonar parameter adaptation.
Each rule evaluates environmental conditions and recommends parameter adjustments.
"""

from typing import Dict, List, Tuple
from config import adaptive_thresholds as at, sonar_limits as sl


class AdaptiveRule:
    """A single adaptive rule with condition evaluation and parameter recommendation."""

    def __init__(self, name: str, description: str):
        self.name = name
        self.description = description

    def evaluate(self, env: Dict, current_config: Dict, target: Dict) -> Tuple[bool, Dict[str, float], str]:
        """
        Evaluate the rule against current conditions.

        Returns:
            (triggered, parameter_adjustments, explanation_fragment)
        """
        raise NotImplementedError


class DepthFrequencyRule(AdaptiveRule):
    """Adjust frequency based on depth for optimal propagation."""

    def __init__(self):
        super().__init__("depth_frequency", "Adjust frequency for depth-dependent propagation")

    def evaluate(self, env, current_config, target):
        depth = env.get("depth", 20)
        adjustments = {}
        explanation = ""

        if depth >= at.deep_depth:
            # Deep water — low frequency for better propagation
            target_freq = 40_000 + (100_000 - 40_000) * (1 - min(depth / 300, 1)) * 0.5
            adjustments["frequency"] = target_freq
            explanation = f"Depth is {depth:.0f}m (deep). Lower frequency selected for improved propagation in deep water."
            return True, adjustments, explanation
        elif depth >= at.medium_depth:
            target_freq = 60_000 + (100_000 - 60_000) * (1 - depth / at.deep_depth)
            adjustments["frequency"] = target_freq
            explanation = f"Depth is {depth:.0f}m (moderate). Frequency adjusted for medium-depth propagation."
            return True, adjustments, explanation
        elif depth <= at.shallow_depth:
            target_freq = 120_000
            adjustments["frequency"] = target_freq
            explanation = f"Depth is {depth:.0f}m (shallow). Higher frequency suitable for shallow water resolution."
            return True, adjustments, explanation

        return False, {}, ""


class TurbidityBandwidthRule(AdaptiveRule):
    """Adjust bandwidth and frequency based on turbidity/scattering."""

    def __init__(self):
        super().__init__("turbidity_bandwidth", "Adapt bandwidth for turbidity conditions")

    def evaluate(self, env, current_config, target):
        turbidity = env.get("turbidity", 10)
        adjustments = {}
        explanation = ""

        if turbidity >= at.high_turbidity:
            # High turbidity — narrower bandwidth for noise rejection
            adjustments["bandwidth"] = 6_000
            adjustments["pulse_duration"] = 0.010  # longer pulse for more energy
            explanation = f"Turbidity is {turbidity:.0f}% (high). Bandwidth narrowed and pulse lengthened for better noise rejection."
            return True, adjustments, explanation
        elif turbidity >= at.medium_turbidity:
            adjustments["bandwidth"] = 10_000
            adjustments["pulse_duration"] = 0.008
            explanation = f"Turbidity is {turbidity:.0f}% (moderate). Bandwidth adjusted for scattering conditions."
            return True, adjustments, explanation
        elif turbidity < at.low_turbidity:
            adjustments["bandwidth"] = 15_000
            adjustments["pulse_duration"] = 0.004
            explanation = f"Turbidity is {turbidity:.0f}% (low). Wider bandwidth for improved range resolution."
            return True, adjustments, explanation

        return False, {}, ""


class RangePowerRule(AdaptiveRule):
    """Adjust transmit power based on target range."""

    def __init__(self):
        super().__init__("range_power", "Optimize power for target range")

    def evaluate(self, env, current_config, target):
        target_dist = env.get("target_distance", 50)
        adjustments = {}
        explanation = ""

        if target_dist >= at.long_range:
            power = min(12.0 + (target_dist - at.long_range) / 40 * 4, sl.power_max)
            adjustments["transmit_power"] = power
            explanation = f"Target range is {target_dist:.0f}m (long range). Increased power for detection at distance."
            return True, adjustments, explanation
        elif target_dist <= at.close_range:
            power = max(2.0, sl.power_min)
            adjustments["transmit_power"] = power
            explanation = f"Target range is {target_dist:.0f}m (close). Reduced power to avoid unnecessary energy consumption."
            return True, adjustments, explanation
        else:
            # Medium range — moderate power
            ratio = (target_dist - at.close_range) / (at.long_range - at.close_range)
            power = 4.0 + ratio * 6.0
            adjustments["transmit_power"] = power
            explanation = f"Target range is {target_dist:.0f}m. Power set proportionally for medium-range detection."
            return True, adjustments, explanation


class BatteryEconomyRule(AdaptiveRule):
    """Reduce power consumption when battery is low."""

    def __init__(self):
        super().__init__("battery_economy", "Energy conservation for low battery")

    def evaluate(self, env, current_config, target):
        battery = env.get("battery", 100)
        adjustments = {}
        explanation = ""

        if battery <= at.battery_critical:
            # Critical — minimum power mode
            adjustments["transmit_power"] = sl.power_min
            adjustments["pulse_duration"] = 0.003
            explanation = f"Battery is {battery:.0f}% (CRITICAL). Minimum power mode activated to preserve remaining energy."
            return True, adjustments, explanation
        elif battery <= at.battery_low:
            # Low — reduce power significantly
            current_power = current_config.get("transmit_power", 8.0)
            adjustments["transmit_power"] = max(current_power * 0.6, sl.power_min)
            explanation = f"Battery is {battery:.0f}% (low). Power reduced to extend operational time."
            return True, adjustments, explanation

        return False, {}, ""


class NoiseAdaptationRule(AdaptiveRule):
    """Adjust parameters based on ambient noise level."""

    def __init__(self):
        super().__init__("noise_adaptation", "Adapt to ambient noise conditions")

    def evaluate(self, env, current_config, target):
        noise = env.get("noise_level", 45)
        adjustments = {}
        explanation = ""

        if noise >= at.high_noise:
            # High noise — narrow bandwidth, increase pulse for better SNR
            adjustments["bandwidth"] = 5_000
            adjustments["pulse_duration"] = 0.012
            explanation = f"Ambient noise is {noise:.0f}dB (high). Bandwidth narrowed and pulse extended to improve SNR."
            return True, adjustments, explanation
        elif noise >= at.medium_noise:
            adjustments["bandwidth"] = 8_000
            adjustments["pulse_duration"] = 0.008
            explanation = f"Ambient noise is {noise:.0f}dB (moderate). Parameters adjusted for noise mitigation."
            return True, adjustments, explanation

        return False, {}, ""


class DepthPulseRule(AdaptiveRule):
    """Adjust pulse duration for deep water energy concentration."""

    def __init__(self):
        super().__init__("depth_pulse", "Pulse optimization for depth")

    def evaluate(self, env, current_config, target):
        depth = env.get("depth", 20)
        adjustments = {}

        if depth >= at.deep_depth:
            adjustments["pulse_duration"] = min(0.015, sl.pulse_max)
            return True, adjustments, f"Deep water ({depth:.0f}m) — pulse duration increased to concentrate transmitted energy."

        return False, {}, ""


# Registry of all rules
ALL_RULES: List[AdaptiveRule] = [
    DepthFrequencyRule(),
    TurbidityBandwidthRule(),
    RangePowerRule(),
    BatteryEconomyRule(),
    NoiseAdaptationRule(),
    DepthPulseRule(),
]
