// BLACKFIN — REST API Client

const API_BASE = 'http://localhost:8000/api';

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
}

export const apiClient = {
  async getSystemStatus() {
    const res = await fetch(`${API_BASE}/system/status`);
    return res.json();
  },

  async getLatestSensors() {
    const res = await fetch(`${API_BASE}/sensors/latest`);
    return res.json();
  },

  async getSonarConfig() {
    const res = await fetch(`${API_BASE}/sonar/configuration`);
    return res.json();
  },

  async getTargets() {
    const res = await fetch(`${API_BASE}/targets`);
    return res.json();
  },

  async getEvents(category?: string, limit: number = 100) {
    const url = new URL(`${API_BASE}/events`);
    if (category && category !== 'all') url.searchParams.set('category', category);
    url.searchParams.set('limit', limit.toString());
    const res = await fetch(url.toString());
    return res.json();
  },

  async getEnergy() {
    const res = await fetch(`${API_BASE}/energy`);
    return res.json();
  },

  async getHealth() {
    const res = await fetch(`${API_BASE}/health`);
    return res.json();
  },

  async getAdaptationHistory(limit: number = 50) {
    const res = await fetch(`${API_BASE}/adaptation/history?limit=${limit}`);
    return res.json();
  },

  async getPresets() {
    const res = await fetch(`${API_BASE}/presets`);
    return res.json();
  },

  async startSonar() {
    const res = await fetch(`${API_BASE}/sonar/start`, { method: 'POST' });
    return res.json();
  },

  async stopSonar() {
    const res = await fetch(`${API_BASE}/sonar/stop`, { method: 'POST' });
    return res.json();
  },

  async setAdaptationMode(mode: 'auto' | 'manual') {
    const res = await fetch(`${API_BASE}/adaptation/configure?mode=${mode}`, {
      method: 'POST',
    });
    return res.json();
  },

  async setManualSonarConfig(config: {
    frequency?: number;
    bandwidth?: number;
    pulse_duration?: number;
    transmit_power?: number;
  }) {
    const res = await fetch(`${API_BASE}/sonar/manual`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(config),
    });
    return res.json();
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
    const res = await fetch(`${API_BASE}/simulation/environment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params),
    });
    return res.json();
  },

  async applyPreset(presetName: string) {
    const res = await fetch(`${API_BASE}/simulation/preset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ preset_name: presetName }),
    });
    return res.json();
  },

  async resetSystem() {
    const res = await fetch(`${API_BASE}/system/reset`, { method: 'POST' });
    return res.json();
  },
};
