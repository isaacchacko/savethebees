'use client';

import { useEffect, useRef, useMemo } from 'react';

// ---------------------------------------------------------------------------
// lissajous.svg — Lissajous curve (repo root)
// ---------------------------------------------------------------------------

const userScale = 1;
const SVG_PATH = "M 384.42 250.00 L 392.59 265.90 L 400.20 281.69 L 407.22 297.26 L 413.62 312.50 L 419.37 327.30 L 424.46 341.55 L 428.86 355.17 L 432.55 368.04 L 435.52 380.09 L 437.75 391.23 L 439.25 401.37 L 440.00 410.46 L 440.00 418.42 L 439.25 425.19 L 437.75 430.74 L 435.52 435.02 L 432.55 438.00 L 428.86 439.67 L 424.46 440.00 L 419.37 439.00 L 413.62 436.68 L 407.22 433.04 L 400.20 428.12 L 392.59 421.95 L 384.42 414.58 L 375.71 406.05 L 366.51 396.43 L 356.85 385.78 L 346.77 374.18 L 336.30 361.70 L 325.50 348.45 L 314.39 334.50 L 303.03 319.96 L 291.47 304.93 L 279.74 289.51 L 267.89 273.82 L 255.97 257.96 L 244.03 242.04 L 232.11 226.18 L 220.26 210.49 L 208.53 195.07 L 196.97 180.04 L 185.61 165.50 L 174.50 151.55 L 163.70 138.30 L 153.23 125.82 L 143.15 114.22 L 133.49 103.57 L 124.29 93.95 L 115.58 85.42 L 107.41 78.05 L 99.80 71.88 L 92.78 66.96 L 86.38 63.32 L 80.63 61.00 L 75.54 60.00 L 71.14 60.33 L 67.45 62.00 L 64.48 64.98 L 62.25 69.26 L 60.75 74.81 L 60.00 81.58 L 60.00 89.54 L 60.75 98.63 L 62.25 108.77 L 64.48 119.91 L 67.45 131.96 L 71.14 144.83 L 75.54 158.45 L 80.63 172.70 L 86.38 187.50 L 92.78 202.74 L 99.80 218.31 L 107.41 234.10 L 115.58 250.00 L 124.29 265.90 L 133.49 281.69 L 143.15 297.26 L 153.23 312.50 L 163.70 327.30 L 174.50 341.55 L 185.61 355.17 L 196.97 368.04 L 208.53 380.09 L 220.26 391.23 L 232.11 401.37 L 244.03 410.46 L 255.97 418.42 L 267.89 425.19 L 279.74 430.74 L 291.47 435.02 L 303.03 438.00 L 314.39 439.67 L 325.50 440.00 L 336.30 439.00 L 346.77 436.68 L 356.85 433.04 L 366.51 428.12 L 375.71 421.95 L 384.42 414.58 L 392.59 406.05 L 400.20 396.43 L 407.22 385.78 L 413.62 374.18 L 419.37 361.70 L 424.46 348.45 L 428.86 334.50 L 432.55 319.96 L 435.52 304.93 L 437.75 289.51 L 439.25 273.82 L 440.00 257.96 L 440.00 242.04 L 439.25 226.18 L 437.75 210.49 L 435.52 195.07 L 432.55 180.04 L 428.86 165.50 L 424.46 151.55 L 419.37 138.30 L 413.62 125.82 L 407.22 114.22 L 400.20 103.57 L 392.59 93.95 L 384.42 85.42 L 375.71 78.05 L 366.51 71.88 L 356.85 66.96 L 346.77 63.32 L 336.30 61.00 L 325.50 60.00 L 314.39 60.33 L 303.03 62.00 L 291.47 64.98 L 279.74 69.26 L 267.89 74.81 L 255.97 81.58 L 244.03 89.54 L 232.11 98.63 L 220.26 108.77 L 208.53 119.91 L 196.97 131.96 L 185.61 144.83 L 174.50 158.45 L 163.70 172.70 L 153.23 187.50 L 143.15 202.74 L 133.49 218.31 L 124.29 234.10 L 115.58 250.00 L 107.41 265.90 L 99.80 281.69 L 92.78 297.26 L 86.38 312.50 L 80.63 327.30 L 75.54 341.55 L 71.14 355.17 L 67.45 368.04 L 64.48 380.09 L 62.25 391.23 L 60.75 401.37 L 60.00 410.46 L 60.00 418.42 L 60.75 425.19 L 62.25 430.74 L 64.48 435.02 L 67.45 438.00 L 71.14 439.67 L 75.54 440.00 L 80.63 439.00 L 86.38 436.68 L 92.78 433.04 L 99.80 428.12 L 107.41 421.95 L 115.58 414.58 L 124.29 406.05 L 133.49 396.43 L 143.15 385.78 L 153.23 374.18 L 163.70 361.70 L 174.50 348.45 L 185.61 334.50 L 196.97 319.96 L 208.53 304.93 L 220.26 289.51 L 232.11 273.82 L 244.03 257.96 L 255.97 242.04 L 267.89 226.18 L 279.74 210.49 L 291.47 195.07 L 303.03 180.04 L 314.39 165.50 L 325.50 151.55 L 336.30 138.30 L 346.77 125.82 L 356.85 114.22 L 366.51 103.57 L 375.71 93.95 L 384.42 85.42 L 392.59 78.05 L 400.20 71.88 L 407.22 66.96 L 413.62 63.32 L 419.37 61.00 L 424.46 60.00 L 428.86 60.33 L 432.55 62.00 L 435.52 64.98 L 437.75 69.26 L 439.25 74.81 L 440.00 81.58 L 440.00 89.54 L 439.25 98.63 L 437.75 108.77 L 435.52 119.91 L 432.55 131.96 L 428.86 144.83 L 424.46 158.45 L 419.37 172.70 L 413.62 187.50 L 407.22 202.74 L 400.20 218.31 L 392.59 234.10 L 384.42 250.00 L 375.71 265.90 L 366.51 281.69 L 356.85 297.26 L 346.77 312.50 L 336.30 327.30 L 325.50 341.55 L 314.39 355.17 L 303.03 368.04 L 291.47 380.09 L 279.74 391.23 L 267.89 401.37 L 255.97 410.46 L 244.03 418.42 L 232.11 425.19 L 220.26 430.74 L 208.53 435.02 L 196.97 438.00 L 185.61 439.67 L 174.50 440.00 L 163.70 439.00 L 153.23 436.68 L 143.15 433.04 L 133.49 428.12 L 124.29 421.95 L 115.58 414.58 L 107.41 406.05 L 99.80 396.43 L 92.78 385.78 L 86.38 374.18 L 80.63 361.70 L 75.54 348.45 L 71.14 334.50 L 67.45 319.96 L 64.48 304.93 L 62.25 289.51 L 60.75 273.82 L 60.00 257.96 L 60.00 242.04 L 60.75 226.18 L 62.25 210.49 L 64.48 195.07 L 67.45 180.04 L 71.14 165.50 L 75.54 151.55 L 80.63 138.30 L 86.38 125.82 L 92.78 114.22 L 99.80 103.57 L 107.41 93.95 L 115.58 85.42 L 124.29 78.05 L 133.49 71.88 L 143.15 66.96 L 153.23 63.32 L 163.70 61.00 L 174.50 60.00 L 185.61 60.33 L 196.97 62.00 L 208.53 64.98 L 220.26 69.26 L 232.11 74.81 L 244.03 81.58 L 255.97 89.54 L 267.89 98.63 L 279.74 108.77 L 291.47 119.91 L 303.03 131.96 L 314.39 144.83 L 325.50 158.45 L 336.30 172.70 L 346.77 187.50 L 356.85 202.74 L 366.51 218.31 L 375.71 234.10 Z";

