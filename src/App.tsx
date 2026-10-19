import React from 'react';
import { Header } from './components/Header';
import { Scrubber } from './components/Scrubber';
import { PowerRiver } from './charts/PowerRiver';
import { DumbbellScorecard } from './charts/DumbbellScorecard';
import { SupplyDemandTape } from './charts/SupplyDemandTape';
import { SplitReveal } from './charts/SplitReveal';
import { SchedulerGantt } from './charts/SchedulerGantt';
import { ForecastFan } from './charts/ForecastFan';
import { SpiralClock } from './charts/SpiralClock';
import { EventLog } from './components/EventLog';
import { WhyPanel } from './components/WhyPanel';
import { Tour } from './components/Tour';
import { About } from './components/About';
import { useGridStore } from './store/useGrid';

export default function App() {
  const { seed, toggleAbout } = useGridStore();

  return (
    <div className="min-h-screen bg-[#0B0F17] text-slate-100 flex flex-col font-sans selection:bg-teal-500/30 selection:text-teal-200">
      {/* Top Navigation */}
      <Header />

      {/* Main Control Dashboard Content */}
      <main className="max-w-[1720px] w-full mx-auto p-4 sm:p-6 space-y-5 flex-1">
        {/* Scrubber & Simulation Time Control */}
        <Scrubber />

        {/* Dumbbell Scorecard (Design Targets vs Simulated Results) */}
        <DumbbellScorecard />

        {/* Hero Power River Visual Flow */}
        <PowerRiver />

        {/* 2-Column: Supply-Demand Tape & Forecast Fan */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          <div className="lg:col-span-2">
            <SupplyDemandTape />
          </div>
          <div className="lg:col-span-1 flex flex-col">
            <ForecastFan />
          </div>
        </div>

        {/* 2-Column: Split Reveal Comparison & Scheduler Gantt */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SplitReveal />
          <SchedulerGantt />
        </div>

        {/* 2-Column: Spiral Clock & Plain-Language Event Log */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <SpiralClock />
          <EventLog />
        </div>
      </main>

      {/* Why Explainability Drawer */}
      <WhyPanel />

      {/* Guided Tour Walkthrough */}
      <Tour />

      {/* About & Assumptions Modal */}
      <About />

      {/* Control-Room Footer */}
      <footer className="border-t border-slate-800/80 bg-[#0B0F17] px-6 py-4 mt-8 text-xs font-mono text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-teal-400"></span>
          <span>GridHeal Microgrid Brain v1.0 • Built for Prompt-ae-thon PS4</span>
        </div>
        <div className="flex items-center gap-4">
          <span>
            Deterministic PRNG Seed: <code className="text-teal-400 font-bold">{seed}</code>
          </span>
          <button
            onClick={() => toggleAbout(true)}
            className="text-slate-400 hover:text-teal-300 underline underline-offset-2 transition-colors"
          >
            Engineering Assumptions
          </button>
        </div>
      </footer>
    </div>
  );
}
