'use client';

import { useEffect, useRef } from 'react';
import { SQRT3, center, distanceFrom, neighborAt, tileCount } from '@/lib/map/hex';
import { COLORS, drawTile, hexPath } from '@/lib/map/draw';
import { WATER, type TerrainMap } from '@/lib/map/terrain';

const DUR = 520;
// how long the wave of changing tiles takes to travel one tile
const STEP_MS = 16;
const NONE = -1;

/** The neighbour-dependent look of every tile of one map. */
type Looks = {
  // open water two tiles out reads darker than the shallows along the shore
  deep: Uint8Array;
  // per water tile, a bit for each direction (0 = east) that faces dry land
  shore: Uint8Array;
};

/**
 * From one map to the next. Each side keeps its own looks, so a tile the wave
 * hasn't reached yet still has the old map's shoreline and deep water, rather
 * than the whole sea restyling the moment the new map arrives.
 */
type Tween = {
  from: Int8Array;
  to: Int8Array;
  fromLooks: Looks;
  toLooks: Looks;
  start: Float64Array;
  end: number;
};

function looksOf(map: TerrainMap): Looks {
  const { tiles } = map;
  const n = tileCount(map);
  const toLand = distanceFrom(map, (i) => tiles[i] !== WATER);
  const shore = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (tiles[i] !== WATER) continue;
    for (let d = 0; d < 6; d++) {
      const nb = neighborAt(map, i, d);
      if (nb >= 0 && tiles[nb] !== WATER) shore[i] |= 1 << d;
    }
  }
  return { deep: Uint8Array.from(toLand, (d) => (d >= 2 ? 1 : 0)), shore };
}

const lookAt = (looks: Looks, i: number) => ({ deep: looks.deep[i] === 1, shore: looks.shore[i] });

const ease = (x: number) => 1 - Math.pow(1 - Math.min(1, Math.max(0, x)), 3);


/**
 * Draws a terrain map to cover its parent. A new map does not cut in: a wave
 * spreads from a random tile, and each tile it reaches shrinks, swaps terrain
 * and grows back — the first map grows in from nothing the same way.
 */
export default function TerrainCanvas({ terrain }: { terrain: TerrainMap | null }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const tween = useRef<Tween | null>(null);
  const frame = useRef(0);
  const shown = useRef<TerrainMap | null>(null);
  // starts the frame loop if it is idle; set once the canvas is mounted
  const kick = useRef(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const draw = (now: number) => {
      const map = shown.current;
      const t = tween.current;
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      if (canvas.width !== Math.round(w * dpr) || canvas.height !== Math.round(h * dpr)) {
        canvas.width = Math.round(w * dpr);
        canvas.height = Math.round(h * dpr);
      }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.fillStyle = COLORS.field;
      ctx.fillRect(0, 0, w, h);
      if (!map || !t) return false;

      // cover: the outer ring of tiles hangs off the edges
      const s = Math.max(w / (SQRT3 * (map.cols - 1.5)), h / (1.5 * (map.rows - 2)));
      const ox = (w - SQRT3 * (map.cols - 0.5) * s) / 2;
      const oy = (h - 1.5 * (map.rows - 1) * s) / 2;

      for (let i = 0; i < tileCount(map); i++) {
        const c = center(map, i);
        const x = ox + c.x * s;
        const y = oy + c.y * s;
        const k = ease((now - t.start[i]) / DUR);
        const from = t.from[i];
        const to = t.to[i];

        if (from === NONE && k === 0) {
          hexPath(ctx, x, y, s * 0.92);
          ctx.strokeStyle = COLORS.ghost;
          ctx.lineWidth = 1;
          ctx.stroke();
          continue;
        }

        if (from === NONE) {
          ctx.globalAlpha = Math.min(1, k * 1.6);
          drawTile(ctx, to, i, x, y, s * (0.6 + 0.4 * k), lookAt(t.toLooks, i));
          ctx.globalAlpha = 1;
        } else {
          // every tile switches over when the wave reaches it — one that keeps
          // its terrain just doesn't shrink, but its shore and depth still
          // wait for the wave
          const scale = from === to ? 1 : 1 - 0.4 * Math.sin(Math.PI * k);
          const flipped = k >= 0.5;
          drawTile(
            ctx,
            flipped ? to : from,
            i,
            x,
            y,
            s * scale,
            lookAt(flipped ? t.toLooks : t.fromLooks, i)
          );
        }
      }
      return now < t.end;
    };

    const loop = (now: number) => {
      frame.current = draw(now) ? requestAnimationFrame(loop) : 0;
    };
    kick.current = () => {
      if (!frame.current) frame.current = requestAnimationFrame(loop);
    };

    const ro = new ResizeObserver(() => kick.current());
    ro.observe(canvas);
    kick.current();
    return () => {
      ro.disconnect();
      cancelAnimationFrame(frame.current);
      frame.current = 0;
    };
  }, []);

  useEffect(() => {
    if (!terrain) return;
    const prev = shown.current;
    const sameGrid = prev && prev.cols === terrain.cols && prev.rows === terrain.rows;
    const n = tileCount(terrain);
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const now = performance.now();

    const origin = center(terrain, Math.floor(Math.random() * n));
    const start = new Float64Array(n);
    let end = now;
    for (let i = 0; i < n; i++) {
      const c = center(terrain, i);
      const delay = reduced ? -DUR : (Math.hypot(c.x - origin.x, c.y - origin.y) / SQRT3) * STEP_MS;
      start[i] = now + delay;
      end = Math.max(end, start[i] + DUR);
    }

    const from = new Int8Array(n).fill(NONE);
    if (sameGrid) for (let i = 0; i < n; i++) from[i] = prev.tiles[i];
    const toLooks = looksOf(terrain);
    tween.current = {
      from,
      to: Int8Array.from(terrain.tiles),
      fromLooks: sameGrid && tween.current ? tween.current.toLooks : toLooks,
      toLooks,
      start,
      end,
    };
    shown.current = terrain;

    kick.current();
  }, [terrain]);

  return <canvas ref={canvasRef} className="terrain" aria-hidden />;
}
