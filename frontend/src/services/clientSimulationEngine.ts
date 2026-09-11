// BLACKFIN — High-Fidelity Autonomous Client-Side Simulation Engine
// Powers live 5 Hz real-time telemetry, A-Scan waveforms, FFT spectra, and adaptive engine
// when deployed on Vercel/cloud or when disconnected from the Python backend.

import { useSensorStore } from '../stores/sensorStore';
import { useSonarStore } from '../stores/sonarStore';
import { useSystemStore } from '../stores/systemStore';
import { useEventStore } from '../stores/eventStore';
import { EnvironmentState, SignalData, TargetDetection, EnergyMetrics, AdaptationResult } from '../types';

class ClientSimulationEngine {
  private timer: any = null;
  private isRunning: boolean = false;
  private tickCount: number = 0;
  private startTime: number = Date.now();

  // Simulation physics state
  private env: EnvironmentState = {
    timestamp: Date.now() / 1000,
    depth: 46.5,
    temperature: 17.8,
    salinity: 35.1,
    turbidity: 12.5,
    noise_level: 48.2,
    target_distance: 58.6,
    battery: 94.8,
    speed_of_sound: 1512.4,
  };

  private targetOverrides: Partial<EnvironmentState> = {};
  private totalEnergyWh: number = 0.42;
  private maxPowerNoAdapt: number = 12.0;

  // Power draw history
  private powerHistory: number[] = [];

  // Mackenzie (1981) Equation for sound speed in seawater (m/s)
  private computeMackenzieSoundSpeed(T: number, S: number, D: number): number {
    const c =
      1448.96 +
      4.591 * T -
      5.304e-2 * Math.pow(T, 2) +
      2.374e-4 * Math.pow(T, 3) +
      1.34 * (S - 35.0) +
      1.63e-2 * D +
      1.675e-7 * Math.pow(D, 2) -
      1.025e-2 * T * (S - 35.0) -
      7.139e-13 * T * Math.pow(D, 3);
    return Math.max(1400.0, Math.min(1600.0, c));
  }

  public start() {
    if (this.isRunning) return;
    this.isRunning = true;
    this.startTime = Date.now();

    // Broadcast immediate tick then interval at 200ms (5 Hz)
    this.tick();
    this.timer = setInterval(() => this.tick(), 200);
  }

  public stop() {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    this.isRunning = false;
  }

  public reset() {
    this.tickCount = 0;
    this.targetOverrides = {};
    this.env = {
      timestamp: Date.now() / 1000,
      depth: 46.5,
      temperature: 17.8,
      salinity: 35.1,
      turbidity: 12.5,
      noise_level: 48.2,
      target_distance: 58.6,
      battery: 94.8,
      speed_of_sound: 1512.4,
    };
    this.powerHistory = [];
    this.totalEnergyWh = 0.42;
    this.tick();
  }

  public setEnvironmentOverrides(updates: Partial<EnvironmentState>) {
    this.targetOverrides = { ...this.targetOverrides, ...updates };
    Object.assign(this.env, updates);
  }

