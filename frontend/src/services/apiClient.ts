// BLACKFIN — Hybrid REST API Client
// Transparently switches between FastAPI backend and local Client-Side Simulation Engine
// to guarantee 100% full interactivity and live graphs on Vercel deployments.

import { clientSimulation } from './clientSimulationEngine';
import { useSonarStore } from '../stores/sonarStore';
import { useSensorStore } from '../stores/sensorStore';
import { useSystemStore } from '../stores/systemStore';

const getApiBase = (): string | null => {
  if (typeof window === 'undefined') return 'http://127.0.0.1:8000/api';
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }
  const host = window.location.hostname || '127.0.0.1';
  if (host === 'localhost' || host === '127.0.0.1') {
    return 'http://127.0.0.1:8000/api';
  }
  return null;
};

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

export const apiClient = {
  async getSystemStatus() {
    const base = getApiBase();
    if (!base) return { status: 'online', mode: 'simulation' };
    try {
      const res = await fetch(`${base}/system/status`);
      return await res.json();
    } catch {
      return { status: 'online', mode: 'simulation' };
    }
  },

  async getLatestSensors() {
    const base = getApiBase();
    if (!base) return useSensorStore.getState().current;
    try {
      const res = await fetch(`${base}/sensors/latest`);
      return await res.json();
    } catch {
      return useSensorStore.getState().current;
    }
  },

  async getSonarConfig() {
    const base = getApiBase();
    if (!base) return useSonarStore.getState().config;
    try {
      const res = await fetch(`${base}/sonar/configuration`);
      return await res.json();
    } catch {
      return useSonarStore.getState().config;
    }
  },

  async getTargets() {
    const base = getApiBase();
    if (!base) return useSonarStore.getState().target;
    try {
      const res = await fetch(`${base}/targets`);
      return await res.json();
    } catch {
      return useSonarStore.getState().target;
    }
  },

  async getEvents(category?: string, limit: number = 100) {
    const base = getApiBase();
    if (!base) return [];
    try {
      const url = new URL(`${base}/events`);
      if (category && category !== 'all') url.searchParams.set('category', category);
      url.searchParams.set('limit', limit.toString());
      const res = await fetch(url.toString());
      return await res.json();
    } catch {
      return [];
    }
  },

  async getEnergy() {
    const base = getApiBase();
    if (!base) return useSonarStore.getState().energy;
    try {
      const res = await fetch(`${base}/energy`);
      return await res.json();
    } catch {
      return useSonarStore.getState().energy;
    }
  },

  async getHealth() {
    const base = getApiBase();
    if (!base) return { components: useSystemStore.getState().components };
    try {
      const res = await fetch(`${base}/health`);
      return await res.json();
    } catch {
      return { components: useSystemStore.getState().components };
    }
  },

  async getAdaptationHistory(limit: number = 50) {
    const base = getApiBase();
    if (!base) return useSonarStore.getState().adaptationHistory;
    try {
      const res = await fetch(`${base}/adaptation/history?limit=${limit}`);
      return await res.json();
    } catch {
      return useSonarStore.getState().adaptationHistory;
    }
  },

  async getPresets() {
    const base = getApiBase();
    if (!base) return {};
    try {
      const res = await fetch(`${base}/presets`);
      return await res.json();
    } catch {
      return {};
    }
  },

  async startSonar() {
    useSystemStore.getState().updateSystemStatus({ sonar_running: true });
    clientSimulation.start();
    const base = getApiBase();
    if (base) {
      try {
        await fetch(`${base}/sonar/start`, { method: 'POST' });
      } catch {}
    }
    return { status: 'started' };
  },

  async stopSonar() {
    useSystemStore.getState().updateSystemStatus({ sonar_running: false });
    clientSimulation.stop();
    const base = getApiBase();
    if (base) {
      try {
        await fetch(`${base}/sonar/stop`, { method: 'POST' });
      } catch {}
    }
    return { status: 'stopped' };
  },

  async setAdaptationMode(mode: 'auto' | 'manual') {
    const config = useSonarStore.getState().config;
    useSonarStore.getState().updateSonarConfig({ ...config, mode });
    const base = getApiBase();
    if (base) {
      try {
        await fetch(`${base}/adaptation/configure?mode=${mode}`, { method: 'POST' });
      } catch {}
    }
    return { mode };
  },

  async setManualSonarConfig(config: {
    frequency?: number;
    bandwidth?: number;
    pulse_duration?: number;
    transmit_power?: number;
  }) {
    const current = useSonarStore.getState().config;
    useSonarStore.getState().updateSonarConfig({
      ...current,
      ...(config.frequency ? { frequency_khz: config.frequency / 1000 } : {}),
      ...(config.bandwidth ? { bandwidth_khz: config.bandwidth / 1000 } : {}),
      ...(config.pulse_duration ? { pulse_duration_ms: config.pulse_duration * 1000 } : {}),
      ...(config.transmit_power ? { transmit_power_w: config.transmit_power } : {}),
    });
    const base = getApiBase();
    if (base) {
      try {
        await fetch(`${base}/sonar/manual`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(config),
        });
      } catch {}
    }
    return { status: 'updated' };
  },

  async updateSimulation(params: {
    depth?: number;
    temperature?: number;
    salinity?: number;
    turbidity?: number;
    noise_level?: number;
    target_distance?: number;
    battery?: number;
  }) {
    clientSimulation.setEnvironmentOverrides(params);
    const base = getApiBase();
    if (base) {
      try {
        await fetch(`${base}/simulation/environment`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(params),
        });
      } catch {}
    }
    return { status: 'updated' };
  },

  async applyPreset(presetName: string) {
    const presets: Record<string, any> = {
      shallow_harbor: { depth: 15, turbidity: 45, noise_level: 62, target_distance: 28 },
      deep_ocean: { depth: 250, temperature: 4, turbidity: 5, target_distance: 75 },
      thermocline: { depth: 85, temperature: 12, target_distance: 55 },
      target_detected: { target_distance: 35, noise_level: 48 },
    };
    if (presets[presetName]) {
      clientSimulation.setEnvironmentOverrides(presets[presetName]);
    }
    const base = getApiBase();
    if (base) {
      try {
        await fetch(`${base}/simulation/preset`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ preset_name: presetName }),
        });
      } catch {}
    }
    return { status: 'applied', preset: presetName };
  },

  async resetSystem() {
    clientSimulation.reset();
    const base = getApiBase();
    if (base) {
      try {
        await fetch(`${base}/system/reset`, { method: 'POST' });
      } catch {}
    }
    return { status: 'reset' };
  },
};
