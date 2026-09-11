// BLACKFIN — Animated Status Indicator Dot

import React from 'react';

interface StatusIndicatorProps {
  status: 'online' | 'offline' | 'warning' | 'error' | 'active';
  size?: 'sm' | 'md' | 'lg';
  label?: string;
  pulse?: boolean;
}

export const StatusIndicator: React.FC<StatusIndicatorProps> = ({
  status,
  size = 'md',
  label,
  pulse = true,
}) => {
  const sizeClasses = {
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3',
  };

  const colorClasses = {
    online: 'bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]',
    active: 'bg-cyan-400 shadow-[0_0_8px_rgba(34,211,238,0.8)]',
    warning: 'bg-amber-400 shadow-[0_0_8px_rgba(251,191,36,0.8)]',
    error: 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]',
    offline: 'bg-slate-500',
  };

  return (
    <span className="inline-flex items-center gap-2">
      <span className="relative flex items-center justify-center">
        {pulse && (status === 'online' || status === 'active') && (
          <span
            className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${
              status === 'active' ? 'bg-cyan-400' : 'bg-emerald-400'
            }`}
          />
        )}
        <span
          className={`relative inline-block rounded-full ${sizeClasses[size]} ${colorClasses[status]}`}
        />
      </span>
      {label && <span className="text-xs font-mono font-medium text-slate-300">{label}</span>}
    </span>
  );
};
