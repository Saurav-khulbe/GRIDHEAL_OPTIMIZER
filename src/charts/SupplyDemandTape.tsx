import React, { useMemo } from 'react';
import { useGridStore } from '../store/useGrid';
import { SIM_CONFIG } from '../sim/config';
import { area, stack, curveMonotoneX } from 'd3-shape';
import { scaleLinear } from 'd3-scale';

export const SupplyDemandTape: React.FC = () => {
  const { currentStep, setCurrentStep, simResult, setHoveredStep } = useGridStore();

  const data = simResult.gridhealOutputs;
  const faultMeta = simResult.scenario;

  const width = 960;
  const height = 240;
  const margin = { top: 20, right: 20, bottom: 25, left: 50 };

  const innerWidth = width - margin.left - margin.right;
  const innerHeight = height - margin.top - margin.bottom;
  const zeroY = margin.top + innerHeight / 2;

  // Scales
  const xScale = useMemo(() => {
    return scaleLinear()
      .domain([0, SIM_CONFIG.TOTAL_STEPS - 1])
      .range([margin.left, margin.left + innerWidth]);
  }, [innerWidth]);

  // Max kW scale
  const yScale = useMemo(() => {
    return scaleLinear()
      .domain([-500, 700]) // Below 0 is demand, above 0 is supply
      .range([margin.top + innerHeight, margin.top]);
  }, [innerHeight]);

  // Supply stacks: solarUsed, gridImport, batteryDischarge (Above 0)
  const solarPoints = data.map((d, i) => ({
    x: xScale(i),
    y0: zeroY,
    y1: zeroY - (d.solarUsedKw / 700) * (innerHeight / 2),
  }));

  const gridPoints = data.map((d, i) => {
    const solarH = (d.solarUsedKw / 700) * (innerHeight / 2);
    const gridH = (d.gridImportKw / 700) * (innerHeight / 2);
    return {
      x: xScale(i),
      y0: zeroY - solarH,
      y1: zeroY - solarH - gridH,
    };
  });

  // Demand stacks: critDemand, regularDemand, flexibleDemand (Below 0)
  const demandPoints = data.map((d, i) => ({
    x: xScale(i),
    y0: zeroY,
    y1: zeroY + (d.totalServedKw / 500) * (innerHeight / 2),
  }));

  // Area generators
  const areaGen = area<{ x: number; y0: number; y1: number }>()
    .x((d) => d.x)
    .y0((d) => d.y0)
    .y1((d) => d.y1)
    .curve(curveMonotoneX);

  const solarPath = areaGen(solarPoints) || '';
  const gridPath = areaGen(gridPoints) || '';
  const demandPath = areaGen(demandPoints) || '';

  // Fault window rectangle
  const faultRect = useMemo(() => {
    if (faultMeta.faultStepStart < 0) return null;
    const x1 = xScale(faultMeta.faultStepStart);
    const x2 = xScale(faultMeta.faultStepEnd);
    return {
      x: x1,
      width: Math.max(8, x2 - x1),
    };
  }, [faultMeta, xScale]);

  const currentX = xScale(currentStep);

  return (
    <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 border-b border-slate-800 gap-2">
        <div>
          <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
            Supply–Demand Diverging Tape (7-Day Overview)
          </h3>
          <p className="text-xs text-slate-400">
            How to read this: Supply stacks ABOVE the centerline (amber=solar, blue=grid), Campus demands stack BELOW. Hatched orange zones indicate fault windows.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <span className="flex items-center gap-1 text-amber-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-solar"></span> Solar
          </span>
          <span className="flex items-center gap-1 text-blue-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-grid"></span> Grid
          </span>
          <span className="flex items-center gap-1 text-purple-400">
            <span className="w-2.5 h-2.5 rounded-sm bg-flexible"></span> Loads
          </span>
        </div>
      </div>

      <div className="mt-3 relative">
        <svg
          viewBox={`0 0 ${width} ${height}`}
          className="w-full h-auto cursor-crosshair select-none"
          onClick={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const clickX = e.clientX - rect.left;
            const ratio = clickX / rect.width;
            const targetStep = Math.round(ratio * (SIM_CONFIG.TOTAL_STEPS - 1));
            setCurrentStep(targetStep);
          }}
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const mouseX = e.clientX - rect.left;
            const ratio = mouseX / rect.width;
            const targetStep = Math.round(ratio * (SIM_CONFIG.TOTAL_STEPS - 1));
            setHoveredStep(targetStep);
          }}
          onMouseLeave={() => setHoveredStep(null)}
        >
          <defs>
            {/* Pattern for fault window */}
            <pattern id="faultHatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
              <line x1="0" y1="0" x2="0" y2="8" stroke="#EF4444" strokeWidth="2.5" strokeOpacity="0.5" />
            </pattern>
          </defs>

          {/* Fault Window Band */}
          {faultRect && (
            <g>
              <rect
                x={faultRect.x}
                y={margin.top}
                width={faultRect.width}
                height={innerHeight}
                fill="url(#faultHatch)"
                className="animate-pulse"
              />
              <rect
                x={faultRect.x}
                y={margin.top}
                width={faultRect.width}
                height={innerHeight}
                fill="#EF4444"
                fillOpacity="0.15"
                stroke="#EF4444"
                strokeWidth="1"
              />
              <text
                x={faultRect.x + faultRect.width / 2}
                y={margin.top + 12}
                textAnchor="middle"
                className="fill-red-300 text-[10px] font-mono font-bold"
              >
                FAULT: {faultMeta.badge}
              </text>
            </g>
          )}

          {/* Supply Area: Solar */}
          <path d={solarPath} fill="#F5B301" fillOpacity="0.75" />

          {/* Supply Area: Grid */}
          <path d={gridPath} fill="#60A5FA" fillOpacity="0.75" />

          {/* Demand Area (Below Zero) */}
          <path d={demandPath} fill="#818CF8" fillOpacity="0.6" />

          {/* Center Zero Line */}
          <line
            x1={margin.left}
            y1={zeroY}
            x2={margin.left + innerWidth}
            y2={zeroY}
            stroke="#475569"
            strokeWidth="1.5"
            strokeDasharray="4 4"
          />
          <text
            x={margin.left - 8}
            y={zeroY + 3}
            textAnchor="end"
            className="fill-slate-400 text-[10px] font-mono"
          >
            0 kW
          </text>
          <text
            x={margin.left - 8}
            y={margin.top + 15}
            textAnchor="end"
            className="fill-amber-400 text-[9px] font-mono"
          >
            +Supply
          </text>
          <text
            x={margin.left - 8}
            y={margin.top + innerHeight - 5}
            textAnchor="end"
            className="fill-purple-400 text-[9px] font-mono"
          >
            -Demand
          </text>

          {/* Day Boundary Tick Lines */}
          {Array.from({ length: 8 }, (_, d) => {
            const step = d * SIM_CONFIG.STEPS_PER_DAY;
            const x = xScale(Math.min(step, SIM_CONFIG.TOTAL_STEPS - 1));
            return (
              <g key={d}>
                <line
                  x1={x}
                  y1={margin.top}
                  x2={x}
                  y2={margin.top + innerHeight}
                  stroke="#334155"
                  strokeWidth="1"
                />
                <text
                  x={x + 4}
                  y={margin.top + innerHeight + 14}
                  className="fill-slate-500 text-[9px] font-mono"
                >
                  Day {d + 1}
                </text>
              </g>
            );
          })}

          {/* Current Playhead */}
          <line
            x1={currentX}
            y1={margin.top - 5}
            x2={currentX}
            y2={margin.top + innerHeight + 5}
            stroke="#2DD4BF"
            strokeWidth="2.5"
          />
          <circle cx={currentX} cy={zeroY} r="4" fill="#2DD4BF" />
        </svg>
      </div>
    </div>
  );
};
