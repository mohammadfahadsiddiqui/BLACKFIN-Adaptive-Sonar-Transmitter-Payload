# BLACKFIN — Intelligent Adaptive Sonar Transmitter for AUVs

**Smart India Hackathon 2026** · **Problem Statement ID:** 26058  
**Title:** Development of a Low-Power, Real-Time Adaptive Software-Defined Sonar Transmitter Payload for Autonomous Underwater Vehicles (AUVs)

---

## 1. Overview

Conventional sonar systems operate using fixed frequencies, static pulse durations, invariant bandwidths, and constant transmission power even as depth, thermoclines, salinity, turbidity, and ambient noise fluctuate. This results in severe acoustic attenuation, false alarms, and excessive energy drain on constrained AUV battery banks.

**BLACKFIN** solves this challenge through a closed-loop **Sense → Analyze → Adapt → Transmit → Receive → Process → Explain** architecture. The system monitors underwater environmental conditions in real time and dynamically adapts sonar transmission parameters to maintain high acoustic detection probability while conserving power.

---

## 2. Core Architecture

```
[ Hydrographic Sensors ] ──────► [ Environment Simulator / CTD ]
                                             │
                                             ▼
                                 [ Adaptive Decision Engine ]
                                 • 8-Rule Matrix Heuristics
                                 • Energy Optimization Budget
                                 • Hysteresis Clamping
                                             │
                       ┌─────────────────────┴─────────────────────┐
                       ▼                                           ▼
             [ Waveform Generator ]                      [ HAL / STM32 Protocol ]
             • LFM Chirp / CW / HFM                      • 115200 Baud Downlink Frame
             • Frequency (20–200 kHz)                    • Microsecond DMA Timing
             • Bandwidth (1–50 kHz)
             • Power (0.5–20.0 W)
                       │
                       ▼
             [ Acoustic Channel ]
             • Spreading & Absorption Loss (Mackenzie Model)
             • Particulate Backscatter & Ambient Noise
                       │
                       ▼
             [ DSP Signal Processor & Echo Analyzer ]
             • Hilbert Envelope Transform
             • FFT Magnitude Spectrum & Waterfall Spectrogram
             • SNR & Peak Prominence Detection
                       │
                       ▼
         [ Real-Time WebSockets (5 Hz) ]
         ├── /ws/dashboard ──► Unified Mission Telemetry
         ├── /ws/sonar     ──► Waveform & FFT Spectrum
         └── /ws/events    ──► Adaptation Audit Stream
                       │
                       ▼
         [ BLACKFIN Telemetry Mission Control UI ]
         • Mission Overview (6 KPI telemetry tiles + radar scope)
         • Sonar Signal Analysis (time domain, FFT spectrum, waterfall)
         • Hydrography & Ocean (6 continuous time-series charts)
         • Adaptive Control (Autonomous / Manual override + rule matrix)
         • Target Acquisition (A-scan peaks, range estimation, SNR)
         • Energy & Power Budget (real-time savings vs 12W conventional baseline)
         • Diagnostics & Health (STM32 HAL protocol specs + component latency)
```

---

## 3. Technology Stack

- **Frontend:** React 19, TypeScript, Vite 8, Tailwind CSS 3, Lucide React, Recharts, HTML5 Canvas Waterfall Renderer, Zustand
- **Backend:** Python 3.14, FastAPI, Uvicorn, NumPy 2.5, SciPy 1.18, Pydantic 2.13, aiosqlite, WebSockets
- **Hardware Interface:** Abstracted Hardware Interface Layer with STM32 UART binary packet protocol

---

## 4. Getting Started

### Quick Start (Windows)
Double-click `start_blackfin.bat` in the project root. This starts both the FastAPI backend and Vite frontend automatically.

### Manual Launch

#### 1. Backend
```bash
cd backend
python -m uvicorn main:app --host 0.0.0.0 --port 8000
```
- API Documentation: `http://localhost:8000/docs`
- REST Endpoint: `http://localhost:8000/api`
- WebSocket Stream: `ws://localhost:8000/ws/dashboard`

#### 2. Frontend
```bash
cd frontend
npm run dev
```
- Mission Control UI: `http://localhost:5173`

---

## 5. Key Pages & Features

1. **Mission Overview (`/`):** 6 primary KPI telemetry cards (Depth, Temperature, Salinity, Turbidity, Target Range, Battery), live A-scan waveform, real-time adaptive decision explanation, target radar scope, and audit log.
2. **Sonar Signal & FFT:** Time-domain hydrophone signal, FFT spectral power density plot with carrier and bandwidth reference markers, and continuous acoustic waterfall spectrogram.
3. **Hydrography & Ocean:** 6 continuous time-series telemetry charts with Mackenzie (1981) sound velocity profile, accompanied by the interactive Scenario Injector with 6 preset mission environments.
4. **Adaptive Control:** Mode switch between Autonomous Adaptive and Manual Override, interactive manual tuning sliders, active heuristic rule evaluation matrix, and adaptation audit history.
5. **Target Acquisition:** Real-time target tracking, acoustic range estimation, SNR in dB, return strength, and peak reflection table.
6. **Energy & Power Budget:** Real-time power consumption chart plotted against a fixed 12.0W conventional baseline, cumulative energy in Wh, battery reserve, and simulated energy savings up to 40%.
7. **Diagnostics & Health:** Subsystem latency table (STM32, Sensors, DAC, Transducer, DSP, Adaptive Engine, WebSocket), payload reboot controls, and UART packet protocol specifications.
