// BLACKFIN — Cinematic Sonar Boot & Payload Initialization Screen
// Implements SIH-26058 HUD aesthetic with circular sweep, staggered boot telemetry, and cross-fade

import React, { useState, useEffect, useRef } from 'react';
import { useSystemStore } from '../../stores/systemStore';
import { playSonarPing } from '../../services/soundEffects';
import { Shield, Volume2, VolumeX, CheckCircle2, ChevronRight } from 'lucide-react';

interface BootStep {
  id: string;
  text: string;
  subtext: string;
  delayMs: number;
}

const BOOT_SEQUENCE: BootStep[] = [
  {
    id: 'step-1',
    text: '> Initializing transducer array...',
    subtext: 'PZT ceramic impedance matched · 20–200 kHz',
    delayMs: 250,
  },
  {
    id: 'step-2',
    text: '> Calibrating adaptive control logic...',
    subtext: 'Mackenzie sound velocity & SNR threshold loaded',
    delayMs: 650,
  },
  {
    id: 'step-3',
    text: '> Loading acoustic propagation model...',
    subtext: 'Transmission loss: spherical spreading + absorption',
    delayMs: 1050,
  },
  {
    id: 'step-4',
    text: '> Establishing telemetry link...',
    subtext: 'Downlink 0xAA55 · Uplink 0x55AA synchronized',
    delayMs: 1450,
  },
  {
    id: 'step-5',
    text: '> Payload ready.',
    subtext: 'Autonomous closed-loop mission active',
    delayMs: 1850,
  },
];

const TOTAL_BOOT_TIME_MS = 2150;
const FADE_OUT_DURATION_MS = 400;

