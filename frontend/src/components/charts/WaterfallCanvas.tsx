// BLACKFIN — Waterfall Spectrogram Canvas Renderer

import React, { useRef, useEffect } from 'react';
import { useSonarStore } from '../../stores/sonarStore';
import { Layers } from 'lucide-react';

interface WaterfallCanvasProps {
  height?: number;
}

export const WaterfallCanvas: React.FC<WaterfallCanvasProps> = ({ height = 240 }) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const waterfallRows = useSonarStore((state) => state.waterfallRows);
  const config = useSonarStore((state) => state.config);

  // Map dB value (-100 to 0) to RGB color
  const getColor = (db: number) => {
    // Normalize between -90 and -10 dB
    const norm = Math.max(0, Math.min(1, (db + 90) / 80));

    if (norm < 0.25) {
      // Deep Navy -> Dark Teal
      const t = norm / 0.25;
      return [Math.floor(7 + t * 5), Math.floor(11 + t * 40), Math.floor(25 + t * 80)];
    } else if (norm < 0.6) {
      // Dark Teal -> Electric Cyan
      const t = (norm - 0.25) / 0.35;
      return [Math.floor(12 + t * (0 - 12)), Math.floor(51 + t * (242 - 51)), Math.floor(105 + t * (254 - 105))];
    } else if (norm < 0.85) {
      // Electric Cyan -> Amber/Yellow
      const t = (norm - 0.6) / 0.25;
      return [Math.floor(0 + t * 245), Math.floor(242 + t * (158 - 242)), Math.floor(254 + t * (11 - 254))];
    } else {
      // Amber/Yellow -> Intense White
      const t = (norm - 0.85) / 0.15;
      return [255, Math.floor(200 + t * 55), Math.floor(100 + t * 155)];
    }
  };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const cHeight = canvas.height;

    // Clear background
    ctx.fillStyle = '#070b12';
    ctx.fillRect(0, 0, width, cHeight);

    if (waterfallRows.length === 0) {
      ctx.fillStyle = '#64748b';
      ctx.font = '11px monospace';
      ctx.textAlign = 'center';
      ctx.fillText('Accumulating continuous waterfall acoustic scans...', width / 2, cHeight / 2);
      return;
    }

    const numRows = waterfallRows.length;
    const rowHeight = Math.max(2, cHeight / Math.min(60, numRows));

    waterfallRows.forEach((row, rIdx) => {
      const y = rIdx * rowHeight;
      if (y > cHeight) return;

      const numBins = row.length;
      const binWidth = width / numBins;

      for (let cIdx = 0; cIdx < numBins; cIdx++) {
        const val = row[cIdx];
        const [r, g, b] = getColor(val);
        ctx.fillStyle = `rgb(${r},${g},${b})`;
        ctx.fillRect(cIdx * binWidth, y, Math.ceil(binWidth) + 0.5, Math.ceil(rowHeight) + 0.5);
      }
    });
  }, [waterfallRows]);

  return (
    <div className="panel-base p-4 flex flex-col justify-between">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Layers className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Acoustic Waterfall Spectrogram
          </h3>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <span>{waterfallRows.length} SCANS BUFFERED</span>
          <span className="text-cyan-400 font-semibold">{config.waveform_type} PULSE</span>
        </div>
      </div>

      {/* Canvas */}
      <div className="relative rounded-lg overflow-hidden border border-slate-800 bg-[#070b12]" style={{ height }}>
        <canvas
          ref={canvasRef}
          width={700}
          height={height}
          className="w-full h-full block"
        />

        {/* Real-time scan sweep line */}
        <div className="absolute top-0 left-0 right-0 h-[2px] bg-cyan-400 shadow-[0_0_8px_rgba(0,242,254,1)] animate-pulse" />
      </div>

      {/* Footer Colormap Legend */}
      <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400 pt-1 border-t border-slate-800">
        <span>Low Echo (-90 dB)</span>
        <div className="w-36 h-2 rounded bg-gradient-to-r from-[#0d1e3d] via-[#00f2fe] via-[#f59e0b] to-[#ffffff] border border-slate-700" />
        <span>High Intensity (0 dB)</span>
      </div>
    </div>
  );
};
