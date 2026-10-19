// Mulberry32 deterministic 32-bit PRNG
// Ensures exact reproducible simulation runs across reloads and test suites.

export function createPRNG(seed: number) {
  let s = seed >>> 0;
  return function next(): number {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Box-Muller transform for normal distribution
export function normalRandom(prng: () => number, mean = 0, stdDev = 1): number {
  let u = 0, v = 0;
  while (u === 0) u = prng();
  while (v === 0) v = prng();
  const num = Math.sqrt(-2.0 * Math.log(u)) * Math.cos(2.0 * Math.PI * v);
  return num * stdDev + mean;
}
