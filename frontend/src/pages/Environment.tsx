// BLACKFIN — Environmental Monitoring & Hydrography Page

import React from 'react';
import { useSensorStore } from '../stores/sensorStore';
import { EnvironmentChart } from '../components/charts/EnvironmentChart';
import { SimulationControlPanel } from '../components/panels/SimulationControlPanel';
import { Compass, Thermometer, Droplet, Eye, Volume2, Waves } from 'lucide-react';

export const Environment: React.FC = () => {
  const current = useSensorStore((state) => state.current);

  return (
    <div className="p-3 sm:p-5 space-y-4 max-w-[1700px] mx-auto overflow-y-auto max-h-[calc(100vh-5.5rem)] pb-12">
      {/* Top Banner: Mackenzie Speed of Sound Equation Output */}
      <div className="panel-base p-4 bg-gradient-to-r from-[#0d1627] via-[#0d1c33] to-[#0d1627] border-cyan-500/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-700/60 text-cyan-400 shrink-0">
              <Waves className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-white">
                Mackenzie (1981) Underwater Sound Speed Profile
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-400 font-mono mt-0.5 break-all">
                c = 1448.96 + 4.591·T - 0.053·T² + 2.37e-4·T³ + 1.34·(S-35) + 0.0163·D
              </p>
            </div>
          </div>
          <div className="flex items-baseline gap-2 font-mono">
            <span className="text-3xl font-extrabold text-cyan-300 tracking-tight">
              {current.speed_of_sound.toFixed(1)}
            </span>
            <span className="text-sm font-bold text-slate-400">m/s</span>
          </div>
        </div>
      </div>

      {/* Grid of 6 Telemetry Time-Series Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        <EnvironmentChart
          title="Submersible Depth"
          dataKey="depth"
          unit="m"
          strokeColor="#00f2fe"
          icon={Compass}
          domain={[0, 500]}
          height={150}
        />
        <EnvironmentChart
          title="Water Temperature"
          dataKey="temperature"
          unit="°C"
          strokeColor="#38bdf8"
          icon={Thermometer}
          domain={[0, 30]}
          height={150}
        />
        <EnvironmentChart
          title="Water Salinity"
          dataKey="salinity"
          unit="PSU"
          strokeColor="#a855f7"
          icon={Droplet}
          domain={[30, 40]}
          height={150}
        />
        <EnvironmentChart
          title="Suspended Turbidity"
          dataKey="turbidity"
          unit="%"
          strokeColor="#f59e0b"
          icon={Eye}
          domain={[0, 100]}
          height={150}
        />
        <EnvironmentChart
          title="Ambient Acoustic Noise"
          dataKey="noise_level"
          unit="dB"
          strokeColor="#f43f5e"
          icon={Volume2}
          domain={[40, 100]}
          height={150}
        />
        <EnvironmentChart
          title="Sound Velocity (In-situ)"
          dataKey="speed_of_sound"
          unit="m/s"
          strokeColor="#10b981"
          icon={Waves}
          domain={[1440, 1560]}
          height={150}
        />
      </div>

      {/* Live Simulation Control Panel */}
      <div>
        <SimulationControlPanel />
      </div>
    </div>
  );
};
