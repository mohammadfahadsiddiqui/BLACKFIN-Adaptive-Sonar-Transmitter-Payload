// BLACKFIN — Environmental Simulation Control & Mission Scenario Injector

import React, { useState } from 'react';
import { useSensorStore } from '../../stores/sensorStore';
import { apiClient } from '../../services/apiClient';
import { Sliders, Sparkles, RefreshCw, Compass, ShieldAlert } from 'lucide-react';

export const SimulationControlPanel: React.FC = () => {
  const current = useSensorStore((state) => state.current);
  const [activePreset, setActivePreset] = useState<string>('clear_water');
  const [isApplying, setIsApplying] = useState<boolean>(false);

  const presets = [
    { id: 'clear_water', name: 'Clear Coastal', desc: '20m Depth · Low noise', color: 'border-cyan-500/40 text-cyan-300' },
    { id: 'deep_water', name: 'Deep Ocean Trench', desc: '200m Depth · High loss', color: 'border-blue-500/40 text-blue-300' },
    { id: 'high_turbidity', name: 'Turbid River Plume', desc: '85% Turbidity · High scatter', color: 'border-amber-500/40 text-amber-300' },
    { id: 'high_noise', name: 'Acoustic Jamming / Noise', desc: '90 dB Ambient noise', color: 'border-rose-500/40 text-rose-300' },
    { id: 'low_battery', name: 'Critical Battery Eco', desc: '12% Battery reserve', color: 'border-purple-500/40 text-purple-300' },
    { id: 'changing_environment', name: 'Thermocline Transition', desc: 'Dynamic gradient shift', color: 'border-emerald-500/40 text-emerald-300' },
  ];

  const handleSliderChange = async (key: string, value: number) => {
    setActivePreset('custom');
    try {
      await apiClient.updateSimulation({ [key]: value });
    } catch (err) {
      console.error('Failed to update simulation:', err);
    }
  };

  const handleApplyPreset = async (presetId: string) => {
    setIsApplying(true);
    setActivePreset(presetId);
    try {
      await apiClient.applyPreset(presetId);
    } catch (err) {
      console.error('Failed to apply preset:', err);
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="panel-base p-4 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Underwater Environment Simulation & Scenario Injector
          </h3>
        </div>
        <span className="badge-tag bg-slate-800 text-slate-300 font-mono">
          REAL-TIME HYDROGRAPHIC MODEL
        </span>
      </div>

      {/* Preset Scenario Buttons */}
      <div className="mb-4">
        <label className="text-[11px] font-mono text-slate-400 uppercase tracking-wider mb-1.5 block">
          Preset Mission Environments:
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2">
          {presets.map((p) => (
            <button
              key={p.id}
              disabled={isApplying}
              onClick={() => handleApplyPreset(p.id)}
              className={`text-left p-2 rounded-lg border transition-all ${
                activePreset === p.id
                  ? `${p.color} bg-[#101b2e] shadow-lg scale-[1.02]`
                  : 'border-slate-800/80 bg-[#080d17]/80 text-slate-400 hover:border-slate-700 hover:text-slate-200'
              }`}
            >
              <div className="font-semibold text-xs truncate">{p.name}</div>
              <div className="text-[10px] font-mono text-slate-500 truncate mt-0.5">{p.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Interactive Telemetry Sliders */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-x-6 gap-y-3.5 pt-3 border-t border-slate-800">
        {/* Depth */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-slate-300">AUV Submersion Depth</span>
            <span className="text-cyan-400 font-bold">{current.depth.toFixed(1)} m</span>
          </div>
          <input
            type="range"
            min={5}
            max={500}
            step={1}
            value={current.depth}
            onChange={(e) => handleSliderChange('depth', parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-0.5">
            <span>5m (Shallow)</span>
            <span>500m (Abyssal)</span>
          </div>
        </div>

        {/* Water Temperature */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-slate-300">Water Temperature</span>
            <span className="text-blue-400 font-bold">{current.temperature.toFixed(1)} °C</span>
          </div>
          <input
            type="range"
            min={0}
            max={30}
            step={0.5}
            value={current.temperature}
            onChange={(e) => handleSliderChange('temperature', parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-0.5">
            <span>0°C (Polar)</span>
            <span>30°C (Tropical)</span>
          </div>
        </div>

        {/* Salinity */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-slate-300">Salinity</span>
            <span className="text-purple-400 font-bold">{current.salinity.toFixed(1)} PSU</span>
          </div>
          <input
            type="range"
            min={30}
            max={40}
            step={0.1}
            value={current.salinity}
            onChange={(e) => handleSliderChange('salinity', parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-0.5">
            <span>30 PSU (Brackish)</span>
            <span>40 PSU (Hyper-saline)</span>
          </div>
        </div>

        {/* Turbidity */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-slate-300">Suspended Turbidity</span>
            <span className="text-amber-400 font-bold">{current.turbidity.toFixed(1)} %</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            step={1}
            value={current.turbidity}
            onChange={(e) => handleSliderChange('turbidity', parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-0.5">
            <span>0% (Crystal Clear)</span>
            <span>100% (Dense Silt)</span>
          </div>
        </div>

        {/* Ambient Acoustic Noise */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-slate-300">Ambient Acoustic Noise</span>
            <span className="text-rose-400 font-bold">{current.noise_level.toFixed(1)} dB</span>
          </div>
          <input
            type="range"
            min={40}
            max={100}
            step={1}
            value={current.noise_level}
            onChange={(e) => handleSliderChange('noise_level', parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-0.5">
            <span>40 dB (Quiet Calms)</span>
            <span>100 dB (Heavy Shipping)</span>
          </div>
        </div>

        {/* Target Distance */}
        <div>
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-slate-300">Target Echo Distance</span>
            <span className="text-emerald-400 font-bold">{current.target_distance.toFixed(1)} m</span>
          </div>
          <input
            type="range"
            min={5}
            max={200}
            step={1}
            value={current.target_distance}
            onChange={(e) => handleSliderChange('target_distance', parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-0.5">
            <span>5m (Near-Field)</span>
            <span>200m (Far-Field)</span>
          </div>
        </div>
      </div>
    </div>
  );
};
