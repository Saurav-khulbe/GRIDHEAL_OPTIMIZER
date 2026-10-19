import React from 'react';
import { useGridStore } from '../store/useGrid';
import { SCENARIOS } from '../sim/faults';
import { 
  Sun, BatteryCharging, ShieldAlert, Cpu, Compass, 
  HelpCircle, Moon, Zap, Layers 
} from 'lucide-react';

export const Header: React.FC = () => {
  const { 
    scenarioId, 
    setScenario, 
    viewMode, 
    setViewMode, 
    startTour, 
    toggleAbout, 
    toggleTheme, 
    theme 
  } = useGridStore();

  return (
    <header className="border-b border-slate-800 bg-[#0F172A]/90 backdrop-blur sticky top-0 z-40 px-4 py-3">
      <div className="max-w-[1720px] mx-auto flex flex-wrap items-center justify-between gap-4">
        {/* Brand & Team Metadata */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center shadow-lg shadow-teal-500/20 text-slate-950">
            <Zap className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-bold tracking-tight text-white font-sans">
                GridHeal
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-teal-500/10 text-teal-400 border border-teal-500/20 uppercase tracking-widest font-semibold">
                Self-Healing OS
              </span>
            </div>
            <p className="text-xs text-slate-400">
              Team lulzsec • Bharati Vidyapeeth's College of Engineering
            </p>
          </div>
        </div>

        {/* Scenario Selector */}
        <div className="flex items-center gap-2 bg-[#0B0F17] p-1 rounded-xl border border-slate-800">
          <span className="text-xs text-slate-400 px-2 font-mono flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            Fault Scenario:
          </span>
          <select 
            value={scenarioId}
            onChange={(e) => setScenario(e.target.value as any)}
            className="bg-[#131B2E] text-slate-100 text-xs font-medium rounded-lg px-3 py-1.5 border border-slate-700 outline-none focus:border-teal-400 cursor-pointer"
          >
            {SCENARIOS.map((sc) => (
              <option key={sc.id} value={sc.id}>
                {sc.name} ({sc.badge})
              </option>
            ))}
          </select>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center bg-[#0B0F17] p-1 rounded-xl border border-slate-800 text-xs">
          <button
            onClick={() => setViewMode('side_by_side')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
              viewMode === 'side_by_side' 
                ? 'bg-teal-500 text-slate-950 font-semibold shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            Side-by-Side
          </button>
          <button
            onClick={() => setViewMode('gridheal')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              viewMode === 'gridheal' 
                ? 'bg-teal-500 text-slate-950 font-semibold shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            GridHeal (Self-Healing)
          </button>
          <button
            onClick={() => setViewMode('baseline')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              viewMode === 'baseline' 
                ? 'bg-slate-700 text-white font-semibold shadow-sm' 
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Baseline Controller
          </button>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          <button
            onClick={startTour}
            className="px-3 py-1.5 rounded-lg bg-teal-500/10 hover:bg-teal-500/20 text-teal-300 border border-teal-500/30 text-xs font-medium flex items-center gap-1.5 transition-colors"
          >
            <Compass className="w-3.5 h-3.5" />
            Start Tour
          </button>
          <button
            onClick={() => toggleAbout(true)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium flex items-center gap-1 transition-colors border border-slate-700"
            title="Assumptions & About"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            About
          </button>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition-colors border border-slate-700"
            title="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-slate-300" />}
          </button>
        </div>
      </div>
    </header>
  );
};
