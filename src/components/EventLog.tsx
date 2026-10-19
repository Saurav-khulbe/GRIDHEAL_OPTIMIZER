import React, { useState } from 'react';
import { useGridStore } from '../store/useGrid';
import { EventStage, GridHealEvent } from '../sim/gridheal';
import { Eye, TrendingUp, RefreshCw, ShieldCheck, ChevronRight, Filter } from 'lucide-react';

const stageIcons: Record<EventStage, React.ReactNode> = {
  detect: <Eye className="w-3.5 h-3.5 text-amber-400" />,
  predict: <TrendingUp className="w-3.5 h-3.5 text-blue-400" />,
  reallocate: <RefreshCw className="w-3.5 h-3.5 text-purple-400" />,
  recover: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />,
};

const stageColors: Record<EventStage, string> = {
  detect: 'border-amber-500/30 bg-amber-500/10 text-amber-300',
  predict: 'border-blue-500/30 bg-blue-500/10 text-blue-300',
  reallocate: 'border-purple-500/30 bg-purple-500/10 text-purple-300',
  recover: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300',
};

export const EventLog: React.FC = () => {
  const { simResult, selectEvent, selectedEvent } = useGridStore();
  const [filterStage, setFilterStage] = useState<string>('all');

  const filteredEvents = simResult.events.filter((e) => {
    if (filterStage === 'all') return true;
    return e.type === filterStage;
  });

  return (
    <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-4 shadow-xl flex flex-col h-[400px]">
      {/* Title & Stage Filter */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></div>
          <h3 className="text-sm font-bold text-white font-sans">
            GridHeal Decision Event Log
          </h3>
          <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
            {filteredEvents.length} events
          </span>
        </div>

        {/* Filter buttons */}
        <div className="flex items-center gap-1 text-[11px] font-mono">
          <Filter className="w-3 h-3 text-slate-500 mr-1" />
          {(['all', 'detect', 'predict', 'reallocate', 'recover'] as const).map((stage) => (
            <button
              key={stage}
              onClick={() => setFilterStage(stage)}
              className={`px-2 py-0.5 rounded-md transition-colors capitalize ${
                filterStage === stage
                  ? 'bg-teal-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-800/60'
              }`}
            >
              {stage}
            </button>
          ))}
        </div>
      </div>

      {/* Events Feed (Newest first) */}
      <div className="overflow-y-auto flex-1 mt-3 space-y-2 pr-1 custom-scrollbar">
        {filteredEvents.length === 0 ? (
          <div className="text-center py-10 text-xs text-slate-500 font-mono">
            No events registered under this stage filter for this scenario.
          </div>
        ) : (
          [...filteredEvents].reverse().map((evt) => {
            const isSelected = selectedEvent?.id === evt.id;
            return (
              <div
                key={evt.id}
                onClick={() => selectEvent(evt)}
                className={`p-3 rounded-xl border transition-all cursor-pointer text-xs flex items-start justify-between gap-3 ${
                  isSelected
                    ? 'border-teal-400 bg-teal-500/10 shadow-md shadow-teal-500/10'
                    : 'border-slate-800 bg-[#0B0F17]/70 hover:border-slate-700 hover:bg-[#0B0F17]'
                }`}
              >
                <div className="space-y-1 flex-1">
                  <div className="flex items-center gap-2">
                    <span
                      className={`px-2 py-0.5 rounded-md border text-[10px] font-mono uppercase font-semibold flex items-center gap-1 ${
                        stageColors[evt.type]
                      }`}
                    >
                      {stageIcons[evt.type]}
                      {evt.type}
                    </span>
                    <span className="font-semibold text-slate-200 font-sans">
                      {evt.action}
                    </span>
                    <span className="text-[10px] text-slate-500 font-mono ml-auto">
                      {evt.timestamp}
                    </span>
                  </div>
                  <p className="text-slate-300 text-xs leading-relaxed font-sans">
                    {evt.reason}
                  </p>
                  <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-slate-400">
                    <span>Loads: {evt.affectedLoads.join(', ')}</span>
                    {evt.kwChange !== 0 && (
                      <span
                        className={
                          evt.kwChange > 0 ? 'text-amber-400 font-semibold' : 'text-emerald-400 font-semibold'
                        }
                      >
                        {evt.kwChange > 0 ? `+${evt.kwChange} kW` : `${evt.kwChange} kW`}
                      </span>
                    )}
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-600 mt-2 shrink-0" />
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
