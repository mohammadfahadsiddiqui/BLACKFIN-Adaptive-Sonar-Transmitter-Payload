// BLACKFIN — Target Detection & Acoustic Return Panel

import React from 'react';
import { useSonarStore } from '../../stores/sonarStore';
import { Crosshair, Radio, Shield, Waves } from 'lucide-react';

export const TargetDetectionPanel: React.FC = () => {
  const target = useSonarStore((state) => state.target);

  return (
    <div className="panel-base p-4 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Crosshair className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Acoustic Target Acquisition & Tracking
          </h3>
        </div>
        <div>
          {target.detected ? (
            <span className="badge-tag bg-cyan-950/90 text-cyan-300 border border-cyan-500/70 shadow-[0_0_10px_rgba(0,242,254,0.3)]">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block mr-1" />
              TARGET ACQUIRED
            </span>
          ) : (
            <span className="badge-tag bg-[#0a1220] text-cyan-400/80 border border-cyan-900/60 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse inline-block" />
              SURVEILLANCE SECTOR ACTIVE
            </span>
          )}
        </div>
      </div>

      {/* Main Content Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
        {/* Visual Target Scope */}
        <div className="relative w-full h-32 rounded-lg bg-[#070c14] border border-slate-800 flex items-center justify-center overflow-hidden">
          {/* Concentric distance rings */}
          <div className="absolute w-28 h-28 rounded-full border border-slate-800/80" />
          <div className="absolute w-20 h-20 rounded-full border border-slate-800/80" />
          <div className="absolute w-10 h-10 rounded-full border border-slate-800/80" />
          
          {/* Axis lines */}
          <div className="absolute w-full h-[1px] bg-slate-800/80" />
          <div className="absolute h-full w-[1px] bg-slate-800/80" />

          {/* Sweep beam */}
          <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/0 via-cyan-500/10 to-cyan-400/25 origin-center animate-radar-sweep pointer-events-none" />

          {/* Target Blip if detected */}
          {target.detected ? (
            <div
              className="absolute z-10 flex flex-col items-center justify-center animate-pulse"
              style={{
                top: '40%',
                left: `${Math.max(25, Math.min(80, (target.estimated_range / 120.0) * 100))}%`,
              }}
            >
              <div className="w-3.5 h-3.5 rounded-full bg-rose-500 border-2 border-white shadow-[0_0_12px_#f43f5e]" />
              <span className="text-[9px] font-mono font-bold text-rose-300 bg-rose-950/90 px-1 rounded mt-0.5 border border-rose-800 shadow">
                {target.estimated_range.toFixed(1)}m
              </span>
            </div>
          ) : (
            <div className="text-[10px] font-mono text-cyan-400/70 z-10 flex flex-col items-center gap-1">
              <span className="animate-pulse">Awaiting acoustic reflection...</span>
            </div>
          )}

          <div className="absolute bottom-1 right-2 text-[9px] font-mono text-slate-500">
            RANGE SCALE: 120m
          </div>
        </div>

        {/* Telemetry Metrics */}
        <div className="md:col-span-2 grid grid-cols-2 gap-2.5">
          <div className="bg-[#080d17]/80 border border-slate-800/80 rounded-lg p-2.5">
            <div className="text-[10px] text-slate-400 font-medium uppercase">ACOUSTIC RANGE</div>
            <div className="mt-1 flex items-baseline gap-1 font-mono">
              {target.detected ? (
                <>
                  <span className="text-2xl font-bold text-white tracking-tight">
                    {target.estimated_range.toFixed(1)}
                  </span>
                  <span className="text-xs font-semibold text-cyan-400">m</span>
                </>
              ) : (
                <span className="text-xs text-slate-400 italic">
                  Awaiting target acquisition
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Two-way acoustic travel</div>
          </div>

          <div className="bg-[#080d17]/80 border border-slate-800/80 rounded-lg p-2.5">
            <div className="text-[10px] text-slate-400 font-medium uppercase">SIGNAL-TO-NOISE (SNR)</div>
            <div className="mt-1 flex items-baseline gap-1 font-mono">
              {target.detected ? (
                <>
                  <span
                    className={`text-2xl font-bold tracking-tight ${
                      target.snr > 12
                        ? 'text-emerald-400'
                        : target.snr > 6
                        ? 'text-amber-400'
                        : 'text-rose-400'
                    }`}
                  >
                    {target.snr.toFixed(1)}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">dB</span>
                </>
              ) : (
                <span className="text-xs text-slate-400 italic">
                  Noise floor: ~45 dB
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Threshold: &gt; 6.0 dB</div>
          </div>

          <div className="bg-[#080d17]/80 border border-slate-800/80 rounded-lg p-2.5">
            <div className="text-[10px] text-slate-400 font-medium uppercase">ECHO RETURN POWER</div>
            <div className="mt-1 flex items-baseline gap-1 font-mono">
              {target.detected ? (
                <>
                  <span className="text-xl font-bold text-white tracking-tight">
                    {target.signal_strength.toFixed(1)}
                  </span>
                  <span className="text-xs font-semibold text-slate-400">dB</span>
                </>
              ) : (
                <span className="text-xs text-slate-400 italic">
                  Clear water column
                </span>
              )}
            </div>
            <div className="text-[10px] text-slate-500 font-mono mt-0.5">Loss adjusted</div>
          </div>

          <div className="bg-[#080d17]/80 border border-slate-800/80 rounded-lg p-2.5">
            <div className="text-[10px] text-slate-400 font-medium uppercase">DETECTION CONFIDENCE</div>
            <div className="mt-1 flex items-baseline gap-1 font-mono">
              {target.detected ? (
                <span className="text-xl font-bold text-cyan-400 tracking-tight">
                  {target.confidence.toFixed(0)}%
                </span>
              ) : (
                <span className="text-xs text-slate-400 italic">
                  Searching sector
                </span>
              )}
            </div>
            <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
              <div
                className="bg-cyan-400 h-full rounded-full transition-all"
                style={{ width: `${target.detected ? target.confidence : 15}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
