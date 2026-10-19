// Baseline Controller Implementation
// Characteristics:
// - Battery-first rules (charges whenever solar surplus, discharges immediately when load > solar)
// - No forecasting or look-ahead
// - EVs charge on arrival immediately at maximum rate (7 kW) until full
// - Reactive only: acts after shortage occurs
// - No fault isolation: when grid fails and battery is exhausted/offline, drops unshielded loads including critical

import { SIM_CONFIG } from './config';
import { StepProfile } from './profiles';
import { FaultEffect } from './faults';

export interface ControllerStepOutput {
  step: number;
  // Power flows (kW)
  solarGeneratedKw: number;
  solarUsedKw: number;
  solarCurtailedKw: number;
  batteryFlowKw: number; // Positive = discharging, Negative = charging
  batterySoc: number; // 0.0 to 1.0
  gridImportKw: number;
  
  // Served / Unserved Demands (kW)
  criticalServedKw: number;
  criticalUnservedKw: number;
  flexibleServedKw: number;
  flexibleUnservedKw: number;
  deferrableServedKw: number;
  deferrableUnservedKw: number;
  regularServedKw: number;
  regularUnservedKw: number;
  evChargingKw: number;
  evUnservedKw: number;
  
  // Totals
  totalDemandKw: number;
  totalServedKw: number;
  totalUnservedKw: number;
  
  // Diagnostics
  isolatedFault: boolean;
  activeFaultName?: string;
}

export interface EVTrack {
  id: number;
  active: boolean;
  energyRemainingKwh: number;
}

