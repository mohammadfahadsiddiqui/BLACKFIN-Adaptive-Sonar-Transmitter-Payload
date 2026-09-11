// BLACKFIN — System Diagnostics, Hardware Interface & Health Page

import React, { useState } from 'react';
import { useSystemStore } from '../stores/systemStore';
import { apiClient } from '../services/apiClient';
import { StatusIndicator } from '../components/cards/StatusIndicator';
import { Cpu, Server, Activity, ShieldCheck, Play, Square, RefreshCw, Terminal, CheckCircle2 } from 'lucide-react';

export const SystemHealth: React.FC = () => {
  const status = useSystemStore((state) => state.status);
  const components = useSystemStore((state) => state.components);
  const [isResetting, setIsResetting] = useState<boolean>(false);

  const handleStart = async () => {
    await apiClient.startSonar();
    useSystemStore.getState().updateSystemStatus({ sonar_running: true });
  };

  const handleStop = async () => {
    await apiClient.stopSonar();
    useSystemStore.getState().updateSystemStatus({ sonar_running: false });
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      await apiClient.resetSystem();
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="p-5 space-y-4 max-w-[1700px] mx-auto overflow-y-auto max-h-[calc(100vh-5.5rem)] pb-8">
      {/* Top Banner */}
      <div className="panel-base p-4 bg-gradient-to-r from-[#0d1627] via-[#0e1d35] to-[#0d1627] border-cyan-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
              <Cpu className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm font-bold uppercase tracking-wider text-white">
                  BLACKFIN System Health & Hardware Abstraction Layer
                </h2>
                <span className="badge-tag bg-emerald-950 text-emerald-300 border border-emerald-800">
                  ● ALL SUBSYSTEMS NOMINAL
                </span>
              </div>
              <p className="text-xs text-slate-400 font-mono mt-0.5">
                Subsystem latency monitoring, packet encoder, and STM32 interface diagnostics
              </p>
            </div>
          </div>

          {/* Quick Payload Control Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={handleStart}
              disabled={status.sonar_running}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                status.sonar_running
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg'
              }`}
            >
              <Play className="w-3.5 h-3.5 fill-current" /> START SONAR
            </button>

            <button
              onClick={handleStop}
              disabled={!status.sonar_running}
              className={`px-3 py-1.5 rounded-lg text-xs font-mono font-bold flex items-center gap-1.5 transition-all ${
                !status.sonar_running
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-rose-600 hover:bg-rose-500 text-white shadow-lg'
              }`}
            >
              <Square className="w-3.5 h-3.5 fill-current" /> STOP SONAR
            </button>

            <button
              onClick={handleReset}
              disabled={isResetting}
              className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-mono text-xs font-bold border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} /> REBOOT
            </button>
          </div>
        </div>
      </div>

      {/* Components Health Table */}
      <div className="panel-base p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Server className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Payload Component Diagnostics
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            PAYLOAD SOURCE: <strong className="text-cyan-400 font-bold">{status.data_source}</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                <th className="py-2.5 px-3">Subsystem Name</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3">Interface Bus</th>
                <th className="py-2.5 px-3">Round-Trip Latency</th>
                <th className="py-2.5 px-3 text-right">Operational State</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {components.map((c, idx) => (
                <tr key={idx} className="hover:bg-slate-800/30 transition-all">
                  <td className="py-3 px-3 font-semibold text-white flex items-center gap-2">
                    <StatusIndicator
                      status={c.status === 'online' ? 'online' : c.status === 'error' ? 'error' : 'offline'}
                      size="sm"
                      pulse={c.status === 'online'}
                    />
                    {c.name}
                  </td>
                  <td className="py-3 px-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        c.status === 'online'
                          ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                          : c.status === 'offline'
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-rose-950 text-rose-300 border border-rose-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-slate-400">
                    {idx === 0
                      ? 'UART / USB (115200 baud)'
                      : idx === 1
                      ? 'I2C / SPI Sensor Bus'
                      : idx === 2
                      ? 'DMA High-Speed DAC Bus'
                      : idx === 3
                      ? 'Acoustic Analog Front-End'
                      : idx === 4
                      ? 'NumPy / SciPy DSP Engine'
                      : idx === 5
                      ? 'FastAPI Heuristic Loop'
                      : 'WebSocket (ws://localhost:8000)'}
                  </td>
                  <td className="py-3 px-3 text-cyan-300">
                    {c.latency_ms > 0 ? `${c.latency_ms.toFixed(1)} ms` : '--'}
                  </td>
                  <td className="py-3 px-3 text-right text-slate-300">{c.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Hardware Interface & STM32 Protocol Specs */}
      <div className="panel-base p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Hardware Abstraction Layer (HAL) & STM32 Protocol Architecture
            </h3>
          </div>
          <span className="badge-tag bg-cyan-950 text-cyan-300 border border-cyan-800">
            UART PACKET READY
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 text-xs font-mono">
          <div className="bg-[#080d17] border border-slate-800 rounded-lg p-3 space-y-2">
            <span className="text-cyan-400 font-bold block">
              1. Downlink Configuration Frame (Payload → STM32 DAC)
            </span>
            <pre className="text-[11px] text-slate-300 bg-[#05080e] p-2.5 rounded border border-slate-900 overflow-x-auto">
{`{
  "sync": "0xAA55",
  "command": "SET_CONFIG",
  "frequency_hz": ${status.sonar_running ? 100000 : 0},
  "bandwidth_hz": 10000,
  "pulse_duration_us": 5000,
  "power_mw": 8000,
  "waveform": "LFM_UP",
  "checksum": "0x7F"
}`}
            </pre>
            <p className="text-[10px] text-slate-500">
              Dispatched when the adaptive engine executes a parameter shift. Encoded into fixed-size binary frames for microsecond DAC DMA generation.
            </p>
          </div>

          <div className="bg-[#080d17] border border-slate-800 rounded-lg p-3 space-y-2">
            <span className="text-emerald-400 font-bold block">
              2. Uplink Telemetry Frame (Sensors / Hydrophone → Payload)
            </span>
            <pre className="text-[11px] text-slate-300 bg-[#05080e] p-2.5 rounded border border-slate-900 overflow-x-auto">
{`{
  "sync": "0x55AA",
  "packet_id": ${status.tick_count},
  "depth_dm": 200,          // 20.0 m
  "temp_c_x10": 220,        // 22.0 °C
  "salinity_x10": 350,      // 35.0 PSU
  "turbidity_pct": 10,
  "adc_samples": [ ... ],   // 1024-sample echo
  "status_flags": "0x01"    // Nominal
}`}
            </pre>
            <p className="text-[10px] text-slate-500">
              Received continuously at 5 Hz. Feeding the Python DSP Hilbert transform and matched filter peak detector.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
