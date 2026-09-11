/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        blackfin: {
          bg: '#070b12',        // ultra-deep marine abyssal navy
          panel: '#0d1524',     // card & panel backdrop
          surface: '#131e33',   // elevated surfaces
          hover: '#1a2942',     // interactive hover
          border: '#1f3352',    // high-contrast subtle border
          borderLight: '#2c476f',
          cyan: '#00f2fe',      // signature sonar electric cyan
          cyanMuted: '#06869b',
          blue: '#0ea5e9',      // telemetry sky blue
          emerald: '#10b981',   // operational nominal
          amber: '#f59e0b',     // caution / adaptation active
          rose: '#f43f5e',      // warning / critical
          purple: '#8b5cf6',    // advanced DSP / FFT
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'Fira Code', 'ui-monospace', 'monospace'],
      },
      boxShadow: {
        'glow-cyan': '0 0 20px -3px rgba(0, 242, 254, 0.35)',
        'glow-emerald': '0 0 20px -3px rgba(16, 185, 129, 0.35)',
        'glow-amber': '0 0 20px -3px rgba(245, 158, 11, 0.35)',
        'glow-rose': '0 0 20px -3px rgba(244, 63, 94, 0.35)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'ping-slow': 'ping 2s cubic-bezier(0, 0, 0.2, 1) infinite',
        'radar-sweep': 'radarSweep 4s linear infinite',
      },
      keyframes: {
        radarSweep: {
          '0%': { transform: 'rotate(0deg)' },
          '100%': { transform: 'rotate(360deg)' },
        }
      }
    },
  },
  plugins: [],
}
