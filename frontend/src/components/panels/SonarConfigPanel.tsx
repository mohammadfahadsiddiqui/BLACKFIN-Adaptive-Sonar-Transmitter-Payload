// BLACKFIN — Sonar Configuration Display Panel

import React from 'react';
import { useSonarStore } from '../../stores/sonarStore';
import { useSystemStore } from '../../stores/systemStore';
import { apiClient } from '../../services/apiClient';
import { Radio, Gauge, Clock, Zap, Waves, Cpu, Play, Square } from 'lucide-react';

export const SonarConfigPanel: React.FC = () => {
  const config = useSonarStore((state) => state.config);
  const status = useSystemStore((state) => state.status);

  const toggleSonar = async () => {
    if (status.sonar_running) {
      await apiClient.stopSonar();
      useSystemStore.getState().updateSystemStatus({ sonar_running: false });
    } else {
      await apiClient.startSonar();
      useSystemStore.getState().updateSystemStatus({ sonar_running: true });
    }
  };

  const paramItems = [
    {
      label: 'Carrier Frequency',
      value: `${config.frequency_khz.toFixed(1)}`,
      unit: 'kHz',
      sub: 'Band: 20 – 200 kHz',
      icon: Radio,
      color: 'text-cyan-400',
    },
    {
      label: 'Signal Bandwidth',
      value: `${config.bandwidth_khz.toFixed(1)}`,
      unit: 'kHz',
      sub: 'Range: 1 – 50 kHz',
      icon: Gauge,
      color: 'text-blue-400',
    },
    {
      label: 'Pulse Duration',
      value: `${config.pulse_duration_ms.toFixed(1)}`,
      unit: 'ms',
      sub: 'Range: 0.1 – 50 ms',
      icon: Clock,
      color: 'text-purple-400',
    },
    {
      label: 'Acoustic Power',
      value: `${config.transmit_power_w.toFixed(1)}`,
      unit: 'Watts',
      sub: 'Range: 0.5 – 20 W',
      icon: Zap,
      color: 'text-amber-400',
    },
    {
      label: 'Modulation Waveform',
      value: config.waveform_type,
      unit: '',
      sub: 'Chirp / Continuous',
      icon: Waves,
      color: 'text-emerald-400',
    },
    {
      label: 'Operational Mode',
      value: config.mode.toUpperCase(),
      unit: '',
      sub: config.mode === 'auto' ? 'Closed-loop adaptive' : 'Manual operator hold',
      icon: Cpu,
      color: config.mode === 'auto' ? 'text-cyan-400' : 'text-amber-400',
    },
  ];

  return (
    <div className="panel-base p-4 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Waves className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Active Sonar Transmission Parameters
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`badge-tag ${
              config.mode === 'auto'
                ? 'bg-cyan-950/80 text-cyan-300 border border-cyan-700/60'
                : 'bg-amber-950/80 text-amber-300 border border-amber-700/60'
            }`}
          >
            ● {config.mode === 'auto' ? 'AUTONOMOUS ADAPTIVE' : 'MANUAL OVERRIDE'}
          </span>
          <button
            onClick={toggleSonar}
            className={`px-2.5 py-1 rounded text-xs font-mono font-semibold flex items-center gap-1.5 transition-all ${
              status.sonar_running
                ? 'bg-rose-950/70 border border-rose-700/60 text-rose-300 hover:bg-rose-900/80'
                : 'bg-emerald-950/70 border border-emerald-700/60 text-emerald-300 hover:bg-emerald-900/80'
            }`}
          >
            {status.sonar_running ? (
              <>
                <Square className="w-3 h-3 fill-rose-400" /> STOP PING
              </>
            ) : (
              <>
                <Play className="w-3 h-3 fill-emerald-400" /> START PING
              </>
            )}
          </button>
        </div>
      </div>

      {/* Grid of parameters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
        {paramItems.map((item, idx) => {
          const Icon = item.icon;
          return (
            <div
              key={idx}
              className="bg-[#080d17]/80 border border-slate-800/80 rounded-lg p-2.5 hover:border-slate-700/80 transition-all"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-400">
                <span className="truncate">{item.label}</span>
                <Icon className={`w-3.5 h-3.5 ${item.color}`} />
              </div>
              <div className="mt-1 flex items-baseline gap-1 font-mono">
                <span className="text-xl font-bold text-white tracking-tight">
                  {item.value}
                </span>
                {item.unit && (
                  <span className="text-[11px] font-semibold text-slate-400">
                    {item.unit}
                  </span>
                )}
              </div>
              <div className="mt-0.5 text-[10px] font-mono text-slate-500">
                {item.sub}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
