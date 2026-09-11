// BLACKFIN — KPI Metric Card Component

import React from 'react';
import { LucideIcon } from 'lucide-react';

interface KPICardProps {
  label: string;
  value: string | number;
  unit?: string;
  icon?: LucideIcon;
  subtext?: string;
  trend?: 'up' | 'down' | 'stable';
  trendValue?: string;
  accentColor?: 'cyan' | 'emerald' | 'amber' | 'rose' | 'purple' | 'blue';
  progress?: number; // 0 - 100
}

export const KPICard: React.FC<KPICardProps> = ({
  label,
  value,
  unit,
  icon: Icon,
  subtext,
  trend,
  trendValue,
  accentColor = 'cyan',
  progress,
}) => {
  const accentGlow = {
    cyan: 'border-[#1f3352] hover:border-cyan-500/50 hover:shadow-[0_0_15px_-3px_rgba(0,242,254,0.25)]',
    emerald: 'border-[#1f3352] hover:border-emerald-500/50 hover:shadow-[0_0_15px_-3px_rgba(16,185,129,0.25)]',
    amber: 'border-[#1f3352] hover:border-amber-500/50 hover:shadow-[0_0_15px_-3px_rgba(245,158,11,0.25)]',
    rose: 'border-[#1f3352] hover:border-rose-500/50 hover:shadow-[0_0_15px_-3px_rgba(244,63,94,0.25)]',
    purple: 'border-[#1f3352] hover:border-purple-500/50 hover:shadow-[0_0_15px_-3px_rgba(139,92,246,0.25)]',
    blue: 'border-[#1f3352] hover:border-sky-500/50 hover:shadow-[0_0_15px_-3px_rgba(14,165,233,0.25)]',
  };

  const iconColor = {
    cyan: 'text-cyan-400 bg-cyan-950/60 border-cyan-800/40',
    emerald: 'text-emerald-400 bg-emerald-950/60 border-emerald-800/40',
    amber: 'text-amber-400 bg-amber-950/60 border-amber-800/40',
    rose: 'text-rose-400 bg-rose-950/60 border-rose-800/40',
    purple: 'text-purple-400 bg-purple-950/60 border-purple-800/40',
    blue: 'text-sky-400 bg-sky-950/60 border-sky-800/40',
  };

  const progressBg = {
    cyan: 'bg-cyan-400',
    emerald: 'bg-emerald-400',
    amber: 'bg-amber-400',
    rose: 'bg-rose-400',
    purple: 'bg-purple-400',
    blue: 'bg-sky-400',
  };

  return (
    <div
      className={`relative bg-[#0d1524]/90 border rounded-xl p-3.5 flex flex-col justify-between transition-all duration-200 backdrop-blur-md ${accentGlow[accentColor]}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-medium uppercase tracking-wider text-slate-400">
          {label}
        </span>
        {Icon && (
          <div className={`p-1.5 rounded-lg border ${iconColor[accentColor]}`}>
            <Icon className="w-3.5 h-3.5" />
          </div>
        )}
      </div>

      {/* Primary Value */}
      <div className="mt-2 flex items-baseline gap-1.5">
        <span className="font-mono text-2xl font-bold tracking-tight text-white">
          {value}
        </span>
        {unit && (
          <span className="font-mono text-xs font-semibold text-slate-400">
            {unit}
          </span>
        )}
      </div>

      {/* Progress Bar if supplied */}
      {progress !== undefined && (
        <div className="mt-2.5 w-full bg-slate-800/80 rounded-full h-1.5 overflow-hidden border border-slate-700/50">
          <div
            className={`h-full rounded-full transition-all duration-300 ${progressBg[accentColor]}`}
            style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
          />
        </div>
      )}

      {/* Subtext & Trend */}
      {(subtext || trendValue) && (
        <div className="mt-2 flex items-center justify-between text-[11px] font-mono text-slate-400">
          {subtext && <span className="truncate">{subtext}</span>}
          {trendValue && (
            <span
              className={`font-semibold ml-auto ${
                trend === 'up'
                  ? 'text-emerald-400'
                  : trend === 'down'
                  ? 'text-amber-400'
                  : 'text-slate-400'
              }`}
            >
              {trend === 'up' ? '↑ ' : trend === 'down' ? '↓ ' : ''}
              {trendValue}
            </span>
          )}
        </div>
      )}
    </div>
  );
};
