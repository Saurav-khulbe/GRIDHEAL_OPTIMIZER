import React, { useMemo } from 'react';
import { useGridStore } from '../store/useGrid';
import { SIM_CONFIG } from '../sim/config';
import { HelpCircle } from 'lucide-react';

export const PowerRiver: React.FC = () => {
  const { currentStep, simResult, viewMode } = useGridStore();

  const isGridHealActive = viewMode === 'gridheal' || viewMode === 'side_by_side';
  const ghStep = simResult.gridhealOutputs[currentStep] || simResult.gridhealOutputs[0];
  const baseStep = simResult.baselineOutputs[currentStep] || simResult.baselineOutputs[0];
  const stepData = isGridHealActive ? ghStep : baseStep;

  // Key flows in kW
  const solarGen = stepData.solarGeneratedKw;
  const solarUsed = stepData.solarUsedKw;
  const solarCurt = stepData.solarCurtailedKw;
  const gridImport = stepData.gridImportKw;
  const batteryFlow = stepData.batteryFlowKw; // >0 discharging, <0 charging
  const batterySoc = Math.round(stepData.batterySoc * 100);

  const critServed = stepData.criticalServedKw;
  const critUnserved = stepData.criticalUnservedKw;
  const flexServed = stepData.flexibleServedKw + stepData.evChargingKw;
  const defServed = stepData.deferrableServedKw;
  const regServed = stepData.regularServedKw;

  // Fault states
  const hasInverterFault = stepData.isolatedFault || (!isGridHealActive && stepData.solarGeneratedKw < 150 && currentStep >= 96 * 3 + 44 && currentStep <= 96 * 3 + 60);
  const isBatteryOffline = Math.abs(batteryFlow) < 0.01 && (currentStep >= 96 * 2 + 36 && currentStep <= 96 * 2 + 48);
  const isGridDown = gridImport === 0 && (currentStep >= 96 * 4 + 72 && currentStep <= 96 * 4 + 80);

  return (
    <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-5 shadow-2xl relative overflow-hidden">
      {/* Chart Title & Explanation */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white font-sans flex items-center gap-2">
              Power River: Live Campus Microgrid Dispatch
            </h2>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-semibold uppercase">
              {viewMode === 'baseline' ? 'Baseline Controller' : 'GridHeal Controller'}
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            How to read this: Energy flows from Solar, Battery, and Grid through the central AC microgrid bus into Campus loads. Ribbon width and particle speed represent real-time kW flows.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-solar"></span>
            <span className="text-slate-300">Solar</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-battery"></span>
            <span className="text-slate-300">Battery</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-grid"></span>
            <span className="text-slate-300">Grid</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-critical"></span>
            <span className="text-slate-300">Critical</span>
          </div>
        </div>
      </div>

      {/* Hero Flow Visual Canvas */}
      <div className="w-full mt-4 flex flex-col items-center">
        <svg 
          viewBox="0 0 960 360" 
          className="w-full h-auto max-h-[380px] select-none"
        >
          <defs>
            {/* Gradients */}
            <linearGradient id="solarToBus" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F5B301" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#F5B301" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="gridToBus" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#60A5FA" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#60A5FA" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="batteryDischargeGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#2DD4BF" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#2DD4BF" stopOpacity="0.3" />
            </linearGradient>
            <linearGradient id="busToCrit" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F87171" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#F87171" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="busToReg" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#94A3B8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#94A3B8" stopOpacity="0.85" />
            </linearGradient>
            <linearGradient id="busToFlex" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#A78BFA" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#A78BFA" stopOpacity="0.9" />
            </linearGradient>
            <linearGradient id="busToDef" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#4ADE80" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#4ADE80" stopOpacity="0.9" />
            </linearGradient>

            {/* Glowing filter */}
            <filter id="glow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
          </defs>

          {/* Central Bus Bar (x=460 to 480) */}
          <rect
            x="465"
            y="40"
            width="14"
            height="280"
            rx="7"
            className="fill-slate-700 stroke-slate-500 stroke-1"
          />
          <text
            x="472"
            y="180"
            transform="rotate(-90 472 180)"
            textAnchor="middle"
            className="fill-slate-400 text-[10px] font-mono tracking-widest uppercase font-bold"
          >
            Central Campus Bus (415V AC)
          </text>

          {/* LEFT SOURCES */}

          {/* 1. Solar PV Station */}
          <g transform="translate(60, 45)">
            <rect
              width="140"
              height="70"
              rx="12"
              className="fill-[#0B0F17] stroke-amber-500/50 stroke-1"
            />
            <circle cx="28" cy="35" r="16" className="fill-amber-500/20 stroke-amber-400 stroke-2" />
            <path
              d="M28 24v4M28 42v4M17 35h4M35 35h4M20 27l3 3M33 40l3 3M20 43l3-3M33 27l3 3"
              className="stroke-amber-400 stroke-2 stroke-linecap-round"
            />
            <text x="56" y="30" className="fill-slate-200 text-xs font-bold font-sans">
              Solar PV (500 kWp)
            </text>
            <text x="56" y="48" className="fill-amber-400 text-sm font-bold font-mono">
              {solarGen.toFixed(0)} kW
            </text>
            {solarCurt > 1 && (
              <text x="56" y="62" className="fill-amber-300/70 text-[9px] font-mono">
                Curtailed: {solarCurt.toFixed(0)} kW
              </text>
            )}
          </g>

          {/* Solar Flow Ribbon to Bus */}
          <path
            d={`M 200 80 C 330 80, 360 100, 465 100`}
            fill="none"
            stroke="url(#solarToBus)"
            strokeWidth={Math.max(3, Math.min(28, solarUsed / 14))}
            strokeLinecap="round"
          />

          {hasInverterFault && (
            <g transform="translate(320, 80)">
              <circle cx="0" cy="0" r="12" className="fill-red-600/90 animate-ping" />
              <circle cx="0" cy="0" r="12" className="fill-red-600 stroke-white stroke-2" />
              <path d="M-5 -5 L5 5 M5 -5 L-5 5" className="stroke-white stroke-2" />
              <text x="18" y="4" className="fill-red-400 text-[10px] font-mono font-bold">
                {isGridHealActive ? 'Inverter B Isolated' : 'Inverter Ground Fault'}
              </text>
            </g>
          )}

          {/* 2. Battery BESS Station */}
          <g transform="translate(60, 145)">
            <rect
              width="140"
              height="80"
              rx="12"
              className="fill-[#0B0F17] stroke-teal-500/50 stroke-1"
            />
            {/* Battery Tank Fill Level */}
            <rect
              x="20"
              y="22"
              width="24"
              height="40"
              rx="4"
              className="fill-slate-800 stroke-teal-400/60 stroke-2"
            />
            <rect
              x="22"
              y={60 - (34 * batterySoc) / 100}
              width="20"
              height={(34 * batterySoc) / 100}
              rx="2"
              className="fill-teal-400"
            />
            <rect x="28" y="18" width="8" height="4" rx="1" className="fill-teal-400" />

            <text x="56" y="32" className="fill-slate-200 text-xs font-bold font-sans">
              BESS (1000 kWh)
            </text>
            <text x="56" y="50" className="fill-teal-300 text-sm font-bold font-mono">
              SoC: {batterySoc}%
            </text>
            <text x="56" y="66" className="fill-slate-400 text-[10px] font-mono">
              {batteryFlow > 0
                ? `Discharging ${batteryFlow.toFixed(0)} kW`
                : batteryFlow < 0
                ? `Charging ${Math.abs(batteryFlow).toFixed(0)} kW`
                : isBatteryOffline
                ? 'OFFLINE (Fault)'
                : 'Idle'}
            </text>
          </g>

          {/* Battery Flow Ribbon */}
          {batteryFlow > 0 ? (
            <path
              d={`M 200 185 C 330 185, 360 170, 465 170`}
              fill="none"
              stroke="url(#batteryDischargeGrad)"
              strokeWidth={Math.max(3, Math.min(26, batteryFlow / 14))}
              strokeLinecap="round"
            />
          ) : batteryFlow < 0 ? (
            <path
              d={`M 465 170 C 360 170, 330 185, 200 185`}
              fill="none"
              stroke="#2DD4BF"
              strokeWidth={Math.max(3, Math.min(26, Math.abs(batteryFlow) / 14))}
              strokeDasharray="4 4"
              strokeLinecap="round"
            />
          ) : null}

          {/* 3. Utility Grid Station */}
          <g transform="translate(60, 255)">
            <rect
              width="140"
              height="70"
              rx="12"
              className={`fill-[#0B0F17] stroke-1 ${
                isGridDown ? 'stroke-red-500/70' : 'stroke-blue-500/50'
              }`}
            />
            <circle
              cx="28"
              cy="35"
              r="16"
              className={isGridDown ? 'fill-red-500/20 stroke-red-400 stroke-2' : 'fill-blue-500/20 stroke-blue-400 stroke-2'}
            />
            <path
              d="M28 23 L22 36 L28 36 L26 47 L34 34 L28 34 Z"
              className={isGridDown ? 'fill-red-400' : 'fill-blue-400'}
            />
            <text x="56" y="32" className="fill-slate-200 text-xs font-bold font-sans">
              Utility Grid (600 kW)
            </text>
            <text
              x="56"
              y="50"
              className={`text-sm font-bold font-mono ${
                isGridDown ? 'fill-red-400' : 'fill-blue-400'
              }`}
            >
              {isGridDown ? 'OUTAGE (0 kW)' : `${gridImport.toFixed(0)} kW`}
            </text>
            <text x="56" y="64" className="fill-slate-500 text-[9px] font-mono">
              {isGridDown && isGridHealActive ? 'Microgrid Islanded' : 'Importing'}
            </text>
          </g>

          {/* Grid Flow Ribbon to Bus */}
          {!isGridDown && gridImport > 0 && (
            <path
              d={`M 200 290 C 330 290, 360 250, 465 240`}
              fill="none"
              stroke="url(#gridToBus)"
              strokeWidth={Math.max(3, Math.min(30, gridImport / 15))}
              strokeLinecap="round"
            />
          )}

          {/* RIGHT DEMANDS */}

          {/* 1. Critical Loads */}
          <g transform="translate(740, 35)">
            <rect
              width="160"
              height="60"
              rx="12"
              className={`fill-[#0B0F17] stroke-1 ${
                critUnserved > 0 ? 'stroke-red-500 stroke-2' : 'stroke-red-500/40'
              }`}
            />
            <text x="16" y="24" className="fill-slate-200 text-xs font-bold font-sans">
              Critical (Always-On)
            </text>
            <text x="16" y="44" className="fill-red-400 text-sm font-bold font-mono">
              {critServed.toFixed(0)} kW
            </text>
            {critUnserved > 0 && (
              <text x="90" y="44" className="fill-red-500 text-xs font-mono font-bold animate-pulse">
                DROPPED: {critUnserved.toFixed(0)} kW!
              </text>
            )}
          </g>
          <path
            d={`M 479 90 C 580 90, 640 65, 740 65`}
            fill="none"
            stroke="url(#busToCrit)"
            strokeWidth={Math.max(3, Math.min(24, critServed / 6))}
            strokeLinecap="round"
          />

          {/* 2. Regular Campus Loads */}
          <g transform="translate(740, 110)">
            <rect
              width="160"
              height="60"
              rx="12"
              className="fill-[#0B0F17] stroke-slate-600/50 stroke-1"
            />
            <text x="16" y="24" className="fill-slate-200 text-xs font-bold font-sans">
              Regular Campus Loads
            </text>
            <text x="16" y="44" className="fill-slate-300 text-sm font-bold font-mono">
              {regServed.toFixed(0)} kW
            </text>
          </g>
          <path
            d={`M 479 140 C 580 140, 640 140, 740 140`}
            fill="none"
            stroke="url(#busToReg)"
            strokeWidth={Math.max(3, Math.min(30, regServed / 10))}
            strokeLinecap="round"
          />

          {/* 3. Flexible Loads & EV Stalls */}
          <g transform="translate(740, 185)">
            <rect
              width="160"
              height="68"
              rx="12"
              className="fill-[#0B0F17] stroke-purple-500/40 stroke-1"
            />
            <text x="16" y="22" className="fill-slate-200 text-xs font-bold font-sans">
              Flexible & 8 EVs
            </text>
            <text x="16" y="42" className="fill-purple-400 text-sm font-bold font-mono">
              {flexServed.toFixed(0)} kW
            </text>
            <text x="16" y="58" className="fill-purple-300/70 text-[10px] font-mono">
              EV: {stepData.evChargingKw.toFixed(0)} kW | Pumps/Batch: {stepData.flexibleServedKw.toFixed(0)} kW
            </text>
          </g>
          <path
            d={`M 479 210 C 580 210, 640 220, 740 220`}
            fill="none"
            stroke="url(#busToFlex)"
            strokeWidth={Math.max(2, Math.min(24, flexServed / 7))}
            strokeLinecap="round"
          />

          {/* 4. Deferrable Surplus Loads */}
          <g transform="translate(740, 268)">
            <rect
              width="160"
              height="60"
              rx="12"
              className="fill-[#0B0F17] stroke-emerald-500/40 stroke-1"
            />
            <text x="16" y="24" className="fill-slate-200 text-xs font-bold font-sans">
              Deferrable (Surplus Only)
            </text>
            <text x="16" y="44" className="fill-emerald-400 text-sm font-bold font-mono">
              {defServed.toFixed(0)} kW
            </text>
          </g>
          {defServed > 0 && (
            <path
              d={`M 479 265 C 580 265, 640 295, 740 295`}
              fill="none"
              stroke="url(#busToDef)"
              strokeWidth={Math.max(2, Math.min(20, defServed / 5))}
              strokeLinecap="round"
            />
          )}
        </svg>
      </div>
    </div>
  );
};
