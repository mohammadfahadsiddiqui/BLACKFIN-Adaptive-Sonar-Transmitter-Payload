// BLACKFIN — Mission Navigation Sidebar

import React from 'react';
import { useSystemStore } from '../../stores/systemStore';
import {
  LayoutGrid,
  Activity,
  Compass,
  BrainCircuit,
  Crosshair,
  Zap,
  Cpu,
  Shield,
  ChevronRight,
  X,
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const activeTab = useSystemStore((state) => state.activeTab);
  const setActiveTab = useSystemStore((state) => state.setActiveTab);
  const mobileMenuOpen = useSystemStore((state) => state.mobileMenuOpen);
  const setMobileMenuOpen = useSystemStore((state) => state.setMobileMenuOpen);

  const navItems = [
    {
      id: 'mission',
      label: 'Mission Overview',
      subtext: 'Real-time telemetry dashboard',
      icon: LayoutGrid,
    },
    {
      id: 'sonar',
      label: 'Sonar Signal & FFT',
      subtext: 'Time domain, spectrum, waterfall',
      icon: Activity,
    },
    {
      id: 'environment',
      label: 'Hydrography & Ocean',
      subtext: 'Depth, thermocline, sound speed',
      icon: Compass,
    },
    {
      id: 'adaptive',
      label: 'Adaptive Control',
      subtext: 'Rule matrix & parameter tuning',
      icon: BrainCircuit,
    },
    {
      id: 'target',
      label: 'Target Acquisition',
      subtext: 'Range, SNR, acoustic echo peaks',
      icon: Crosshair,
    },
    {
      id: 'energy',
      label: 'Energy & Power Budget',
      subtext: 'Dynamic savings vs fixed sonar',
      icon: Zap,
    },
    {
      id: 'health',
      label: 'Diagnostics & Health',
      subtext: 'STM32, DAC, Transducer status',
      icon: Cpu,
    },
  ];

  const renderNavContent = () => (
    <>
      {/* Brand Header */}
      <div className="p-3 pb-2 border-b border-[#1f3352]/60">
        <div className="flex items-center gap-3 p-2 rounded-xl bg-gradient-to-br from-[#0c1527] to-[#070b12] border border-cyan-900/40 shadow-inner">
          <div className="w-10 h-10 rounded-lg overflow-hidden border border-cyan-500/50 shadow-[0_0_12px_rgba(0,242,254,0.3)] bg-[#070b12] shrink-0">
            <img src="/blackfin_logo.jpg" alt="BLACKFIN" className="w-full h-full object-cover" />
          </div>
          <div className="min-w-0">
            <div className="font-mono text-xs font-extrabold tracking-wider text-white">
              BLACKFIN™
            </div>
            <div className="text-[9px] text-cyan-400 font-mono tracking-tight font-semibold">
              SMARTER MISSIONS
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Links */}
      <div className="p-3 space-y-1 flex-1 overflow-y-auto">
        <div className="px-3 py-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 font-bold">
          Navigation Systems
        </div>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all cursor-pointer group ${
                isActive
                  ? 'bg-gradient-to-r from-cyan-950/90 to-blue-950/60 border border-cyan-500/50 shadow-[0_0_15px_-3px_rgba(0,242,254,0.25)] text-cyan-300'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-[#0f172a]/60 border border-transparent'
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-1.5 rounded-lg border transition-all ${
                    isActive
                      ? 'bg-cyan-500/20 border-cyan-400/40 text-cyan-300'
                      : 'bg-slate-900 border-slate-800 text-slate-400 group-hover:text-slate-200'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-semibold tracking-wide">
                    {item.label}
                  </div>
                  <div className="text-[10px] font-mono text-slate-500 group-hover:text-slate-400">
                    {item.subtext}
                  </div>
                </div>
              </div>
              <ChevronRight
                className={`w-3.5 h-3.5 transition-transform ${
                  isActive ? 'text-cyan-400 translate-x-0.5' : 'text-slate-600 opacity-0 group-hover:opacity-100'
                }`}
              />
            </button>
          );
        })}
      </div>

      {/* Bottom Mission Card */}
      <div className="p-3 border-t border-slate-800/80">
        <div className="p-3 rounded-xl bg-[#0a1120] border border-cyan-900/40 flex items-center gap-2.5">
          <Shield className="w-5 h-5 text-cyan-400 shrink-0" />
          <div className="text-[10px] font-mono leading-tight">
            <div className="text-white font-bold">AUV PAYLOAD LINK</div>
            <div className="text-slate-400 mt-0.5">Firmware: v1.0.4-Adaptive</div>
            <div className="text-emerald-400 font-semibold mt-0.5">● Ready for Dive</div>
          </div>
        </div>
      </div>
    </>
  );

  return (
    <>
      {/* Desktop Sidebar (hidden on mobile, visible on md and up) */}
      <aside className="hidden md:flex w-64 bg-[#080d17]/95 border-r border-[#1f3352] flex-col justify-between shrink-0 select-none">
        {renderNavContent()}
      </aside>

      {/* Mobile Drawer (visible on mobile when opened) */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex select-none">
          {/* Dark Backdrop */}
          <div
            className="fixed inset-0 bg-black/80 backdrop-blur-sm transition-opacity"
            onClick={() => setMobileMenuOpen(false)}
          />

          {/* Off-canvas Sliding Container */}
          <div className="relative w-72 max-w-[85vw] h-full bg-[#080d17] border-r border-cyan-500/40 flex flex-col justify-between shadow-[0_0_30px_rgba(0,0,0,0.9)] z-10">
            {/* Mobile Header with Close Button */}
            <div className="p-3 pb-2 border-b border-[#1f3352]/80 flex items-center justify-between">
              <span className="font-mono text-xs font-bold text-cyan-400 tracking-wider">
                BLACKFIN NAVIGATION
              </span>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg bg-slate-800 text-slate-300 hover:text-white border border-slate-700 cursor-pointer"
                title="Close Navigation Drawer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {renderNavContent()}
          </div>
        </div>
      )}
    </>
  );
};
