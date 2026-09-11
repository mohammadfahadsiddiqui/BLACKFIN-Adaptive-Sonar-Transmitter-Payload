"""
BLACKFIN — Sonar Waveform Generator
Generates synthetic sonar transmitted pulses, simulated echoes, acoustic reverberation, and noise.
"""

import numpy as np
from scipy import signal as sig
import time
from typing import Dict, Tuple, List
from config import simulation_config as sc


class SonarGenerator:
    """Generates realistic sonar waveforms and simulated echo returns."""

    def __init__(self):
        self._sample_rate = 500_000  # 500 kHz internal simulation sample rate
        self._display_points = 256    # Number of points sent to UI for high-speed streaming
        self._max_display_ms = 120.0  # Display time window in ms (covers up to ~90m direct range)
        self._tick = 0

    def generate_frame(
        self,
        frequency: float,
        bandwidth: float,
        pulse_duration: float,
        power: float,
        waveform_type: str,
        target_distance: float,
        speed_of_sound: float,
        depth: float,
        turbidity: float,
        noise_level: float,
    ) -> Dict:
        """
        Generate a complete sonar acoustic frame (Tx pulse + ocean clutter + target echo + FFT).
        All returned time-domain and frequency-domain arrays are scaled and animated in real-time.
        """
        self._tick += 1
        t_now = time.time()

        # Display time axis: 0 to 120 ms
        time_axis_ms = np.linspace(0, self._max_display_ms, self._display_points)
        time_axis_s = time_axis_ms / 1000.0

        # 1. Transmit Main Bang (at t = 0 to pulse_duration_ms)
        pulse_ms = pulse_duration * 1000.0
        tx_envelope = np.zeros(self._display_points)
        in_tx = time_axis_ms <= pulse_ms
        if np.any(in_tx):
            # Windowed chirp envelope
            norm_t = time_axis_ms[in_tx] / pulse_ms
            window = 0.5 * (1 - np.cos(2 * np.pi * norm_t))
            tx_carrier = np.cos(2 * np.pi * 35.0 * norm_t)  # normalized display carrier
            power_scale = np.sqrt(max(0.2, power) / 8.0)
            tx_envelope[in_tx] = window * tx_carrier * 0.95 * power_scale

        # 2. Near-field transducer ringing & reverberation decay
        reverb = np.exp(-time_axis_ms / (pulse_ms * 1.5 + 4.0)) * 0.4 * np.sqrt(power / 8.0)
        reverb *= np.cos(2 * np.pi * 18.0 * time_axis_s + (self._tick * 0.4))

        # 3. Ambient ocean acoustic clutter & noise (visibly animated every tick)
        noise_amp = 0.04 + (noise_level - 40.0) / 60.0 * 0.08
        ambient_noise = np.random.normal(0, noise_amp, self._display_points)
        # Add smooth colored turbulence
        turb_t = time_axis_ms * 0.15 + (self._tick * 0.6)
        clutter = np.sin(turb_t) * (noise_amp * 0.6) + np.sin(turb_t * 2.3) * (noise_amp * 0.3)

        # 4. Target Echo Reflection
        target_echo = np.zeros(self._display_points)
        peaks = []

        # Acoustic round-trip delay in ms
        round_trip_ms = (2.0 * target_distance / speed_of_sound) * 1000.0

        # Check if target is present within our surveillance window (or simulated target)
        has_target = target_distance > 0 and round_trip_ms < (self._max_display_ms - 2.0)

        if has_target:
            # Sonar transmission loss
            spreading_loss = 20.0 * np.log10(max(target_distance, 1.0))
            absorption_coeff = 0.0008 * (frequency / 50000.0) ** 1.3 + (turbidity * 0.0003)
            absorption_loss = absorption_coeff * (target_distance * 2.0)
            total_tl = spreading_loss + absorption_loss

            # Target reflection amplitude
            target_strength = 14.0  # dB
            signal_db = 10.0 * np.log10(max(power, 0.5)) + target_strength - total_tl
            target_amp = np.clip(10.0 ** (signal_db / 28.0), 0.35, 1.1)

            # Echo pulse width (spread slightly by turbidity scattering)
            echo_width_ms = pulse_ms * (1.0 + turbidity * 0.005)
            sigma = echo_width_ms / 3.0

            # Gaussian envelope centered at round_trip_ms
            dt = time_axis_ms - round_trip_ms
            echo_env = np.exp(-(dt ** 2) / (2.0 * (sigma ** 2)))

            # Modulated carrier for the echo
            carrier_phase = (self._tick * 0.8)
            echo_carrier = np.cos(2 * np.pi * 32.0 * (time_axis_ms / 10.0) + carrier_phase)
            target_echo += echo_env * echo_carrier * target_amp

            # Secondary multipath seabed reflection (delayed by 1.35x, weaker)
            multipath_ms = round_trip_ms * 1.28
            if multipath_ms < self._max_display_ms:
                dt_mp = time_axis_ms - multipath_ms
                mp_env = np.exp(-(dt_mp ** 2) / (2.0 * ((sigma * 1.4) ** 2)))
                target_echo += mp_env * np.cos(2 * np.pi * 25.0 * (time_axis_ms / 10.0)) * (target_amp * 0.28)

            # Record detected target peak
            peak_idx = int(np.argmin(np.abs(time_axis_ms - round_trip_ms)))
            peak_val = float(abs(target_echo[peak_idx]) + abs(ambient_noise[peak_idx]))
            peaks.append({
                "time": round(float(round_trip_ms), 2),
                "amplitude": round(min(1.15, peak_val), 3),
                "range": round(float(target_distance), 1),
                "sample_index": peak_idx,
            })

        # Combined Received Signal (A-Scan)
        rx_signal = tx_envelope + reverb + target_echo + ambient_noise + clutter
        # Clamp to realistic display dynamic range [-1.2, 1.2]
        rx_signal = np.clip(rx_signal, -1.15, 1.15)

        # 5. Frequency Spectrum (FFT) centered around carrier frequency
        freq_axis_khz = np.linspace(15.0, 185.0, 128)
        fc_khz = frequency / 1000.0
        bw_khz = bandwidth / 1000.0

        # Synthetic spectral power density with realistic peak at fc and bandwidth shape
        f_diff = freq_axis_khz - fc_khz
        filter_shape = np.exp(-(f_diff ** 2) / (2.0 * ((bw_khz * 0.6) ** 2)))
        signal_pwr_db = -12.0 + 10.0 * np.log10(max(power, 1.0))

        # Ambient spectral noise floor
        noise_floor_db = -75.0 + (noise_level - 40.0) * 0.35
        fft_noise = np.random.normal(0, 1.8, 128)

        magnitude_db = noise_floor_db + (signal_pwr_db - noise_floor_db) * filter_shape + fft_noise
        magnitude_db = np.clip(magnitude_db, -95.0, -2.0)

        # Ensure return is clean JSON-serializable list
        return {
            "time_axis": [round(float(t), 2) for t in time_axis_ms],
            "amplitude": [round(float(a), 4) for a in rx_signal],
            "freq_axis": [round(float(f), 1) for f in freq_axis_khz],
            "magnitude": [round(float(m), 1) for m in magnitude_db],
            "peaks": peaks,
            "waterfall_row": [round(float(m), 1) for m in magnitude_db],
        }
