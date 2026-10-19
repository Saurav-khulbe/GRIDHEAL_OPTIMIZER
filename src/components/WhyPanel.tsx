import React from 'react';
import { useGridStore } from '../store/useGrid';
import { EventStage } from '../sim/gridheal';
import { X, Eye, TrendingUp, RefreshCw, ShieldCheck, ArrowRight, Zap } from 'lucide-react';

const STAGES: { key: EventStage; label: string; icon: React.ReactNode; color: string }[] = [
  { key: 'detect', label: '1. Detect', icon: <Eye className="w-4 h-4" />, color: 'amber' },
  { key: 'predict', label: '2. Predict', icon: <TrendingUp className="w-4 h-4" />, color: 'blue' },
  { key: 'reallocate', label: '3. Reallocate', icon: <RefreshCw className="w-4 h-4" />, color: 'purple' },
  { key: 'recover', label: '4. Recover', icon: <ShieldCheck className="w-4 h-4" />, color: 'emerald' },
];

export const WhyPanel: React.FC = () => {
  const { isWhyPanelOpen, toggleWhyPanel, selectedEvent, currentStep, simResult } = useGridStore();

  if (!isWhyPanelOpen || !selectedEvent) return null;

  const currentGh = simResult.gridhealOutputs[selectedEvent.step] || simResult.gridhealOutputs[0];
  const currentBase = simResult.baselineOutputs[selectedEvent.step] || simResult.baselineOutputs[0];

  return (
    <div className="fixed inset-y-0 right-0 z-50 w-full sm:w-[480px] bg-[#0F172A] border-l border-slate-800 shadow-2xl flex flex-col transform transition-transform duration-300">
      {/* Header */}
      <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-[#131B2E]">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-full bg-teal-400 animate-pulse"></div>
          <div>
            <h2 className="text-base font-bold text-white font-sans">
              Why Panel: Explainability Engine
            </h2>
            <p className="text-xs text-slate-400">
              Audit trail for step {selectedEvent.step + 1} ({selectedEvent.timestamp})
            </p>
          </div>
        </div>
        <button
          onClick={() => toggleWhyPanel(false)}
          className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="p-6 overflow-y-auto flex-1 space-y-6">
        {/* 4-Stage Horizontal Stepper */}
        <div>
          <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider block mb-2">
            The Control Loop (15-min cycle)
          </span>
          <div className="grid grid-cols-4 gap-1 bg-[#0B0F17] p-1.5 rounded-xl border border-slate-800">
            {STAGES.map((st) => {
              const isActive = selectedEvent.type === st.key;
              return (
                <div
                  key={st.key}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg text-center transition-all ${
                    isActive
                      ? 'bg-teal-500 text-slate-950 font-bold shadow-md'
                      : 'text-slate-500'
                  }`}
                >
                  {st.icon}
                  <span className="text-[10px] font-mono mt-1 font-semibold">{st.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* What GridHeal Did */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-xs font-mono text-teal-400">
            <Zap className="w-3.5 h-3.5" />
            <span className="uppercase font-semibold">Autonomous Action Taken:</span>
          </div>
          <h4 className="text-base font-bold text-white font-sans">
            {selectedEvent.action}
          </h4>
          <p className="text-sm text-slate-200 leading-relaxed font-sans bg-[#0B0F17] p-3 rounded-lg border border-slate-800/80">
            "{selectedEvent.reason}"
          </p>
        </div>

        {/* Triggering Numbers */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-xl p-4 space-y-3">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block">
            Telemetry Numbers that Triggered Decision
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
            <div className="bg-[#0B0F17] p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 block">Solar PV Generation:</span>
              <strong className="text-amber-400 text-sm">{currentGh.solarGeneratedKw.toFixed(1)} kW</strong>
            </div>
            <div className="bg-[#0B0F17] p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 block">Battery State of Charge:</span>
              <strong className="text-teal-300 text-sm">{(currentGh.batterySoc * 100).toFixed(0)}%</strong>
            </div>
            <div className="bg-[#0B0F17] p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 block">Grid Tie Status:</span>
              <strong className={currentGh.gridImportKw > 0 ? "text-blue-400 text-sm" : "text-amber-400 text-sm"}>
                {currentGh.gridImportKw > 0 ? `${currentGh.gridImportKw.toFixed(0)} kW Online` : 'Islanded / 0 kW'}
              </strong>
            </div>
            <div className="bg-[#0B0F17] p-2.5 rounded-lg border border-slate-800">
              <span className="text-slate-500 block">Decision Time:</span>
              <strong className="text-emerald-400 text-sm">{currentGh.replanDurationMs.toFixed(2)} ms</strong>
            </div>
          </div>
        </div>

        {/* Baseline Comparison at Same Moment */}
        <div className="bg-[#131B2E] border border-red-900/30 rounded-xl p-4 space-y-2">
          <span className="text-xs font-mono text-red-400 uppercase tracking-wider block font-semibold">
            What the Baseline Controller Did at This Moment:
          </span>
          <div className="text-xs text-slate-300 space-y-1.5 leading-relaxed bg-[#0B0F17] p-3 rounded-lg border border-red-950">
            {currentBase.criticalUnservedKw > 0 ? (
              <p className="text-red-400 font-semibold">
                ⚠️ Baseline reacted purely after blackout: dropped <strong>{currentBase.criticalUnservedKw.toFixed(0)} kW</strong> of CRITICAL campus loads because no fault isolation or island schedule was triggered.
              </p>
            ) : (
              <p>
                Baseline executed standard reactive battery-first dispatch without looking ahead, importing <strong>{currentBase.gridImportKw.toFixed(0)} kW</strong> from the grid.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