export const BootLoadingScreen: React.FC = () => {
  const finishBoot = useSystemStore((state) => state.finishBoot);
  const [visibleSteps, setVisibleSteps] = useState<number>(0);
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);
  const [audioEnabled, setAudioEnabled] = useState<boolean>(true);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [sweepAngle, setSweepAngle] = useState<number>(0);

  const animFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number>(performance.now());
  const pingPlayedRef = useRef<boolean>(false);

  // Smooth continuous sweep rotation via requestAnimationFrame
  useEffect(() => {
    let active = true;
    const updateSweep = () => {
      if (!active) return;
      const elapsed = performance.now() - startTimeRef.current;
      // 1 full 360-degree rotation every 1800ms
      const angle = (elapsed / 1800) * 360;
      setSweepAngle(angle % 360);
      animFrameRef.current = requestAnimationFrame(updateSweep);
    };

    animFrameRef.current = requestAnimationFrame(updateSweep);
    return () => {
      active = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, []);

  // Staggered step reveal & progress calculation
  useEffect(() => {
    const timers: Array<ReturnType<typeof setTimeout>> = [];


    BOOT_SEQUENCE.forEach((step, index) => {
      const timer = setTimeout(() => {
        setVisibleSteps(index + 1);
        setProgressPercent(Math.round(((index + 1) / BOOT_SEQUENCE.length) * 100));

        // When reaching final step ("Payload ready."), play subtle sonar ping
        if (index === BOOT_SEQUENCE.length - 1 && audioEnabled && !pingPlayedRef.current) {
          pingPlayedRef.current = true;
          playSonarPing(0.14);
        }
      }, step.delayMs);
      timers.push(timer);
    });

    // Begin cross-fade into dashboard
    const fadeTimer = setTimeout(() => {
      setIsFadingOut(true);
    }, TOTAL_BOOT_TIME_MS);

    // Complete transition and unmount
    const finishTimer = setTimeout(() => {
      finishBoot();
    }, TOTAL_BOOT_TIME_MS + FADE_OUT_DURATION_MS);

    return () => {
      timers.forEach(clearTimeout);
      clearTimeout(fadeTimer);
      clearTimeout(finishTimer);
    };
  }, [finishBoot, audioEnabled]);

  // Keyboard shortcut to skip immediately (e.g. Escape key)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' || e.key === ' ') {
        if (audioEnabled && !pingPlayedRef.current) {
          playSonarPing(0.1);
        }
        setIsFadingOut(true);
        setTimeout(() => finishBoot(), 200);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [finishBoot, audioEnabled]);

  const handleSkip = () => {
    if (audioEnabled && !pingPlayedRef.current) {
      playSonarPing(0.1);
    }
    setIsFadingOut(true);
    setTimeout(() => finishBoot(), 200);
  };

  return (
    <div
      className={`fixed inset-0 z-[100] bg-[#070b12] bg-sonar-grid flex flex-col items-center justify-between p-6 sm:p-10 select-none overflow-hidden transition-all duration-400 ease-out ${
        isFadingOut
          ? 'opacity-0 scale-[1.03] pointer-events-none blur-[1px]'
          : 'opacity-100 scale-100 pointer-events-auto'
      }`}
    >
      {/* Top Controls Bar */}
      <div className="w-full max-w-4xl flex items-center justify-between text-xs font-mono text-slate-500">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
          <span className="text-slate-400 tracking-wider">BOOT TELEMETRY SEQUENCE</span>
          <span className="text-slate-600">|</span>
          <span className="text-cyan-500/80">SIH-26058</span>
        </div>

        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => setAudioEnabled(!audioEnabled)}
            className="hover:text-cyan-300 transition-colors flex items-center gap-1.5 px-2 py-1 rounded bg-[#0b1322] border border-slate-800"
            title="Toggle Sonar Ping Audio"
          >
            {audioEnabled ? (
              <>
                <Volume2 className="w-3.5 h-3.5 text-cyan-400" />
                <span className="text-[10px] text-cyan-400 font-semibold">AUDIO ON</span>
              </>
            ) : (
              <>
                <VolumeX className="w-3.5 h-3.5 text-slate-500" />
                <span className="text-[10px] text-slate-500">MUTED</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={handleSkip}
            className="hover:text-cyan-300 transition-colors flex items-center gap-1 text-[11px] text-slate-400 hover:border-cyan-700 px-2 py-1 rounded border border-slate-800 bg-[#090f1a]"
          >
            <span>SKIP [ESC]</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Center Display: Branding, Sonar Radar, and Staggered Boot Telemetry */}
      <div className="w-full max-w-md flex flex-col items-center justify-center my-auto">
        {/* Centered Logo & Wordmark */}
        <div className="flex flex-col items-center text-center mb-6">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border-2 border-cyan-400/80 shadow-[0_0_30px_rgba(0,242,254,0.45)] bg-[#070b12] p-1 mb-3">
            <img
              src="/blackfin_logo.jpg"
              alt="BLACKFIN"
              className="w-full h-full object-cover rounded-xl"
            />
          </div>

          <h1 className="font-mono text-3xl sm:text-4xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-200 to-emerald-400 drop-shadow-[0_0_20px_rgba(0,242,254,0.3)]">
            BLACKFIN
          </h1>

          <div className="text-xs font-mono tracking-[0.3em] text-slate-400 font-semibold uppercase mt-1">
            SMARTER MISSIONS
          </div>

          <div className="text-[10px] font-mono text-cyan-400/90 mt-2 px-2.5 py-0.5 rounded-full bg-cyan-950/70 border border-cyan-800/60 shadow-[0_0_12px_rgba(0,242,254,0.2)]">
            LOW-POWER ADAPTIVE SOFTWARE-DEFINED SONAR PAYLOAD
          </div>
        </div>

        {/* Center Stage: High-Fidelity Sonar Radar Display */}
        <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-full border border-cyan-500/40 bg-[#060a12]/95 shadow-[0_0_40px_rgba(0,242,254,0.2)] overflow-hidden flex items-center justify-center mb-6">
          {/* Concentric Range Rings */}
          <div className="absolute w-[80%] h-[80%] rounded-full border border-cyan-500/25" />
          <div className="absolute w-[56%] h-[56%] rounded-full border border-cyan-500/25" />
          <div className="absolute w-[30%] h-[30%] rounded-full border border-cyan-500/25" />

          {/* Crosshairs */}
          <div className="absolute w-full h-[1px] bg-cyan-500/25" />
          <div className="absolute h-full w-[1px] bg-cyan-500/25" />

          {/* Range Scale Annotations */}
          <div className="absolute top-2 right-4 text-[8px] font-mono text-cyan-400/50">
            RANGE: 120m
          </div>
          <div className="absolute bottom-2 left-4 text-[8px] font-mono text-cyan-400/50">
            SECTOR: 360°
          </div>

          {/* Range distance markings on vertical axis */}
          <span className="absolute top-[11%] text-[8px] font-mono text-cyan-400/40">90m</span>
          <span className="absolute top-[23%] text-[8px] font-mono text-cyan-400/40">60m</span>
          <span className="absolute top-[36%] text-[8px] font-mono text-cyan-400/40">30m</span>

          {/* Rotating Sonar Sweep Beam with Authentic Conical Fading Trail */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              transform: `rotate(${sweepAngle}deg)`,
              transformOrigin: '50% 50%',
            }}
          >
            {/* 75-degree Conical Gradient Phosphor Trail */}
            <div
              className="absolute inset-0 rounded-full"
              style={{
                background:
                  'conic-gradient(from 0deg at 50% 50%, rgba(0, 242, 254, 0.42) 0deg, rgba(0, 242, 254, 0.18) 25deg, rgba(0, 242, 254, 0.04) 55deg, transparent 75deg, transparent 360deg)',
              }}
            />

            {/* Bright Leading Edge Sweep Line */}
            <div
              className="absolute top-1/2 left-1/2 w-1/2 h-[2px] -translate-y-1/2 origin-left"
              style={{
                background: 'linear-gradient(to right, rgba(0, 242, 254, 0.3), #00f2fe, #ffffff)',
                boxShadow: '0 0 10px #00f2fe, 0 0 4px #ffffff',
              }}
            />
          </div>

          {/* Simulated Target Acoustic Reflection Blip (flares as beam passes) */}
          <div
            className="absolute z-10 flex flex-col items-center"
            style={{ top: '32%', right: '28%' }}
          >
            <div className="w-2.5 h-2.5 rounded-full bg-cyan-300 border border-white shadow-[0_0_12px_#00f2fe] animate-ping" />
            <span className="text-[8px] font-mono text-cyan-300 bg-[#070c14]/90 px-1 rounded border border-cyan-800/80 mt-0.5">
              48.2m
            </span>
          </div>

          {/* Center Transducer Node with Acoustic Pulse Rings */}
          <div className="absolute w-8 h-8 rounded-full border border-cyan-400/60 animate-ping pointer-events-none opacity-40" />
          <div className="relative z-20 w-3.5 h-3.5 rounded-full bg-cyan-400 border border-white shadow-[0_0_14px_#00f2fe]" />
        </div>

        {/* Staggered Boot Sequence Log Box */}
        <div className="w-full bg-[#090f1a]/90 border border-cyan-900/50 rounded-xl p-3.5 shadow-lg backdrop-blur-sm">
          <div className="text-[10px] font-mono text-slate-500 uppercase tracking-wider mb-2 flex items-center justify-between border-b border-slate-800 pb-1.5">
            <span>Acoustic Control Unit (ACU) · Boot Log</span>
            <span className="text-cyan-400">{progressPercent}%</span>
          </div>

          <div className="space-y-1.5 font-mono text-xs min-h-[110px]">
            {BOOT_SEQUENCE.slice(0, visibleSteps).map((step, idx) => {
              const isLatest = idx === visibleSteps - 1;
              const isFinal = idx === BOOT_SEQUENCE.length - 1;

              return (
                <div
                  key={step.id}
                  className={`flex items-start justify-between gap-2 transition-opacity duration-200 ${
                    isFinal ? 'text-emerald-300 font-bold' : isLatest ? 'text-cyan-300' : 'text-slate-400'
                  }`}
                >
                  <div className="flex items-center gap-1.5">
                    {isFinal ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 inline animate-pulse" />
                    ) : (
                      <span className="text-cyan-500 text-[10px]">›</span>
                    )}
                    <span>{step.text.replace('> ', '')}</span>
                    {isLatest && !isFinal && (
                      <span className="inline-block w-1.5 h-3 bg-cyan-400 animate-pulse ml-0.5" />
                    )}
                  </div>

                  <span
                    className={`text-[9px] px-1.5 py-0.2 rounded shrink-0 ${
                      isFinal
                        ? 'bg-emerald-950 text-emerald-300 border border-emerald-700 shadow-[0_0_8px_rgba(16,185,129,0.4)]'
                        : 'bg-[#0e1726] text-cyan-400/80 border border-cyan-900/60'
                    }`}
                  >
                    {isFinal ? 'ONLINE' : 'OK'}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Smooth High-Tech Progress Fill */}
          <div className="w-full bg-slate-900 rounded-full h-1.5 mt-3 overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 via-teal-400 to-emerald-400 rounded-full transition-all duration-300 ease-out shadow-[0_0_10px_rgba(0,242,254,0.6)]"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Footer Details */}
      <div className="w-full max-w-4xl flex items-center justify-between text-[11px] font-mono text-slate-500 pt-2 border-t border-slate-900">
        <div className="flex items-center gap-2">
          <Shield className="w-3.5 h-3.5 text-cyan-500" />
          <span>AUTONOMOUS AUV PAYLOAD SUBSYSTEM</span>
        </div>
        <div>
          <span>FIRMWARE v1.0.4-ADAPTIVE</span>
        </div>
      </div>
    </div>
  );
};