export function simulateBaseline(
  profiles: StepProfile[],
  faultLookup: (step: number) => FaultEffect
): ControllerStepOutput[] {
  const outputs: ControllerStepOutput[] = [];
  
  let batteryEnergyKwh = SIM_CONFIG.BATTERY_CAPACITY_KWH * SIM_CONFIG.BATTERY_INITIAL_SOC;
  const evFleet: EVTrack[] = Array.from({ length: SIM_CONFIG.EV_COUNT }, (_, i) => ({
    id: i,
    active: false,
    energyRemainingKwh: 0,
  }));

  for (const prof of profiles) {
    const fault = faultLookup(prof.step);
    
    // 1. EVs arrival handling: baseline charges immediately
    if (fault.evRushActive) {
      // All 8 EVs activate
      for (let i = 0; i < SIM_CONFIG.EV_COUNT; i++) {
        if (!evFleet[i].active) {
          evFleet[i].active = true;
          evFleet[i].energyRemainingKwh = SIM_CONFIG.EV_REQUIRED_ENERGY_KWH;
        }
      }
    } else {
      for (const evId of prof.evArrivals) {
        if (!evFleet[evId].active) {
          evFleet[evId].active = true;
          evFleet[evId].energyRemainingKwh = SIM_CONFIG.EV_REQUIRED_ENERGY_KWH;
        }
      }
    }

    // Baseline EV demand: every active EV charges at full 7 kW
    let evDemandKw = 0;
    for (const ev of evFleet) {
      if (ev.active && ev.energyRemainingKwh > 0.01) {
        evDemandKw += SIM_CONFIG.EV_CHARGER_KW;
      }
    }

    // 2. Solar available after fault (inverter trip reduces solar available by 50% without isolation)
    let solarAvailableKw = prof.solarPotentialKw * fault.solarMultiplier;
    if (fault.inverterAvailableRatio < 1.0) {
      // Inverter tripped: Baseline doesn't isolate immediately, so dirty trip drops solar
      solarAvailableKw *= fault.inverterAvailableRatio;
    }

    // 3. Demands: Baseline does not defer or shift
    const critDemand = prof.criticalDemandKw;
    const regDemand = prof.regularDemandKw;
    const flexDemand = prof.flexibleDemandKw;
    const defDemand = prof.deferrableDemandKw;
    const totalDemandKw = critDemand + regDemand + flexDemand + defDemand + evDemandKw;

    // 4. Dispatch: Solar first -> Battery -> Grid import
    let solarUsedKw = 0;
    let solarCurtailedKw = 0;
    let batteryFlowKw = 0;
    let gridImportKw = 0;

    let remainingDemand = totalDemandKw;

    // Use solar
    if (solarAvailableKw >= remainingDemand) {
      solarUsedKw = remainingDemand;
      const surplusSolar = solarAvailableKw - remainingDemand;
      remainingDemand = 0;

      // Charge battery with surplus solar if available
      if (fault.batteryAvailable) {
        const maxSocKwh = SIM_CONFIG.BATTERY_CAPACITY_KWH * SIM_CONFIG.BATTERY_MAX_SOC;
        const roomInBatteryKwh = Math.max(0, maxSocKwh - batteryEnergyKwh);
        const maxChargeKw = Math.min(SIM_CONFIG.BATTERY_MAX_POWER_KW, roomInBatteryKwh / SIM_CONFIG.STEP_HOURS);
        const chargeKw = Math.min(surplusSolar, maxChargeKw);
        
        batteryEnergyKwh += chargeKw * SIM_CONFIG.STEP_HOURS * Math.sqrt(SIM_CONFIG.BATTERY_ROUNDTRIP_EFFICIENCY);
        batteryFlowKw = -chargeKw;
        solarCurtailedKw = surplusSolar - chargeKw;
      } else {
        solarCurtailedKw = surplusSolar;
      }
    } else {
      solarUsedKw = solarAvailableKw;
      remainingDemand -= solarAvailableKw;

      // Discharge battery to meet remaining demand
      if (fault.batteryAvailable) {
        const minSocKwh = SIM_CONFIG.BATTERY_CAPACITY_KWH * SIM_CONFIG.BATTERY_MIN_SOC;
        const availableInBatteryKwh = Math.max(0, batteryEnergyKwh - minSocKwh);
        const maxDischargeKw = Math.min(
          SIM_CONFIG.BATTERY_MAX_POWER_KW,
          (availableInBatteryKwh * Math.sqrt(SIM_CONFIG.BATTERY_ROUNDTRIP_EFFICIENCY)) / SIM_CONFIG.STEP_HOURS
        );
        const dischargeKw = Math.min(remainingDemand, maxDischargeKw);
        
        batteryEnergyKwh -= (dischargeKw * SIM_CONFIG.STEP_HOURS) / Math.sqrt(SIM_CONFIG.BATTERY_ROUNDTRIP_EFFICIENCY);
        batteryFlowKw = dischargeKw;
        remainingDemand -= dischargeKw;
      }

      // Import from Grid
      if (remainingDemand > 0) {
        if (fault.gridAvailable) {
          const gridImport = Math.min(remainingDemand, SIM_CONFIG.GRID_IMPORT_LIMIT_KW);
          gridImportKw = gridImport;
          remainingDemand -= gridImport;
        } else {
          // Grid is down!
          gridImportKw = 0;
        }
      }
    }

    // 5. Calculate served vs unserved:
    // Baseline sheds blindly proportionally or drops all non-guaranteed loads when deficit occurs
    const deficitKw = Math.max(0, remainingDemand);
    let totalServedKw = totalDemandKw - deficitKw;

    let critServed = critDemand;
    let critUnserved = 0;
    let regServed = regDemand;
    let regUnserved = 0;
    let flexServed = flexDemand;
    let flexUnserved = 0;
    let defServed = defDemand;
    let defUnserved = 0;
    let evServed = evDemandKw;
    let evUnserved = 0;

    if (deficitKw > 0) {
      // In baseline, without smart priority scheduling, deficit cuts across loads:
      // First cuts deferrable, then flexible, then regular, but if grid outage hits and battery is 0,
      // baseline drops everything including critical loads!
      let remainingDeficit = deficitKw;

      const cutDef = Math.min(defServed, remainingDeficit);
      defServed -= cutDef;
      defUnserved += cutDef;
      remainingDeficit -= cutDef;

      const cutEv = Math.min(evServed, remainingDeficit);
      evServed -= cutEv;
      evUnserved += cutEv;
      remainingDeficit -= cutEv;

      const cutFlex = Math.min(flexServed, remainingDeficit);
      flexServed -= cutFlex;
      flexUnserved += cutFlex;
      remainingDeficit -= cutFlex;

      const cutReg = Math.min(regServed, remainingDeficit);
      regServed -= cutReg;
      regUnserved += cutReg;
      remainingDeficit -= cutReg;

      // If deficit still remains, critical load suffers downtime!
      if (remainingDeficit > 0) {
        const cutCrit = Math.min(critServed, remainingDeficit);
        critServed -= cutCrit;
        critUnserved += cutCrit;
        remainingDeficit -= cutCrit;
      }
    }

    // Update EV energy delivered
    if (evDemandKw > 0 && evServed > 0) {
      const deliveredPerEv = (evServed / evDemandKw) * SIM_CONFIG.EV_CHARGER_KW * SIM_CONFIG.STEP_HOURS;
      for (const ev of evFleet) {
        if (ev.active && ev.energyRemainingKwh > 0) {
          ev.energyRemainingKwh = Math.max(0, ev.energyRemainingKwh - deliveredPerEv);
          if (ev.energyRemainingKwh <= 0.01) {
            ev.active = false; // finished charging
          }
        }
      }
    }

    outputs.push({
      step: prof.step,
      solarGeneratedKw: solarAvailableKw,
      solarUsedKw: Math.round(solarUsedKw * 10) / 10,
      solarCurtailedKw: Math.round(solarCurtailedKw * 10) / 10,
      batteryFlowKw: Math.round(batteryFlowKw * 10) / 10,
      batterySoc: Math.round((batteryEnergyKwh / SIM_CONFIG.BATTERY_CAPACITY_KWH) * 1000) / 1000,
      gridImportKw: Math.round(gridImportKw * 10) / 10,
      criticalServedKw: Math.round(critServed * 10) / 10,
      criticalUnservedKw: Math.round(critUnserved * 10) / 10,
      flexibleServedKw: Math.round(flexServed * 10) / 10,
      flexibleUnservedKw: Math.round(flexUnserved * 10) / 10,
      deferrableServedKw: Math.round(defServed * 10) / 10,
      deferrableUnservedKw: Math.round(defUnserved * 10) / 10,
      regularServedKw: Math.round(regServed * 10) / 10,
      regularUnservedKw: Math.round(regUnserved * 10) / 10,
      evChargingKw: Math.round(evServed * 10) / 10,
      evUnservedKw: Math.round(evUnserved * 10) / 10,
      totalDemandKw: Math.round(totalDemandKw * 10) / 10,
      totalServedKw: Math.round(totalServedKw * 10) / 10,
      totalUnservedKw: Math.round(deficitKw * 10) / 10,
      isolatedFault: false,
      activeFaultName: fault.faultName || undefined,
    });
  }

  return outputs;
}
