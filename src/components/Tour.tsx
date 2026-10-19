import React from 'react';
import { useGridStore } from '../store/useGrid';
import { Compass, ChevronRight, X, Sparkles } from 'lucide-react';

interface TourStepDef {
  title: string;
  scenario: 'cloud_transient' | 'inverter_trip' | 'grid_outage' | 'all_sequence';
  step: number;
  content: string;
}

const TOUR_STEPS: TourStepDef[] = [
  {
    title: '1. The Problem: Campus Clean Power Volatility',
    scenario: 'cloud_transient',
    step: 96 + 48,
    content: 'Clean campus microgrids face abrupt solar drops when clouds pass, and evening EV charging surges that overload transformers. Manual dispatch fails to react fast enough.',
  },
  {
    title: '2. The Power River: Live Telemetry Dispatch',
    scenario: 'cloud_transient',
    step: 96 + 48,
    content: 'Observe the live flows: Solar, Battery, and Grid feed the campus bus. GridHeal continuously monitors kW ribbons and adjusts battery flow in 15-minute cycles.',
  },
  {
    title: '3. Midday Cloud Transient: Instant Forecast & Reallocate',
    scenario: 'cloud_transient',
    step: 96 + 50,
    content: 'A cloud drops solar by 70%. Look at the Forecast Fan: GridHeal predicted the drop, paused EV charging, and discharged the battery without triggering costly peak grid penalties.',
  },
  {
    title: '4. Inverter Ground Trip: Fault Isolation & Islanding',
    scenario: 'inverter_trip',
    step: 96 * 3 + 45,
    content: 'When Inverter B ground-tripped, Baseline suffered dirty trips. GridHeal immediately isolated the fault path in under 1 second, keeping healthy solar arrays online.',
  },
  {
    title: '5. Baseline vs GridHeal Split: Measurable Savings',
    scenario: 'grid_outage',
    step: 96 * 4 + 74,
    content: 'During the utility grid outage, the Split-Reveal shows Baseline dropping power to critical labs. GridHeal isolated and islanded the microgrid with zero critical downtime.',
  },
  {
    title: '6. Dumbbell Scorecard: Design Targets Met',
    scenario: 'all_sequence',
    step: 200,
    content: 'The scoreboard delivers on all design targets: 0 min critical-load downtime, sub-second autonomous re-planning, peak shaving, and 2+ tonnes of CO2 avoided weekly.',
  },
];

export const Tour: React.FC = () => {
  const { isTourActive, tourStep, nextTourStep, prevTourStep, endTour, setScenario, setCurrentStep } = useGridStore();

  if (!isTourActive) return null;

  const currentDef = TOUR_STEPS[tourStep] || TOUR_STEPS[0];

  const handleNext = () => {
    if (tourStep < TOUR_STEPS.length - 1) {
      const nextDef = TOUR_STEPS[tourStep + 1];
      setScenario(nextDef.scenario);
      setCurrentStep(nextDef.step);
      nextTourStep();
    } else {
      endTour();
    }
  };

  return (
    <div className="fixed inset-x-0 bottom-6 z-50 flex justify-center px-4 pointer-events-none">
      <div className="bg-[#0F172A]/95 border-2 border-teal-400 rounded-2xl p-5 shadow-2xl max-w-xl w-full pointer-events-auto backdrop-blur-md">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2 text-teal-400 font-mono text-xs font-bold uppercase tracking-wider">
            <Sparkles className="w-4 h-4" />
            <span>Guided Hackathon Walkthrough • Step {tourStep + 1} of {TOUR_STEPS.length}</span>
          </div>
          <button
            onClick={endTour}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="mt-3 space-y-2">
          <h3 className="text-base font-bold text-white font-sans">
            {currentDef.title}
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed font-sans">
            {currentDef.content}
          </p>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
          <button
            onClick={prevTourStep}
            disabled={tourStep === 0}
            className="text-xs font-mono text-slate-400 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed"
          >
            ← Previous
          </button>
          <button
            onClick={handleNext}
            className="px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors shadow-md shadow-teal-500/20"
          >
            <span>{tourStep === TOUR_STEPS.length - 1 ? 'Finish Tour' : 'Next Step'}</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
