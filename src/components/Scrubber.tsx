import React, { useEffect, useRef } from 'react';
import { useGridStore } from '../store/useGrid';
import { SIM_CONFIG } from '../sim/config';
import { Play, Pause, SkipBack, SkipForward, Clock, Zap } from 'lucide-react';

export const Scrubber: React.FC = () => {
  const {
    currentStep,
    setCurrentStep,
    isPlaying,
    togglePlay,
    speed,
    setSpeed,
    stepForward,
    stepBackward,
    simResult,
  } = useGridStore();

  const animationFrameRef = useRef<number>();
  const lastTickTimeRef = useRef<number>(0);

  // Keyboard navigation shortcuts: Space = play/pause, Left/Right = step, 1-5 = scenarios
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement) return;

      if (e.code === 'Space') {
        e.preventDefault();
        togglePlay();
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        stepForward();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        stepBackward();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [togglePlay, stepForward, stepBackward]);

  // Simulation timer loop
  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = 250 / speed;

    const tick = (now: number) => {
      if (now - lastTickTimeRef.current >= intervalMs) {
        lastTickTimeRef.current = now;
        const next = (currentStep + 1) % SIM_CONFIG.TOTAL_STEPS;
        setCurrentStep(next);
      }
      animationFrameRef.current = requestAnimationFrame(tick);
    };

    animationFrameRef.current = requestAnimationFrame(tick);
    return () => {
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [isPlaying, speed, currentStep, setCurrentStep]);

  const currentProf = simResult.profiles[currentStep] || simResult.profiles[0];
  const activeFault = simResult.baselineOutputs[currentStep]?.activeFaultName;

  return (
    <div className="bg-[#131B2E] border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Playback Buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={stepBackward}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Step Backward (Left Arrow)"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            onClick={togglePlay}
            className={`px-4 py-2 rounded-xl flex items-center gap-2 font-semibold text-sm transition-all shadow-md ${
              isPlaying
                ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/20'
                : 'bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-teal-500/20'
            }`}
          >
            {isPlaying ? (
              <>
                <Pause className="w-4 h-4 fill-current" /> Pause
              </>
            ) : (
              <>
                <Play className="w-4 h-4 fill-current" /> Play Simulation
              </>
            )}
          </button>
          <button
            onClick={stepForward}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
            title="Step Forward (Right Arrow)"
          >
            <SkipForward className="w-4 h-4" />
          </button>

          {/* Speed Selector */}
          <div className="flex items-center bg-[#0B0F17] rounded-xl p-1 border border-slate-800 ml-2">
            {([1, 4, 16] as const).map((s) => (
              <button
                key={s}
                onClick={() => setSpeed(s)}
                className={`px-2 py-1 rounded-lg text-xs font-mono font-semibold transition-colors ${
                  speed === s ? 'bg-teal-500 text-slate-950' : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {s}×
              </button>
            ))}
          </div>
        </div>

        {/* Current Time Display */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2 bg-[#0B0F17] px-3 py-1.5 rounded-xl border border-slate-800">
            <Clock className="w-4 h-4 text-teal-400" />
            <span className="text-slate-400">Time:</span>
            <span className="text-teal-300 font-bold">
              Day {currentProf.day + 1} • {String(currentProf.hour).padStart(2, '0')}:
              {String(currentProf.minute).padStart(2, '0')}
            </span>
            <span className="text-slate-500">
              (Step {currentStep + 1}/{SIM_CONFIG.TOTAL_STEPS})
            </span>
          </div>

          {activeFault && (
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/15 border border-red-500/30 text-red-400 font-sans font-semibold text-xs animate-pulse">
              <Zap className="w-3.5 h-3.5 text-red-400" />
              <span>Fault Active: {activeFault}</span>
            </div>
          )}
        </div>
      </div>

      {/* Scrubber Range Slider with fault markers */}
      <div className="mt-4 relative">
        <input
          type="range"
          min={0}
          max={SIM_CONFIG.TOTAL_STEPS - 1}
          value={currentStep}
          onChange={(e) => setCurrentStep(parseInt(e.target.value, 10))}
          className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-teal-400 focus:outline-none"
        />
        <div className="flex justify-between text-[10px] text-slate-500 font-mono mt-1">
          <span>Day 1 (Mon)</span>
          <span>Day 2 (Tue)</span>
          <span>Day 3 (Wed)</span>
          <span>Day 4 (Thu)</span>
          <span>Day 5 (Fri)</span>
          <span>Day 6 (Sat)</span>
          <span>Day 7 (Sun)</span>
        </div>
      </div>
    </div>
  );
};
