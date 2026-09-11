// BLACKFIN — Adaptive Decision & Explainability Panel

import React from 'react';
import { useSonarStore } from '../../stores/sonarStore';
import { BrainCircuit, CheckCircle2, ArrowRight, ShieldCheck, Sparkles } from 'lucide-react';

export const AdaptiveDecisionPanel: React.FC = () => {
  const latestAdaptation = useSonarStore((state) => state.latestAdaptation);
  const config = useSonarStore((state) => state.config);

  return (
    <div className="panel-base p-4 flex flex-col justify-between">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <BrainCircuit className="w-4 h-4 text-cyan-400 shrink-0" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Autonomous Adaptation & Decision Logic
          </h3>
        </div>
        <div>
          {latestAdaptation ? (
            <span className="badge-tag text-[10px] sm:text-xs bg-cyan-950/80 text-cyan-300 border border-cyan-700/60">
              <Sparkles className="w-3 h-3 text-cyan-400 inline mr-1" />
              CONFIDENCE: {latestAdaptation.confidence.toFixed(0)}%
            </span>
          ) : (
            <span className="badge-tag text-[10px] sm:text-xs bg-slate-800 text-slate-400">
              STABLE CRUISE
            </span>
          )}
        </div>
      </div>

      {/* Decision Summary */}
      {latestAdaptation ? (
        <div className="space-y-3">
          {/* Explanation Text */}
          <div className="bg-[#080e19] border border-cyan-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-slate-200 leading-relaxed font-medium">
                  {latestAdaptation.reason || 'Sonar parameters dynamically balanced for current hydrographic conditions.'}
                </p>
                {latestAdaptation.triggered_rules && latestAdaptation.triggered_rules.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {latestAdaptation.triggered_rules.map((rule, idx) => (
                      <span
                        key={idx}
                        className="px-2 py-0.5 rounded bg-cyan-950/70 text-cyan-300 border border-cyan-800/60 text-[10px] font-mono"
                      >
                        RULE: {rule}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Before vs After Deltas */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-[11px] font-mono">
            {/* Frequency */}
            <div className="bg-[#080d17]/80 border border-slate-800 rounded p-2">
              <span className="text-slate-400 text-[10px] block">FREQUENCY</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-slate-400 line-through">
                  {latestAdaptation.old_config?.frequency
                    ? (latestAdaptation.old_config.frequency / 1000).toFixed(0)
                    : '--'}
                </span>
                <ArrowRight className="w-3 h-3 text-cyan-400" />
                <span className="text-white font-bold">
                  {latestAdaptation.new_config?.frequency
                    ? (latestAdaptation.new_config.frequency / 1000).toFixed(0)
                    : config.frequency_khz.toFixed(0)}{' '}
                  kHz
                </span>
              </div>
            </div>

            {/* Bandwidth */}
            <div className="bg-[#080d17]/80 border border-slate-800 rounded p-2">
              <span className="text-slate-400 text-[10px] block">BANDWIDTH</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-slate-400 line-through">
                  {latestAdaptation.old_config?.bandwidth
                    ? (latestAdaptation.old_config.bandwidth / 1000).toFixed(0)
                    : '--'}
                </span>
                <ArrowRight className="w-3 h-3 text-cyan-400" />
                <span className="text-white font-bold">
                  {latestAdaptation.new_config?.bandwidth
                    ? (latestAdaptation.new_config.bandwidth / 1000).toFixed(0)
                    : config.bandwidth_khz.toFixed(0)}{' '}
                  kHz
                </span>
              </div>
            </div>

            {/* Pulse */}
            <div className="bg-[#080d17]/80 border border-slate-800 rounded p-2">
              <span className="text-slate-400 text-[10px] block">PULSE DURATION</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-slate-400 line-through">
                  {latestAdaptation.old_config?.pulse_duration
                    ? (latestAdaptation.old_config.pulse_duration * 1000).toFixed(1)
                    : '--'}
                </span>
                <ArrowRight className="w-3 h-3 text-cyan-400" />
                <span className="text-white font-bold">
                  {latestAdaptation.new_config?.pulse_duration
                    ? (latestAdaptation.new_config.pulse_duration * 1000).toFixed(1)
                    : config.pulse_duration_ms.toFixed(1)}{' '}
                  ms
                </span>
              </div>
            </div>

            {/* Power */}
            <div className="bg-[#080d17]/80 border border-slate-800 rounded p-2">
              <span className="text-slate-400 text-[10px] block">POWER</span>
              <div className="flex items-center gap-1.5 mt-1">
                <span className="text-slate-400 line-through">
                  {latestAdaptation.old_config?.transmit_power
                    ? latestAdaptation.old_config.transmit_power.toFixed(1)
                    : '--'}
                </span>
                <ArrowRight className="w-3 h-3 text-amber-400" />
                <span className="text-white font-bold">
                  {latestAdaptation.new_config?.transmit_power
                    ? latestAdaptation.new_config.transmit_power.toFixed(1)
                    : config.transmit_power_w.toFixed(1)}{' '}
                  W
                </span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-[#080d17]/50 border border-dashed border-slate-800 rounded-lg p-6 text-center text-slate-500 font-mono text-xs">
          <ShieldCheck className="w-6 h-6 text-slate-600 mx-auto mb-2" />
          Sonar parameters in optimal steady state. Adjust depth, turbidity, or distance sliders to trigger real-time adaptation.
        </div>
      )}
    </div>
  );
};
