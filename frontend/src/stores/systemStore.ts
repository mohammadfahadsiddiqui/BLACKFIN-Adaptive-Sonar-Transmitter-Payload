// BLACKFIN — System State Store (Zustand)

import { create } from 'zustand';
import { SystemStatus, ComponentHealth } from '../types';

interface SystemState {
  status: SystemStatus;
  components: ComponentHealth[];
  wsConnected: boolean;
  activeTab: string;
  isBooting: boolean;
  mobileMenuOpen: boolean;
  setWsConnected: (connected: boolean) => void;
  updateSystemStatus: (status: Partial<SystemStatus>) => void;
  updateComponents: (components: ComponentHealth[]) => void;
  setActiveTab: (tab: string) => void;
  setMobileMenuOpen: (open: boolean) => void;
  finishBoot: () => void;
  triggerBoot: () => void;
}

export const useSystemStore = create<SystemState>((set) => ({
  status: {
    mode: 'simulation',
    adaptation_mode: 'auto',
    sonar_running: true,
    connected: true,
    uptime: 0,
    data_source: 'SIMULATION',
    tick_count: 0,
  },
  components: [
    { name: 'STM32 Controller', status: 'offline', last_update: Date.now(), latency_ms: 0, details: 'Simulation mode' },
    { name: 'Environment Sensors', status: 'online', last_update: Date.now(), latency_ms: 2.1, details: 'Telemetry OK' },
    { name: 'DAC', status: 'online', last_update: Date.now(), latency_ms: 0.5, details: '12-bit High Speed' },
    { name: 'Sonar Transducer', status: 'online', last_update: Date.now(), latency_ms: 1.2, details: 'Piezoelectric Ceramic' },
    { name: 'Signal Processor', status: 'online', last_update: Date.now(), latency_ms: 3.4, details: 'FFT & Hilbert Engine' },
    { name: 'Adaptive Engine', status: 'online', last_update: Date.now(), latency_ms: 1.8, details: 'Heuristic Rule Matrix' },
    { name: 'Dashboard', status: 'online', last_update: Date.now(), latency_ms: 0.4, details: 'WebSocket Live' },
  ],
  wsConnected: false,
  activeTab: 'mission',
  isBooting: true,
  mobileMenuOpen: false,

  setWsConnected: (connected) => set({ wsConnected: connected }),
  updateSystemStatus: (status) =>
    set((state) => ({ status: { ...state.status, ...status } })),
  updateComponents: (components) => set({ components }),
  setActiveTab: (activeTab) => set({ activeTab, mobileMenuOpen: false }),
  setMobileMenuOpen: (mobileMenuOpen) => set({ mobileMenuOpen }),
  finishBoot: () => set({ isBooting: false }),
  triggerBoot: () => set({ isBooting: true }),
}));

