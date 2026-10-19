import React, { useState, useMemo } from 'react';
import { useGridStore } from '../store/useGrid';
import { SIM_CONFIG } from '../sim/config';
import { scaleLinear } from 'd3-scale';
import { line, area, curveMonotoneX } from 'd3-shape';
import { Sliders, Eye } from 'lucide-react';

export const SplitReveal: React.FC = () => {
  const { simResult, currentStep } = useGridStore();
  const [splitRatio, setSplitRatio] = useState<number>(0.5); // 0.0 to 1.0
  const [showGhostOverlay, setShowGhostOverlay] = useState<boolean>(true);

  const baseline = simResult.baselineOutputs;
  const gridheal = simResult.gridhealOutputs;

  const width = 960;
  const height = 240;
  const margin = { top: 20, right: 20, bottom: 30, left: 55 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  const xScale = useMemo(() => {
    return scaleLinear()
      .domain([0, SIM_CONFIG.TOTAL_STEPS - 1])
      .range([margin.left, margin.left + innerWidth]);
  }, [innerWidth]);

  const yScale = useMemo(() => {
    return scaleLinear()
      .domain([0, 500])
      .range([margin.top + innerHeight, margin.top]);
  }, [innerHeight]);

  const splitX = margin.left + innerWidth * splitRatio;

  // Path generators
  const lineGen = line<{ step: number; val: number }>()
    .x((d) => xScale(d.step))
    .y((d) => yScale(d.val))
    .curve(curveMonotoneX);

  const basePoints = baseline.map((d, i) => ({ step: i, val: d.gridImportKw }));
  const ghPoints = gridheal.map((d, i) => ({ step: i, val: d.gridImportKw }));

  const baseLinePath = lineGen(basePoints) || '';
  const ghLinePath = lineGen(ghPoints) || '';

  // Area between baseline and gridheal (kWh saved)
  const savedAreaGen = area<{ step: number; baseVal: number; ghVal: number }>()
    .x((d) => xScale(d.step))
    .y0((d) => yScale(d.ghVal))
    .y1((d) => yScale(d.baseVal))
    .curve(curveMonotoneX);

  const savedPoints = baseline.map((b, i) => ({
    step: i,
    baseVal: b.gridImportKw,
    ghVal: gridheal[i]?.gridImportKw || 0,
  }));

  const savedAreaPath = savedAreaGen(savedPoints) || '';

  return (
    <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 border-b border-slate-800 gap-2">
        <div>
          <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
            Split-Reveal Compare: Grid Import (Baseline vs GridHeal)
          </h3>
          <p className="text-xs text-slate-400">
            How to read this: Drag the vertical dividing slider to reveal Baseline on the left vs GridHeal on the right. Green shaded ribbon highlights real saved kWh.
          </p>
        </div>

        <div className="flex items-center gap-4 text-xs font-mono">
          <label className="flex items-center gap-1.5 cursor-pointer text-slate-300">
            <input
              type="checkbox"
              checked={showGhostOverlay}
              onChange={(e) => setShowGhostOverlay(e.target.checked)}
              className="rounded bg-slate-800 border-slate-700 text-teal-400 focus:ring-0"
            />
            <span>Highlight kWh Saved</span>
          </label>
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-0.5 bg-red-400"></span>
            <span className="text-red-400">Baseline</span>
            <span className="w-2.5 h-0.5 bg-teal-400 ml-2"></span>
            <span className="text-teal-400">GridHeal</span>
          </div>
        </div>
      </div>

      <div className="mt-3 relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto select-none"
        >
          <defs>
            {/* Left Clip (Baseline) */}
            <clipPath id="leftClip">
              <rect x={margin.left} y={margin.top} width={splitX - margin.left} height={innerHeight} />
            </clipPath>
            {/* Right Clip (GridHeal) */}
            <clipPath id="rightClip">
              <rect x={splitX} y={margin.top} width={margin.left + innerWidth - splitX} height={innerHeight} />
            </clipPath>
          </defs>

          {/* Shaded Saved Area */}
          {showGhostOverlay && (
            <path d={savedAreaPath} fill="#2DD4BF" fillOpacity="0.22" />
          )}

          {/* Baseline Left */}
          <g clipPath="url(#leftClip)">
            <path
              d={baseLinePath}
              fill="none"
              stroke="#F87171"
              strokeWidth="2.5"
            />
            <text
              x={margin.left + 15}
              y={margin.top + 20}
              className="fill-red-400 text-xs font-mono font-bold"
            >
              ← BASELINE (High Peaks)
            </text>
          </g>

          {/* GridHeal Right */}
          <g clipPath="url(#rightClip)">
            <path
              d={ghLinePath}
              fill="none"
              stroke="#2DD4BF"
              strokeWidth="2.5"
            />
            <text
              x={margin.left + innerWidth - 15}
              y={margin.top + 20}
              textAnchor="end"
              className="fill-teal-300 text-xs font-mono font-bold"
            >
              GRIDHEAL (Peak Shaved) →
            </text>
          </g>

          {/* Y Axis Gridlines */}
          {[100, 250, 400].map((kw) => (
            <g key={kw}>
              <line
                x1={margin.left}
                y1={yScale(kw)}
                x2={margin.left + innerWidth}
                y2={yScale(kw)}
                stroke="#1E293B"
                strokeDasharray="4 4"
              />
              <text
                x={margin.left - 8}
                y={yScale(kw) + 3}
                textAnchor="end"
                className="fill-slate-500 text-[10px] font-mono"
              >
                {kw} kW
              </text>
            </g>
          ))}

          {/* Draggable Divider Handle */}
          <line
            x1={splitX}
            y1={margin.top - 8}
            x2={splitX}
            y2={margin.top + innerHeight + 8}
            stroke="#FFFFFF"
            strokeWidth="2"
            strokeDasharray="2 2"
          />
          <circle cx={splitX} cy={margin.top + innerHeight / 2} r="10" fill="#0F172A" stroke="#FFFFFF" strokeWidth="2" />
          <path
            d={`M ${splitX - 4} ${margin.top + innerHeight / 2} L ${splitX - 1} ${margin.top + innerHeight / 2 - 3} L ${splitX - 1} ${margin.top + innerHeight / 2 + 3} Z`}
            fill="#FFFFFF"
          />
          <path
            d={`M ${splitX + 4} ${margin.top + innerHeight / 2} L ${splitX + 1} ${margin.top + innerHeight / 2 - 3} L ${splitX + 1} ${margin.top + innerHeight / 2 + 3} Z`}
            fill="#FFFFFF"
          />
        </svg>

        {/* Range slider for divider */}
        <div className="flex items-center gap-2 mt-2">
          <Sliders className="w-3.5 h-3.5 text-slate-400" />
          <span className="text-[11px] font-mono text-slate-400">Drag to Split View:</span>
          <input
            type="range"
            min={0.05}
            max={0.95}
            step={0.01}
            value={splitRatio}
            onChange={(e) => setSplitRatio(parseFloat(e.target.value))}
            className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400"
          />
        </div>
      </div>
    </div>
  );
};
