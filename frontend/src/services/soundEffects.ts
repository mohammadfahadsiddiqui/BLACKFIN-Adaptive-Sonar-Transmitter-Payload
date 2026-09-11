// BLACKFIN — Web Audio API Sonar Sound Generator
// Self-contained acoustic synthesizer for submarine sonar ping (0 external assets)

let audioCtx: AudioContext | null = null;

function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
      audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
}

/**
 * Plays a single, restrained, high-fidelity sonar ping.
 * Uses a primary resonant tone (1220 Hz) with subtle harmonic overtone and exponential decay.
 */
export function playSonarPing(volume: number = 0.12): void {
  try {
    const ctx = getAudioContext();
    if (!ctx) return;

    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }

    const t = ctx.currentTime;

    // Master gain envelope
    const masterGain = ctx.createGain();
    masterGain.gain.setValueAtTime(0.0001, t);
    masterGain.gain.exponentialRampToValueAtTime(volume, t + 0.015);
    masterGain.gain.exponentialRampToValueAtTime(0.0001, t + 0.75);

    // Primary acoustic carrier (downward Doppler chirp characteristic of active sonar ping)
    const osc1 = ctx.createOscillator();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(1240, t);
    osc1.frequency.exponentialRampToValueAtTime(1160, t + 0.6);

    // Second harmonic overtone for metallic hull reverberation
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(2480, t);
    gain2.gain.setValueAtTime(volume * 0.18, t);
    gain2.gain.exponentialRampToValueAtTime(0.0001, t + 0.35);

    osc1.connect(masterGain);
    osc2.connect(gain2);
    gain2.connect(masterGain);
    masterGain.connect(ctx.destination);

    osc1.start(t);
    osc2.start(t);

    osc1.stop(t + 0.8);
    osc2.stop(t + 0.8);
  } catch (err) {
    // Gracefully ignore browser autoplay restrictions
  }
}