// ---------------------------------------------------------------------------
// Fourier / FFT helpers
// ---------------------------------------------------------------------------

const N = 2048;
/** One full Lissajous cycle in simulation time (ms). */
const CYCLE_MS = 9000;
/** Cap a single frame’s `dt` so tab restore / hitches don’t jump the phase. */
const MAX_DT_MS = 100;

interface FourierTerm {
  freq: number;
  amp: number;
  phase: number;
}

/** In-place radix-2 Cooley–Tukey FFT (N must be a power of two). */
function fft(re: Float64Array, im: Float64Array): void {
  const n = re.length;
  // Bit-reverse permutation
  for (let i = 1, j = 0; i < n; i++) {
    let bit = n >> 1;
    for (; j & bit; bit >>= 1) j ^= bit;
    j ^= bit;
    if (i < j) {
      [re[i], re[j]] = [re[j], re[i]];
      [im[i], im[j]] = [im[j], im[i]];
    }
  }
  // Butterfly passes
  for (let len = 2; len <= n; len <<= 1) {
    const ang = (-2 * Math.PI) / len;
    const wr = Math.cos(ang);
    const wi = Math.sin(ang);
    for (let i = 0; i < n; i += len) {
      let cr = 1, ci = 0;
      for (let k = 0; k < len >> 1; k++) {
        const half = len >> 1;
        const ur = re[i + k], ui = im[i + k];
        const vr = re[i + k + half] * cr - im[i + k + half] * ci;
        const vi = re[i + k + half] * ci + im[i + k + half] * cr;
        re[i + k] = ur + vr; im[i + k] = ui + vi;
        re[i + k + half] = ur - vr; im[i + k + half] = ui - vi;
        const ncr = cr * wr - ci * wi;
        ci = cr * wi + ci * wr;
        cr = ncr;
      }
    }
  }
}

