// BLACKFIN — TypeScript Type Definitions

export type SystemMode = 'simulation' | 'hardware';
export type AdaptationMode = 'auto' | 'manual';
export type WaveformType = 'LFM' | 'CW' | 'HFM';
export type ComponentStatus = 'online' | 'offline' | 'warning' | 'error';
export type EventCategory = 'environment' | 'sonar' | 'adaptation' | 'target' | 'hardware' | 'warning' | 'system';

export interface EnvironmentState {
  timestamp: number;
  depth: number;                // meters (5 - 500)
  temperature: number;          // °C (0 - 30)
  salinity: number;             // PSU (30 - 40)
  turbidity: number;            // % (0 - 100)
  noise_level: number;          // dB (40 - 100)
  target_distance: number;      // meters (5 - 200)
  battery: number;              // % (0 - 100)
  speed_of_sound: number;       // m/s (calculated)
}

export interface SonarDisplayConfig {
  frequency_khz: number;
  bandwidth_khz: number;
  pulse_duration_ms: number;
  transmit_power_w: number;
  waveform_type: WaveformType;
  mode: AdaptationMode;
}

export interface TargetDetection {
  timestamp: number;
  detected: boolean;
  estimated_range: number;      // meters
  signal_strength: number;      // dB
  snr: number;                  // dB
  confidence: number;           // % (0 - 100)
  peak_amplitude: number;
}

export interface AdaptationResult {
  timestamp: number;
  triggered: boolean;
  old_config: Record<string, any>;
  new_config: Record<string, any>;
  reason: string;
  triggered_rules: string[];
  confidence: number;
  environment_snapshot: Record<string, number>;
}

export interface EnergyMetrics {
  current_power: number;         // Watts
  average_power: number;         // Watts
  total_energy: number;          // Wh
  battery_level: number;         // %
  estimated_remaining_hours: number;
  adaptive_efficiency: number;   // %
  energy_saved_percent: number;  // %
}

export interface SystemStatus {
  mode: SystemMode;
  adaptation_mode: AdaptationMode;
  sonar_running: boolean;
  connected: boolean;
  uptime: number;
  data_source: string;
  tick_count: number;
}

export interface ComponentHealth {
  name: string;
  status: ComponentStatus;
  last_update: number;
  latency_ms: number;
  details: string;
}

export interface SystemHealthData {
  components: ComponentHealth[];
  uptime_seconds: number;
  mode: SystemMode;
  data_source: string;
}

export interface EchoPeak {
  time: number;
  amplitude: number;
  range: number;
}

export interface SignalData {
  timestamp: number;
  time_axis: number[];          // ms
  amplitude: number[];          // normalized amplitude
  freq_axis: number[];          // kHz
  magnitude: number[];          // dB
  echo_peaks: EchoPeak[];
}

export interface SonarPayload {
  signal: SignalData;
  waterfall_row: number[];
}

export interface SystemEvent {
  timestamp: number;
  category: EventCategory;
  message: string;
  details?: Record<string, any> | null;
}

export interface DashboardPayload {
  environment: EnvironmentState;
  sonar_config: SonarDisplayConfig;
  target: TargetDetection;
  energy: EnergyMetrics;
  system_status: SystemStatus;
  latest_adaptation: AdaptationResult | null;
}

export interface EnvironmentPreset {
  depth: number;
  temperature: number;
  salinity: number;
  turbidity: number;
  noise_level: number;
  target_distance: number;
  battery: number;
  description: string;
}
