// BLACKFIN — Mission Control Top Header Bar

import React, { useState, useEffect } from 'react';
import { useSystemStore } from '../../stores/systemStore';
import { useSonarStore } from '../../stores/sonarStore';
import { apiClient } from '../../services/apiClient';
import { StatusIndicator } from '../cards/StatusIndicator';
import { Radio, RefreshCw, Shield, Zap, AlertTriangle } from 'lucide-react';

export const Header: React.FC = () => {
  const status = useSystemStore((state) => state.status);
  const wsConnected = useSystemStore((state) => state.wsConnected);
  const config = useSonarStore((state) => state.config);
  const [timeStr, setTimeStr] = useState<string>('');
  const [isResetting, setIsResetting] = useState<boolean>(false);

  useEffect(() => {
    const updateTimer = () => {
      const now = new Date();
      setTimeStr(
        `${now.getUTCHours().toString().padStart(2, '0')}:${now.getUTCMinutes().toString().padStart(2, '0')}:${now.getUTCSeconds().toString().padStart(2, '0')} UTC`
      );
    };
    updateTimer();
    const timer = setInterval(updateTimer, 1000);
    return () => clearInterval(timer);
  }, []);

  const handleReset = async () => {
    if (!window.confirm('Confirm full system reset? This reloads initial mission baseline.')) return;
    setIsResetting(true);
    try {
      await apiClient.resetSystem();
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  const handleToggleMode = async () => {
    const nextMode = config.mode === 'auto' ? 'manual' : 'auto';
    await apiClient.setAdaptationMode(nextMode);
    useSonarStore.getState().updateSonarConfig({ ...config, mode: nextMode });
  };

  return (
    <header className="h-14 bg-[#090f1a]/95 border-b border-[#1f3352] px-5 flex items-center justify-between backdrop-blur-md z-30 select-none">
      {/* Left: Branding & Subtitle */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => useSystemStore.getState().triggerBoot()}
            className="w-9 h-9 rounded-lg overflow-hidden border border-cyan-500/60 shadow-[0_0_14px_rgba(0,242,254,0.35)] bg-[#070b12] flex items-center justify-center shrink-0 hover:border-cyan-300 hover:scale-105 active:scale-95 transition-all cursor-pointer group"
            title="Re-run Blackfin Sonar Boot Sequence"
          >
            <img src="/blackfin_logo.jpg" alt="BLACKFIN" className="w-full h-full object-cover group-hover:opacity-90" />
          </button>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-sm font-extrabold tracking-wider text-white">
                BLACKFIN
              </span>
              <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-cyan-950 text-cyan-400 border border-cyan-800 font-semibold">
                PS-26058
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-mono tracking-tight">
              Adaptive Sonar Transmitter Payload · SIH 2026
            </p>
          </div>
        </div>
      </div>

      {/* Right: Live Telemetry Status Chips */}
      <div className="flex items-center gap-3 font-mono text-xs">
        {/* UTC Time */}
        <div className="hidden md:flex items-center px-2.5 py-1 rounded bg-[#070b12] border border-slate-800 text-slate-300">
          <span className="text-cyan-400 mr-1.5">●</span>
          {timeStr || '00:00:00 UTC'}
        </div>

        {/* System Source */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-[#070b12] border border-slate-800 text-slate-300">
          <span className="text-[10px] text-slate-500 uppercase">PAYLOAD:</span>
          <span className="text-cyan-300 font-bold text-[11px]">{status.data_source}</span>
        </div>

        {/* Adaptation Mode Switch */}
        <button
          onClick={handleToggleMode}
          title="Click to toggle Adaptive Auto / Manual operator override"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded border transition-all cursor-pointer ${
            config.mode === 'auto'
              ? 'bg-cyan-950/70 border-cyan-700/80 text-cyan-300 shadow-[0_0_10px_rgba(0,242,254,0.2)]'
              : 'bg-amber-950/70 border-amber-700/80 text-amber-300'
          }`}
        >
          <Zap className="w-3 h-3" />
          <span className="text-[11px] font-bold">
            {config.mode === 'auto' ? 'AUTO-ADAPTIVE' : 'MANUAL'}
          </span>
        </button>

        {/* WebSocket Connection Link */}
        <div className="flex items-center gap-2 px-2.5 py-1 rounded bg-[#070b12] border border-slate-800">
          <StatusIndicator
            status={wsConnected ? 'online' : 'error'}
            size="sm"
            pulse={wsConnected}
          />
          <span className={`text-[11px] font-bold ${wsConnected ? 'text-emerald-400' : 'text-rose-400'}`}>
            {wsConnected ? 'LIVE TELEMETRY' : 'CONNECTING...'}
          </span>
        </div>

        {/* System Reset Button */}
        <button
          onClick={handleReset}
          disabled={isResetting}
          title="Reset mission state and calibration"
          className="p-1.5 rounded bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isResetting ? 'animate-spin' : ''}`} />
        </button>
      </div>
    </header>
  );
};
