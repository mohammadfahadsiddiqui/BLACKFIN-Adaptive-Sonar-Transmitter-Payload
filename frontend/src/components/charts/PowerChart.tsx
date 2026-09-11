// BLACKFIN — Power Consumption & Energy Savings Chart

import React from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useSonarStore } from '../../stores/sonarStore';
import { Zap, ShieldCheck } from 'lucide-react';

export const PowerChart: React.FC<{ height?: number }> = ({ height = 220 }) => {
  const energy = useSonarStore((state) => state.energy);
  const powerHistory = useSonarStore((state) => state.powerHistory);

  return (
    <div className="panel-base p-4 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Real-time Transmit Power & Energy Optimization
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono">
          <span className="badge-tag bg-emerald-950/80 text-emerald-300 border border-emerald-700/60">
            <ShieldCheck className="w-3 h-3 text-emerald-400 inline mr-1" />
            {energy.energy_saved_percent.toFixed(1)}% ENERGY SAVED
          </span>
          <span className="text-slate-400">
            CURR: <strong className="text-amber-400 font-bold">{energy.current_power.toFixed(1)} W</strong>
          </span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height }}>
        {powerHistory.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">
            Tracking energy telemetry...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={powerHistory} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="powerGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.5} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="timeStr"
                stroke="#334155"
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[0, 20]}
                stroke="#334155"
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                unit="W"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#090f1a] border border-amber-500/40 p-2 rounded shadow-lg text-[11px] font-mono">
                        <p className="text-amber-400 font-semibold">{data.timeStr}</p>
                        <p className="text-white">Active Power: {data.power} W</p>
                        <p className="text-slate-400">Fixed Baseline: {data.baseline} W</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              {/* Baseline reference */}
              <Line
                type="monotone"
                dataKey="baseline"
                stroke="#ef4444"
                strokeDasharray="4 4"
                strokeWidth={1.5}
                dot={false}
                name="Conventional Fixed Sonar (12W)"
                isAnimationActive={false}
              />
              {/* Actual Power */}
              <Area
                type="monotone"
                dataKey="power"
                stroke="#f59e0b"
                strokeWidth={2}
                fill="url(#powerGradient)"
                name="BLACKFIN Adaptive Power"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Comparison */}
      <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-1 bg-amber-400 inline-block rounded-sm" />
          Adaptive Dynamic Power (Current avg: {energy.average_power.toFixed(1)}W)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-rose-500 border-dashed inline-block" />
          Fixed Non-Adaptive Baseline (12.0W)
        </span>
      </div>
    </div>
  );
};
