// BLACKFIN — Time-Series Environmental Parameter Chart

import React from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { useSensorStore } from '../../stores/sensorStore';
import { LucideIcon } from 'lucide-react';

interface EnvironmentChartProps {
  title: string;
  dataKey: 'depth' | 'temperature' | 'salinity' | 'turbidity' | 'noise_level' | 'speed_of_sound';
  unit: string;
  strokeColor?: string;
  icon?: LucideIcon;
  domain?: [number, number];
  height?: number;
}

export const EnvironmentChart: React.FC<EnvironmentChartProps> = ({
  title,
  dataKey,
  unit,
  strokeColor = '#00f2fe',
  icon: Icon,
  domain,
  height = 160,
}) => {
  const history = useSensorStore((state) => state.history);
  const current = useSensorStore((state) => state.current);
  const currentValue = current[dataKey];

  return (
    <div className="panel-base p-3.5 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-2">
          {Icon && <Icon className="w-3.5 h-3.5" style={{ color: strokeColor }} />}
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-300">
            {title}
          </span>
        </div>
        <div className="flex items-baseline gap-1 font-mono">
          <span className="text-base font-bold text-white">
            {typeof currentValue === 'number' ? currentValue.toFixed(1) : currentValue}
          </span>
          <span className="text-[10px] text-slate-400 font-medium">{unit}</span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height }}>
        {history.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">
            Gathering telemetry...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history} margin={{ top: 4, right: 6, left: -22, bottom: 0 }}>
              <XAxis
                dataKey="timeStr"
                stroke="#1e293b"
                tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }}
                interval="preserveStartEnd"
              />
              <YAxis
                domain={domain || ['auto', 'auto']}
                stroke="#1e293b"
                tick={{ fill: '#64748b', fontSize: 9, fontFamily: 'monospace' }}
                tickFormatter={(v) => typeof v === 'number' ? v.toFixed(0) : v}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#090f1a] border border-slate-700 p-1.5 rounded shadow text-[10px] font-mono">
                        <span className="text-slate-400">{data.timeStr} : </span>
                        <span className="font-bold text-white">{data[dataKey]} {unit}</span>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey={dataKey}
                stroke={strokeColor}
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
};
