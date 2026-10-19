import { runSimulation } from './src/sim/run.js';
import { SCENARIOS } from './src/sim/faults.js';

console.log('========================================================================================');
console.log('GRIDHEAL SIMULATION RESULTS BENCHMARK (Baseline vs GridHeal Across All 5 Fault Scenarios)');
console.log('========================================================================================\n');

const tableData = [];

for (const sc of SCENARIOS) {
  const res = runSimulation(sc.id);
  const b = res.kpis.baselineKPIs;
  const g = res.kpis.gridhealKPIs;
  
  tableData.push({
    'Scenario': sc.name,
    'Base Solar Util %': `${b.solarUtilisationPct}%`,
    'GH Solar Util %': `${g.solarUtilisationPct}%`,
    'Base Peak (kW)': `${b.peakGridDemandKw} kW`,
    'GH Peak (kW)': `${g.peakGridDemandKw} kW`,
    'Base Crit Downtime': `${b.criticalDowntimeMinutes} min`,
    'GH Crit Downtime': `${g.criticalDowntimeMinutes} min`,
    'CO2 Avoided': `${res.kpis.co2SavingsKg} kg`,
    'Re-plan Time': `${g.replanDurationMsAvg.toFixed(2)} ms`
  });
}

console.table(tableData);
