// BLACKFIN — Sonar, Signal & Target Store (Zustand)

import { create } from 'zustand';
import {
  SonarDisplayConfig,
  TargetDetection,
  EnergyMetrics,
  AdaptationResult,
  SignalData,
} from '../types';

interface SonarStoreState {
  config: SonarDisplayConfig;
  target: TargetDetection;
  energy: EnergyMetrics;
  latestAdaptation: AdaptationResult | null;
  adaptationHistory: AdaptationResult[];
  signal: SignalData;
  waterfallRows: number[][]; // last 80 rows for canvas spectrogram
  powerHistory: { timeStr: string; power: number; baseline: number }[];

  updateSonarConfig: (config: SonarDisplayConfig) => void;
  updateTarget: (target: TargetDetection) => void;
  updateEnergy: (energy: EnergyMetrics) => void;
  setLatestAdaptation: (adaptation: AdaptationResult | null) => void;
  updateSignal: (signal: SignalData, waterfallRow?: number[]) => void;
  addAdaptationRecord: (record: AdaptationResult) => void;
}

const DEFAULT_CONFIG: SonarDisplayConfig = {
  frequency_khz: 100.0,
  bandwidth_khz: 10.0,
  pulse_duration_ms: 5.0,
  transmit_power_w: 8.0,
  waveform_type: 'LFM',
  mode: 'auto',
};

const DEFAULT_TARGET: TargetDetection = {
  timestamp: Date.now() / 1000,
  detected: false,
  estimated_range: 0,
  signal_strength: 0,
  snr: 0,
  confidence: 0,
  peak_amplitude: 0,
};

const DEFAULT_ENERGY: EnergyMetrics = {
  current_power: 8.0,
  average_power: 8.0,
  total_energy: 0.12,
  battery_level: 95.0,
  estimated_remaining_hours: 5.8,
  adaptive_efficiency: 84.5,
  energy_saved_percent: 33.3,
};

const DEFAULT_SIGNAL: SignalData = {
  timestamp: Date.now() / 1000,
  time_axis: Array.from({ length: 64 }, (_, i) => i * 0.03),
  amplitude: Array.from({ length: 64 }, () => 0),
  freq_axis: Array.from({ length: 64 }, (_, i) => 20 + i * 2.8),
  magnitude: Array.from({ length: 64 }, () => -70),
  echo_peaks: [],
};

export const useSonarStore = create<SonarStoreState>((set) => ({
  config: DEFAULT_CONFIG,
  target: DEFAULT_TARGET,
  energy: DEFAULT_ENERGY,
  latestAdaptation: null,
  adaptationHistory: [],
  signal: DEFAULT_SIGNAL,
  waterfallRows: [],
  powerHistory: [],

  updateSonarConfig: (config) => set({ config }),
  updateTarget: (target) => set({ target }),
  updateEnergy: (energy) =>
    set((state) => {
      const now = new Date();
      const timeStr = `${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      const newPowerPoint = {
        timeStr,
        power: energy.current_power,
        baseline: 12.0, // fixed non-adaptive baseline for clear comparative visualization
      };
      const powerHistory = [...state.powerHistory, newPowerPoint];
      if (powerHistory.length > 50) powerHistory.shift();

      return { energy, powerHistory };
    }),

  setLatestAdaptation: (latestAdaptation) => set({ latestAdaptation }),

  addAdaptationRecord: (record) =>
    set((state) => {
      const history = [record, ...state.adaptationHistory];
      if (history.length > 100) history.pop();
      return { latestAdaptation: record, adaptationHistory: history };
    }),

  updateSignal: (signal, waterfallRow) =>
    set((state) => {
      let waterfallRows = state.waterfallRows;
      if (waterfallRow && waterfallRow.length > 0) {
        waterfallRows = [waterfallRow, ...waterfallRows];
        if (waterfallRows.length > 80) {
          waterfallRows = waterfallRows.slice(0, 80);
        }
      }
      return { signal, waterfallRows };
    }),
}));
