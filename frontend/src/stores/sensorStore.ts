// BLACKFIN — Sensor & Environment Store (Zustand)

import { create } from 'zustand';
import { EnvironmentState } from '../types';

export interface HistoryPoint {
  timeStr: string;
  timestamp: number;
  depth: number;
  temperature: number;
  salinity: number;
  turbidity: number;
  noise_level: number;
  target_distance: number;
  battery: number;
  speed_of_sound: number;
}

interface SensorStoreState {
  current: EnvironmentState;
  history: HistoryPoint[];
  maxHistoryLength: number;
  updateEnvironment: (env: EnvironmentState) => void;
  resetHistory: () => void;
}

const DEFAULT_ENV: EnvironmentState = {
  timestamp: Date.now() / 1000,
  depth: 20.0,
  temperature: 22.0,
  salinity: 35.0,
  turbidity: 10.0,
  noise_level: 45.0,
  target_distance: 50.0,
  battery: 95.0,
  speed_of_sound: 1526.4,
};

export const useSensorStore = create<SensorStoreState>((set) => ({
  current: DEFAULT_ENV,
  history: [],
  maxHistoryLength: 120, // 120 points * 200ms = 24 seconds continuous window

  updateEnvironment: (env) =>
    set((state) => {
      const now = new Date();
      const timeStr = `${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}.${Math.floor(now.getMilliseconds() / 100)}`;
      const newPoint: HistoryPoint = {
        timeStr,
        timestamp: env.timestamp || Date.now() / 1000,
        depth: Number(env.depth.toFixed(1)),
        temperature: Number(env.temperature.toFixed(1)),
        salinity: Number(env.salinity.toFixed(1)),
        turbidity: Number(env.turbidity.toFixed(1)),
        noise_level: Number(env.noise_level.toFixed(1)),
        target_distance: Number(env.target_distance.toFixed(1)),
        battery: Number(env.battery.toFixed(1)),
        speed_of_sound: Number(env.speed_of_sound.toFixed(1)),
      };

      const history = [...state.history, newPoint];
      if (history.length > state.maxHistoryLength) {
        history.shift();
      }

      return {
        current: env,
        history,
      };
    }),

  resetHistory: () => set({ history: [] }),
}));
