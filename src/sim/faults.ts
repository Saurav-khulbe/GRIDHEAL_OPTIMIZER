// Fault Definitions and Scenario Configurations
// 5 Fault Scenarios + "normal" + "all_sequence"

export type ScenarioId = 
  | 'normal'
  | 'cloud_transient'
  | 'battery_failure'
  | 'inverter_trip'
  | 'grid_outage'
  | 'ev_rush'
  | 'all_sequence';

export interface FaultEffect {
  solarMultiplier: number; // Factor on solar potential (1.0 = normal, 0.3 = 70% drop)
  batteryAvailable: boolean; // Battery BESS operational status
  inverterAvailableRatio: number; // 1.0 = all paths ok, 0.5 = 1 inverter path down
  gridAvailable: boolean; // Grid interconnection status
  evRushActive: boolean; // Rush of all 8 EVs arriving at once
  faultName: string;
  faultDescription: string;
}

export interface ScenarioMeta {
  id: ScenarioId;
  name: string;
  badge: string;
  description: string;
  faultStepStart: number;
  faultStepEnd: number;
}

export const SCENARIOS: ScenarioMeta[] = [
  {
    id: 'normal',
    name: 'Normal Week',
    badge: 'Baseline',
    description: '7-day standard operation with normal solar variance and predictable evening EV arrivals.',
    faultStepStart: -1,
    faultStepEnd: -1,
  },
  {
    id: 'cloud_transient',
    name: '1. Cloud Transient',
    badge: 'Weather Transient',
    description: 'Heavy sudden overcast drops solar generation by 70% for 45 minutes during midday peak.',
    faultStepStart: 96 + 48, // Day 1 at 12:00
    faultStepEnd: 96 + 51,   // Day 1 at 12:45 (3 steps = 45 min)
  },
  {
    id: 'battery_failure',
    name: '2. Battery Failure',
    badge: 'Hardware Fault',
    description: 'BESS thermal safeguard triggers: battery goes offline (0 kW charge/discharge) for 3 hours.',
    faultStepStart: 96 * 2 + 36, // Day 2 at 09:00
    faultStepEnd: 96 * 2 + 48,   // Day 2 at 12:00 (12 steps = 3 hours)
  },
  {
    id: 'inverter_trip',
    name: '3. Inverter Trip',
    badge: 'Fault Isolation',
    description: 'Ground fault trips String Inverter B (50% solar loss); requires isolation to prevent bus trip.',
    faultStepStart: 96 * 3 + 44, // Day 3 at 11:00
    faultStepEnd: 96 * 3 + 60,   // Day 3 at 15:00 (16 steps = 4 hours)
  },
  {
    id: 'grid_outage',
    name: '4. Grid Outage',
    badge: 'Grid Loss / Islanding',
    description: 'Upstream utility grid fails for 2 hours. Microgrid must rapidly island to preserve critical loads.',
    faultStepStart: 96 * 4 + 72, // Day 4 at 18:00 (during evening load peak)
    faultStepEnd: 96 * 4 + 80,   // Day 4 at 20:00 (8 steps = 2 hours)
  },
  {
    id: 'ev_rush',
    name: '5. EV Rush',
    badge: 'Demand Surge',
    description: 'Campus special event: all 8 EVs connect within 30 minutes, creating a simultaneous 56 kW surge.',
    faultStepStart: 96 * 5 + 68, // Day 5 at 17:00
    faultStepEnd: 96 * 5 + 74,   // Day 5 at 18:30 (6 steps = 1.5 hours)
  },
  {
    id: 'all_sequence',
    name: 'All 5 in Sequence',
    badge: 'Stress Test',
    description: 'Full resilience benchmark: replaying all 5 realistic faults sequentially over the 7-day run.',
    faultStepStart: 96 + 48,
    faultStepEnd: 96 * 5 + 74,
  },
];

export function getFaultAtStep(scenarioId: ScenarioId, step: number): FaultEffect {
  const normal: FaultEffect = {
    solarMultiplier: 1.0,
    batteryAvailable: true,
    inverterAvailableRatio: 1.0,
    gridAvailable: true,
    evRushActive: false,
    faultName: '',
    faultDescription: '',
  };

  if (scenarioId === 'normal') return normal;

  const checkCloud = () => {
    const s = 96 + 48, e = 96 + 51;
    if (step >= s && step <= e) {
      return {
        ...normal,
        solarMultiplier: 0.30, // 70% drop
        faultName: 'Cloud Transient',
        faultDescription: 'Solar PV dropped 70% due to dense cloud formation',
      };
    }
    return null;
  };

  const checkBattery = () => {
    const s = 96 * 2 + 36, e = 96 * 2 + 48;
    if (step >= s && step <= e) {
      return {
        ...normal,
        batteryAvailable: false,
        faultName: 'Battery BESS Offline',
        faultDescription: 'Thermal sensor safeguard disconnected BESS unit',
      };
    }
    return null;
  };

  const checkInverter = () => {
    const s = 96 * 3 + 44, e = 96 * 3 + 60;
    if (step >= s && step <= e) {
      return {
        ...normal,
        inverterAvailableRatio: 0.50,
        faultName: 'Inverter B Ground Trip',
        faultDescription: 'Solar branch inverter B tripped; path requires isolation',
      };
    }
    return null;
  };

  const checkGrid = () => {
    const s = 96 * 4 + 72, e = 96 * 4 + 80;
    if (step >= s && step <= e) {
      return {
        ...normal,
        gridAvailable: false,
        faultName: 'Utility Grid Outage',
        faultDescription: 'Substation tie tripped: 0 kW grid import available',
      };
    }
    return null;
  };

  const checkEvRush = () => {
    const s = 96 * 5 + 68, e = 96 * 5 + 74;
    if (step >= s && step <= e) {
      return {
        ...normal,
        evRushActive: true,
        faultName: 'EV Charging Rush',
        faultDescription: 'All 8 EV stalls occupied simultaneously, stacking peak demand',
      };
    }
    return null;
  };

  if (scenarioId === 'cloud_transient') return checkCloud() || normal;
  if (scenarioId === 'battery_failure') return checkBattery() || normal;
  if (scenarioId === 'inverter_trip') return checkInverter() || normal;
  if (scenarioId === 'grid_outage') return checkGrid() || normal;
  if (scenarioId === 'ev_rush') return checkEvRush() || normal;

  if (scenarioId === 'all_sequence') {
    return checkCloud() || checkBattery() || checkInverter() || checkGrid() || checkEvRush() || normal;
  }

  return normal;
}
