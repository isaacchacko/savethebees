'use client';

import { useEffect, useRef, useMemo } from 'react';

// ---------------------------------------------------------------------------
// Fourier / FFT helpers
// ---------------------------------------------------------------------------

const N = 512;
const CYCLE_MS = 9000; // ms for one full trefoil cycle

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

/**
 * Sample the 2-D trefoil knot as a complex signal, compute its DFT via FFT,
 * and return coefficients sorted by amplitude (largest first).
 *
 * Parameterisation:  x(t) = sin(t) + 2·sin(2t)
 *                    y(t) = cos(t) − 2·cos(2t)   t ∈ [0, 2π)
 *
 * Treat each sample as z = x + iy so one FFT handles both axes.
 */
function buildTerms(): FourierTerm[] {
  const re = new Float64Array(N);
  const im = new Float64Array(N);
  for (let k = 0; k < N; k++) {
    const t = (2 * Math.PI * k) / N;
    re[k] = Math.sin(t) + 2 * Math.sin(2 * t);
    im[k] = Math.cos(t) - 2 * Math.cos(2 * t);
  }
  fft(re, im);
  const terms: FourierTerm[] = Array.from({ length: N }, (_, k) => ({
    freq: k <= N / 2 ? k : k - N,   // map upper half to negative frequencies
    amp: Math.hypot(re[k], im[k]) / N,
    phase: Math.atan2(im[k], re[k]),
  }));
  terms.sort((a, b) => b.amp - a.amp);
  return terms;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

/** Max path points kept in the ring buffer (≈ 60 fps × 9 s + slack). */
const MAX_PATH = 640;
/** Number of fade batches drawn for the trefoil path trail. */
const PATH_BATCHES = 10;
/** Minimum rendered circle radius in CSS px before we skip a term. */
const MIN_RADIUS_PX = 0.3;

export default function TrefoilHero({ paragraphCenterY, overrideCenterX, overrideScaleFactor }: { paragraphCenterY?: number | null; overrideCenterX?: number; overrideScaleFactor?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const terms = useMemo(buildTerms, []);
  const paragraphCenterYRef = useRef<number | null | undefined>(paragraphCenterY);
  const overrideCenterXRef = useRef<number | undefined>(overrideCenterX);
  const overrideScaleFactorRef = useRef<number | undefined>(overrideScaleFactor);
  useEffect(() => { paragraphCenterYRef.current = paragraphCenterY; }, [paragraphCenterY]);
  useEffect(() => { overrideCenterXRef.current = overrideCenterX; }, [overrideCenterX]);
  useEffect(() => { overrideScaleFactorRef.current = overrideScaleFactor; }, [overrideScaleFactor]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let raf = 0;
    const path: [number, number][] = [];
    const startTime = performance.now();

    // ── resize ──────────────────────────────────────────────────────────────
    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      if (w === 0 || h === 0) return;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      // Replace the transform so re-calling resize is idempotent
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      path.length = 0; // redraw path cleanly after layout change
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    // ── draw loop ────────────────────────────────────────────────────────────
    const draw = (now: number) => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      if (W === 0 || H === 0) { raf = requestAnimationFrame(draw); return; }

      const elapsed = now - startTime;
      const t = ((elapsed % CYCLE_MS) / CYCLE_MS) * 2 * Math.PI;

      // Read accent colour from CSS variable — responds to dark mode and ColorPaletteEditor
      const accentHex = getComputedStyle(document.documentElement).getPropertyValue('--accent').trim() || '#c0fe05';
      const hexMatch = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(accentHex);
      const [r, g, b] = hexMatch
        ? [parseInt(hexMatch[1], 16), parseInt(hexMatch[2], 16), parseInt(hexMatch[3], 16)]
        : [192, 254, 5];
      const circleStroke = `rgba(${r},${g},${b},0.10)`;
      const armStroke    = `rgba(${r},${g},${b},0.45)`;
      const pathHue      = `${r},${g},${b}`;
      const tipColor     = accentHex;
      const tipGlow      = `rgba(${r},${g},${b},0.7)`;

      ctx.clearRect(0, 0, W, H);

      // ── epicycle origin: horizontally centred, vertically at paragraph centre
      const cx = overrideCenterXRef.current ?? W * 0.3578;
      const cy = paragraphCenterYRef.current ?? H * 0.5074;
      const scale = Math.min(W, H) * (overrideScaleFactorRef.current ?? 0.1209);

      let x = cx, y = cy;

      for (const { freq, amp, phase } of terms) {
        const r = amp * scale;
        if (r < MIN_RADIUS_PX) break; // terms are sorted by amp, so safe to stop

        const px = x, py = y;
        const angle = freq * t + phase + Math.PI / 2;
        x += r * Math.cos(angle);
        y += r * Math.sin(angle);

        // ── orbit circle ──────────────────────────────────────────────────
        ctx.beginPath();
        ctx.arc(px, py, r, 0, 2 * Math.PI);
        ctx.strokeStyle = circleStroke;
        ctx.lineWidth = 1;
        ctx.stroke();

        // ── radial arm ────────────────────────────────────────────────────
        ctx.beginPath();
        ctx.moveTo(px, py);
        ctx.lineTo(x, y);
        ctx.strokeStyle = armStroke;
        ctx.lineWidth = 1.2;
        ctx.stroke();

        // ── arrowhead at the tip of the arm ───────────────────────────────
        if (r > 4) {
          const headLen = Math.min(r * 0.18, 9);
          const armAngle = Math.atan2(y - py, x - px);
          const spread = 0.42;
          ctx.beginPath();
          ctx.moveTo(x, y);
          ctx.lineTo(
            x - headLen * Math.cos(armAngle - spread),
            y - headLen * Math.sin(armAngle - spread),
          );
          ctx.moveTo(x, y);
          ctx.lineTo(
            x - headLen * Math.cos(armAngle + spread),
            y - headLen * Math.sin(armAngle + spread),
          );
          ctx.strokeStyle = armStroke;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }

      // ── path ring buffer ──────────────────────────────────────────────────
      path.push([x, y]);
      if (path.length > MAX_PATH) path.shift();

      // ── draw trefoil path with a fading tail (batch-rendered) ────────────
      if (path.length > 1) {
        const batchSize = Math.ceil(path.length / PATH_BATCHES);
        for (let b = 0; b < PATH_BATCHES; b++) {
          const start = b * batchSize;
          const end = Math.min(start + batchSize + 1, path.length);
          if (start >= path.length) break;

          const alpha = ((b + 1) / PATH_BATCHES) * 0.92;
          ctx.beginPath();
          ctx.moveTo(path[start][0], path[start][1]);
          for (let i = start + 1; i < end; i++) {
            ctx.lineTo(path[i][0], path[i][1]);
          }
          ctx.strokeStyle = `rgba(${pathHue},${alpha})`;
          ctx.lineWidth = 2;
          ctx.lineCap = 'round';
          ctx.lineJoin = 'round';
          ctx.stroke();
        }
      }

      // ── glowing tip dot ───────────────────────────────────────────────────
      ctx.save();
      ctx.shadowBlur = 14;
      ctx.shadowColor = tipGlow;
      ctx.beginPath();
      ctx.arc(x, y, 3.5, 0, 2 * Math.PI);
      ctx.fillStyle = tipColor;
      ctx.fill();
      ctx.restore();

      raf = requestAnimationFrame(draw);
    };

    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
    };
  }, [terms]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      <canvas ref={canvasRef} className="w-full h-full" />
      {/* minimal label — bottom-right, away from the main text block */}
      <div className="absolute bottom-20 right-8 text-right select-none">
        <p className="text-[10px] font-mono tracking-[0.18em] uppercase text-gray-400 dark:text-gray-500">
          Fourier Epicycles
        </p>
        <p className="text-[9px] font-mono text-gray-400/70 dark:text-gray-600">
          Trefoil Knot · 512-term DFT
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
