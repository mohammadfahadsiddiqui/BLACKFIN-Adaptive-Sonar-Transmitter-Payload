// BLACKFIN — Adaptive Control & Decision Rule Matrix Page

import React, { useState } from 'react';
import { useSonarStore } from '../stores/sonarStore';
import { useSensorStore } from '../stores/sensorStore';
import { apiClient } from '../services/apiClient';
import { BrainCircuit, Sliders, CheckCircle2, AlertCircle, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export const AdaptiveControl: React.FC = () => {
  const config = useSonarStore((state) => state.config);
  const latestAdaptation = useSonarStore((state) => state.latestAdaptation);
  const adaptationHistory = useSonarStore((state) => state.adaptationHistory);
  const sensor = useSensorStore((state) => state.current);

  // Manual configuration form state
  const [manualFreq, setManualFreq] = useState<number>(config.frequency_khz);
  const [manualBw, setManualBw] = useState<number>(config.bandwidth_khz);
  const [manualPulse, setManualPulse] = useState<number>(config.pulse_duration_ms);
  const [manualPower, setManualPower] = useState<number>(config.transmit_power_w);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const isManual = config.mode === 'manual';

  const handleModeToggle = async (targetMode: 'auto' | 'manual') => {
    setIsUpdating(true);
    try {
      await apiClient.setAdaptationMode(targetMode);
      useSonarStore.getState().updateSonarConfig({ ...config, mode: targetMode });
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleApplyManual = async () => {
    setIsUpdating(true);
    try {
      await apiClient.setManualSonarConfig({
        frequency: manualFreq * 1000,
        bandwidth: manualBw * 1000,
        pulse_duration: manualPulse / 1000,
        transmit_power: manualPower,
      });
      useSonarStore.getState().updateSonarConfig({
        ...config,
        frequency_khz: manualFreq,
        bandwidth_khz: manualBw,
        pulse_duration_ms: manualPulse,
        transmit_power_w: manualPower,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsUpdating(false);
    }
  };

  // 8 Core Rules evaluated by engine
  const rules = [
    {
      id: 'DEPTH_FREQ',
      name: 'Depth-Dependent Frequency Scaling',
      condition: 'Depth > 80m (Deep water absorption compensation)',
      action: 'Scale frequency down toward 40–60 kHz for long acoustic reach',
      active: sensor.depth > 80,
      priority: 'HIGH',
    },
    {
      id: 'TURB_BW',
      name: 'Turbidity Noise Rejection Bandwidth',
      condition: 'Turbidity > 40% (Suspended particulate backscatter)',
      action: 'Expand bandwidth + apply LFM chirp correlation gain',
      active: sensor.turbidity > 40,
      priority: 'MEDIUM',
    },
    {
      id: 'RANGE_PWR',
      name: 'Dynamic Target Range Power Scaling',
      condition: 'Target Range > 60m (High spreading loss)',
      action: 'Step up transmit power proportionally up to safe limit',
      active: sensor.target_distance > 60,
      priority: 'HIGH',
    },
    {
      id: 'PWR_SAVE',
      name: 'Proximity Power Save Economy',
      condition: 'Target Range < 30m (Strong near-field return)',
      action: 'Throttle transmit power to 2.0–4.0W to conserve AUV battery',
      active: sensor.target_distance < 30,
      priority: 'MEDIUM',
    },
    {
      id: 'BATTERY_ECO',
      name: 'Battery Reserve Economy Throttle',
      condition: 'AUV Battery < 30%',
      action: 'Clamp maximum power to 4.0W and optimize duty cycle',
      active: sensor.battery < 30,
      priority: 'CRITICAL',
    },
    {
      id: 'BATTERY_CRIT',
      name: 'Emergency Low-Power Ping Mode',
      condition: 'AUV Battery < 15%',
      action: 'Minimum 1.0W ping, low duty cycle, emergency telemetry beacon',
      active: sensor.battery < 15,
      priority: 'CRITICAL',
    },
    {
      id: 'NOISE_AVOID',
      name: 'Ambient Noise Avoidance Band-Shift',
      condition: 'Ambient Noise > 75 dB',
      action: 'Shift carrier frequency to quietest spectral band',
      active: sensor.noise_level > 75,
      priority: 'HIGH',
    },
    {
      id: 'THERM_PULSE',
      name: 'Thermocline Pulse Stretching',
      condition: 'Water Temp < 10°C or Deep Layer',
      action: 'Lengthen pulse duration up to 15ms for integrated energy',
      active: sensor.temperature < 10 || sensor.depth > 120,
      priority: 'MEDIUM',
    },
  ];

  return (
    <div className="p-5 space-y-4 max-w-[1700px] mx-auto overflow-y-auto max-h-[calc(100vh-5.5rem)] pb-8">
      {/* Top Banner: Mode Selection */}
      <div className="panel-base p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-950 border border-cyan-800 text-cyan-400">
            <BrainCircuit className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-sm font-bold uppercase tracking-wider text-white">
              Autonomous Adaptive Sonar Control Loop
            </h2>
            <p className="text-xs text-slate-400 font-mono mt-0.5">
              Multi-parameter closed-loop heuristic & environmental rule evaluation
            </p>
          </div>
        </div>

        {/* Toggle Switch */}
        <div className="flex items-center gap-2 bg-[#070b12] p-1.5 rounded-xl border border-slate-800">
          <button
            onClick={() => handleModeToggle('auto')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              !isManual
                ? 'bg-cyan-500 text-slate-950 shadow-[0_0_12px_rgba(0,242,254,0.6)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            AUTONOMOUS ADAPTIVE
          </button>
          <button
            onClick={() => handleModeToggle('manual')}
            className={`px-4 py-1.5 rounded-lg text-xs font-mono font-bold transition-all ${
              isManual
                ? 'bg-amber-500 text-slate-950 shadow-[0_0_12px_rgba(245,158,11,0.6)]'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            MANUAL OVERRIDE
          </button>
        </div>
      </div>

      {/* Manual Configuration Sliders (active when in manual mode) */}
      <div
        className={`panel-base p-4 transition-all duration-300 ${
          isManual
            ? 'border-amber-500/50 shadow-[0_0_20px_-3px_rgba(245,158,11,0.2)]'
            : 'opacity-60 pointer-events-none'
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Manual Parameter Override Sliders {isManual ? '(Active)' : '(Disabled — Enable Manual Mode)'}
            </h3>
          </div>
          {isManual && (
            <button
              onClick={handleApplyManual}
              disabled={isUpdating}
              className="px-3 py-1 rounded bg-amber-500 hover:bg-amber-400 text-slate-950 font-mono font-bold text-xs shadow-lg transition-all"
            >
              APPLY SETTINGS
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-400">Carrier Freq</span>
              <span className="text-white font-bold">{manualFreq.toFixed(1)} kHz</span>
            </div>
            <input
              type="range"
              min={20}
              max={200}
              step={1}
              value={manualFreq}
              disabled={!isManual}
              onChange={(e) => setManualFreq(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-400">Bandwidth</span>
              <span className="text-white font-bold">{manualBw.toFixed(1)} kHz</span>
            </div>
            <input
              type="range"
              min={1}
              max={50}
              step={0.5}
              value={manualBw}
              disabled={!isManual}
              onChange={(e) => setManualBw(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-400">Pulse Duration</span>
              <span className="text-white font-bold">{manualPulse.toFixed(1)} ms</span>
            </div>
            <input
              type="range"
              min={0.1}
              max={50}
              step={0.5}
              value={manualPulse}
              disabled={!isManual}
              onChange={(e) => setManualPulse(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div>
            <div className="flex justify-between text-xs font-mono mb-1">
              <span className="text-slate-400">Transmit Power</span>
              <span className="text-white font-bold">{manualPower.toFixed(1)} W</span>
            </div>
            <input
              type="range"
              min={0.5}
              max={20}
              step={0.5}
              value={manualPower}
              disabled={!isManual}
              onChange={(e) => setManualPower(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>
        </div>
      </div>

      {/* Adaptive Decision Rule Matrix Status Table */}
      <div className="panel-base p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Active Heuristic Adaptation Rules Matrix
            </h3>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            {rules.filter((r) => r.active).length} OF {rules.length} RULES CURRENTLY TRIGGERED
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400 text-[10px] uppercase">
                <th className="py-2 px-3">Rule ID & Name</th>
                <th className="py-2 px-3">Trigger Condition</th>
                <th className="py-2 px-3">Adaptation Action</th>
                <th className="py-2 px-3">Priority</th>
                <th className="py-2 px-3 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {rules.map((rule) => (
                <tr
                  key={rule.id}
                  className={`hover:bg-slate-800/30 transition-all ${
                    rule.active ? 'bg-cyan-950/20' : ''
                  }`}
                >
                  <td className="py-2.5 px-3">
                    <span className="font-bold text-white block">{rule.name}</span>
                    <span className="text-[10px] text-slate-500">{rule.id}</span>
                  </td>
                  <td className="py-2.5 px-3 text-slate-300">{rule.condition}</td>
                  <td className="py-2.5 px-3 text-cyan-300 font-medium">{rule.action}</td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${
                        rule.priority === 'CRITICAL'
                          ? 'bg-rose-950 text-rose-300 border border-rose-800'
                          : rule.priority === 'HIGH'
                          ? 'bg-amber-950 text-amber-300 border border-amber-800'
                          : 'bg-slate-800 text-slate-300'
                      }`}
                    >
                      {rule.priority}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    {rule.active ? (
                      <span className="inline-flex items-center gap-1.5 text-cyan-400 font-bold">
                        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
                        TRIGGERED
                      </span>
                    ) : (
                      <span className="text-slate-600">INACTIVE</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adaptation History Timeline Table */}
      <div className="panel-base p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Adaptation Decision Audit History
          </h3>
          <span className="text-[11px] font-mono text-slate-400">
            {adaptationHistory.length} EVENTS LOGGED
          </span>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
          {adaptationHistory.length === 0 ? (
            <div className="p-6 text-center text-slate-500 font-mono text-xs">
              No parameter adaptations recorded yet. Move environment sliders to trigger adaptive transitions.
            </div>
          ) : (
            adaptationHistory.map((rec, idx) => (
              <div
                key={idx}
                className="bg-[#080d17]/80 border border-slate-800 rounded-lg p-3 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-500">
                      {new Date(rec.timestamp * 1000).toLocaleTimeString()}
                    </span>
                    <span className="font-bold text-slate-200">{rec.reason}</span>
                  </div>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {rec.triggered_rules?.map((r, rIdx) => (
                      <span
                        key={rIdx}
                        className="px-1.5 py-0.5 rounded bg-cyan-950 text-cyan-400 text-[9px] font-mono"
                      >
                        {r}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 font-mono text-[11px] text-slate-300 shrink-0">
                  <span>
                    fc: {(rec.old_config?.frequency / 1000).toFixed(0)} →{' '}
                    <strong className="text-cyan-300">{(rec.new_config?.frequency / 1000).toFixed(0)} kHz</strong>
                  </span>
                  <span>
                    Pwr: {rec.old_config?.transmit_power?.toFixed(1)} →{' '}
                    <strong className="text-amber-300">{rec.new_config?.transmit_power?.toFixed(1)}W</strong>
                  </span>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
