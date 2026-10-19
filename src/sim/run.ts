// Unified Simulation Runner
import { SIM_CONFIG } from './config';
import { generateProfiles, StepProfile } from './profiles';
import { SCENARIOS, ScenarioId, getFaultAtStep, ScenarioMeta } from './faults';
import { simulateBaseline, ControllerStepOutput } from './baseline';
import { simulateGridHeal, GridHealStepOutput, GridHealEvent } from './gridheal';
import { computeKPIs, ComparisonResults } from './kpis';

export interface SimulationRunResult {
  scenario: ScenarioMeta;
  seed: number;
  profiles: StepProfile[];
  baselineOutputs: ControllerStepOutput[];
  gridhealOutputs: GridHealStepOutput[];
  events: GridHealEvent[];
  kpis: ComparisonResults;
}

export function runSimulation(scenarioId: ScenarioId = 'normal', seed: number = SIM_CONFIG.DEFAULT_SEED): SimulationRunResult {
  const scenario = SCENARIOS.find(s => s.id === scenarioId) || SCENARIOS[0];
  const profiles = generateProfiles(seed);
  const faultLookup = (step: number) => getFaultAtStep(scenarioId, step);

  const baselineOutputs = simulateBaseline(profiles, faultLookup);
  const { outputs: gridhealOutputs, allEvents } = simulateGridHeal(profiles, faultLookup);
  const kpis = computeKPIs(baselineOutputs, gridhealOutputs);

  return {
    scenario,
    seed,
    profiles,
    baselineOutputs,
    gridhealOutputs,
    events: allEvents,
    kpis,
  };
}
