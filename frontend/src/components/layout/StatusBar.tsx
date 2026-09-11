// BLACKFIN — Bottom Telemetry Status Bar

import React from 'react';
import { useSystemStore } from '../../stores/systemStore';
import { useSonarStore } from '../../stores/sonarStore';
import { useSensorStore } from '../../stores/sensorStore';
import { Activity, Battery, Cpu, Clock } from 'lucide-react';

export const StatusBar: React.FC = () => {
  const status = useSystemStore((state) => state.status);
  const wsConnected = useSystemStore((state) => state.wsConnected);
  const config = useSonarStore((state) => state.config);
  const energy = useSonarStore((state) => state.energy);
  const sensor = useSensorStore((state) => state.current);

  const formatUptime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <footer className="h-7 bg-[#060910] border-t border-[#1f3352] px-4 flex items-center justify-between text-[11px] font-mono text-slate-400 select-none z-30">
      {/* Left items */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1.5">
          <span
            className={`w-2 h-2 rounded-full ${
              wsConnected ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]' : 'bg-rose-500'
            }`}
          />
          <span className="text-slate-300">
            {wsConnected ? 'TELEMETRY STREAM: 5 Hz (200ms)' : 'STREAM: DISCONNECTED'}
          </span>
        </span>

        <span className="hidden sm:inline-block text-slate-600">|</span>

        <span className="hidden sm:flex items-center gap-1">
          <Clock className="w-3 h-3 text-slate-500" />
          <span>UPTIME: {formatUptime(status.uptime)}</span>
        </span>

        <span className="hidden md:inline-block text-slate-600">|</span>

        <span className="hidden md:flex items-center gap-1">
          <Activity className="w-3 h-3 text-cyan-400" />
          <span>TICKS: {status.tick_count}</span>
        </span>
      </div>

      {/* Right items */}
      <div className="flex items-center gap-4">
        <span className="flex items-center gap-1">
          <span className="text-slate-500">TX:</span>
          <span className="text-cyan-300 font-bold">{config.frequency_khz.toFixed(0)} kHz</span>
          <span className="text-slate-500">@</span>
          <span className="text-amber-300 font-bold">{config.transmit_power_w.toFixed(1)}W</span>
        </span>

        <span className="text-slate-600">|</span>

        <span className="flex items-center gap-1.5">
          <Battery
            className={`w-3 h-3 ${
              sensor.battery < 20 ? 'text-rose-400 animate-pulse' : 'text-emerald-400'
            }`}
          />
          <span className="text-slate-300 font-bold">{sensor.battery.toFixed(0)}%</span>
          <span className="text-slate-500 hidden lg:inline">
            (~{energy.estimated_remaining_hours.toFixed(1)}h)
          </span>
        </span>
      </div>
    </footer>
  );
};