  public tick() {
    this.tickCount++;
    const tSec = (Date.now() - this.startTime) / 1000;
    const tickNorm = this.tickCount;

    // 1. Natural underwater environmental drift
    if (!this.targetOverrides.depth) {
      this.env.depth = 45.0 + 8.0 * Math.sin(tSec * 0.08) + 2.0 * Math.sin(tSec * 0.25);
    }
    if (!this.targetOverrides.temperature) {
      this.env.temperature = 17.5 - (this.env.depth / 100.0) * 2.2 + 0.3 * Math.sin(tSec * 0.15);
    }
    if (!this.targetOverrides.salinity) {
      this.env.salinity = 35.0 + 0.25 * Math.sin(tSec * 0.05);
    }
    if (!this.targetOverrides.turbidity) {
      this.env.turbidity = 12.0 + 3.0 * Math.sin(tSec * 0.12) + (Math.random() - 0.5) * 0.4;
    }
    if (!this.targetOverrides.noise_level) {
      this.env.noise_level = 48.0 + 2.5 * Math.sin(tSec * 0.2) + (Math.random() - 0.5) * 0.8;
    }
    if (!this.targetOverrides.target_distance) {
      // Dynamic AUV target tracking cruise path
      this.env.target_distance = 58.0 + 4.5 * Math.sin(tSec * 0.1) + 1.2 * Math.cos(tSec * 0.3);
    }
    if (!this.targetOverrides.battery) {
      this.env.battery = Math.max(12.0, 95.0 - (this.tickCount * 0.0012));
    }

    // Sound speed updated via Mackenzie formula
    this.env.speed_of_sound = this.computeMackenzieSoundSpeed(
      this.env.temperature,
      this.env.salinity,
      this.env.depth
    );
    this.env.timestamp = Date.now() / 1000;

    // 2. Active Sonar Config & Closed-Loop Adaptive Evaluation
    const currentConfig = useSonarStore.getState().config;
    const isAuto = currentConfig.mode === 'auto';

    let activeFreq = currentConfig.frequency_khz;
    let activeBw = currentConfig.bandwidth_khz;
    let activePulse = currentConfig.pulse_duration_ms;
    let activePower = currentConfig.transmit_power_w;

    let triggeredRules: string[] = [];
    let adaptationReason = 'Acoustic channel conditions stable; power throttled for conservation.';

    if (isAuto) {
      // Depth-dependent frequency scaling
      if (this.env.depth > 75) {
        activeFreq = 48.0;
        triggeredRules.push('DEPTH_FREQ_SCALING');
      } else {
        activeFreq = 95.0;
      }

      // Turbidity noise rejection
      if (this.env.turbidity > 25) {
        activeBw = 18.0;
        triggeredRules.push('TURBIDITY_BW_EXPANSION');
      } else {
        activeBw = 12.0;
      }

      // Proximity Power Throttling vs Range
      if (this.env.target_distance < 35) {
        activePower = 3.5;
        triggeredRules.push('PROXIMITY_PWR_SAVE');
      } else if (this.env.target_distance > 65) {
        activePower = 9.2;
        triggeredRules.push('HIGH_RANGE_PWR_BOOST');
      } else {
        activePower = 6.4 + 0.6 * Math.sin(tSec * 0.2);
        triggeredRules.push('CRUISE_EFFICIENCY');
      }

      // Battery Reserve Conservation
      if (this.env.battery < 30) {
        activePower = Math.min(activePower, 3.8);
        triggeredRules.push('BATTERY_CONSERVATION_THROTTLE');
      }

      activePower = Math.max(1.5, Math.min(14.0, activePower));
    }

    // 3. Synthesize A-Scan Received Waveform (256 points, 0–120ms)
    const displayPoints = 256;
    const maxDisplayMs = 120.0;
    const cWater = this.env.speed_of_sound;
    const targetDist = this.env.target_distance;
    const roundTripMs = (2.0 * targetDist / cWater) * 1000.0;

    const timeAxis: number[] = new Array(displayPoints);
    const amplitude: number[] = new Array(displayPoints);

    const pulseMs = activePulse;
    const targetAmp = Math.max(0.65, Math.min(0.88, 0.74 + (activePower - 7.0) * 0.02));
    const echoSigma = Math.max(3.0, pulseMs / 2.5);

    let peakSampleIdx = 0;
    let peakAmplitudeVal = 0;

    for (let i = 0; i < displayPoints; i++) {
      const tMs = (i / (displayPoints - 1)) * maxDisplayMs;
      timeAxis[i] = Number(tMs.toFixed(2));

      // 1. Transmit main bang
      let tx = 0;
      if (tMs <= pulseMs) {
        const normT = tMs / pulseMs;
        const window = 0.5 * (1 - Math.cos(2 * Math.PI * normT));
        tx = window * Math.cos(2 * Math.PI * 32.0 * normT) * 0.9 * Math.sqrt(activePower / 8.0);
      }

      // 2. Transducer ringing reverberation
      const reverb = Math.exp(-tMs / (pulseMs * 1.5 + 4.0)) * 0.35 * Math.cos(2 * Math.PI * 18.0 * (tMs / 1000.0) + tickNorm * 0.4);

      // 3. Ocean acoustic clutter & ripples (animated every tick)
      const turbT = tMs * 0.15 + tickNorm * 0.6;
      const clutter = Math.sin(turbT) * 0.035 + Math.sin(turbT * 2.3) * 0.02 + (Math.random() - 0.5) * 0.05;

      // 4. Target Echo Reflection (clean Gaussian acoustic envelope)
      let echo = 0;
      const dt = tMs - roundTripMs;
      const envVal = Math.exp(-(dt * dt) / (2.0 * echoSigma * echoSigma));
      const subcarrier = 0.88 + 0.12 * Math.cos(2 * Math.PI * (dt / echoSigma));
      echo += envVal * targetAmp * subcarrier;

      // Secondary seabed multipath reflection
      const dtMp = tMs - (roundTripMs + 12.0);
      if (roundTripMs + 12.0 < maxDisplayMs) {
        const mpEnv = Math.exp(-(dtMp * dtMp) / (2.0 * (echoSigma * 1.5) * (echoSigma * 1.5)));
        echo += mpEnv * (targetAmp * 0.28);
      }

      let y = tx + reverb + clutter + echo;
      y = Math.max(-1.15, Math.min(1.15, y));
      amplitude[i] = Number(y.toFixed(4));

      if (echo > peakAmplitudeVal) {
        peakAmplitudeVal = echo;
        peakSampleIdx = i;
      }
    }

    const echoPeaks = [
      {
        time: Number(roundTripMs.toFixed(2)),
        amplitude: Number(targetAmp.toFixed(3)),
        range: Number(targetDist.toFixed(1)),
        sample_index: peakSampleIdx,
      },
    ];

    // 4. Frequency Spectrum (FFT, 128 points, 15 to 185 kHz)
    const freqPoints = 128;
    const freqAxis: number[] = new Array(freqPoints);
    const magnitude: number[] = new Array(freqPoints);
    const waterfallRow: number[] = new Array(freqPoints);

    const fMin = 15.0;
    const fMax = 185.0;
    const fc = activeFreq;
    const bw = activeBw;

    const noiseFloor = -74.0 + (this.env.noise_level - 40.0) * 0.3;
    const signalPwr = -10.0 + 8.0 * Math.log10(Math.max(activePower, 1.0));

    for (let i = 0; i < freqPoints; i++) {
      const f = fMin + (i / (freqPoints - 1)) * (fMax - fMin);
      freqAxis[i] = Number(f.toFixed(1));

      const fDiff = f - fc;
      const filterShape = Math.exp(-(fDiff * fDiff) / (2.0 * (bw * 0.6) * (bw * 0.6)));
      const noise = (Math.random() - 0.5) * 3.5;
      const mag = noiseFloor + (signalPwr - noiseFloor) * filterShape + noise;
      const clamped = Math.max(-95.0, Math.min(-2.0, mag));
      magnitude[i] = Number(clamped.toFixed(1));

      // Waterfall intensity (0 to 1)
      const normMag = Math.max(0, Math.min(1, (clamped + 90.0) / 80.0));
      waterfallRow[i] = Number(normMag.toFixed(3));
    }

    const signalData: SignalData = {
      timestamp: Date.now() / 1000,
      time_axis: timeAxis,
      amplitude: amplitude,
      freq_axis: freqAxis,
      magnitude: magnitude,
      echo_peaks: echoPeaks,
    };

    // 5. Target Detection Metrics
    const noiseRms = 0.055;
    const snrDb = Math.max(12.0, Math.min(32.0, 20 * Math.log10(targetAmp / noiseRms)));
    const targetDetection: TargetDetection = {
      timestamp: Date.now() / 1000,
      detected: true,
      estimated_range: Number(targetDist.toFixed(1)),
      signal_strength: Number((-2.5 + Math.random() * 0.8).toFixed(1)),
      snr: Number(snrDb.toFixed(1)),
      confidence: Number((82.0 + 3.0 * Math.sin(tSec * 0.1) + Math.random() * 2.0).toFixed(0)),
      peak_amplitude: Number(targetAmp.toFixed(3)),
    };

    // 6. Energy & Power Savings Accounting
    this.powerHistory.push(activePower);
    if (this.powerHistory.length > 300) this.powerHistory.shift();

    const avgPower = this.powerHistory.reduce((a, b) => a + b, 0) / this.powerHistory.length;
    const hoursElapsed = (0.2 / 3600);
    this.totalEnergyWh += activePower * hoursElapsed;

    const savingsPct = Math.max(0, ((this.maxPowerNoAdapt - activePower) / this.maxPowerNoAdapt) * 100);
    const estHours = (this.env.battery / 100.0 * 50.0) / Math.max(activePower, 0.5);

    const energyMetrics: EnergyMetrics = {
      current_power: Number(activePower.toFixed(1)),
      average_power: Number(avgPower.toFixed(1)),
      total_energy: Number(this.totalEnergyWh.toFixed(2)),
      battery_level: Number(this.env.battery.toFixed(1)),
      estimated_remaining_hours: Number(estHours.toFixed(1)),
      adaptive_efficiency: 84.5,
      energy_saved_percent: Number(savingsPct.toFixed(1)),
    };

    // 7. Periodic Adaptation Event Recording (every ~8 seconds)
    if (this.tickCount % 40 === 0 && isAuto) {
      const adaptationRecord: AdaptationResult = {
        timestamp: Date.now() / 1000,
        triggered: true,
        reason: adaptationReason,
        triggered_rules: triggeredRules,
        confidence: targetDetection.confidence,
        old_config: {
          frequency: (activeFreq - 5.0) * 1000,
          bandwidth: activeBw * 1000,
          pulse_duration: activePulse / 1000,
          transmit_power: activePower + 1.2,
        },
        new_config: {
          frequency: activeFreq * 1000,
          bandwidth: activeBw * 1000,
          pulse_duration: activePulse / 1000,
          transmit_power: activePower,
        },
        environment_snapshot: {
          depth: this.env.depth,
          temperature: this.env.temperature,
          salinity: this.env.salinity,
          turbidity: this.env.turbidity,
          noise_level: this.env.noise_level,
          target_distance: this.env.target_distance,
          battery: this.env.battery,
          speed_of_sound: this.env.speed_of_sound,
        },
      };

      useSonarStore.getState().addAdaptationRecord(adaptationRecord);
      useEventStore.getState().addEvent({
        timestamp: Date.now() / 1000,
        category: 'adaptation',
        message: `Adaptive closed-loop adjustment applied (${triggeredRules.join(', ')})`,
        details: { adaptation: adaptationRecord },
      });
    }

    // 8. Push updates to all Zustand Stores
    useSensorStore.getState().updateEnvironment(this.env);
    useSonarStore.getState().updateSonarConfig({
      ...currentConfig,
      frequency_khz: Number(activeFreq.toFixed(1)),
      bandwidth_khz: Number(activeBw.toFixed(1)),
      pulse_duration_ms: Number(activePulse.toFixed(1)),
      transmit_power_w: Number(activePower.toFixed(1)),
    });
    useSonarStore.getState().updateTarget(targetDetection);
    useSonarStore.getState().updateEnergy(energyMetrics);
    useSonarStore.getState().updateSignal(signalData, waterfallRow);

    useSystemStore.getState().updateSystemStatus({
      uptime: Math.floor((Date.now() - this.startTime) / 1000),
      tick_count: this.tickCount,
      sonar_running: true,
      data_source: 'CLIENT-SIMULATOR',
    });
  }
}

export const clientSimulation = new ClientSimulationEngine();
