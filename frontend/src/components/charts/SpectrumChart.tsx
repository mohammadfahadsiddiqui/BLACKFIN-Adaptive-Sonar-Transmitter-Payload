// BLACKFIN — FFT Frequency Spectrum Component

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { useSonarStore } from '../../stores/sonarStore';
import { Radio } from 'lucide-react';

export const SpectrumChart: React.FC<{ height?: number }> = ({ height = 220 }) => {
  const signal = useSonarStore((state) => state.signal);
  const config = useSonarStore((state) => state.config);

  const chartData = useMemo(() => {
    if (!signal || !signal.freq_axis || signal.freq_axis.length === 0) return [];
    return signal.freq_axis.map((f, idx) => ({
      freq: Number(f.toFixed(1)),
      mag: Number((signal.magnitude[idx] || -100).toFixed(1)),
    }));
  }, [signal]);

  // Operating band lines
  const centerFreq = config.frequency_khz;
  const halfBw = config.bandwidth_khz / 2;
  const fLower = centerFreq - halfBw;
  const fUpper = centerFreq + halfBw;

  return (
    <div className="panel-base p-4 flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Radio className="w-4 h-4 text-purple-400 shrink-0" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            FFT Spectral Magnitude Spectrum
          </h3>
        </div>
        <div className="flex items-center gap-2 font-mono text-[10px] sm:text-[11px]">
          <span className="text-purple-400 font-medium">fc = {centerFreq.toFixed(1)} kHz</span>
          <span className="text-slate-500">|</span>
          <span className="text-slate-400">BW = {config.bandwidth_khz.toFixed(1)} kHz</span>
        </div>
      </div>

      {/* Chart */}
      <div style={{ width: '100%', height }}>
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">
            Computing FFT spectrum...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={chartData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <defs>
                <linearGradient id="spectrumGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="freq"
                stroke="#334155"
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                unit="k"
              />
              <YAxis
                domain={[-100, 0]}
                stroke="#334155"
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                unit="dB"
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#090f1a] border border-purple-500/40 p-2 rounded shadow-lg text-[11px] font-mono">
                        <p className="text-purple-400 font-semibold">{data.freq} kHz</p>
                        <p className="text-slate-200">{data.mag} dB</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <ReferenceLine
                x={centerFreq}
                stroke="#00f2fe"
                strokeDasharray="3 3"
                label={{
                  value: 'fc',
                  fill: '#00f2fe',
                  fontSize: 10,
                  fontFamily: 'monospace',
                  position: 'top',
                }}
              />
              <ReferenceLine x={fLower} stroke="#64748b" strokeDasharray="2 2" />
              <ReferenceLine x={fUpper} stroke="#64748b" strokeDasharray="2 2" />
              <Area
                type="monotone"
                dataKey="mag"
                stroke="#8b5cf6"
                strokeWidth={1.5}
                fill="url(#spectrumGradient)"
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Legend */}
      <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-1.5 bg-purple-500/80 inline-block rounded-sm" />
          Spectral Power Density (dB relative)
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-cyan-400 inline-block border-dashed" />
          Carrier Center Frequency
        </span>
      </div>
    </div>
  );
};
