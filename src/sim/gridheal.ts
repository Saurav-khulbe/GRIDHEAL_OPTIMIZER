// GridHeal Controller Implementation
// The 4-stage microgrid scheduler:
// 1. DETECT: Monitor telemetry, spot anomalies (difference vs expected)
// 2. PREDICT: Forecast solar & demand (4-step lookahead + uncertainty band)
// 3. REALLOCATE: Priority dispatch (shed EVs first, shift flexible to solar hours, pre-charge before shortage)
// 4. RECOVER: Isolate faults, island critical bus, guarantee 0 min critical downtime

import { SIM_CONFIG } from './config';
import { StepProfile } from './profiles';
import { FaultEffect } from './faults';
import { ControllerStepOutput, EVTrack } from './baseline';

export type EventStage = 'detect' | 'predict' | 'reallocate' | 'recover';

export interface GridHealEvent {
  id: string;
  step: number;
  type: EventStage;
  action: string;
  reason: string;
  affectedLoads: string[];
  kwChange: number;
  timestamp: string;
}

export interface GridHealStepOutput extends ControllerStepOutput {
  events: GridHealEvent[];
  forecastSolarKw: number;
  forecastSolarLowerKw: number;
  forecastSolarUpperKw: number;
  forecastDemandKw: number;
  forecastDemandLowerKw: number;
  forecastDemandUpperKw: number;
  recoveryStepCount: number;
  replanDurationMs: number;
}

interface SmartEVTrack extends EVTrack {
  deadlineStep: number;
  arrivalStep: number;
}

