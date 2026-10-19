import React, { useState } from 'react';
import { useGridStore } from '../store/useGrid';
import { SIM_CONFIG } from '../sim/config';

type MetricKey = 'solar_util' | 'grid_import' | 'unserved';

export const SpiralClock: React.FC = () => {
  const { setCurrentStep, simResult, currentStep } = useGridStore();
  const [metric, setMetric] = useState<MetricKey>('solar_util');

  const width = 460;
  const height = 400;
  const centerX = width / 2;
  const centerY = height / 2 + 10;

  const innerRadius = 45;
  const ringWidth = 16;
  const numDays = 7;
  const stepsPerDay = 96;

  // Helper color map
  const getColor = (stepIndex: number) => {
    const gh = simResult.gridhealOutputs[stepIndex] || simResult.gridhealOutputs[0];
    const base = simResult.baselineOutputs[stepIndex] || simResult.baselineOutputs[0];

    if (metric === 'solar_util') {
      const util = gh.solarGeneratedKw > 0 ? gh.solarUsedKw / gh.solarGeneratedKw : 0;
      return util > 0.85 ? '#F5B301' : util > 0.4 ? '#D97706' : '#1E293B';
    } else if (metric === 'grid_import') {
      const imp = gh.gridImportKw;
      return imp > 250 ? '#EF4444' : imp > 100 ? '#60A5FA' : '#1E293B';
    } else {
      // unserved load (baseline failure marker)
      return base.criticalUnservedKw > 0 ? '#EF4444' : '#10B981';
    }
  };

  const currentDay = Math.floor(currentStep / stepsPerDay);
  const currentStepInDay = currentStep % stepsPerDay;

  return (
    <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-4 shadow-xl flex-1 flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 border-b border-slate-800 gap-2">
        <div>
          <h3 className="text-sm font-bold text-white font-sans">
            Spiral Clock: 7-Day Radial Heatmap
          </h3>
          <p className="text-xs text-slate-400">
            How to read this: 7 concentric day rings, 24 hours around. Click any cell to jump the global time scrubber directly to it.
          </p>
        </div>
        {/* Metric Toggle */}
        <div className="flex items-center gap-1 bg-[#0B0F17] p-1 rounded-lg border border-slate-800 text-[11px] font-mono">
          <button
            onClick={() => setMetric('solar_util')}
            className={`px-2 py-0.5 rounded ${metric === 'solar_util' ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            Solar Util
          </button>
          <button
            onClick={() => setMetric('grid_import')}
            className={`px-2 py-0.5 rounded ${metric === 'grid_import' ? 'bg-blue-500 text-slate-950 font-bold' : 'text-slate-400'}`}
          >
            Grid Import
          </button>
          <button
            onClick={() => setMetric('unserved')}
            className={`px-2 py-0.5 rounded ${metric === 'unserved' ? 'bg-red-500 text-white font-bold' : 'text-slate-400'}`}
          >
            Faults
          </button>
        </div>
      </div>

      <div className="flex items-center justify-center my-auto">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full max-w-[340px] h-auto select-none">
          {/* Day rings */}
          {Array.from({ length: numDays }, (_, d) => {
            const rInner = innerRadius + d * ringWidth;
            const rOuter = rInner + ringWidth - 2;

            return (
              <g key={d}>
                {Array.from({ length: stepsPerDay }, (_, s) => {
                  const stepIndex = d * stepsPerDay + s;
                  const angleStart = (s / stepsPerDay) * 2 * Math.PI - Math.PI / 2;
                  const angleEnd = ((s + 1) / stepsPerDay) * 2 * Math.PI - Math.PI / 2;

                  const x1 = centerX + rInner * Math.cos(angleStart);
                  const y1 = centerY + rInner * Math.sin(angleStart);
                  const x2 = centerX + rOuter * Math.cos(angleStart);
                  const y2 = centerY + rOuter * Math.sin(angleStart);
                  const x3 = centerX + rOuter * Math.cos(angleEnd);
                  const y3 = centerY + rOuter * Math.sin(angleEnd);
                  const x4 = centerX + rInner * Math.cos(angleEnd);
                  const y4 = centerY + rInner * Math.sin(angleEnd);

                  const path = `M ${x1} ${y1} L ${x2} ${y2} A ${rOuter} ${rOuter} 0 0 1 ${x3} ${y3} L ${x4} ${y4} A ${rInner} ${rInner} 0 0 0 ${x1} ${y1} Z`;

                  const isCurrent = currentStep === stepIndex;

                  return (
                    <path
                      key={s}
                      d={path}
                      fill={getColor(stepIndex)}
                      stroke={isCurrent ? '#2DD4BF' : '#0B0F17'}
                      strokeWidth={isCurrent ? 2 : 0.4}
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => setCurrentStep(stepIndex)}
                    />
                  );
                })}
              </g>
            );
          })}

          {/* Clock Labels: 00h, 06h, 12h, 18h */}
          <text x={centerX} y={centerY - innerRadius - numDays * ringWidth - 6} textAnchor="middle" className="fill-slate-400 text-[10px] font-mono">00:00</text>
          <text x={centerX + innerRadius + numDays * ringWidth + 12} y={centerY + 3} textAnchor="start" className="fill-slate-400 text-[10px] font-mono">06:00</text>
          <text x={centerX} y={centerY + innerRadius + numDays * ringWidth + 14} textAnchor="middle" className="fill-slate-400 text-[10px] font-mono">12:00</text>
          <text x={centerX - innerRadius - numDays * ringWidth - 12} y={centerY + 3} textAnchor="end" className="fill-slate-400 text-[10px] font-mono">18:00</text>

          {/* Center Hub */}
          <circle cx={centerX} cy={centerY} r={innerRadius - 4} className="fill-[#0B0F17] stroke-slate-800 stroke-1" />
          <text x={centerX} y={centerY - 6} textAnchor="middle" className="fill-teal-300 text-xs font-bold font-mono">Day {currentDay + 1}</text>
          <text x={centerX} y={centerY + 10} textAnchor="middle" className="fill-slate-400 text-[10px] font-mono">
            {String(Math.floor(currentStepInDay / 4)).padStart(2, '0')}:{String((currentStepInDay % 4) * 15).padStart(2, '0')}
          </text>
        </svg>
      </div>
    </div>
  );
};
