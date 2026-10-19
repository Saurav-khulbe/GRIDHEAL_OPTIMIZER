import React from 'react';
import { useGridStore } from '../store/useGrid';
import { SIM_CONFIG } from '../sim/config';
import { X, Info, ShieldCheck, Zap } from 'lucide-react';

export const About: React.FC = () => {
  const { isAboutOpen, toggleAbout, seed } = useGridStore();

  if (!isAboutOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
      <div className="bg-[#0F172A] border border-slate-700 rounded-3xl max-w-2xl w-full p-6 shadow-2xl space-y-5 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Info className="w-5 h-5 text-teal-400" />
            <h2 className="text-lg font-bold text-white font-sans">
              About GridHeal & Assumptions
            </h2>
          </div>
          <button
            onClick={() => toggleAbout(false)}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Project Core Concept */}
        <div className="space-y-2 text-xs text-slate-300 leading-relaxed font-sans">
          <p className="text-sm font-semibold text-teal-300">
            "A microgrid is an operating system for electricity. GridHeal is the scheduler."
          </p>
          <p>
            Operating systems allocate limited compute resources (CPU, RAM) among competing tasks. Similarly, clean campus microgrids must allocate fluctuating renewable power among essential loads, research facilities, and EV chargers.
          </p>
          <p>
            GridHeal runs an autonomous 15-minute loop: <strong>Detect → Predict → Reallocate → Recover</strong>. It operates deterministically in-browser using a rule-based priority engine and a seasonal persistence lookahead forecast.
          </p>
        </div>

        {/* Assumptions & Honesty Disclosure */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-4 space-y-3">
          <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider font-mono">
            Engineering Assumptions (Honesty Rule)
          </h4>
          <ul className="text-xs text-slate-400 space-y-2 list-disc list-inside font-mono">
            <li><strong>Solar PV:</strong> 500 kWp nameplate rating, bell curve with cloud noise factor.</li>
            <li><strong>Battery BESS:</strong> 1000 kWh capacity, 400 kW max power, 90% round-trip efficiency, 10–95% safe SoC bounds.</li>
            <li><strong>Grid Tie:</strong> 600 kW import limit, export disabled (surplus curtailed as solar wasted).</li>
            <li><strong>EV Infrastructure:</strong> 8 Level 2 chargers (7 kW each = 56 kW total surge), evening peak arrival distribution.</li>
            <li><strong>Critical Loads:</strong> 60–80 kW continuous (server rooms, emergency, biology labs).</li>
            <li><strong>Carbon Factor:</strong> 0.70 kg CO₂/kWh assumed standard campus grid intensity.</li>
            <li><strong>Deterministic PRNG:</strong> Mulberry32 generator with active seed: <code className="text-teal-300 bg-slate-800 px-1 py-0.5 rounded">{seed}</code>.</li>
          </ul>
        </div>

        {/* Design Targets vs Simulation */}
        <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-4 space-y-2 text-xs">
          <h4 className="font-bold text-slate-200 font-sans">
            Design Targets vs Simulated Results
          </h4>
          <p className="text-slate-400">
            The pitch specifies two headline targets: <strong>0 min critical-load downtime</strong> and <strong>under 1 s fault-to-plan time</strong>. Both are verified in real-time by the in-browser simulator across all 5 fault benchmarks.
          </p>
        </div>

        <div className="pt-2 flex justify-end">
          <button
            onClick={() => toggleAbout(false)}
            className="px-5 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
