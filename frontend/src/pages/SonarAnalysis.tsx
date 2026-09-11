// BLACKFIN — Advanced Sonar Signal & Acoustic Analysis Page

import React from 'react';
import { EchoSignalChart } from '../components/charts/EchoSignalChart';
import { SpectrumChart } from '../components/charts/SpectrumChart';
import { WaterfallCanvas } from '../components/charts/WaterfallCanvas';
import { useSonarStore } from '../stores/sonarStore';
import { Radio, Waves, Cpu, Zap, Activity } from 'lucide-react';

export const SonarAnalysis: React.FC = () => {
  const config = useSonarStore((state) => state.config);
  const target = useSonarStore((state) => state.target);

  return (
    <div className="p-5 space-y-4 max-w-[1700px] mx-auto overflow-y-auto max-h-[calc(100vh-5.5rem)] pb-8">
      {/* Top Header Metrics Banner */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="panel-base p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-950/70 border border-cyan-800/60 text-cyan-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono text-slate-400">CENTER FREQUENCY</div>
            <div className="text-xl font-bold font-mono text-white">
              {config.frequency_khz.toFixed(1)} <span className="text-xs text-slate-400">kHz</span>
            </div>
          </div>
        </div>

        <div className="panel-base p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-purple-950/70 border border-purple-800/60 text-purple-400">
            <Waves className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono text-slate-400">CHIRP BANDWIDTH</div>
            <div className="text-xl font-bold font-mono text-white">
              {config.bandwidth_khz.toFixed(1)} <span className="text-xs text-slate-400">kHz</span>
            </div>
          </div>
        </div>

        <div className="panel-base p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-amber-950/70 border border-amber-800/60 text-amber-400">
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono text-slate-400">ACOUSTIC POWER</div>
            <div className="text-xl font-bold font-mono text-white">
              {config.transmit_power_w.toFixed(1)} <span className="text-xs text-slate-400">W</span>
            </div>
          </div>
        </div>

        <div className="panel-base p-3 flex items-center gap-3">
          <div className="p-2 rounded-lg bg-emerald-950/70 border border-emerald-800/60 text-emerald-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[10px] uppercase font-mono text-slate-400">PULSE MODULATION</div>
            <div className="text-xl font-bold font-mono text-white">
              {config.waveform_type} <span className="text-xs text-slate-400">({config.pulse_duration_ms.toFixed(1)}ms)</span>
            </div>
          </div>
        </div>
      </div>

      {/* Primary DSP Charts: Waveform & FFT */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <div>
          <EchoSignalChart height={280} title="Hydrophone Time-Domain Received Signal (A-Scan)" />
        </div>
        <div>
          <SpectrumChart height={280} />
        </div>
      </div>

      {/* Waterfall Spectrogram */}
      <div>
        <WaterfallCanvas height={260} />
      </div>
    </div>
  );
};
