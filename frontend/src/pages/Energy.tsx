// BLACKFIN — Power Telemetry & Energy Optimization Analysis Page

import React from 'react';
import { useSonarStore } from '../stores/sonarStore';
import { useSensorStore } from '../stores/sensorStore';
import { KPICard } from '../components/cards/KPICard';
import { PowerChart } from '../components/charts/PowerChart';
import { Zap, Battery, ShieldCheck, Clock, TrendingDown, Gauge } from 'lucide-react';

export const Energy: React.FC = () => {
  const energy = useSonarStore((state) => state.energy);
  const sensor = useSensorStore((state) => state.current);

  return (
    <div className="p-5 space-y-4 max-w-[1700px] mx-auto overflow-y-auto max-h-[calc(100vh-5.5rem)] pb-8">
      {/* 4 Energy KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <KPICard
          label="Current Transmit Power"
          value={energy.current_power.toFixed(1)}
          unit="W"
          icon={Zap}
          accentColor="amber"
          subtext="Active transducer drive"
        />
        <KPICard
          label="Average Transmit Power"
          value={energy.average_power.toFixed(1)}
          unit="W"
          icon={Gauge}
          accentColor="blue"
          subtext="Mission time-averaged"
        />
        <KPICard
          label="Energy Consumed"
          value={energy.total_energy.toFixed(2)}
          unit="Wh"
          icon={TrendingDown}
          accentColor="purple"
          subtext="Cumulative acoustic work"
        />
        <KPICard
          label="Battery Reserve"
          value={sensor.battery.toFixed(0)}
          unit="%"
          icon={Battery}
          accentColor={sensor.battery < 20 ? 'rose' : 'emerald'}
          progress={sensor.battery}
          subtext="AUV primary cells"
        />
        <KPICard
          label="Remaining Mission"
          value={energy.estimated_remaining_hours.toFixed(1)}
          unit="hrs"
          icon={Clock}
          accentColor="cyan"
          subtext="At current power draw"
        />
        <KPICard
          label="Energy Saved"
          value={energy.energy_saved_percent.toFixed(1)}
          unit="%"
          icon={ShieldCheck}
          accentColor="emerald"
          progress={energy.energy_saved_percent}
          subtext="vs 12W fixed sonar"
        />
      </div>

      {/* Real-time Power Chart vs Fixed Baseline */}
      <div>
        <PowerChart height={280} />
      </div>

      {/* Comparative Architecture Table: Fixed Conventional vs BLACKFIN */}
      <div className="panel-base p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Payload Efficiency Comparison: Conventional vs BLACKFIN Adaptive Sonar
            </h3>
          </div>
          <span className="badge-tag bg-emerald-950 text-emerald-300 border border-emerald-800">
            SIMULATED BENCHMARK
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                <th className="py-2.5 px-3">System Characteristic</th>
                <th className="py-2.5 px-3">Conventional Fixed Sonar</th>
                <th className="py-2.5 px-3">BLACKFIN Adaptive Sonar</th>
                <th className="py-2.5 px-3 text-right">Advantage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-3 font-semibold text-white">Transmit Power Profile</td>
                <td className="py-3 px-3 text-rose-400">Fixed maximum (12.0 – 16.0 W)</td>
                <td className="py-3 px-3 text-emerald-400 font-bold">Dynamically throttled (0.5 – 20.0 W)</td>
                <td className="py-3 px-3 text-right text-emerald-400 font-bold">Up to 40% energy reduction</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-3 font-semibold text-white">Waveform Modulation</td>
                <td className="py-3 px-3 text-slate-400">Static single CW / fixed pulse</td>
                <td className="py-3 px-3 text-cyan-300 font-bold">LFM chirp with matched filter correlation</td>
                <td className="py-3 px-3 text-right text-cyan-400 font-bold">+12 dB processing gain</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-3 font-semibold text-white">Depth / Absorption Response</td>
                <td className="py-3 px-3 text-slate-400">None — blind to absorption loss</td>
                <td className="py-3 px-3 text-blue-300 font-bold">Automatic frequency lowering in deep water</td>
                <td className="py-3 px-3 text-right text-blue-400 font-bold">Optimized acoustic propagation</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-3 font-semibold text-white">Turbidity & Silt Adaptation</td>
                <td className="py-3 px-3 text-rose-400">Signal drops due to scatter</td>
                <td className="py-3 px-3 text-amber-300 font-bold">Bandwidth expansion for noise rejection</td>
                <td className="py-3 px-3 text-right text-amber-400 font-bold">Sustained detection in river plumes</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-3 px-3 font-semibold text-white">AUV Battery Management</td>
                <td className="py-3 px-3 text-slate-400">No power awareness until cutoff</td>
                <td className="py-3 px-3 text-purple-300 font-bold">Closed-loop low battery throttling & eco mode</td>
                <td className="py-3 px-3 text-right text-purple-400 font-bold">Extends mission duration by 1.8x</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
