# BLACKFIN Hardware & Telemetry Data Contract
**SIH 2026 · Problem Statement ID:** 26058  
**Document Status:** LOCKED / RATIFIED  
**Target Microcontroller:** STM32H7 / STM32F4 Series (ARM Cortex-M7/M4)

---

## 1. Overview & Purpose
This data contract locks every field consumed and emitted by the BLACKFIN Software-Defined Adaptive Sonar platform. When transitioning from the current real-time Simulation Layer to real STM32 microcontroller and transducer hardware, **zero UI or API rebuilding is required** — only swapping the packet source.

---

## 2. Downlink Configuration Frame (`Payload → STM32 Transmit DAC`)
Dispatched whenever the adaptive engine evaluates an acoustic parameter shift or manual operator command.

| Field Name | Type | Unit | Range / Constraints | Update Frequency | Description |
|---|---|---|---|---|---|
| `sync_word` | `uint16` | Hex | `0xAA55` | On change | Frame synchronization header |
| `carrier_freq_khz` | `float32` | kHz | `20.0` – `200.0` | On change | Center carrier frequency for DAC DDS generation |
| `bandwidth_khz` | `float32` | kHz | `1.0` – `50.0` | On change | Chirp sweep bandwidth ($f_{\text{high}} - f_{\text{low}}$) |
| `pulse_duration_ms`| `float32` | ms | `0.1` – `50.0` | On change | Active acoustic ping duration $\tau$ |
| `acoustic_power_w` | `float32` | W | `0.5` – `20.0` | On change | Transmit power driving transducer amplifier |
| `waveform_type` | `uint8` | Enum | `0`=LFM_UP, `1`=LFM_DOWN, `2`=CW, `3`=HFM | On change | Modulation waveform topology |
| `duty_cycle_pct` | `float32` | % | `1.0` – `25.0` | On change | Ping repetition rate limiter to protect battery |
| `checksum` | `uint16` | Hex | CRC-16-CCITT | On change | Frame integrity verification |

---

## 3. Uplink Telemetry Frame (`STM32 / CTD Sensors → Payload`)
Received at a constant 5 Hz (200 ms interval) via DMA UART / USB Virtual COM Port.

| Field Name | Type | Unit | Range / Constraints | Update Frequency | Description |
|---|---|---|---|---|---|
| `sync_word` | `uint16` | Hex | `0x55AA` | 5 Hz (200ms) | Telemetry synchronization header |
| `packet_id` | `uint32` | Count | `0` – $2^{32}-1$ | 5 Hz (200ms) | Monotonically incrementing tick count |
| `uptime_sec` | `float32` | s | `0.0` – $\infty$ | 5 Hz (200ms) | Continuous system operational uptime |
| `depth_m` | `float32` | m | `5.0` – `500.0` | 5 Hz (200ms) | Hydrostatic pressure depth sensor |
| `water_temp_c` | `float32` | °C | `0.0` – `30.0` | 5 Hz (200ms) | CTD thermistor temperature |
| `salinity_psu` | `float32` | PSU | `30.0` – `40.0` | 5 Hz (200ms) | Conductivity sensor salinity |
| `turbidity_pct` | `float32` | % | `0.0` – `100.0` | 5 Hz (200ms) | Optical nephelometric turbidity unit (NTU scaled) |
| `ambient_noise_db` | `float32` | dB | `40.0` – `100.0` | 5 Hz (200ms) | Hydrophone passive background noise floor |
| `battery_pct` | `float32` | % | `0.0` – `100.0` | 5 Hz (200ms) | AUV main bus fuel gauge |
| `speed_of_sound_mps`| `float32`| m/s | `1400.0` – `1600.0`| 5 Hz (200ms) | Computed via Mackenzie (1981) model |

---

## 4. Acoustic Return & DSP Detection Frame (`Hydrophone ADC → UI`)
Transmitted over `/ws/sonar` at 5–10 Hz.

| Field Name | Type | Unit | Range / Constraints | Description |
|---|---|---|---|---|
| `adc_time_axis_ms` | `float32[]` | ms | `0.0` – `120.0` (256 pts) | Time vector of hydrophone A-scan |
| `adc_amplitude` | `float32[]` | Norm | `-1.2` – `+1.2` (256 pts) | Normalized received acoustic voltage |
| `fft_freq_axis_khz`| `float32[]` | kHz | `15.0` – `185.0` (128 pts) | Frequency domain bin center frequencies |
| `fft_magnitude_db` | `float32[]` | dB | `-95.0` – `0.0` (128 pts) | Calibrated spectral power density |
| `estimated_range_m`| `float32` | m | `0.0` – `200.0` | Two-way acoustic travel range to target |
| `snr_db` | `float32` | dB | `0.0` – `60.0` | Target peak SNR vs noise floor |
| `detection_confidence_pct`| `float32`| % | `0.0` – `100.0` | Matched filter confidence score |
| `target_detected` | `bool` | Flag | `true` / `false` | Acquisition lock flag |

---

## 5. Hero Metric Power Frame (`Adaptive Engine → UI`)
Consumed by the `AdaptivePowerEfficiencyPanel` for real-time benchmark claims.

| Field Name | Type | Unit | Benchmark Value | Description |
|---|---|---|---|---|
| `adaptive_power_w` | `float32` | W | Dynamic `0.5` – `20.0` | Actual active transmit power draw |
| `baseline_power_w` | `float32` | W | Fixed `12.0` | Conventional static sonar baseline draw |
| `power_savings_pct`| `float32` | % | Calculated `0.0` – `85.0` | `((baseline - adaptive) / baseline) * 100` |
| `total_energy_wh` | `float32` | Wh | Cumulative | Total acoustic energy consumed |
| `mission_multiplier`| `float32` | Factor | `1.0x` – `2.5x` | Extended mission dive factor |
