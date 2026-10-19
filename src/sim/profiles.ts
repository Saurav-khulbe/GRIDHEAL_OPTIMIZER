// Simulation Profile Generator for 7 days (672 steps)
import { SIM_CONFIG } from './config';
import { createPRNG, normalRandom } from './prng';

export interface StepProfile {
  step: number;
  day: number;
  hour: number;
  minute: number;
  solarPotentialKw: number; // Raw potential without faults
  criticalDemandKw: number;
  flexibleDemandKw: number;
  deferrableDemandKw: number;
  regularDemandKw: number;
  totalBaseDemandKw: number;
  evArrivals: number[]; // IDs of EVs arriving at this step
}

export function generateProfiles(seed: number = SIM_CONFIG.DEFAULT_SEED): StepProfile[] {
  const prng = createPRNG(seed);
  const profiles: StepProfile[] = [];

  for (let step = 0; step < SIM_CONFIG.TOTAL_STEPS; step++) {
    const day = Math.floor(step / SIM_CONFIG.STEPS_PER_DAY);
    const stepInDay = step % SIM_CONFIG.STEPS_PER_DAY;
    const hour = Math.floor(stepInDay / 4);
    const minute = (stepInDay % 4) * 15;
    const timeOfDay = hour + minute / 60; // 0.0 to 23.75

    // Solar Bell Curve (sun between 06:00 and 18:00, peak at 12:30)
    let solar = 0;
    if (timeOfDay > 6 && timeOfDay < 18.5) {
      const sunCenter = 12.25;
      const sunSpread = 3.2;
      const baseSolar = Math.exp(-Math.pow(timeOfDay - sunCenter, 2) / (2 * Math.pow(sunSpread, 2)));
      
      // Cloud noise (slow day-to-day weather variation + step jitter)
      const dayWeatherFactor = 0.85 + 0.15 * Math.sin(day * 1.7 + 0.5);
      const stepNoise = Math.max(0.6, Math.min(1.05, 1.0 + normalRandom(prng, 0, 0.08)));
      solar = Math.max(0, SIM_CONFIG.SOLAR_PEAK_KW * baseSolar * dayWeatherFactor * stepNoise);
    }

    // Critical Loads: steady 65-75 kW with slight sensor noise
    const critical = SIM_CONFIG.CRITICAL_LOAD_MIN_KW + 
      (SIM_CONFIG.CRITICAL_LOAD_MAX_KW - SIM_CONFIG.CRITICAL_LOAD_MIN_KW) * 0.5 + 
      normalRandom(prng, 0, 3);

    // Regular Campus Load: diurnal pattern (peaks at 10-12h and 14-16h)
    let regFactor = 0.25; // Night base (dormitories, night labs)
    if (timeOfDay >= 7 && timeOfDay <= 20) {
      regFactor = 0.45 + 0.55 * Math.sin(((timeOfDay - 7) / 13) * Math.PI);
    }
    const regular = SIM_CONFIG.REGULAR_CAMPUS_BASE_KW + 
      (SIM_CONFIG.REGULAR_CAMPUS_PEAK_KW - SIM_CONFIG.REGULAR_CAMPUS_BASE_KW) * regFactor + 
      normalRandom(prng, 0, 10);

    // Flexible Loads (pumps, automated lab batches): scheduled around 11:00-16:00
    let flexible = 15;
    if (timeOfDay >= 10 && timeOfDay <= 16) {
      flexible = SIM_CONFIG.FLEXIBLE_LOAD_PEAK_KW * (0.8 + 0.2 * prng());
    }

    // Deferrable Loads: potential candidate load available to run if surplus
    let deferrable = 0;
    if (timeOfDay >= 9 && timeOfDay <= 18) {
      deferrable = SIM_CONFIG.DEFERRABLE_LOAD_KW;
    }

    // EV Arrivals: concentrated around evening peak (17:00 to 20:00)
    // 8 EVs total per day
    const evArrivals: number[] = [];
    if (timeOfDay >= 16.5 && timeOfDay <= 21) {
      // Deterministic arrival distribution across chargers
      for (let i = 0; i < SIM_CONFIG.EV_COUNT; i++) {
        const evArrivalSlot = 17.0 + (i * 0.45) + ((day * 7 + i) % 3) * 0.25;
        if (Math.abs(timeOfDay - evArrivalSlot) < 0.12) {
          evArrivals.push(i);
        }
      }
    }

    profiles.push({
      step,
      day,
      hour,
      minute,
      solarPotentialKw: Math.max(0, Math.round(solar * 10) / 10),
      criticalDemandKw: Math.max(0, Math.round(critical * 10) / 10),
      flexibleDemandKw: Math.max(0, Math.round(flexible * 10) / 10),
      deferrableDemandKw: Math.max(0, Math.round(deferrable * 10) / 10),
      regularDemandKw: Math.max(0, Math.round(regular * 10) / 10),
      totalBaseDemandKw: Math.round((critical + regular + flexible) * 10) / 10,
      evArrivals,
    });
  }

  return profiles;
}