// ---------------------------------------------------------------------------
// SVG path sampling + FFT → Fourier terms
// ---------------------------------------------------------------------------

type Pt = { x: number; y: number; move?: boolean };

/** Walk M/m H/h V/v L/l Z/z commands (absolute and relative) and collect vertex points. */
function sampleSvgPath(pathD: string): Pt[] {
  // Tokenise: split on command letters, keeping the letters as tokens
  const tokens = pathD
    .replace(/,/g, ' ')
    .split(/([MmHhVvLlZz])/)
    .map(s => s.trim())
    .filter(Boolean);

  const pts: Pt[] = [];
  let cur: Pt = { x: 0, y: 0 };
  let start: Pt = { x: 0, y: 0 };
  let i = 0;

  while (i < tokens.length) {
    const raw = tokens[i++];
    // If this token is not a command letter, skip (shouldn't happen after split)
    if (!/^[MmHhVvLlZz]$/.test(raw)) continue;
    const rel = raw === raw.toLowerCase(); // lowercase = relative
    const cmd = raw.toUpperCase();
    const nums = (tokens[i] && !/^[MmHhVvLlZz]$/.test(tokens[i])
      ? tokens[i++]
      : ''
    ).split(/\s+/).filter(Boolean).map(Number);

    if (cmd === 'M') {
      for (let k = 0; k < nums.length; k += 2) {
        // First pair moves; subsequent pairs are implicit L commands (same rel flag)
        cur = rel
          ? { x: cur.x + nums[k], y: cur.y + nums[k + 1] }
          : { x: nums[k], y: nums[k + 1] };
        if (k === 0) start = { ...cur };
        pts.push({ ...cur, move: k === 0 });
      }
    } else if (cmd === 'L') {
      for (let k = 0; k < nums.length; k += 2) {
        cur = rel
          ? { x: cur.x + nums[k], y: cur.y + nums[k + 1] }
          : { x: nums[k], y: nums[k + 1] };
        pts.push({ ...cur });
      }
    } else if (cmd === 'H') {
      for (let k = 0; k < nums.length; k++) {
        cur = rel ? { x: cur.x + nums[k], y: cur.y } : { x: nums[k], y: cur.y };
        pts.push({ ...cur });
      }
    } else if (cmd === 'V') {
      for (let k = 0; k < nums.length; k++) {
        cur = rel ? { x: cur.x, y: cur.y + nums[k] } : { x: cur.x, y: nums[k] };
        pts.push({ ...cur });
      }
    } else if (cmd === 'Z') {
      pts.push({ ...start, move: true });
      cur = { ...start };
    }
  }
  return pts;
}

/**
 * Complex FFT on z(t) = x(t) + i y(t) → one sorted epicycle chain,
 * plus a pen-up mask so the trail skips M-command jumps.
 */
