// Global Application State (Zustand)
import { create } from 'zustand';
import { ScenarioId, SCENARIOS, ScenarioMeta } from '../sim/faults';
import { runSimulation, SimulationRunResult } from '../sim/run';
import { SIM_CONFIG } from '../sim/config';
import { GridHealEvent } from '../sim/gridheal';

export type ControllerViewMode = 'gridheal' | 'baseline' | 'side_by_side';

export interface GridStore {
  // Simulation run state
  scenarioId: ScenarioId;
  seed: number;
  simResult: SimulationRunResult;
  viewMode: ControllerViewMode;
  
  // Playback state
  currentStep: number;
  isPlaying: boolean;
  speed: 1 | 4 | 16;
  
  // Interaction & Explainability state
  hoveredStep: number | null;
  selectedEvent: GridHealEvent | null;
  isWhyPanelOpen: boolean;
  isAboutOpen: boolean;
  isTourActive: boolean;
  tourStep: number;
  theme: 'dark' | 'light';
  
  // Actions
  setScenario: (id: ScenarioId) => void;
  setSeed: (seed: number) => void;
  setViewMode: (mode: ControllerViewMode) => void;
  setCurrentStep: (step: number) => void;
  setIsPlaying: (playing: boolean) => void;
  togglePlay: () => void;
  setSpeed: (speed: 1 | 4 | 16) => void;
  stepForward: () => void;
  stepBackward: () => void;
  setHoveredStep: (step: number | null) => void;
  selectEvent: (event: GridHealEvent | null) => void;
  toggleWhyPanel: (open?: boolean) => void;
  toggleAbout: (open?: boolean) => void;
  startTour: () => void;
  nextTourStep: () => void;
  prevTourStep: () => void;
  endTour: () => void;
  toggleTheme: () => void;
}

export const useGridStore = create<GridStore>((set, get) => {
  const initialScenario: ScenarioId = 'cloud_transient';
  const initialResult = runSimulation(initialScenario, SIM_CONFIG.DEFAULT_SEED);

  return {
    scenarioId: initialScenario,
    seed: SIM_CONFIG.DEFAULT_SEED,
    simResult: initialResult,
    viewMode: 'side_by_side',

    currentStep: 96 + 48, // Start right at Day 1 12:00 for the cloud transient
    isPlaying: false,
    speed: 4,

    hoveredStep: null,
    selectedEvent: initialResult.events[0] || null,
    isWhyPanelOpen: false,
    isAboutOpen: false,
    isTourActive: false,
    tourStep: 0,
    theme: 'dark',

    setScenario: (id: ScenarioId) => {
      const res = runSimulation(id, get().seed);
      // Auto-jump to the fault start step if present, otherwise step 48
      const targetStep = res.scenario.faultStepStart > 0 ? res.scenario.faultStepStart : 48;
      set({
        scenarioId: id,
        simResult: res,
        currentStep: targetStep,
        selectedEvent: res.events[0] || null,
      });
    },

    setSeed: (seed: number) => {
      const res = runSimulation(get().scenarioId, seed);
      set({ seed, simResult: res });
    },

    setViewMode: (mode: ControllerViewMode) => set({ viewMode: mode }),

    setCurrentStep: (step: number) => {
      const clamped = Math.max(0, Math.min(SIM_CONFIG.TOTAL_STEPS - 1, step));
      set({ currentStep: clamped });
    },

    setIsPlaying: (playing: boolean) => set({ isPlaying: playing }),

    togglePlay: () => set(state => ({ isPlaying: !state.isPlaying })),

    setSpeed: (speed: 1 | 4 | 16) => set({ speed }),

    stepForward: () => {
      const { currentStep } = get();
      if (currentStep < SIM_CONFIG.TOTAL_STEPS - 1) {
        set({ currentStep: currentStep + 1 });
      }
    },

    stepBackward: () => {
      const { currentStep } = get();
      if (currentStep > 0) {
        set({ currentStep: currentStep - 1 });
      }
    },

    setHoveredStep: (step: number | null) => set({ hoveredStep: step }),

    selectEvent: (event: GridHealEvent | null) => {
      set({ selectedEvent: event, isWhyPanelOpen: !!event });
    },

    toggleWhyPanel: (open?: boolean) => set(state => ({
      isWhyPanelOpen: open !== undefined ? open : !state.isWhyPanelOpen
    })),

    toggleAbout: (open?: boolean) => set(state => ({
      isAboutOpen: open !== undefined ? open : !state.isAboutOpen
    })),

    startTour: () => {
      set({ isTourActive: true, tourStep: 0 });
    },

    nextTourStep: () => {
      const { tourStep } = get();
      if (tourStep < 5) {
        set({ tourStep: tourStep + 1 });
      } else {
        set({ isTourActive: false, tourStep: 0 });
      }
    },

    prevTourStep: () => {
      const { tourStep } = get();
      if (tourStep > 0) {
        set({ tourStep: tourStep - 1 });
      }
    },

    endTour: () => set({ isTourActive: false, tourStep: 0 }),

    toggleTheme: () => set(state => {
      const nextTheme = state.theme === 'dark' ? 'light' : 'dark';
      if (nextTheme === 'light') {
        document.documentElement.classList.remove('dark');
      } else {
        document.documentElement.classList.add('dark');
      }
      return { theme: nextTheme };
    }),
  };
});
