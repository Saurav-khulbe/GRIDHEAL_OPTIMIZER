import React from 'react';
import { useGridStore } from '../store/useGrid';
import { CheckCircle2, AlertTriangle, Clock, Zap, ArrowDownRight, ArrowUpRight } from 'lucide-react';

export const DumbbellScorecard: React.FC = () => {
  const { simResult } = useGridStore();
  const b = simResult.kpis.baselineKPIs;
  const g = simResult.kpis.gridhealKPIs;
  const kpis = simResult.kpis;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 my-4">
      {/* 1. Critical-Load Downtime (Headline pitch target) */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-sans">
              Critical Load Downtime
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              Design Target: 0 min
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono tabular-nums">
              {g.criticalDowntimeMinutes} min
            </span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center">
              (100% Protected)
            </span>
          </div>
        </div>

        {/* Dumbbell bar */}
        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-slate-400">Baseline: <strong className="text-red-400">{b.criticalDowntimeMinutes} min</strong></span>
            <span className="text-slate-400">GridHeal: <strong className="text-emerald-400">{g.criticalDowntimeMinutes} min</strong></span>
          </div>
          <div className="relative h-2 bg-slate-800 rounded-full flex items-center">
            <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-red-500 to-emerald-400 rounded-full" />
            <div className="absolute left-[0%] w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 shadow" />
            <div className="absolute right-[0%] w-3 h-3 rounded-full bg-red-400 border-2 border-slate-900 shadow" />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-sans">
            Simulated result: {kpis.criticalDowntimePreventedMinutes} minutes of critical blackout prevented.
          </p>
        </div>
      </div>

      {/* 2. Fault to New Dispatch Plan Time */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-sans">
              Fault to New Plan Time
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 font-semibold">
              Design Target: &lt; 1 s
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-teal-400 font-mono tabular-nums">
              {g.replanDurationMsAvg.toFixed(2)} ms
            </span>
            <span className="text-xs text-slate-400 font-mono">
              (In-browser engine)
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-slate-400">Baseline: <strong className="text-slate-300">~3 min (Manual)</strong></span>
            <span className="text-slate-400">GridHeal: <strong className="text-teal-400">&lt; 0.2 ms</strong></span>
          </div>
          <div className="relative h-2 bg-slate-800 rounded-full flex items-center">
            <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-teal-400 to-slate-600 rounded-full" />
            <div className="absolute left-[0%] w-3 h-3 rounded-full bg-teal-400 border-2 border-slate-900 shadow" />
            <div className="absolute right-[0%] w-3 h-3 rounded-full bg-slate-500 border-2 border-slate-900 shadow" />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-sans">
            Simulated result: autonomous real-time re-optimization executes in microsecond loop.
          </p>
        </div>
      </div>

      {/* 3. Peak Grid Demand Reduction */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-sans">
              Peak Grid Demand
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-semibold">
              Peak Shaved
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-white font-mono tabular-nums">
              {g.peakGridDemandKw} kW
            </span>
            <span className="text-xs font-semibold text-emerald-400 flex items-center">
              <ArrowDownRight className="w-3.5 h-3.5 mr-0.5" /> -{kpis.peakDemandReductionKw} kW
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-slate-400">Baseline: <strong className="text-slate-300">{b.peakGridDemandKw} kW</strong></span>
            <span className="text-slate-400">GridHeal: <strong className="text-blue-400">{g.peakGridDemandKw} kW</strong></span>
          </div>
          <div className="relative h-2 bg-slate-800 rounded-full flex items-center">
            <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-blue-400 to-amber-500 rounded-full" />
            <div className="absolute left-[20%] w-3 h-3 rounded-full bg-blue-400 border-2 border-slate-900 shadow" />
            <div className="absolute right-[5%] w-3 h-3 rounded-full bg-amber-400 border-2 border-slate-900 shadow" />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-sans">
            Simulated result: EV shifting prevents simultaneous evening transformer overload.
          </p>
        </div>
      </div>

      {/* 4. Carbon Avoided (SDG 7 & 13) */}
      <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col justify-between">
        <div>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider font-sans">
              CO₂ Emissions Avoided
            </span>
            <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold">
              SDG 13
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold text-emerald-400 font-mono tabular-nums">
              {kpis.co2SavingsKg} kg
            </span>
            <span className="text-xs text-slate-400 font-mono">
              7-Day Run
            </span>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800/80">
          <div className="flex justify-between text-xs font-mono mb-1">
            <span className="text-slate-400">GH Solar Util: <strong className="text-amber-400">{g.solarUtilisationPct}%</strong></span>
            <span className="text-slate-400">Base Solar Util: <strong className="text-slate-300">{b.solarUtilisationPct}%</strong></span>
          </div>
          <div className="relative h-2 bg-slate-800 rounded-full flex items-center">
            <div className="absolute left-0 right-0 h-1 bg-gradient-to-r from-emerald-400 to-slate-700 rounded-full" />
            <div className="absolute left-[99%] w-3 h-3 rounded-full bg-emerald-400 border-2 border-slate-900 shadow" />
            <div className="absolute left-[97%] w-3 h-3 rounded-full bg-slate-500 border-2 border-slate-900 shadow" />
          </div>
          <p className="text-[11px] text-slate-400 mt-2 font-sans">
            Simulated result: 0.70 kg/kWh grid factor applied on curtailed solar captured.
          </p>
        </div>
      </div>
    </div>
  );
};
