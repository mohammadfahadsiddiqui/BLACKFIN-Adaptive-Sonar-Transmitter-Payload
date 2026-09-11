// BLACKFIN — Hero Metric: Adaptive Power Efficiency & Comparative Savings Panel

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
import { Zap, ShieldCheck, TrendingDown, BatteryCharging, Sparkles } from 'lucide-react';

export const AdaptivePowerEfficiencyPanel: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const energy = useSonarStore((state) => state.energy);
  const powerHistory = useSonarStore((state) => state.powerHistory);

  const baselinePower = 12.0; // Fixed-frequency non-adaptive reference baseline (W)
  const currentPower = energy.current_power;
  const powerDelta = Math.max(0, baselinePower - currentPower);
  const savingsPct = baselinePower > 0
    ? Math.max(0, Math.min(85, ((baselinePower - currentPower) / baselinePower) * 100))
    : 0;

  // Estimated mission dive life multiplier (e.g. 12W vs 6.7W = 1.79x)
  const lifeMultiplier = currentPower > 0 ? (baselinePower / currentPower).toFixed(1) : '2.0';

  return (
    <div className="panel-base p-4 bg-gradient-to-br from-[#0b172a] via-[#0d1c33] to-[#091120] border-emerald-500/40 shadow-[0_0_25px_-5px_rgba(16,185,129,0.25)] flex flex-col justify-between relative overflow-hidden">
      {/* Background ambient decorative glow */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Header with Pitch Badge */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-emerald-950/80 border border-emerald-600/50 text-emerald-400">
            <Zap className="w-4 h-4 fill-emerald-400 animate-pulse" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-white flex items-center gap-1.5">
              Adaptive Power Efficiency
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-normal">
                HERO METRIC
              </span>
            </h3>
            <p className="text-[10px] text-slate-400 font-mono">
              SIH-26058 Low-Power Acoustic Transmitter Benchmark
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono">
          <span className="badge-tag bg-emerald-950/90 text-emerald-300 border border-emerald-500/60 shadow-[0_0_10px_rgba(16,185,129,0.3)]">
            <ShieldCheck className="w-3 h-3 text-emerald-400 inline mr-1" />
            CLOSED-LOOP THROTTLED
          </span>
        </div>
      </div>

      {/* Hero Metric Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center mb-3">
        {/* Dominant Large % Savings Badge */}
        <div className="md:col-span-6 bg-[#070d17]/90 border border-emerald-500/40 rounded-xl p-3.5 flex items-center justify-between shadow-inner">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-slate-400 block mb-1">
              REAL-TIME TRANSMIT POWER REDUCTION
            </span>
            <div className="flex items-baseline gap-2">
              <span className="font-mono text-3xl sm:text-4xl font-black tracking-tight text-emerald-400 drop-shadow-[0_0_15px_rgba(52,211,153,0.5)]">
                {savingsPct.toFixed(1)}%
              </span>
              <span className="font-mono text-xs font-bold text-emerald-300 uppercase">
                SAVINGS
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono mt-1 flex items-center gap-1">
              <TrendingDown className="w-3 h-3 text-emerald-400" />
              {powerDelta.toFixed(1)}W lower than fixed 12W transmitter
            </p>
          </div>

          <div className="text-right pl-3 border-l border-slate-800 shrink-0 font-mono">
            <div className="text-[9px] text-slate-500 uppercase">AUV MISSION LIFE</div>
            <div className="text-xl font-extrabold text-cyan-300 tracking-tight mt-0.5">
              +{lifeMultiplier}x
            </div>
            <div className="text-[9px] text-emerald-400 font-semibold mt-0.5">
              LONGER DIVE
            </div>
          </div>
        </div>

        {/* Real-time Side-by-Side Values */}
        <div className="md:col-span-6 grid grid-cols-2 gap-2.5 font-mono text-xs">
          <div className="bg-[#070c16]/80 border border-amber-500/30 rounded-lg p-2.5">
            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>ACTIVE ADAPTIVE DRAW</span>
              <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping" />
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-white tracking-tight">
                {currentPower.toFixed(1)}
              </span>
              <span className="text-[11px] text-amber-400 font-semibold">Watts</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Dynamically matched to range
            </div>
          </div>

          <div className="bg-[#070c16]/80 border border-rose-900/40 rounded-lg p-2.5">
            <div className="text-[10px] text-slate-400 flex items-center justify-between">
              <span>FIXED BASELINE REF</span>
              <span className="text-[9px] text-rose-400 font-semibold">CONVENTIONAL</span>
            </div>
            <div className="mt-1 flex items-baseline gap-1">
              <span className="text-2xl font-bold text-slate-300 tracking-tight line-through opacity-80">
                12.0
              </span>
              <span className="text-[11px] text-slate-400 font-semibold">Watts</span>
            </div>
            <div className="text-[10px] text-slate-500 mt-0.5">
              Static non-adaptive baseline
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Live Sparkline Tracking Savings Over Time */}
      <div className="bg-[#060a12] border border-slate-800/90 rounded-lg p-2.5">
        <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-1">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-0.5 bg-emerald-400 inline-block" />
            Adaptive Consumption vs Fixed Baseline (12.0W)
          </span>
          <span className="text-emerald-400 font-semibold">
            {powerHistory.length} SCANS BUFFERED
          </span>
        </div>

        <div style={{ width: '100%', height: compact ? 80 : 100 }}>
          {powerHistory.length === 0 ? (
            <div className="h-full flex items-center justify-center text-slate-500 font-mono text-[10px]">
              Sampling power telemetry...
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={powerHistory} margin={{ top: 4, right: 6, left: -24, bottom: 0 }}>
                <defs>
                  <linearGradient id="adaptiveSavingsGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.45} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="timeStr" hide />
                <YAxis domain={[0, 16]} stroke="#1e293b" tick={{ fill: '#64748b', fontSize: 9 }} unit="W" />
                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      const sav = Math.max(0, ((12.0 - data.power) / 12.0) * 100).toFixed(0);
                      return (
                        <div className="bg-[#090f1a] border border-emerald-500/50 p-1.5 rounded text-[10px] font-mono">
                          <p className="text-white">Active: {data.power}W (Baseline: 12W)</p>
                          <p className="text-emerald-400 font-bold">{sav}% Power Saved</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Line type="monotone" dataKey="baseline" stroke="#f43f5e" strokeDasharray="3 3" strokeWidth={1} dot={false} isAnimationActive={false} />
                <Area type="monotone" dataKey="power" stroke="#10b981" strokeWidth={2} fill="url(#adaptiveSavingsGradient)" dot={false} isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
};