function buildComplexTerms(): { terms: FourierTerm[]; penUpMask: Uint8Array } {
  const raw = sampleSvgPath(SVG_PATH);
  if (raw.length < 2) return { terms: [], penUpMask: new Uint8Array(N) };

  // Normalise: centre + scale so the largest axis spans [-0.5, 0.5]
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
  for (const p of raw) {
    if (p.x < minX) minX = p.x; if (p.x > maxX) maxX = p.x;
    if (p.y < minY) minY = p.y; if (p.y > maxY) maxY = p.y;
  }
  const span = Math.max(maxX - minX, maxY - minY) || 1;
  const cxN = (minX + maxX) / 2, cyN = (minY + maxY) / 2;

  const zRe = new Float64Array(N);
  const zIm = new Float64Array(N);
  const penUpMask = new Uint8Array(N);

  for (let k = 0; k < N; k++) {
    const t = (k / N) * (raw.length - 1);
    const i0 = Math.floor(t);
    const i1 = Math.min(i0 + 1, raw.length - 1);
    const frac = t - i0;
    const x = (((raw[i0].x * (1 - frac) + raw[i1].x * frac) - cxN) / span) * userScale;
    const y = (((raw[i0].y * (1 - frac) + raw[i1].y * frac) - cyN) / span) * userScale;
    zRe[k] = x;
    zIm[k] = y;
    // if (raw[i0].move) penUpMask[k] = 1; commented out since lissajous uses a move when it should be a draw
  }

  fft(zRe, zIm);

  const terms: FourierTerm[] = Array.from({ length: N }, (_, k) => ({
    freq: k <= N / 2 ? k : k - N,
    amp: Math.hypot(zRe[k], zIm[k]) / N,
    phase: Math.atan2(zIm[k], zRe[k]),
  })).sort((a, b) => b.amp - a.amp);

  return { terms, penUpMask };
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

const MIN_RADIUS_PX = 0.9;
const MAX_TRAIL = 3000;
/** Trail segment max age in simulation ms (matches prior ~500 “ticks” @ ~60fps). */
const TRAIL_FADE_MS = (500 * 1000) / 60;
/** >1 = older segments lose opacity faster than linear (easier to see the fade). */
const TRAIL_FADE_POWER = 2.4;
const TRAIL_LINE_WIDTH = 3.2;

/** `simMs` = simulation clock when this sample was taken (only advances while tab visible). */
type TrailEntry = { x: number; y: number; simMs: number } | null;

export default function Epicycle({
  paragraphCenterY,
  overrideCenterX,
  overrideScaleFactor,
  scaleX = 1.5,
  scaleY = 1,
}: {
  paragraphCenterY?: number | null;
  overrideCenterX?: number;
  overrideScaleFactor?: number;
  /** Multiplier on horizontal offset from center (Fourier space → screen). */
  scaleX?: number;
  /** Multiplier on vertical offset from center (Fourier space → screen). */
  scaleY?: number;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { terms, penUpMask } = useMemo(buildComplexTerms, []);
  const paragraphCenterYRef = useRef<number | null | undefined>(paragraphCenterY);
  const overrideCenterXRef = useRef<number | undefined>(overrideCenterX);
  const overrideScaleRef = useRef<number | undefined>(overrideScaleFactor);
  const scaleXRef = useRef(scaleX ?? 1);
  const scaleYRef = useRef(scaleY ?? 1);
  // Keep in sync on every render so the rAF loop always sees updates (Hero used to pass scaleX={1} and hid edits).
  scaleXRef.current = scaleX ?? 1;
  scaleYRef.current = scaleY ?? 1;
  useEffect(() => { paragraphCenterYRef.current = paragraphCenterY; }, [paragraphCenterY]);
  useEffect(() => { overrideCenterXRef.current = overrideCenterX; }, [overrideCenterX]);
  useEffect(() => { overrideScaleRef.current = overrideScaleFactor; }, [overrideScaleFactor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    let lastTime = performance.now();
    /** Simulation clock (ms); increases by clamped `dt` only when `visibilityState === 'visible'`. */
    let simTimeMs = 0;
    const trail: TrailEntry[] = [];

    const onVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        lastTime = performance.now();
      }
    };
    document.addEventListener('visibilitychange', onVisibilityChange);

    const resizeCanvas = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth, h = canvas.offsetHeight;
      if (w === 0 || h === 0) return;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      trail.length = 0;
    };
    resizeCanvas();
    const ro = new ResizeObserver(resizeCanvas);
    ro.observe(canvas);

    const draw = () => {
      const now = performance.now();
      const W = canvas.offsetWidth, H = canvas.offsetHeight;
      if (W === 0 || H === 0) {
        lastTime = now;
        raf = requestAnimationFrame(draw);
        return;
      }

      if (document.visibilityState !== 'visible') {
        lastTime = now;
        raf = requestAnimationFrame(draw);
        return;
      }

      const dt = Math.min(Math.max(0, now - lastTime), MAX_DT_MS);
      lastTime = now;
      simTimeMs += dt;

      const progress = (simTimeMs % CYCLE_MS) / CYCLE_MS;
      const t = progress * 2 * Math.PI;
      const kIdx = Math.floor(progress * N) % N;
      const isPenUp = penUpMask[kIdx] === 1;

      // ── accent colour ──────────────────────────────────────────────────────
      const accentHex = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#dc2626';
      const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(accentHex);
      const [r, g, b] = m ? [parseInt(m[1], 16), parseInt(m[2], 16), parseInt(m[3], 16)] : [192, 254, 5];
      const circleStroke = `rgba(${r},${g},${b},0.14)`;
      const armStroke = `rgba(${r},${g},${b},0.52)`;
      const tipGlow = `rgba(${r},${g},${b},0.7)`;

      ctx.clearRect(0, 0, W, H);

      const drawCX = overrideCenterXRef.current ?? W * 0.5;
      const drawCY = paragraphCenterYRef.current ?? H * 0.5;
      const baseScale = Math.min(W, H) * (overrideScaleRef.current ?? 0.7);
      const sx = scaleXRef.current;
      const sy = scaleYRef.current;

      // ── single complex-plane epicycle chain (uniform Fourier space ox,oy → screen with sx, sy) ──
      let ox = 0;
      let oy = 0;
      let drawX = drawCX;
      let drawY = drawCY;
      for (const { freq, amp, phase } of terms) {
        const radius = amp * baseScale;
        const rScreen = radius * Math.min(sx, sy);
        if (rScreen < MIN_RADIUS_PX) break;
        const px = drawCX + ox * sx;
        const py = drawCY + oy * sy;
        const angle = freq * t + phase;
        ox += radius * Math.cos(angle);
        oy += radius * Math.sin(angle);
        drawX = drawCX + ox * sx;
        drawY = drawCY + oy * sy;

        ctx.beginPath();
        ctx.ellipse(px, py, radius * sx, radius * sy, 0, 0, 2 * Math.PI);
        ctx.strokeStyle = circleStroke;
        ctx.lineWidth = 0.8;
        ctx.stroke();

        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(drawX, drawY);
        ctx.strokeStyle = armStroke;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        if (rScreen > 5) {
          const headLen = Math.min(rScreen * 0.18, 8);
          const aa = Math.atan2(drawY - py, drawX - px);
          const sp = 0.42;
          ctx.beginPath();
          ctx.moveTo(drawX, drawY);
          ctx.lineTo(drawX - headLen * Math.cos(aa - sp), drawY - headLen * Math.sin(aa - sp));
          ctx.moveTo(drawX, drawY);
          ctx.lineTo(drawX - headLen * Math.cos(aa + sp), drawY - headLen * Math.sin(aa + sp));
          ctx.strokeStyle = armStroke;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // ── trail (history as one continuous line — butt caps avoid bead-like dots) ──
      if (isPenUp) {
        if (trail.length > 0 && trail[trail.length - 1] !== null) trail.push(null);
      } else {
        trail.push({ x: drawX, y: drawY, simMs: simTimeMs });
      }
      while (trail.length > MAX_TRAIL) trail.shift();
      while (
        trail.length > 0 &&
        trail[0] !== null &&
        simTimeMs - trail[0].simMs > TRAIL_FADE_MS
      ) {
        trail.shift();
      }
      while (
        trail.length > 1 &&
        trail[0] === null &&
        trail[1] !== null &&
        simTimeMs - trail[1].simMs > TRAIL_FADE_MS
      ) {
        trail.shift();
      }

      ctx.save();
      ctx.lineCap = 'butt';
      ctx.lineJoin = 'bevel';
      ctx.lineWidth = TRAIL_LINE_WIDTH;
      for (let i = 0; i < trail.length - 1; i++) {
        const p0 = trail[i];
        const p1 = trail[i + 1];
        if (p0 === null || p1 === null) continue;
        const age = simTimeMs - Math.min(p0.simMs, p1.simMs);
        const u = Math.max(0, 1 - age / TRAIL_FADE_MS);
        const alpha = Math.pow(u, TRAIL_FADE_POWER) * 0.95;
        if (alpha < 0.012) continue;
        ctx.beginPath();
        ctx.moveTo(p0.x, p0.y);
        ctx.lineTo(p1.x, p1.y);
        ctx.strokeStyle = `rgba(${r},${g},${b},${alpha})`;
        ctx.stroke();
      }
      ctx.restore();

      // ── tip dot ────────────────────────────────────────────────────────────
      if (!isPenUp) {
        ctx.save();
        ctx.shadowBlur = 14;
        ctx.shadowColor = tipGlow;
        ctx.beginPath();
        ctx.arc(drawX, drawY, 3.5, 0, 2 * Math.PI);
        ctx.fillStyle = accentHex;
        ctx.fill();
        ctx.restore();
      }

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      document.removeEventListener('visibilitychange', onVisibilityChange);
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [terms, penUpMask]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
      <div className="absolute bottom-6 right-6 text-right select-none">
        <p className="text-[10px] font-mono tracking-[0.18em] uppercase text-gray-400 dark:text-gray-500">
          Lissajous · Fourier
        </p>
        <p className="text-[9px] font-mono text-gray-400/70 dark:text-gray-600">
          One chain · complex 2048-DFT
        </p>
        <br />
        <p className="text-[10px] font-mono tracking-[0.18em] uppercase text-gray-400 dark:text-gray-500">
          Bitstream
        </p>
        <p className="text-[9px] font-mono text-gray-400/70 dark:text-gray-600">
          Perlin Noise · 8 Octave
        </p>
      </div>
    </div>
  );
}
