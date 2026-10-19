import React, { useMemo } from 'react';
import { useGridStore } from '../store/useGrid';
import { SIM_CONFIG } from '../sim/config';
import { scaleLinear } from 'd3-scale';
import { area, line, curveMonotoneX } from 'd3-shape';
import { Eye, TrendingUp } from 'lucide-react';

export const ForecastFan: React.FC = () => {
  const { currentStep, simResult } = useGridStore();

  const width = 460;
  const height = 220;
  const margin = { top: 20, right: 20, bottom: 25, left: 45 };
  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;

  // Window: 8 steps past + 8 steps into future (total 16 steps = 4 hours)
  const windowSize = 16;
  const halfWindow = 8;
  const minStep = Math.max(0, currentStep - halfWindow);
  const maxStep = Math.min(SIM_CONFIG.TOTAL_STEPS - 1, minStep + windowSize);

  const stepSlice = simResult.gridhealOutputs.slice(minStep, maxStep + 1);

  const xScale = useMemo(() => {
    return scaleLinear()
      .domain([minStep, maxStep])
      .range([margin.left, margin.left + innerWidth]);
  }, [minStep, maxStep, innerWidth]);

  const yScale = useMemo(() => {
    return scaleLinear()
      .domain([0, 500])
      .range([margin.top + innerHeight, margin.top]);
  }, [innerHeight]);

  // Actual solar curve up to currentStep
  const actualSolarPoints = stepSlice
    .filter((d) => d.step <= currentStep)
    .map((d) => ({ step: d.step, val: d.solarGeneratedKw }));

  const lineGen = line<{ step: number; val: number }>()
    .x((d) => xScale(d.step))
    .y((d) => yScale(d.val))
    .curve(curveMonotoneX);

  const actualPath = lineGen(actualSolarPoints) || '';

  // Forecast Fan: future steps
  const futurePoints = stepSlice
    .filter((d) => d.step >= currentStep)
    .map((d) => ({
      step: d.step,
      lower: d.forecastSolarLowerKw,
      mean: d.forecastSolarKw,
      upper: d.forecastSolarUpperKw,
    }));

  const fanAreaGen = area<{ step: number; lower: number; upper: number }>()
    .x((d) => xScale(d.step))
    .y0((d) => yScale(d.lower))
    .y1((d) => yScale(d.upper))
    .curve(curveMonotoneX);

  const fanAreaPath = fanAreaGen(futurePoints) || '';

  const meanLineGen = line<{ step: number; mean: number }>()
    .x((d) => xScale(d.step))
    .y((d) => yScale(d.mean))
    .curve(curveMonotoneX);

  const meanLinePath = meanLineGen(futurePoints) || '';

  const nowX = xScale(currentStep);

  return (
    <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-4 shadow-xl flex-1">
      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
        <div>
          <h3 className="text-sm font-bold text-white font-sans flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-amber-400" />
            Forecast Fan: Solar PV Uncertainty Cone
          </h3>
          <p className="text-xs text-slate-400">
            How to read this: Gold line is actual generation up to playhead. Shaded cone is the 4-step lookahead prediction tested in real-time.
          </p>
        </div>
      </div>

      <div className="mt-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto select-none">
          {/* Y Gridlines */}
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
                x={margin.left - 6}
                y={yScale(kw) + 3}
                textAnchor="end"
                className="fill-slate-500 text-[10px] font-mono"
              >
                {kw}
              </text>
            </g>
          ))}

          {/* Uncertainty Fan Area */}
          <path d={fanAreaPath} fill="#F5B301" fillOpacity="0.25" />

          {/* Forecast Mean Line (Dashed) */}
          <path
            d={meanLinePath}
            fill="none"
            stroke="#F5B301"
            strokeWidth="2"
            strokeDasharray="4 4"
          />

          {/* Actual Solar Line (Solid) */}
          <path
            d={actualPath}
            fill="none"
            stroke="#F5B301"
            strokeWidth="2.5"
          />

          {/* Now Playhead */}
          <line
            x1={nowX}
            y1={margin.top}
            x2={nowX}
            y2={margin.top + innerHeight}
            stroke="#2DD4BF"
            strokeWidth="2"
          />
          <text
            x={nowX}
            y={margin.top - 5}
            textAnchor="middle"
            className="fill-teal-300 text-[9px] font-mono font-bold"
          >
            NOW
          </text>
        </svg>
      </div>
    </div>
  );
};
