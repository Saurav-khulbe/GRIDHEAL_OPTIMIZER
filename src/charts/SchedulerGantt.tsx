import React from 'react';
import { useGridStore } from '../store/useGrid';
import { SIM_CONFIG } from '../sim/config';
import { Cpu, Server, Car, Waves, Flame } from 'lucide-react';

interface TaskRow {
  name: string;
  category: 'Critical' | 'Flexible' | 'Deferrable';
  priority: 'P0' | 'P1' | 'P2';
  icon: React.ReactNode;
  activeColor: string;
}

const TASK_ROWS: TaskRow[] = [
  { name: 'Server Rooms & Emergency Power', category: 'Critical', priority: 'P0', icon: <Server className="w-3.5 h-3.5 text-red-400" />, activeColor: '#F87171' },
  { name: 'Biology & Cryo Research Labs', category: 'Critical', priority: 'P0', icon: <Cpu className="w-3.5 h-3.5 text-red-400" />, activeColor: '#F87171' },
  { name: 'Campus EV Chargers Bank (8 Stalls)', category: 'Flexible', priority: 'P1', icon: <Car className="w-3.5 h-3.5 text-purple-400" />, activeColor: '#A78BFA' },
  { name: 'HVAC Chilled Water Pumps', category: 'Flexible', priority: 'P1', icon: <Waves className="w-3.5 h-3.5 text-purple-400" />, activeColor: '#A78BFA' },
  { name: 'Thermal Pre-Cooling & Laundry', category: 'Deferrable', priority: 'P2', icon: <Flame className="w-3.5 h-3.5 text-emerald-400" />, activeColor: '#4ADE80' },
];

export const SchedulerGantt: React.FC = () => {
  const { currentStep, simResult, selectEvent } = useGridStore();

  const stepWindow = 48; // View 12-hour slice around current step
  const startStep = Math.max(0, currentStep - 24);
  const endStep = Math.min(SIM_CONFIG.TOTAL_STEPS - 1, startStep + stepWindow);

  const ghStep = simResult.gridhealOutputs[currentStep] || simResult.gridhealOutputs[0];
  const relevantEvents = simResult.events.filter(
    (e) => Math.abs(e.step - currentStep) <= 4
  );

  return (
    <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-2 border-b border-slate-800 gap-2">
        <div>
          <h3 className="text-sm font-bold text-white font-sans flex items-center gap-2">
            Scheduler Gantt: "The Microgrid Operating System"
          </h3>
          <p className="text-xs text-slate-400">
            How to read this: Each electrical load is treated as a priority process scheduled on the microgrid CPU. P0 (Critical) tasks are non-preemptible. P1 (Flexible) shift into solar windows.
          </p>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2 py-0.5 rounded bg-red-500/20 text-red-300 font-bold border border-red-500/30">
            P0: Critical
          </span>
          <span className="px-2 py-0.5 rounded bg-purple-500/20 text-purple-300 font-bold border border-purple-500/30">
            P1: Flexible
          </span>
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold border border-emerald-500/30">
            P2: Deferrable
          </span>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {TASK_ROWS.map((task, idx) => {
          let isRunning = true;
          let statusText = 'RUNNING';

          if (task.priority === 'P0') {
            isRunning = true;
            statusText = 'PROTECTED (P0)';
          } else if (task.priority === 'P1') {
            if (task.name.includes('EV')) {
              isRunning = ghStep.evChargingKw > 5;
              statusText = isRunning ? `ACTIVE (${ghStep.evChargingKw.toFixed(0)} kW)` : 'PAUSED / SHIFTED';
            } else {
              isRunning = ghStep.flexibleServedKw > 10;
              statusText = isRunning ? 'OPTIMIZED' : 'THROTTLED';
            }
          } else if (task.priority === 'P2') {
            isRunning = ghStep.deferrableServedKw > 0;
            statusText = isRunning ? `RUNNING ON SURPLUS (${ghStep.deferrableServedKw.toFixed(0)} kW)` : 'WAITING FOR SURPLUS';
          }

          return (
            <div key={task.name} className="flex items-center gap-3 text-xs">
              {/* Process metadata label */}
              <div className="w-56 shrink-0 flex items-center gap-2">
                {task.icon}
                <div className="truncate">
                  <span className="text-slate-200 font-medium font-sans truncate block">
                    {task.name}
                  </span>
                  <span className="text-[10px] font-mono text-slate-500">
                    Priority: {task.priority} • {task.category}
                  </span>
                </div>
              </div>

              {/* Gantt Bar Visualizer */}
              <div className="flex-1 h-7 bg-[#0B0F17] rounded-lg border border-slate-800 p-1 flex items-center relative overflow-hidden">
                <div
                  className="h-full rounded transition-all duration-300 flex items-center px-2"
                  style={{
                    width: isRunning ? '100%' : '20%',
                    backgroundColor: isRunning ? `${task.activeColor}33` : '#33415533',
                    borderLeft: `4px solid ${isRunning ? task.activeColor : '#64748B'}`,
                  }}
                >
                  <span
                    className="text-[10px] font-mono font-bold tracking-wider"
                    style={{ color: isRunning ? task.activeColor : '#94A3B8' }}
                  >
                    {statusText}
                  </span>
                </div>

                {/* Playhead marker indicator on row */}
                <div className="absolute left-1/2 top-0 bottom-0 w-0.5 bg-teal-400 opacity-80" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Connected Event Explanation Callout */}
      {relevantEvents.length > 0 && (
        <div
          onClick={() => selectEvent(relevantEvents[0])}
          className="mt-4 p-2.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-xs text-teal-300 font-mono flex items-center justify-between cursor-pointer hover:bg-teal-500/15 transition-colors"
        >
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400 animate-pulse"></span>
            <span>Scheduler Event @ this step: <strong>{relevantEvents[0].action}</strong> ({relevantEvents[0].reason})</span>
          </div>
          <span className="text-[10px] uppercase font-bold text-teal-400">View in Why Panel →</span>
        </div>
      )}
    </div>
  );
};
