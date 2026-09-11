# BLACKFIN Autonomous Adaptation Rule Matrix
**SIH 2026 · Problem Statement ID:** 26058  
**Document Status:** RATIFIED SPECIFICATION  
**System Module:** `backend/adaptive_engine/rules.py` & `engine.py`

---

## 1. Rule Architecture Overview
The BLACKFIN Adaptive Sonar Engine evaluates an 8-rule heuristic matrix on every simulation tick (5 Hz / 200 ms). Each rule maps real-time underwater environmental sensing and target geometry to optimal transmission parameters ($f_c$, $BW$, $\tau$, $P_{\text{tx}}$).

```
   [ Environmental Inputs ]             [ Target Geometry ]
   • Depth (m)                          • Range (m)
   • Turbidity (%)                      • SNR (dB)
   • Temperature (°C)                   • Target Strength (dB)
   • Salinity (PSU)                     • Battery Fuel Gauge (%)
   • Ambient Noise (dB)
                 │                               │
                 └──────────────┬────────────────┘
                                ▼
              [ 8-Rule Matrix Evaluation Engine ]
              1. Depth-Dependent Absorption Rule
              2. Turbidity Backscatter Rejection Rule
              3. Range-Proportional Power Scaling Rule
              4. Proximity Power Throttling Economy Rule
              5. Ambient Noise Avoidance Band-Shift Rule
              6. Thermocline Dispersion Compensation Rule
              7. Battery Reserve Throttling Rule
              8. Critical Low-Power Emergency Beacon Rule
                                ▼
                   [ Hysteresis Clamping & ]
                   [ Energy Budget Arbiter ]
                                ▼
              [ Output: Hardware Transmit Command ]
              • Carrier Frequency: 20 – 200 kHz
              • Bandwidth: 1 – 50 kHz
              • Pulse Duration: 0.1 – 50 ms
              • Transmit Power: 0.5 – 20.0 W
```

---

## 2. Comprehensive Adaptation Rule Matrix Table

| Rule ID | Rule Name | Sensed Condition Trigger | Sensed Threshold | Mathematical Transfer Function | Parameter Actuation | Engineering Justification |
|---|---|---|---|---|---|---|
| `RULE-01` | **Depth Absorption Scaling** | Depth increases | $D > 80\text{ m}$ (Moderate)<br>$D > 150\text{ m}$ (Deep) | $f_c = 40 + (100-40) \cdot (1 - \frac{D}{300}) \text{ kHz}$ | **Decrease Carrier Frequency**<br>$100\text{ kHz} \to 45\text{–}60\text{ kHz}$ | Seawater absorption coefficient $\alpha \propto f^2$. Lower frequencies suffer dramatically less acoustic attenuation in deep water columns. |
| `RULE-02` | **Turbidity Noise Rejection** | Suspended sediment/plume | $\text{Turbidity} > 40\%$ | $\tau = \tau_0 \cdot (1 + \frac{\text{Turb}}{100})$<br>$BW = \max(6\text{ kHz}, BW_0 - 4\text{ kHz})$ | **Lengthen Pulse Duration** ($\tau \to 10\text{–}15\text{ ms}$)<br>**Narrow Bandwidth** ($BW \to 6\text{–}8\text{ kHz}$) | Particulate scattering causes diffuse reverberation. Longer pulse integrates more energy; matched filtering recovers target SNR through turbidity. |
| `RULE-03` | **Far-Range Acoustic Scaling** | Target echo far | $\text{Range} > 70\text{ m}$ | $P_{\text{tx}} = \min(18\text{W}, P_0 + 0.1 \cdot (R - 70))$ | **Increase Transmit Power**<br>$8.0\text{ W} \to 12.0\text{–}16.0\text{ W}$ | Compensates for spherical spreading loss ($20 \log_{10} R$) to keep echo return safely above the detection threshold. |
| `RULE-04` | **Proximity Power Economy** | Target echo close | $\text{Range} < 30\text{ m}$ | $P_{\text{tx}} = \max(2.0\text{W}, P_0 \cdot (\frac{R}{30})^{1.5})$ | **Throttle Transmit Power**<br>$8.0\text{ W} \to 2.5\text{–}3.5\text{ W}$ (**-70% power**) | Strong near-field returns do not require full power. Throttling saves massive battery energy and prevents transducer hydrophone saturation. |
| `RULE-05` | **Noise Avoidance Band Shift** | High acoustic background | $\text{Noise} > 75\text{ dB}$ | $f_c = f_c \pm 15\text{ kHz}$ (into quiet spectral band) | **Shift Carrier Frequency**<br>$\Delta f = \pm 15\text{ kHz}$ | Avoids heavy shipping noise or biological interference bands, preserving Signal-to-Noise Ratio (SNR). |
| `RULE-06` | **Thermocline Dispersion** | Cold water or temperature inversion | $T < 10^\circ\text{C}$ or $\frac{dT}{dD} > 0.5^\circ/\text{m}$ | $BW = \min(45\text{ kHz}, BW_0 + 10\text{ kHz})$ | **Widen Chirp Bandwidth**<br>$BW \to 25\text{–}40\text{ kHz}$ (LFM UP) | Strong sound speed gradients cause acoustic refraction. Wideband LFM chirp provides maximum pulse compression processing gain. |
| `RULE-07` | **Battery Reserve Throttling** | AUV battery reserve low | $\text{Battery} < 30\%$ | $P_{\text{max}} = 4.0\text{ W}$<br>$\text{DutyCycle} \le 5\%$ | **Hard Cap on Max Power**<br>Clamp $P_{\text{tx}} \le 4.0\text{ W}$ | Protects AUV bus from undervoltage shutdown during extended mission legs. Extends dive endurance by 1.8x. |
| `RULE-08` | **Critical Low-Power Beacon** | Emergency battery status | $\text{Battery} < 15\%$ | $P_{\text{tx}} = 1.0\text{ W}$<br>$\text{PingRate} = 0.5\text{ Hz}$ | **Ultra-Low Power Ping**<br>$1.0\text{ W}$ minimum beacon mode | Preserves remaining battery for AUV emergency ascent guidance while maintaining basic navigation telemetry. |

---

## 3. Hysteresis & Anti-Hunting Thresholds
To prevent parameter oscillation (hunting) caused by minor sensor noise, an adaptation command is only dispatched to the hardware if the proposed change exceeds the following hysteresis deadbands:

- **Carrier Frequency Deadband:** $|\Delta f_c| \ge 2.0\text{ kHz}$
- **Transmit Power Deadband:** $|\Delta P_{\text{tx}}| \ge 0.3\text{ W}$
- **Bandwidth Deadband:** $|\Delta BW| \ge 0.5\text{ kHz}$
- **Pulse Duration Deadband:** $|\Delta \tau| \ge 0.5\text{ ms}$

---

## 4. Hardware Actuation Mapping
When an adaptation rule fires, the resulting parameters are packed into the STM32 UART Downlink Frame (`0xAA55` header) and applied in real time to the DDS (Direct Digital Synthesis) waveform generator.