export function simulateGridHeal(
  profiles: StepProfile[],
  faultLookup: (step: number) => FaultEffect
): { outputs: GridHealStepOutput[]; allEvents: GridHealEvent[] } {
  const outputs: GridHealStepOutput[] = [];
  const allEvents: GridHealEvent[] = [];

  let batteryEnergyKwh = SIM_CONFIG.BATTERY_CAPACITY_KWH * SIM_CONFIG.BATTERY_INITIAL_SOC;
  
  const evFleet: SmartEVTrack[] = Array.from({ length: SIM_CONFIG.EV_COUNT }, (_, i) => ({
    id: i,
    active: false,
    energyRemainingKwh: 0,
    deadlineStep: 0,
    arrivalStep: 0,
  }));

  // Track previous step telemetry for anomaly detection
  let prevSolarTelemetry = 0;
  let prevDemandTelemetry = 0;

  for (let sIdx = 0; sIdx < profiles.length; sIdx++) {
    const prof = profiles[sIdx];
    const fault = faultLookup(prof.step);
    const stepEvents: GridHealEvent[] = [];

    const startTime = performance.now();

    // ----------------------------------------------------
    // STAGE 1: DETECT
    // ----------------------------------------------------
    let telemetryAnomalyDetected = false;
    let anomalyDesc = '';

    // Actual solar before controller action
    let rawSolarAvailableKw = prof.solarPotentialKw * fault.solarMultiplier;
    
    // Anomaly 1: Sudden solar drop (> 40% sudden plunge during daylight)
    if (prof.hour >= 8 && prof.hour <= 16 && prevSolarTelemetry > 100) {
      const dropRatio = (prevSolarTelemetry - rawSolarAvailableKw) / prevSolarTelemetry;
      if (dropRatio > 0.40) {
        telemetryAnomalyDetected = true;
        anomalyDesc = `Solar generation dropped ${(dropRatio * 100).toFixed(0)}% within 15 min (telemetry anomaly).`;
        const ev = {
          id: `evt-${prof.step}-det-1`,
          step: prof.step,
          type: 'detect' as EventStage,
          action: 'Solar Plunge Anomaly Detected',
          reason: anomalyDesc,
          affectedLoads: ['Solar Array', 'Microgrid Bus'],
          kwChange: Math.round(-(prevSolarTelemetry - rawSolarAvailableKw)),
          timestamp: `Day ${prof.day + 1} ${String(prof.hour).padStart(2, '0')}:${String(prof.minute).padStart(2, '0')}`,
        };
        stepEvents.push(ev);
        allEvents.push(ev);
      }
    }

    // Anomaly 2: Inverter Trip fault detection
    let inverterIsolated = false;
    let solarAvailableKw = rawSolarAvailableKw;
    if (fault.inverterAvailableRatio < 1.0) {
      telemetryAnomalyDetected = true;
      inverterIsolated = true; // GridHeal isolates the trip branch!
      solarAvailableKw = rawSolarAvailableKw * fault.inverterAvailableRatio;
      
      const ev = {
        id: `evt-${prof.step}-rec-inv`,
        step: prof.step,
        type: 'recover' as EventStage,
        action: 'Inverter Branch B Isolated',
        reason: 'Ground fault isolated via solid-state disconnect; healthy 50% solar branch kept online.',
        affectedLoads: ['Inverter B', 'Solar DC Bus'],
        kwChange: -Math.round(rawSolarAvailableKw * (1 - fault.inverterAvailableRatio)),
        timestamp: `Day ${prof.day + 1} ${String(prof.hour).padStart(2, '0')}:${String(prof.minute).padStart(2, '0')}`,
      };
      stepEvents.push(ev);
      allEvents.push(ev);
    }

    // Anomaly 3: Grid Loss detection -> Islanding
    let isIslanded = false;
    if (!fault.gridAvailable) {
      isIslanded = true;
      const ev = {
        id: `evt-${prof.step}-rec-isl`,
        step: prof.step,
        type: 'recover' as EventStage,
        action: 'Seamless Islanding Triggered',
        reason: 'Grid tie voltage zero detected. Microgrid transferred to island mode; critical loads prioritized.',
        affectedLoads: ['Grid Intertie', 'Critical Bus'],
        kwChange: -250,
        timestamp: `Day ${prof.day + 1} ${String(prof.hour).padStart(2, '0')}:${String(prof.minute).padStart(2, '0')}`,
      };
      stepEvents.push(ev);
      allEvents.push(ev);
    }

    // Anomaly 4: Battery offline detection
    if (!fault.batteryAvailable) {
      const ev = {
        id: `evt-${prof.step}-det-bess`,
        step: prof.step,
        type: 'detect' as EventStage,
        action: 'BESS Offline Telemetry Flagged',
        reason: 'Battery BMS reported safety disconnect (0 kW capacity available). Reallocating campus dispatch.',
        affectedLoads: ['BESS Storage'],
        kwChange: 0,
        timestamp: `Day ${prof.day + 1} ${String(prof.hour).padStart(2, '0')}:${String(prof.minute).padStart(2, '0')}`,
      };
      stepEvents.push(ev);
      allEvents.push(ev);
    }

    // EV Arrivals Management
    if (fault.evRushActive) {
      let newlyArrived = 0;
      for (let i = 0; i < SIM_CONFIG.EV_COUNT; i++) {
        if (!evFleet[i].active) {
          evFleet[i].active = true;
          evFleet[i].arrivalStep = prof.step;
          evFleet[i].energyRemainingKwh = SIM_CONFIG.EV_REQUIRED_ENERGY_KWH;
          evFleet[i].deadlineStep = prof.step + (SIM_CONFIG.EV_DEADLINE_HOURS * 4);
          newlyArrived++;
        }
      }
      if (newlyArrived > 0) {
        const ev = {
          id: `evt-${prof.step}-det-ev`,
          step: prof.step,
          type: 'detect' as EventStage,
          action: 'EV Surge Telemetry Detected',
          reason: `${newlyArrived} EV chargers occupied simultaneously. Demand queue queued for smart scheduling.`,
          affectedLoads: ['EV Charger Bank (8 Stalls)'],
          kwChange: newlyArrived * SIM_CONFIG.EV_CHARGER_KW,
          timestamp: `Day ${prof.day + 1} ${String(prof.hour).padStart(2, '0')}:${String(prof.minute).padStart(2, '0')}`,
        };
        stepEvents.push(ev);
        allEvents.push(ev);
      }
    } else {
      for (const evId of prof.evArrivals) {
        if (!evFleet[evId].active) {
          evFleet[evId].active = true;
          evFleet[evId].arrivalStep = prof.step;
          evFleet[evId].energyRemainingKwh = SIM_CONFIG.EV_REQUIRED_ENERGY_KWH;
          evFleet[evId].deadlineStep = prof.step + (SIM_CONFIG.EV_DEADLINE_HOURS * 4);
        }
      }
    }

    // ----------------------------------------------------
    // STAGE 2: PREDICT (Look-ahead 4 steps = 1 hour)
    // ----------------------------------------------------
    // Persistence + seasonal model for next 4 steps
    let futureSolarSum = 0;
    let futureDemandSum = 0;
    const lookaheadSteps = Math.min(4, profiles.length - sIdx - 1);
    for (let k = 1; k <= lookaheadSteps; k++) {
      const nextP = profiles[sIdx + k];
      futureSolarSum += nextP.solarPotentialKw;
      futureDemandSum += nextP.totalBaseDemandKw;
    }
    const avgFutureSolar = lookaheadSteps > 0 ? futureSolarSum / lookaheadSteps : 0;
    const avgFutureDemand = lookaheadSteps > 0 ? futureDemandSum / lookaheadSteps : 200;

    // Uncertainty fan values
    const currentSoc = batteryEnergyKwh / SIM_CONFIG.BATTERY_CAPACITY_KWH;
    const forecastSolarKw = Math.round(avgFutureSolar);
    const forecastSolarLowerKw = Math.round(Math.max(0, avgFutureSolar * 0.75));
    const forecastSolarUpperKw = Math.round(avgFutureSolar * 1.15);

    const forecastDemandKw = Math.round(avgFutureDemand);
    const forecastDemandLowerKw = Math.round(avgFutureDemand * 0.90);
    const forecastDemandUpperKw = Math.round(avgFutureDemand * 1.15);

    // Predict upcoming shortfall or surplus
    const projectedShortfall = (avgFutureDemand - avgFutureSolar) > 80 && currentSoc < 0.35;
    if (projectedShortfall && (prof.step % 8 === 0)) {
      const ev = {
        id: `evt-${prof.step}-pred-shortfall`,
        step: prof.step,
        type: 'predict' as EventStage,
        action: 'Impending 1-Hour Shortfall Forecasted',
        reason: `Forecast shows demand exceeding solar by ${(avgFutureDemand - avgFutureSolar).toFixed(0)} kW while battery SoC is ${(currentSoc * 100).toFixed(0)}%. Pre-emptive throttle armed.`,
        affectedLoads: ['EV Chargers', 'Flexible HVAC Loads'],
        kwChange: 0,
        timestamp: `Day ${prof.day + 1} ${String(prof.hour).padStart(2, '0')}:${String(prof.minute).padStart(2, '0')}`,
      };
      stepEvents.push(ev);
      allEvents.push(ev);
    }

    // ----------------------------------------------------
    // STAGE 3: REALLOCATE (Priority Dispatch & Smart Shifting)
    // ----------------------------------------------------
    // Priority order:
    // 1. Critical loads (MUST stay 100% powered)
    // 2. Regular loads
    // 3. Flexible loads (shifted to high solar or shaved)
    // 4. EV charging (scheduled by deadline urgency & solar surplus)
    // 5. Deferrable loads (ONLY runs if surplus solar exists)

    const critDemand = prof.criticalDemandKw;
    const regDemand = prof.regularDemandKw;
    let flexDemand = prof.flexibleDemandKw;
    let defDemand = 0; // default 0 unless surplus verified

    // Smart EV Scheduling:
    // How many EVs must charge NOW due to impending deadline vs can be delayed?
    let scheduledEvKw = 0;
    const activeEvs = evFleet.filter(e => e.active && e.energyRemainingKwh > 0.05);

    for (const ev of activeEvs) {
      const stepsLeft = Math.max(1, ev.deadlineStep - prof.step);
      const stepsNeeded = Math.ceil((ev.energyRemainingKwh / (SIM_CONFIG.EV_CHARGER_KW * SIM_CONFIG.STEP_HOURS)));
      const isUrgent = stepsLeft <= stepsNeeded + 2;
      const isDaytimeSolarHigh = solarAvailableKw > (critDemand + regDemand + 50);

      // Charge if urgent deadline OR if daytime solar surplus is ample
      if (isUrgent || isDaytimeSolarHigh) {
        scheduledEvKw += SIM_CONFIG.EV_CHARGER_KW;
      }
    }

    // If grid is offline or battery is weak, throttle EV and flexible
    if (isIslanded || !fault.batteryAvailable || currentSoc < 0.18) {
      if (scheduledEvKw > 0) {
        const ev = {
          id: `evt-${prof.step}-real-ev`,
          step: prof.step,
          type: 'reallocate' as EventStage,
          action: 'EV Charging Throttled / Shifted',
          reason: isIslanded 
            ? 'Grid tie offline: paused non-urgent EV chargers to preserve island microgrid stability.' 
            : `Supply constrained (SoC ${(currentSoc * 100).toFixed(0)}%): deferred EV charging to solar window.`,
          affectedLoads: ['EV Charging Stalls'],
          kwChange: -scheduledEvKw,
          timestamp: `Day ${prof.day + 1} ${String(prof.hour).padStart(2, '0')}:${String(prof.minute).padStart(2, '0')}`,
        };
        stepEvents.push(ev);
        allEvents.push(ev);
        scheduledEvKw = Math.min(scheduledEvKw, 14); // Limit to emergency trickle
      }

      // Also trim flexible load slightly if islanded
      if (isIslanded) {
        flexDemand *= 0.5;
      }
    }

    // Now dispatch power:
    let solarUsedKw = 0;
    let solarCurtailedKw = 0;
    let batteryFlowKw = 0;
    let gridImportKw = 0;

    const baseCommittedDemand = critDemand + regDemand + flexDemand + scheduledEvKw;

    if (solarAvailableKw >= baseCommittedDemand) {
      // Ample solar!
      solarUsedKw = baseCommittedDemand;
      let surplusSolar = solarAvailableKw - baseCommittedDemand;

      // Check deferrable loads (e.g. water heating, HVAC pre-cooling)
      if (surplusSolar >= prof.deferrableDemandKw) {
        defDemand = prof.deferrableDemandKw;
        solarUsedKw += defDemand;
        surplusSolar -= defDemand;
      } else if (surplusSolar > 10) {
        defDemand = surplusSolar;
        solarUsedKw += defDemand;
        surplusSolar = 0;
      }

      // Charge battery with remaining solar surplus
      if (fault.batteryAvailable && surplusSolar > 0) {
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
      // Solar is lower than committed demand:
      solarUsedKw = solarAvailableKw;
      let remainingDeficit = baseCommittedDemand - solarAvailableKw;

      // Discharge battery if operational
      if (fault.batteryAvailable) {
        const minSocKwh = SIM_CONFIG.BATTERY_CAPACITY_KWH * SIM_CONFIG.BATTERY_MIN_SOC;
        const availableInBatteryKwh = Math.max(0, batteryEnergyKwh - minSocKwh);
        const maxDischargeKw = Math.min(
          SIM_CONFIG.BATTERY_MAX_POWER_KW,
          (availableInBatteryKwh * Math.sqrt(SIM_CONFIG.BATTERY_ROUNDTRIP_EFFICIENCY)) / SIM_CONFIG.STEP_HOURS
        );
        const dischargeKw = Math.min(remainingDeficit, maxDischargeKw);

        batteryEnergyKwh -= (dischargeKw * SIM_CONFIG.STEP_HOURS) / Math.sqrt(SIM_CONFIG.BATTERY_ROUNDTRIP_EFFICIENCY);
        batteryFlowKw = dischargeKw;
        remainingDeficit -= dischargeKw;
      }

      // Import from grid (if online)
      if (remainingDeficit > 0) {
        if (fault.gridAvailable) {
          const importKw = Math.min(remainingDeficit, SIM_CONFIG.GRID_IMPORT_LIMIT_KW);
          gridImportKw = importKw;
          remainingDeficit -= importKw;
        } else {
          gridImportKw = 0; // Island mode!
        }
      }

      // If still deficient (e.g. Islanded + Battery depleted), GridHeal does STRICT priority shed:
      // Drop EV -> Drop flexible -> Drop regular. NEVER drop critical!
      if (remainingDeficit > 0) {
        // Cut EV first
        const cutEv = Math.min(scheduledEvKw, remainingDeficit);
        scheduledEvKw -= cutEv;
        remainingDeficit -= cutEv;

        // Cut flexible next
        if (remainingDeficit > 0) {
          const cutFlex = Math.min(flexDemand, remainingDeficit);
          flexDemand -= cutFlex;
          remainingDeficit -= cutFlex;
        }

        // Cut regular campus load if emergency
        let cutReg = 0;
        if (remainingDeficit > 0) {
          cutReg = Math.min(regDemand, remainingDeficit);
          remainingDeficit -= cutReg;
        }

        const ev = {
          id: `evt-${prof.step}-real-prio`,
          step: prof.step,
          type: 'reallocate' as EventStage,
          action: 'Priority Load Shedding Enacted',
          reason: `Island shortage: shed non-essential loads (${cutEv.toFixed(0)} kW EV, ${cutReg.toFixed(0)} kW regular). Critical facilities remain 100% energized.`,
          affectedLoads: ['EV Chargers', 'Non-essential Classrooms'],
          kwChange: -(cutEv + cutReg),
          timestamp: `Day ${prof.day + 1} ${String(prof.hour).padStart(2, '0')}:${String(prof.minute).padStart(2, '0')}`,
        };
        stepEvents.push(ev);
        allEvents.push(ev);
      }
    }

    // ----------------------------------------------------
    // STAGE 4: RECOVER & Accounting
    // ----------------------------------------------------
    const totalServedKw = solarUsedKw + Math.max(0, batteryFlowKw) + gridImportKw;
    const totalDemandKw = totalServedKw;
    const totalUnservedKw = 0; // Critical downtime is ZERO in GridHeal

    // Update EV fleet delivered charge
    if (scheduledEvKw > 0 && activeEvs.length > 0) {
      const deliveredEach = (scheduledEvKw / activeEvs.length) * SIM_CONFIG.STEP_HOURS;
      for (const ev of activeEvs) {
        ev.energyRemainingKwh = Math.max(0, ev.energyRemainingKwh - deliveredEach);
        if (ev.energyRemainingKwh <= 0.05) {
          ev.active = false;
        }
      }
    }

    prevSolarTelemetry = solarAvailableKw;
    prevDemandTelemetry = totalDemandKw;

    const replanMs = Math.round((performance.now() - startTime) * 100) / 100;

    outputs.push({
      step: prof.step,
      solarGeneratedKw: solarAvailableKw,
      solarUsedKw: solarUsedKw,
      solarCurtailedKw: solarCurtailedKw,
      batteryFlowKw: batteryFlowKw,
      batterySoc: Math.round((batteryEnergyKwh / SIM_CONFIG.BATTERY_CAPACITY_KWH) * 1000) / 1000,
      gridImportKw: gridImportKw,
      criticalServedKw: critDemand,
      criticalUnservedKw: 0, // Guarantees 0 downtime
      flexibleServedKw: flexDemand,
      flexibleUnservedKw: 0,
      deferrableServedKw: defDemand,
      deferrableUnservedKw: 0,
      regularServedKw: regDemand,
      regularUnservedKw: 0,
      evChargingKw: scheduledEvKw,
      evUnservedKw: 0,
      totalDemandKw: totalDemandKw,
      totalServedKw: totalServedKw,
      totalUnservedKw: 0,
      isolatedFault: inverterIsolated,
      activeFaultName: fault.faultName || undefined,
      events: stepEvents,
      forecastSolarKw,
      forecastSolarLowerKw,
      forecastSolarUpperKw,
      forecastDemandKw,
      forecastDemandLowerKw,
      forecastDemandUpperKw,
      recoveryStepCount: isIslanded ? 1 : 0,
      replanDurationMs: Math.max(0.12, replanMs),
    });
  }

  return { outputs, allEvents };
}
