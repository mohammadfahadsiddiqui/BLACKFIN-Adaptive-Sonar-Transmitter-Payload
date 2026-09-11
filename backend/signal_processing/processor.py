"""
BLACKFIN — Signal Processing Module
FFT, filtering, envelope detection, and spectral analysis.
"""

import numpy as np
from scipy import signal as sig
from typing import Dict, Tuple


class SignalProcessor:
    """Core DSP pipeline for sonar signal processing."""

    def __init__(self, sample_rate: float = 500_000):
        self._sample_rate = sample_rate

    def bandpass_filter(
        self,
        signal_data: np.ndarray,
        center_freq: float,
        bandwidth: float,
        order: int = 4,
    ) -> np.ndarray:
        """
        Apply bandpass filter centered on operating frequency.

        Args:
            signal_data: Input signal
            center_freq: Center frequency in Hz
            bandwidth: Bandwidth in Hz
            order: Filter order
        """
        nyquist = self._sample_rate / 2
        low = max((center_freq - bandwidth / 2) / nyquist, 0.001)
        high = min((center_freq + bandwidth / 2) / nyquist, 0.999)

        if low >= high:
            return signal_data

        sos = sig.butter(order, [low, high], btype='bandpass', output='sos')
        return sig.sosfilt(sos, signal_data)

    def compute_fft(self, signal_data: np.ndarray) -> Tuple[np.ndarray, np.ndarray]:
        """
        Compute FFT of the signal.

        Returns:
            (frequency_axis_hz, magnitude_db)
        """
        fft_data = np.fft.rfft(signal_data)
        magnitude = np.abs(fft_data) / len(signal_data)
        magnitude_db = 20 * np.log10(magnitude + 1e-12)
        freq_axis = np.fft.rfftfreq(len(signal_data), 1.0 / self._sample_rate)
        return freq_axis, magnitude_db

    def envelope_detection(self, signal_data: np.ndarray) -> np.ndarray:
        """Compute signal envelope using Hilbert transform."""
        analytic = sig.hilbert(signal_data)
        envelope = np.abs(analytic)

        # Smooth the envelope
        kernel_size = min(21, len(envelope) // 10)
        if kernel_size > 1:
            kernel = np.ones(kernel_size) / kernel_size
            envelope = np.convolve(envelope, kernel, mode='same')

        return envelope

    def spectral_analysis(self, freq_axis: np.ndarray, magnitude_db: np.ndarray) -> Dict:
        """
        Analyze the frequency spectrum.

        Returns dict with dominant_frequency, bandwidth_3db, noise_floor, spectral_centroid.
        """
        # Convert to linear for centroid calculation
        magnitude_linear = 10 ** (magnitude_db / 20)

        # Dominant frequency
        peak_idx = np.argmax(magnitude_db)
        dominant_freq = float(freq_axis[peak_idx])

        # -3dB bandwidth
        peak_magnitude = magnitude_db[peak_idx]
        threshold_3db = peak_magnitude - 3.0
        above_threshold = magnitude_db >= threshold_3db
        indices = np.where(above_threshold)[0]
        if len(indices) > 0:
            bandwidth_3db = float(freq_axis[indices[-1]] - freq_axis[indices[0]])
        else:
            bandwidth_3db = 0.0

        # Noise floor (median of lower 50% magnitudes)
        sorted_mag = np.sort(magnitude_db)
        noise_floor = float(np.median(sorted_mag[:len(sorted_mag) // 2]))

        # Spectral centroid
        total_energy = np.sum(magnitude_linear)
        if total_energy > 0:
            spectral_centroid = float(np.sum(freq_axis * magnitude_linear) / total_energy)
        else:
            spectral_centroid = 0.0

        return {
            "dominant_frequency_hz": round(dominant_freq, 1),
            "bandwidth_3db_hz": round(bandwidth_3db, 1),
            "noise_floor_db": round(noise_floor, 1),
            "spectral_centroid_hz": round(spectral_centroid, 1),
            "peak_magnitude_db": round(float(peak_magnitude), 1),
        }
