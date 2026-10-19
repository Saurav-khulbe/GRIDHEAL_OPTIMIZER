// GridHeal Domain Configuration & Assumed Constants
// All parameters here are marked as (assumed) engineering design values for the campus microgrid.

export const SIM_CONFIG = {
  // Time simulation
  DAYS: 7,
  STEPS_PER_DAY: 96, // 15-minute intervals (24h * 4)
  TOTAL_STEPS: 7 * 96, // 672 steps
  STEP_HOURS: 0.25, // 15 minutes = 0.25h

  // Solar PV (assumed)
  SOLAR_PEAK_KW: 500, // 500 kWp nameplate rating

  // Battery Energy Storage System (BESS) (assumed)
  BATTERY_CAPACITY_KWH: 1000,
  BATTERY_MAX_POWER_KW: 400, // Max charge/discharge
  BATTERY_ROUNDTRIP_EFFICIENCY: 0.90, // 90%
  BATTERY_MIN_SOC: 0.10, // 10% minimum reserve (depth of discharge limit)
  BATTERY_MAX_SOC: 0.95, // 95% maximum safe state of charge
  BATTERY_INITIAL_SOC: 0.50, // Starts at 50% SoC

  // Grid Interconnection (assumed)
  GRID_IMPORT_LIMIT_KW: 600, // Substation transformer limit
  GRID_EXPORT_ENABLED: false, // Export disabled: surplus solar curtailed (wasted)
  CO2_FACTOR_KG_PER_KWH: 0.70, // Standard campus grid emission factor (0.7 kg CO2/kWh)

  // EV Charging Infrastructure (assumed)
  EV_COUNT: 8,
  EV_CHARGER_KW: 7, // Level 2 charger (7 kW per stall = 56 kW total)
  EV_PEAK_ARRIVAL_HOUR: 18, // 6:00 PM evening surge
  EV_REQUIRED_ENERGY_KWH: 28, // ~4 hours at 7kW
  EV_DEADLINE_HOURS: 10, // Must finish within 10h of arrival

  // Campus Loads Baseline Demands (assumed)
  CRITICAL_LOAD_MIN_KW: 60, // Server rooms, biology labs, medical centre, emergency lighting
  CRITICAL_LOAD_MAX_KW: 80,
  FLEXIBLE_LOAD_PEAK_KW: 70, // Batch compute jobs, chilled water pumps
  DEFERRABLE_LOAD_KW: 50, // HVAC thermal pre-cooling, laundry, hot water buffer
  REGULAR_CAMPUS_BASE_KW: 120, // Classrooms, offices, common spaces daytime load
  REGULAR_CAMPUS_PEAK_KW: 280,

  // Default PRNG Seed
  DEFAULT_SEED: 42490,
} as const;

export type LoadClass = 'critical' | 'flexible' | 'deferrable' | 'regular';

export interface EVState {
  id: number;
  arrived: boolean;
  arrivalStep: number;
  deadlineStep: number;
  energyNeededKwh: number;
  energyChargedKwh: number;
  isCharging: boolean;
  chargingRateKw: number;
}
