// Precomputed HexRain animation frames — generated once at module load and
// shared across all HexRain instances. Never recomputed per render or mount.

// ── Tiling Perlin noise ───────────────────────────────────────────────────────
//
// TILE_PERIOD is the noise-space period for both spatial axes.
// SCALE is chosen so that PRECOMP_ROWS * SCALE = TILE_PERIOD exactly.
// This means noise(y + PRECOMP_ROWS) === noise(y) for every octave,
// making the CSS scroll loop perfectly seamless with zero discontinuity.

export const PRECOMP_COLS   = 70;
export const PRECOMP_ROWS   = 70; // matches the actual `rows` prop used in Hero
export const PRECOMP_FRAMES = 150;

const TILE_PERIOD = 4;                        // noise-space tile size (integer)
const SCALE       = TILE_PERIOD / PRECOMP_ROWS; // 4/70 ≈ 0.0571 — PRECOMP_ROWS * SCALE = 4 exactly

// Permutation table with period TILE_PERIOD.
// Because tilingNoise2 uses (coord % TILE_PERIOD), all octave frequencies
// evaluate to the same 16 fundamental gradient cells, tiling cleanly.
const TPERM = (() => {
  const P = TILE_PERIOD;
  const p = Array.from({ length: P }, (_, i) => i);
  let s = 0xdeadbeef;
  const rng = () => { s = (Math.imul(s ^ (s >>> 16), 0x45d9f3b) >>> 0); return s / 0x100000000; };
  for (let i = P - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [p[i], p[j]] = [p[j], p[i]];
  }
  // Triple-sized so indices up to 2*(P-1) are always in bounds
  const t = new Uint8Array(P * 3);
  for (let i = 0; i < t.length; i++) t[i] = p[i % P];
  return t;
})();

function fade(t: number) { return t * t * t * (t * (t * 6 - 15) + 10); }
function lerp(a: number, b: number, t: number) { return a + t * (b - a); }
function grad(h: number, x: number, y: number) {
  const g = h & 3;
  return ((g & 1) ? -x : x) + ((g & 2) ? -y : y);
}

function tilingNoise2(x: number, y: number): number {
  const P  = TILE_PERIOD;
  const Xi  = ((Math.floor(x) % P) + P) % P;
  const Yi  = ((Math.floor(y) % P) + P) % P;
  const Xi1 = (Xi + 1) % P;
  x -= Math.floor(x); y -= Math.floor(y);
  const u = fade(x), v = fade(y);
  const a = TPERM[Xi]  + Yi;
  const b = TPERM[Xi1] + Yi;
  return lerp(
    lerp(grad(TPERM[a],     x,     y),     grad(TPERM[b],     x - 1, y),     u),
    lerp(grad(TPERM[a + 1], x,     y - 1), grad(TPERM[b + 1], x - 1, y - 1), u),
    v,
  );
}

const PERSISTENCE = 0.32;
function fbm8(x: number, y: number): number {
  let v = 0, amp = 1, freq = 1, max = 0;
  for (let i = 0; i < 8; i++) {
    v   += tilingNoise2(x * freq, y * freq) * amp;
    max += amp;
    amp  *= PERSISTENCE;
    freq *= 2;
  }
  return (v / max + 1) * 0.5; // → [0, 1]
}

const CONTRAST = 10;
function sharpen(n: number): number {
  const x = n * 2 - 1;
  return (Math.tanh(x * CONTRAST) / Math.tanh(CONTRAST) + 1) * 0.5;
}

// ── Precomputation ────────────────────────────────────────────────────────────

// Circular path radius in noise space — frame 0 and frame PRECOMP_FRAMES land
// at the same point, guaranteeing a perfect seamless temporal loop.
const TIME_RADIUS = 1.5;

// Flat Uint8Array layout: [frame][row][col]
// Value 0 = literal space, 1–255 = braille U+2801–U+28FF
export const FRAMES: Uint8Array = (() => {
  const stride = PRECOMP_ROWS * PRECOMP_COLS;
  const buf    = new Uint8Array(PRECOMP_FRAMES * stride);

  for (let f = 0; f < PRECOMP_FRAMES; f++) {
    const angle = (f / PRECOMP_FRAMES) * Math.PI * 2;
    const tx    = Math.cos(angle) * TIME_RADIUS;
    const ty    = Math.sin(angle) * TIME_RADIUS;
    const base  = f * stride;

    for (let r = 0; r < PRECOMP_ROWS; r++) {
      for (let c = 0; c < PRECOMP_COLS; c++) {
        const n = fbm8(c * SCALE + tx, r * SCALE + ty);
        buf[base + r * PRECOMP_COLS + c] = Math.min(255, Math.floor(sharpen(n) * 256));
      }
    }
  }
  return buf;
})();

const FRAME_STRIDE = PRECOMP_ROWS * PRECOMP_COLS;

export function getCell(frameIdx: number, row: number, col: number): string {
  const f   = frameIdx % PRECOMP_FRAMES;
  const r   = row      % PRECOMP_ROWS;
  const c   = col      % PRECOMP_COLS;
  const idx = FRAMES[f * FRAME_STRIDE + r * PRECOMP_COLS + c];
  return idx === 0 ? ' ' : String.fromCodePoint(0x2800 + idx);
}
