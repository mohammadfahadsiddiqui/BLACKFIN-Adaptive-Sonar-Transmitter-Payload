"""
BLACKFIN — Echo Analyzer
Peak detection, range estimation, SNR calculation, and target confidence scoring.
"""

import numpy as np
from scipy import signal as sig
from typing import Dict, List, Optional


class EchoAnalyzer:
    """Analyzes echo signals for target detection and range estimation."""

    def __init__(self, sample_rate: float = 500_000):
        self._sample_rate = sample_rate
        self._previous_detections: List[Dict] = []

    def analyze(
        self,
        received_signal: np.ndarray,
        speed_of_sound: float,
        noise_level: float,
        peaks: List[Dict],
    ) -> Dict:
        """
        Analyze received echo signal for target detection.

        Args:
            received_signal: The received sonar signal
            speed_of_sound: Speed of sound in water (m/s)
            noise_level: Ambient noise level (dB)
            peaks: Pre-detected peaks from sonar generator

        Returns:
            Target detection result dict
        """
        # Signal metrics
        signal_rms = float(np.sqrt(np.mean(received_signal ** 2)))
        signal_peak = float(np.max(np.abs(received_signal)))

        # Noise estimation: sample from quiet tail window away from Tx main bang
        tail_start = int(len(received_signal) * 0.75)
        noise_window = received_signal[tail_start:]
        noise_rms = float(np.sqrt(np.mean(noise_window ** 2)))
        noise_rms = max(0.015, noise_rms)

        # SNR (Peak to Noise Floor)
        if noise_rms > 1e-6:
            snr_linear = signal_peak / noise_rms
            snr_db = 20 * np.log10(snr_linear + 1e-10)
        else:
            snr_db = 40.0

        snr_db = np.clip(snr_db, 0, 60)

        # Signal strength in dB
        signal_strength_db = 20 * np.log10(signal_peak + 1e-10)

        # Target detection logic
        detected = False
        best_peak = None
        estimated_range = 0.0
        confidence = 0.0

        if peaks:
            # Filter peaks: ignore initial transmission pulse (first 10ms)
            valid_peaks = []
            for p in peaks:
                p_time = p.get("time_ms", p.get("time", 0))
                if p_time > 10.0:
                    valid_peaks.append(p)

            if valid_peaks:
                best_peak = max(valid_peaks, key=lambda p: p.get("amplitude", 0))
                p_range = best_peak.get("estimated_range", best_peak.get("range", 0))
                estimated_range = float(p_range)
                peak_amplitude = float(best_peak.get("amplitude", 0))

                if peak_amplitude > (noise_rms * 1.5) and estimated_range > 3.0:
                    detected = True
                    snr_conf = min(max(snr_db / 24.0 * 100, 60.0), 98.0)
                    amplitude_conf = min(max(peak_amplitude * 120.0, 70.0), 98.0)
                    consistency_conf = self._check_consistency(estimated_range)
                    confidence = round(snr_conf * 0.45 + amplitude_conf * 0.35 + consistency_conf * 0.20, 1)

        # Store detection for consistency tracking
        if detected:
            self._previous_detections.append({
                "range": estimated_range,
                "snr": snr_db,
            })
            # Keep last 20 detections
            self._previous_detections = self._previous_detections[-20:]

        return {
            "detected": bool(detected),
            "estimated_range": round(float(estimated_range), 1),
            "signal_strength": round(float(signal_strength_db), 1),
            "snr": round(float(snr_db), 1),
            "confidence": round(float(confidence), 1),
            "peak_amplitude": round(float(best_peak["amplitude"]) if best_peak else 0.0, 4),
            "num_peaks": int(len(peaks)),
            "signal_rms": round(float(signal_rms), 6),
            "noise_rms": round(float(noise_rms), 6),
        }

    def _check_consistency(self, current_range: float) -> float:
        """
        Check how consistent the current detection is with recent history.
        Returns a confidence percentage (0-100).
        """
        if not self._previous_detections:
            return 50.0  # neutral

        recent_ranges = [d["range"] for d in self._previous_detections[-5:]]
        if not recent_ranges:
            return 50.0

        mean_range = np.mean(recent_ranges)
        std_range = np.std(recent_ranges) + 1e-3

        # How many standard deviations away?
        deviation = abs(current_range - mean_range) / std_range
        if deviation < 1:
            return 95.0
        elif deviation < 2:
            return 75.0
        elif deviation < 3:
            return 50.0
        else:
            return 25.0

    def reset(self):
        """Reset detection history."""
        self._previous_detections = []
