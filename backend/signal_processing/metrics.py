"""
BLACKFIN — Signal Metrics
Utility functions for signal quality measurements.
"""

import numpy as np
from typing import Dict


def signal_energy(signal_data: np.ndarray) -> float:
    """Calculate total signal energy."""
    return float(np.sum(signal_data ** 2))


def rms_amplitude(signal_data: np.ndarray) -> float:
    """Calculate RMS amplitude."""
    return float(np.sqrt(np.mean(signal_data ** 2)))


def peak_to_peak(signal_data: np.ndarray) -> float:
    """Calculate peak-to-peak amplitude."""
    return float(np.max(signal_data) - np.min(signal_data))


def crest_factor(signal_data: np.ndarray) -> float:
    """Calculate crest factor (peak / RMS)."""
    rms = rms_amplitude(signal_data)
    if rms < 1e-10:
        return 0.0
    return float(np.max(np.abs(signal_data)) / rms)


def duty_cycle(signal_data: np.ndarray, threshold: float = 0.1) -> float:
    """Calculate duty cycle (fraction of time signal is above threshold)."""
    above = np.sum(np.abs(signal_data) > threshold)
    return float(above / len(signal_data)) if len(signal_data) > 0 else 0.0


def compute_all_metrics(signal_data: np.ndarray) -> Dict[str, float]:
    """Compute all signal metrics."""
    return {
        "energy": round(signal_energy(signal_data), 6),
        "rms": round(rms_amplitude(signal_data), 6),
        "peak_to_peak": round(peak_to_peak(signal_data), 6),
        "crest_factor": round(crest_factor(signal_data), 2),
        "duty_cycle": round(duty_cycle(signal_data), 4),
    }
