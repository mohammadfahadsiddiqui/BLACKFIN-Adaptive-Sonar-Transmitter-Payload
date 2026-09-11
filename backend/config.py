"""
BLACKFIN — System Configuration & Thresholds
Central configuration for all tunable parameters.
"""

from dataclasses import dataclass, field
from typing import Dict, Any


@dataclass
class SonarLimits:
    """Safe operating limits for sonar parameters."""
    freq_min: float = 20_000       # Hz (20 kHz)
    freq_max: float = 200_000      # Hz (200 kHz)
    bandwidth_min: float = 1_000   # Hz (1 kHz)
    bandwidth_max: float = 50_000  # Hz (50 kHz)
    pulse_min: float = 0.0001     # seconds (0.1 ms)
    pulse_max: float = 0.050      # seconds (50 ms)
    power_min: float = 0.5        # Watts
    power_max: float = 20.0       # Watts


@dataclass
class SimulationConfig:
    """Simulation engine settings."""
    tick_rate_ms: int = 200           # ms between simulation ticks
    signal_sample_rate: float = 500_000  # Hz — sample rate for waveform generation
    signal_samples: int = 1024        # samples per waveform frame
    drift_speed: float = 0.02         # environmental parameter drift rate
    smoothing_factor: float = 0.1     # exponential smoothing for slider transitions
    waterfall_history: int = 100      # number of scans to keep in waterfall


@dataclass
class EnvironmentLimits:
    """Valid ranges for environmental parameters."""
    depth_min: float = 5.0
    depth_max: float = 500.0
    temperature_min: float = 0.0
    temperature_max: float = 30.0
    salinity_min: float = 30.0
    salinity_max: float = 40.0
    turbidity_min: float = 0.0
    turbidity_max: float = 100.0
    noise_min: float = 40.0
    noise_max: float = 100.0
    target_distance_min: float = 5.0
    target_distance_max: float = 200.0
    battery_min: float = 0.0
    battery_max: float = 100.0


@dataclass
class AdaptiveThresholds:
    """Thresholds for the adaptive engine rules."""
    # Depth thresholds (meters)
    shallow_depth: float = 30.0
    medium_depth: float = 80.0
    deep_depth: float = 150.0

    # Turbidity thresholds (%)
    low_turbidity: float = 25.0
    medium_turbidity: float = 50.0
    high_turbidity: float = 75.0

    # Noise thresholds (dB)
    low_noise: float = 55.0
    medium_noise: float = 70.0
    high_noise: float = 85.0

    # Battery thresholds (%)
    battery_critical: float = 10.0
    battery_low: float = 30.0
    battery_medium: float = 60.0

    # Range thresholds (meters)
    close_range: float = 20.0
    medium_range: float = 60.0
    long_range: float = 120.0

    # Change detection — minimum delta to trigger adaptation
    depth_change_threshold: float = 5.0
    turbidity_change_threshold: float = 8.0
    noise_change_threshold: float = 5.0
    battery_change_threshold: float = 5.0

    # Hysteresis — minimum parameter change to actually apply
    freq_hysteresis: float = 2000     # Hz
    power_hysteresis: float = 0.3     # W
    bandwidth_hysteresis: float = 500  # Hz
    pulse_hysteresis: float = 0.0005  # seconds


# --- Environment Presets ---

ENVIRONMENT_PRESETS: Dict[str, Dict[str, float]] = {
    "clear_water": {
        "depth": 20.0,
        "temperature": 22.0,
        "salinity": 35.0,
        "turbidity": 10.0,
        "noise_level": 45.0,
        "target_distance": 50.0,
        "battery": 95.0,
    },
    "deep_water": {
        "depth": 200.0,
        "temperature": 4.0,
        "salinity": 34.8,
        "turbidity": 15.0,
        "noise_level": 50.0,
        "target_distance": 100.0,
        "battery": 85.0,
    },
    "high_turbidity": {
        "depth": 40.0,
        "temperature": 18.0,
        "salinity": 33.5,
        "turbidity": 85.0,
        "noise_level": 65.0,
        "target_distance": 30.0,
        "battery": 78.0,
    },
    "high_noise": {
        "depth": 60.0,
        "temperature": 15.0,
        "salinity": 35.5,
        "turbidity": 40.0,
        "noise_level": 90.0,
        "target_distance": 45.0,
        "battery": 70.0,
    },
    "low_battery": {
        "depth": 50.0,
        "temperature": 16.0,
        "salinity": 34.0,
        "turbidity": 30.0,
        "noise_level": 55.0,
        "target_distance": 40.0,
        "battery": 12.0,
    },
    "changing_environment": {
        "depth": 75.0,
        "temperature": 12.0,
        "salinity": 36.0,
        "turbidity": 55.0,
        "noise_level": 70.0,
        "target_distance": 65.0,
        "battery": 60.0,
    },
}


# --- Default Initial State ---

DEFAULT_ENVIRONMENT = ENVIRONMENT_PRESETS["clear_water"].copy()

DEFAULT_SONAR_CONFIG: Dict[str, Any] = {
    "frequency": 100_000,      # Hz (100 kHz)
    "bandwidth": 10_000,       # Hz (10 kHz)
    "pulse_duration": 0.005,   # seconds (5 ms)
    "transmit_power": 8.0,     # Watts
    "waveform_type": "LFM",    # Linear Frequency Modulated
    "mode": "auto",            # auto / manual
}


# --- Singleton Config ---

sonar_limits = SonarLimits()
simulation_config = SimulationConfig()
environment_limits = EnvironmentLimits()
adaptive_thresholds = AdaptiveThresholds()
