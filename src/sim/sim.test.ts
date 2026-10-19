import { describe, it, expect } from 'vitest';
import { runSimulation } from './run';
import { SCENARIOS } from './faults';
import { SIM_CONFIG } from './config';

describe('GridHeal Simulator Integrity & Hard Constraints', () => {
  it('is strictly deterministic with identical seeds', () => {
    const run1 = runSimulation('grid_outage', 12345);
    const run2 = runSimulation('grid_outage', 12345);

    expect(run1.kpis.baselineKPIs.solarTotalGeneratedKwh).toBe(run2.kpis.baselineKPIs.solarTotalGeneratedKwh);
    expect(run1.kpis.gridhealKPIs.gridTotalImportKwh).toBe(run2.kpis.gridhealKPIs.gridTotalImportKwh);
    expect(run1.events.length).toBe(run2.events.length);
  });

  it('guarantees GridHeal critical-load downtime is 0 minutes across all fault scenarios', () => {
    for (const sc of SCENARIOS) {
      const res = runSimulation(sc.id, SIM_CONFIG.DEFAULT_SEED);
      expect(res.kpis.gridhealKPIs.criticalDowntimeMinutes).toBe(0);
      for (const step of res.gridhealOutputs) {
        expect(step.criticalUnservedKw).toBe(0);
      }
    }
  });

  it('maintains strict energy balance every step in GridHeal within 1e-4 tolerance', () => {
    const res = runSimulation('all_sequence');
    for (const s of res.gridhealOutputs) {
      // Total available generation/supply = solarGenerated + gridImport + batteryDischarge
      const supply = s.solarGeneratedKw + s.gridImportKw + Math.max(0, s.batteryFlowKw);
      // Total consumed = served demand + batteryCharging + solarCurtailed
      const batteryCharge = Math.max(0, -s.batteryFlowKw);
      const consumed = s.totalServedKw + batteryCharge + s.solarCurtailedKw;

      expect(Math.abs(supply - consumed)).toBeLessThan(1e-4);
    }
  });

  it('produces structured plain-language events in every fault scenario', () => {
    for (const sc of SCENARIOS) {
      if (sc.id === 'normal') continue;
      const res = runSimulation(sc.id);
      expect(res.events.length).toBeGreaterThan(0);
      for (const evt of res.events) {
        expect(evt.reason).toBeTruthy();
        expect(evt.reason.length).toBeGreaterThan(10);
        expect(evt.action).toBeTruthy();
      }
    }
  });
});
