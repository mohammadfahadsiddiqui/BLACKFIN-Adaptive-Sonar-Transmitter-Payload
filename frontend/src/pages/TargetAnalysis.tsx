// BLACKFIN — Acoustic Target Acquisition & Tracking Analysis Page

import React from 'react';
import { useSonarStore } from '../stores/sonarStore';
import { TargetDetectionPanel } from '../components/panels/TargetDetectionPanel';
import { EchoSignalChart } from '../components/charts/EchoSignalChart';
import { Crosshair, Target, Shield, Compass, Waves, CheckCircle2 } from 'lucide-react';

export const TargetAnalysis: React.FC = () => {
  const target = useSonarStore((state) => state.target);
  const signal = useSonarStore((state) => state.signal);
  const config = useSonarStore((state) => state.config);

  return (
    <div className="p-3 sm:p-5 space-y-4 max-w-[1700px] mx-auto overflow-y-auto max-h-[calc(100vh-5.5rem)] pb-12">
      {/* Top Banner Status */}
      <div className="panel-base p-4 bg-gradient-to-r from-[#0d1627] via-[#0d1e38] to-[#0d1627] border-cyan-500/30">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div
              className={`p-2.5 rounded-xl border shrink-0 ${
                target.detected
                  ? 'bg-rose-950 border-rose-700/80 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.4)]'
                  : 'bg-cyan-950 border-cyan-800 text-cyan-400'
              }`}
            >
              <Crosshair className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                  {target.detected ? 'Acoustic Target Lock Engaged' : 'Sector Acoustic Surveillance Active'}
                </h2>
                <span
                  className={`badge-tag text-[9px] sm:text-[10px] ${
                    target.detected
                      ? 'bg-rose-950 text-rose-300 border-rose-700'
                      : 'bg-slate-800 text-slate-400'
                  }`}
                >
                  {target.detected ? 'CONTACT CONFIRMED' : 'CLEAR WATER'}
                </span>
              </div>
              <p className="text-[10px] sm:text-xs text-slate-400 font-mono mt-0.5">
                Matched filter correlation & peak prominence analysis on hydrophone return
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 sm:gap-6 font-mono sm:text-right">
            <div>
              <div className="text-[10px] text-slate-500 uppercase">ESTIMATED RANGE</div>
              <div className="text-xl sm:text-2xl font-extrabold text-white">
                {target.detected ? `${target.estimated_range.toFixed(1)} m` : '--'}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-slate-500 uppercase">CONFIDENCE</div>
              <div className="text-xl sm:text-2xl font-extrabold text-cyan-400">
                {target.detected ? `${target.confidence.toFixed(0)}%` : '0%'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Target Scope and Metrics Component */}
      <div>
        <TargetDetectionPanel />
      </div>

      {/* Echo Waveform with Peak Annotations */}
      <div>
        <EchoSignalChart height={280} title="Target Reflection Profile & Echo Peaks" />
      </div>

      {/* Detected Peaks Table */}
      <div className="panel-base p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Target className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Resolved Acoustic Echo Reflection Peaks
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {signal.echo_peaks?.length || 0} PEAKS DETECTED
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                <th className="py-2 px-3">Peak Index</th>
                <th className="py-2 px-3">Time Delay (ms)</th>
                <th className="py-2 px-3">Acoustic Range (m)</th>
                <th className="py-2 px-3">Envelope Amplitude</th>
                <th className="py-2 px-3 text-right">Classification</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {(!signal.echo_peaks || signal.echo_peaks.length === 0) ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-slate-500">
                    No significant acoustic reflections exceeding detection threshold.
                  </td>
                </tr>
              ) : (
                signal.echo_peaks.map((peak, idx) => (
                  <tr key={idx} className="hover:bg-slate-800/30 transition-all">
                    <td className="py-2.5 px-3 font-bold text-white">#0{idx + 1}</td>
                    <td className="py-2.5 px-3 text-cyan-300">{peak.time.toFixed(2)} ms</td>
                    <td className="py-2.5 px-3 text-emerald-300 font-bold">{peak.range.toFixed(1)} m</td>
                    <td className="py-2.5 px-3 text-slate-300">{peak.amplitude.toFixed(4)}</td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          idx === 0
                            ? 'bg-rose-950 text-rose-300 border border-rose-800'
                            : 'bg-slate-800 text-slate-300'
                        }`}
                      >
                        {idx === 0 ? 'PRIMARY CONTACT' : 'MULTIPATH / SECONDARY'}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
