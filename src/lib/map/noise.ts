// Seeded randomness for terrain. Everything downstream of a seed has to be
// reproducible, so nothing here touches Math.random.

export type Rng = () => number;

/** mulberry32: small, fast, and good enough for map generation. */
export function rng(seed: number): Rng {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A stable pseudo-random value in [0, 1) for an integer lattice point. */
function lattice(seed: number, x: number, y: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(seed, 2147483647);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

const smooth = (t: number) => t * t * (3 - 2 * t);

/** Value noise in [0, 1), smooth between integer lattice points. */
export function valueNoise(seed: number, x: number, y: number): number {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const tx = smooth(x - x0);
  const ty = smooth(y - y0);
  const a = lattice(seed, x0, y0);
  const b = lattice(seed, x0 + 1, y0);
  const c = lattice(seed, x0, y0 + 1);
  const d = lattice(seed, x0 + 1, y0 + 1);
  return a + (b - a) * tx + (c - a) * ty + (a - b - c + d) * tx * ty;
}

/** Fractal noise: octaves of value noise, each finer and fainter. Range [0, 1). */
export function fbm(seed: number, x: number, y: number, octaves: number): number {
  let sum = 0;
  let amp = 1;
  let norm = 0;
  for (let o = 0; o < octaves; o++) {
    sum += valueNoise(seed + o * 101, x, y) * amp;
    norm += amp;
    amp *= 0.5;
    x *= 2;
    y *= 2;
  }
  return sum / norm;
}

/**
 * Peaks where fbm crosses its midpoint, so the high values trace thin winding
 * lines instead of blobs. That is what makes mountains read as ranges.
 */
export function ridged(seed: number, x: number, y: number, octaves: number): number {
  return 1 - Math.abs(2 * fbm(seed, x, y, octaves) - 1);
}

/** The value below which `fraction` of `values` fall. */
export function quantile(values: ArrayLike<number>, fraction: number): number {
  const sorted = Array.from(values).sort((a, b) => a - b);
  if (sorted.length === 0) return 0;
  const i = Math.min(sorted.length - 1, Math.max(0, Math.floor(fraction * sorted.length)));
  return sorted[i];
}
