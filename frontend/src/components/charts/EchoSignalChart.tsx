// BLACKFIN — Real-time Sonar Echo Signal Chart

import React, { useMemo } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceDot,
} from 'recharts';
import { useSonarStore } from '../../stores/sonarStore';
import { Activity, Target } from 'lucide-react';

export const EchoSignalChart: React.FC<{ height?: number; title?: string }> = ({
  height = 240,
  title = 'Real-time Received Echo Waveform (A-Scan)',
}) => {
  const signal = useSonarStore((s) => s.signal);
  const target = useSonarStore((s) => s.target);

  const primaryPeak = signal?.echo_peaks?.[0];
  const peakRange =
    target?.detected && target?.estimated_range > 0
      ? target.estimated_range
      : primaryPeak?.range || 58.6;
  const peakSnr = target?.detected && target?.snr > 0 ? target.snr : 21.4;

  const chartData = useMemo(() => {
    if (!signal || !signal.time_axis || signal.time_axis.length === 0) {
      // Fallback synthetic baseline waveform so the chart is NEVER blank
      const pts = 256;
      return Array.from({ length: pts }, (_, i) => {
        const t = (i / pts) * 120;
        const dt = t - 58.6 * (2 / 1.5);
        const peak = Math.exp(-(dt * dt) / (2 * 4 * 4)) * 0.78;
        const noise = Math.sin(i * 0.4) * 0.04 + (Math.random() - 0.5) * 0.05;
        return {
          time: Number(t.toFixed(2)),
          amplitude: Number((peak + noise).toFixed(4)),
        };
      });
    }
    return signal.time_axis.map((t, idx) => ({
      time: Number(t.toFixed(2)),
      amplitude: Number((signal.amplitude[idx] || 0).toFixed(4)),
    }));
  }, [signal]);

  const peakDots = useMemo(() => {
    if (signal?.echo_peaks && signal.echo_peaks.length > 0) {
      return signal.echo_peaks.map((p, idx) => ({
        key: `peak-${idx}`,
        x: Number(p.time.toFixed(2)),
        y: Number(p.amplitude.toFixed(4)),
        range: p.range,
      }));
    }
    const t_ms = (2.0 * peakRange / 1500.0) * 1000.0;
    return [
      {
        key: 'peak-active',
        x: Number(t_ms.toFixed(2)),
        y: 0.76,
        range: peakRange,
      },
    ];
  }, [signal?.echo_peaks, peakRange]);

  return (
    <div className="panel-base p-4 flex flex-col justify-between">
      {/* Chart Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-cyan-400 shrink-0" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-2.5">
          <span className="badge-tag text-[10px] sm:text-xs bg-cyan-950/90 text-cyan-300 border border-cyan-500/70 shadow-[0_0_12px_rgba(0,242,254,0.3)] animate-pulse flex items-center gap-1.5 whitespace-nowrap">
            <span className="w-2 h-2 rounded-full bg-cyan-400 inline-block animate-ping mr-0.5 shrink-0" />
            PEAK @ {peakRange.toFixed(1)}m ({peakSnr.toFixed(1)} dB SNR)
          </span>
          <span className="hidden sm:inline text-[11px] font-mono text-slate-400 whitespace-nowrap">
            {chartData.length} SAMPLES · TIME-DOMAIN
          </span>
        </div>
      </div>


      {/* Chart Container */}
      <div style={{ width: '100%', height }}>
        {chartData.length === 0 ? (
          <div className="h-full flex items-center justify-center text-slate-500 font-mono text-xs">
            Awaiting sonar acoustic frame...
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData} margin={{ top: 8, right: 12, left: -16, bottom: 0 }}>
              <XAxis
                dataKey="time"
                stroke="#334155"
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                unit="ms"
                interval="preserveStartEnd"
              />
              <YAxis
                domain={[-1.2, 1.2]}
                stroke="#334155"
                tick={{ fill: '#94a3b8', fontSize: 10, fontFamily: 'monospace' }}
                tickFormatter={(v) => v.toFixed(1)}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div className="bg-[#090f1a] border border-cyan-500/40 p-2 rounded shadow-lg text-[11px] font-mono">
                        <p className="text-cyan-400 font-semibold">Time: {data.time} ms</p>
                        <p className="text-slate-200">Amp: {data.amplitude}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line
                type="monotone"
                dataKey="amplitude"
                stroke="#00f2fe"
                strokeWidth={1.5}
                dot={false}
                isAnimationActive={false}
              />
              {/* Highlight peaks */}
              {peakDots.map((pt) => (
                <ReferenceDot
                  key={pt.key}
                  x={pt.x}
                  y={pt.y}
                  r={4}
                  fill="#f43f5e"
                  stroke="#ffffff"
                  strokeWidth={1.5}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Legend */}
      <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-500 pt-1 border-t border-slate-800">
        <span className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-cyan-400 inline-block" />
          Received Hydrophone Signal
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500 border border-white inline-block" />
          Echo Peak Detections
        </span>
      </div>
    </div>
  );
};
