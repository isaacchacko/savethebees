'use client';

import { useEffect, useRef } from 'react';
import type { PointerEvent as ReactPointerEvent } from 'react';
import { EMPTY, PARK, STATION, TUNNEL, isHouse, tunnelLines, type Board } from '@/lib/map/board';
import {
  COLORS,
  PLAIN,
  drawCross,
  drawHouses,
  drawPark,
  drawStation,
  drawTile,
  drawRail,
  drawTunnel,
  hash,
  hexPath,
} from '@/lib/map/draw';
import { SQRT3, center, distanceFrom, neighborAt, tileCount } from '@/lib/map/hex';
import { LAND, MOUNTAIN, WATER } from '@/lib/map/terrain';
import type { ToolId } from '@/lib/map/tools';

const TERRAIN_MS = 520;
const BUILD_MS = 560;
const RAIL_MS = 240;
// how long a wave of changes takes to travel one tile
const WAVE_STEP_MS = 16;
// how long a new route takes to draw from one tile to the next
const ROUTE_STEP_MS = 45;
const NEVER = -1;

/** A board to show, and how the change to it should play out. */
export type Scene = {
  board: Board;
  /** The tile a change spreads out from; a whole new map picks one at random. */
  origin?: number;
  /** Tiles in the order they should animate, for rail drawing itself along a route. */
  order?: number[];
};

/** What the pointer would do on the tile under it, drawn faintly before it happens. */
export type Ghost = { tile: number; tool: ToolId; ok: boolean };

/**
 * Rail a drag would lay: the real route in gray when there is one, or when
 * there isn't, the straight line to the pointer in faded red.
 */
export type Preview = { path: number[]; ok: boolean };

// drawn solid on a layer of their own, then laid down faded in one go, so the
// joins between tiles don't double up into darker dots
const PREVIEW_OK = { color: COLORS.ink, alpha: 0.38 };
const PREVIEW_BLOCKED = { color: '#c62828', alpha: 0.5 };
const BLOCKED_RGB = '198,40,40';

/** A tile's worth in select mode, drawn as a tag above it; the pinned one is also outlined. */
export type TileLabel = { tile: number; value: number; pinned: boolean };

export type TilePointer = {
  type: 'down' | 'move' | 'up' | 'leave';
  tile: number;
  button: number;
  shift: boolean;
};

/**
 * Per tile, what it is changing from and when the change started. Terrain also
 * keeps both sides' shoreline and depth, so water the wave hasn't reached
 * still looks like the old map.
 */
type Tweens = {
  terrainFrom: Int8Array;
  terrainStart: Float64Array;
  deepFrom: Uint8Array;
  shoreFrom: Uint8Array;
  deepTo: Uint8Array;
  shoreTo: Uint8Array;
  buildFrom: Uint8Array;
  buildStart: Float64Array;
  railFrom: Uint8Array;
  railStart: Float64Array;
  /** Tunnels just taken away, so their underwater line can fade out with them. */
  goneTunnels: { ends: [number, number]; start: number }[];
  end: number;
};

function looksOf(board: Board) {
  const { tiles } = board;
  const n = tileCount(board);
  const toLand = distanceFrom(board, (i) => tiles[i] !== WATER);
  const shore = new Uint8Array(n);
  for (let i = 0; i < n; i++) {
    if (tiles[i] !== WATER) continue;
    for (let d = 0; d < 6; d++) {
      const nb = neighborAt(board, i, d);
      if (nb >= 0 && tiles[nb] !== WATER) shore[i] |= 1 << d;
    }
  }
  return { deep: Uint8Array.from(toLand, (d) => (d >= 2 ? 1 : 0)), shore };
}

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));
const ease = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);

function dirBetween(board: Board, a: number, b: number) {
  for (let d = 0; d < 6; d++) if (neighborAt(board, a, d) === b) return d;
  return -1;
}

/**
 * The map behind the site: terrain, and on the fp page everything built on it.
 * Nothing cuts in. A new map arrives as a wave from a random tile; a painted
 * tile shrinks, swaps and grows back; buildings pop, drop or draw themselves
 * in, and erasing plays that backwards. On the fp page it also takes the
 * pointer and says which tile it is over.
 */
export default function MapCanvas({
  scene,
  interactive = false,
  ghost = null,
  preview = null,
  pendingTunnel = -1,
  labels = [],
  hints = [],
  onPointer,
  onPress,
}: {
  scene: Scene | null;
  interactive?: boolean;
  ghost?: Ghost | null;
  preview?: Preview | null;
  pendingTunnel?: number;
  labels?: TileLabel[];
  /** Tiles the tutorial points at, ringed and breathing. */
  hints?: number[];
  onPointer?: (e: TilePointer) => void;
  /** A click on the map while it isn't interactive. */
  onPress?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const shown = useRef<Board | null>(null);
  const tweens = useRef<Tweens | null>(null);
  const overlay = useRef({ ghost, preview, pendingTunnel, labels, hints });
  overlay.current = { ghost, preview, pendingTunnel, labels, hints };
  const layout = useRef({ s: 0, ox: 0, oy: 0 });
  const frame = useRef(0);
  // starts the frame loop if it is idle; set once the canvas is mounted
  const kick = useRef(() => {});

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const layer = document.createElement('canvas');
    const layerCtx = layer.getContext('2d')!;

    const draw = (now: number) => {
      const board = shown.current;
      const t = tweens.current;
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
      if (!board || !t) return false;

      // cover: the outer ring of tiles hangs off the edges
      const s = Math.max(w / (SQRT3 * (board.cols - 1.5)), h / (1.5 * (board.rows - 2)));
      const ox = (w - SQRT3 * (board.cols - 0.5) * s) / 2;
      const oy = (h - 1.5 * (board.rows - 1) * s) / 2;
      layout.current = { s, ox, oy };
      const n = tileCount(board);
      const at = (i: number) => {
        const c = center(board, i);
        return [ox + c.x * s, oy + c.y * s] as const;
      };

      // terrain
      for (let i = 0; i < n; i++) {
        const [x, y] = at(i);
        const k = ease((now - t.terrainStart[i]) / TERRAIN_MS);
        const from = t.terrainFrom[i];
        const to = board.tiles[i];
        if (from === NEVER && k === 0) {
          hexPath(ctx, x, y, s * 0.92);
          ctx.strokeStyle = COLORS.ghost;
          ctx.lineWidth = 1;
          ctx.stroke();
          continue;
        }
        const lookTo = { deep: t.deepTo[i] === 1, shore: t.shoreTo[i] };
        if (from === NEVER) {
          ctx.globalAlpha = Math.min(1, k * 1.6);
          drawTile(ctx, to, i, x, y, s * (0.6 + 0.4 * k), lookTo);
          ctx.globalAlpha = 1;
        } else {
          // a tile switches when its change reaches it; one keeping its
          // terrain doesn't shrink, but its shore and depth still wait
          const scale = from === to ? 1 : 1 - 0.4 * Math.sin(Math.PI * k);
          const flipped = k >= 0.5;
          const lookFrom = { deep: t.deepFrom[i] === 1, shore: t.shoreFrom[i] };
          drawTile(ctx, flipped ? to : from, i, x, y, s * scale, flipped ? lookTo : lookFrom);
        }
      }

      // what each tile's building is doing: [kind, k, houses already down, leaving]
      const builds = (i: number): [number, number, number, boolean][] => {
        const cur = board.build[i];
        const from = t.buildFrom[i];
        const p = clamp01((now - t.buildStart[i]) / BUILD_MS);
        if (cur === from || p >= 1) return cur === EMPTY ? [] : [[cur, 1, 0, false]];
        if (from === EMPTY) return [[cur, p, 0, false]];
        if (cur === EMPTY) return [[from, 1 - p, 0, true]];
        if (isHouse(cur) && isHouse(from)) {
          return cur > from ? [[cur, p, from, false]] : [[from, 1 - p, cur, true]];
        }
        return p < 0.5 ? [[from, 1 - 2 * p, 0, true]] : [[cur, 2 * p - 1, 0, false]];
      };

      // parks are ground, so they go under the rail
      for (let i = 0; i < n; i++) {
        for (const [kind, k, , leaving] of builds(i)) {
          if (kind !== PARK) continue;
          const [x, y] = at(i);
          drawPark(ctx, x, y, s, hash(i), k, leaving);
        }
      }

      for (let i = 0; i < n; i++) {
        const cur = board.rail[i];
        const from = t.railFrom[i];
        if (!cur && !from) continue;
        const [x, y] = at(i);
        const p = clamp01((now - t.railStart[i]) / RAIL_MS);
        // a station's rail meets in its middle, under the circle
        const hub = board.build[i] === STATION;
        if (p >= 1 || cur === from) {
          drawRail(ctx, x, y, s, cur, 0, 1, hub);
          continue;
        }
        const added = cur & ~from;
        const removed = from & ~cur;
        drawRail(ctx, x, y, s, cur, added, p, hub);
        // drawRail eases its growth out; feeding it the inverse makes rail
        // retract straight away instead of hanging on at full length
        if (removed) drawRail(ctx, x, y, s, removed, removed, 1 - Math.cbrt(p), hub);
      }

      for (let i = 0; i < n; i++) {
        for (const [kind, k, settled, leaving] of builds(i)) {
          if (kind === PARK) continue;
          const [x, y] = at(i);
          if (kind === STATION) drawStation(ctx, x, y, s, k, leaving);
          else if (kind === TUNNEL) drawTunnel(ctx, x, y, s, k, leaving);
          else if (isHouse(kind)) drawHouses(ctx, x, y, s, kind as 1 | 2 | 3, k, settled, leaving);
        }
      }

      const { ghost: g, preview, pendingTunnel: pending, labels: tags, hints: pointed } = overlay.current;

      // each tunnel's run under the water, as a faint dashed line between its
      // mouths — and the one a second click would make, while it is valid
      const underwater = (a: number, c: number, alpha: number, rgb = '238,243,230') => {
        const [ax, ay] = at(a);
        const [cx, cy] = at(c);
        ctx.beginPath();
        ctx.moveTo(ax, ay);
        ctx.lineTo(cx, cy);
        ctx.setLineDash([s * 0.25, s * 0.25]);
        ctx.strokeStyle = `rgba(${rgb},${alpha})`;
        ctx.lineWidth = Math.max(1.5, s * 0.12);
        ctx.lineCap = 'butt';
        ctx.stroke();
        ctx.setLineDash([]);
      };
      for (const { ends } of tunnelLines(board)) {
        // a new tunnel's line fades in once its arches are halfway up
        const p = clamp01((now - t.buildStart[ends[0]] - BUILD_MS * 0.5) / BUILD_MS);
        if (p > 0) underwater(ends[0], ends[1], 0.55 * p);
      }
      // and a removed one's fades out as its arches sink
      for (const { ends, start } of t.goneTunnels) {
        const p = clamp01((now - start) / (BUILD_MS * 0.6));
        if (p < 1) underwater(ends[0], ends[1], 0.55 * (1 - p));
      }
      // with one end down, the line to the pointer is always shown: pale where
      // a tunnel could go, faded red where it can't
      if (pending >= 0 && g && g.tool === 'tunnel' && g.tile >= 0 && g.tile !== pending) {
        if (g.ok) underwater(pending, g.tile, 0.45);
        else underwater(pending, g.tile, 0.5, BLOCKED_RGB);
      }

      // the rail a drag would lay, telegraphed before it is let go
      if (preview && preview.path.length > 1) {
        const { path, ok } = preview;
        const masks = new Map<number, number>();
        for (let k = 1; k < path.length; k++) {
          const d = dirBetween(board, path[k - 1], path[k]);
          if (d < 0) continue;
          masks.set(path[k - 1], (masks.get(path[k - 1]) ?? 0) | (1 << d));
          masks.set(path[k], (masks.get(path[k]) ?? 0) | (1 << ((d + 3) % 6)));
        }
        const look = ok ? PREVIEW_OK : PREVIEW_BLOCKED;
        layer.width = canvas.width;
        layer.height = canvas.height;
        layerCtx.setTransform(dpr, 0, 0, dpr, 0, 0);
        for (const [i, mask] of masks) {
          const [x, y] = at(i);
          drawRail(layerCtx, x, y, s, mask, 0, 1, board.build[i] === STATION, look.color);
        }
        ctx.save();
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.globalAlpha = look.alpha;
        ctx.drawImage(layer, 0, 0);
        ctx.restore();
      }

      if (g && g.tile >= 0) {
        const [x, y] = at(g.tile);
        if (!g.ok) {
          hexPath(ctx, x, y, s * 0.86);
          ctx.setLineDash([3, 3]);
          // tunnels say no in the same red as a route that can't be laid
          ctx.strokeStyle = g.tool === 'tunnel' ? `rgba(${BLOCKED_RGB},.6)` : 'rgba(18,32,10,.5)';
          ctx.lineWidth = 1.5;
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          ctx.globalAlpha = 0.55;
          const v = board.build[g.tile];
          if (g.tool === 'erase') drawCross(ctx, x, y, s);
          else if (g.tool === 'house') drawHouses(ctx, x, y, s, (isHouse(v) ? v + 1 : 1) as 1 | 2 | 3);
          else if (g.tool === 'park') drawPark(ctx, x, y, s, hash(g.tile));
          else if (g.tool === 'station') drawStation(ctx, x, y, s);
          else if (g.tool === 'tunnel') drawTunnel(ctx, x, y, s);
          else if (g.tool === 'rail') {
            hexPath(ctx, x, y, s * 0.86);
            ctx.strokeStyle = COLORS.ink;
            ctx.lineWidth = 1.5;
            ctx.stroke();
          } else {
            const kind = g.tool === 'water' ? WATER : g.tool === 'mountain' ? MOUNTAIN : LAND;
            drawTile(ctx, kind, g.tile, x, y, s, PLAIN);
          }
          ctx.globalAlpha = 1;
        }
      }

      // the first end of a tunnel, breathing until the second goes down
      if (pending >= 0) {
        const [x, y] = at(pending);
        const pulse = 0.5 + 0.5 * Math.sin(now / 180);
        hexPath(ctx, x, y, s * (0.8 + 0.08 * pulse));
        ctx.strokeStyle = COLORS.paper;
        ctx.lineWidth = 2;
        ctx.globalAlpha = 0.5 + 0.5 * pulse;
        ctx.stroke();
        ctx.globalAlpha = 0.6;
        drawTunnel(ctx, x, y, s);
        ctx.globalAlpha = 1;
      }

      // what the tutorial wants built on or used, in rings that breathe
      if (pointed.length) {
        const pulse = 0.5 + 0.5 * Math.sin(now / 260);
        ctx.setLineDash([s * 0.3, s * 0.18]);
        ctx.lineDashOffset = -now / 40;
        ctx.strokeStyle = COLORS.ink;
        ctx.lineWidth = 2.5;
        ctx.globalAlpha = 0.55 + 0.45 * pulse;
        for (const tile of pointed) {
          const [x, y] = at(tile);
          hexPath(ctx, x, y, s * (0.78 + 0.08 * pulse));
          ctx.stroke();
        }
        ctx.globalAlpha = 1;
        ctx.setLineDash([]);
        ctx.lineDashOffset = 0;
      }

      // select mode: each tile's worth as a paper tag above it, the pinned
      // tile outlined in ink; a tile worth nothing gets no tag
      for (const { tile, value, pinned } of tags) {
        const [x, y] = at(tile);
        if (pinned) {
          hexPath(ctx, x, y, s * 0.9);
          ctx.strokeStyle = COLORS.ink;
          ctx.lineWidth = 2.5;
          ctx.stroke();
        }
        // nothing worth saying about a tile that adds nothing
        if (value === 0) continue;
        const text = value > 0 ? `+${value}` : String(value);
        ctx.font = `700 ${Math.round(s * 0.62)}px ${getComputedStyle(canvas).fontFamily}`;
        const tw = ctx.measureText(text).width;
        const bw = tw + s * 0.5;
        const bh = s * 0.9;
        const bx = x - bw / 2;
        const by = y - s * 1.05 - bh;
        ctx.fillStyle = COLORS.paper;
        ctx.fillRect(bx, by, bw, bh);
        ctx.strokeStyle = COLORS.ink;
        ctx.lineWidth = 1.5;
        ctx.strokeRect(bx, by, bw, bh);
        ctx.fillStyle = COLORS.ink;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, by + bh / 2 + 1);
      }

      return now < t.end || pending >= 0 || pointed.length > 0;
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

  // overlays change without the board changing
  useEffect(() => kick.current(), [ghost, preview, pendingTunnel, labels, hints]);

  useEffect(() => {
    if (!scene) return;
    const { board, order } = scene;
    const prev = shown.current;
    const n = tileCount(board);
    const sameGrid = !!prev && prev.cols === board.cols && prev.rows === board.rows;
    const newMap = !sameGrid || prev.seed !== board.seed;
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const now = performance.now();

    const origin = scene.origin ?? (newMap ? Math.floor(Math.random() * n) : -1);
    const ranks = new Map(order?.map((tile, k) => [tile, k]));
    const from = origin >= 0 ? center(board, origin) : null;
    const startOf = (i: number) => {
      if (reduced) return -Infinity;
      if (ranks.has(i)) return now + ranks.get(i)! * ROUTE_STEP_MS;
      if (!from) return now;
      const c = center(board, i);
      return now + (Math.hypot(c.x - from.x, c.y - from.y) / SQRT3) * WAVE_STEP_MS;
    };

    const looks = looksOf(board);
    const old = sameGrid ? tweens.current : null;
    const t: Tweens = old
      ? {
          ...old,
          terrainFrom: old.terrainFrom.slice(),
          terrainStart: old.terrainStart.slice(),
          deepFrom: old.deepFrom.slice(),
          shoreFrom: old.shoreFrom.slice(),
          deepTo: old.deepTo.slice(),
          shoreTo: old.shoreTo.slice(),
          buildFrom: old.buildFrom.slice(),
          buildStart: old.buildStart.slice(),
          railFrom: old.railFrom.slice(),
          railStart: old.railStart.slice(),
          goneTunnels: old.goneTunnels.filter((g) => now < g.start + BUILD_MS),
        }
      : {
          terrainFrom: new Int8Array(n).fill(NEVER),
          terrainStart: new Float64Array(n),
          deepFrom: looks.deep.slice(),
          shoreFrom: looks.shore.slice(),
          deepTo: looks.deep,
          shoreTo: looks.shore,
          buildFrom: new Uint8Array(n),
          buildStart: new Float64Array(n).fill(-Infinity),
          railFrom: new Uint8Array(n),
          railStart: new Float64Array(n).fill(-Infinity),
          goneTunnels: [],
          end: now,
        };

    // on a new map, what was built goes at once, before the terrain wave gets
    // to it; what the new map brings arrives just after the wave has laid
    // its land
    const before = (i: number) => (prev && sameGrid ? prev.build[i] : EMPTY);
    const railBefore = (i: number) => (prev && sameGrid ? prev.rail[i] : 0);
    const builtStart = (i: number) => {
      if (!newMap) return startOf(i);
      if (reduced) return -Infinity;
      return before(i) !== EMPTY || railBefore(i) ? now : startOf(i) + TERRAIN_MS * 0.6;
    };

    for (let i = 0; i < n; i++) {
      const terrainChanged = !old || prev!.tiles[i] !== board.tiles[i];
      const lookChanged = t.deepTo[i] !== looks.deep[i] || t.shoreTo[i] !== looks.shore[i];
      // a whole new map sweeps every tile, so even unchanged ones take the wave
      if (!old || newMap || terrainChanged || lookChanged) {
        const midway = old && now < t.terrainStart[i] + TERRAIN_MS && !terrainChanged;
        if (!midway) {
          if (old) {
            t.terrainFrom[i] = prev!.tiles[i];
            t.deepFrom[i] = t.deepTo[i];
            t.shoreFrom[i] = t.shoreTo[i];
          }
          t.terrainStart[i] = startOf(i);
        }
        t.deepTo[i] = looks.deep[i];
        t.shoreTo[i] = looks.shore[i];
        t.end = Math.max(t.end, t.terrainStart[i] + TERRAIN_MS);
      }
      if (before(i) !== board.build[i]) {
        t.buildFrom[i] = before(i);
        t.buildStart[i] = builtStart(i);
        t.end = Math.max(t.end, t.buildStart[i] + BUILD_MS);
      }
      if (railBefore(i) !== board.rail[i]) {
        t.railFrom[i] = railBefore(i);
        t.railStart[i] = builtStart(i);
        t.end = Math.max(t.end, t.railStart[i] + RAIL_MS);
      }
    }
    if (prev && sameGrid) {
      const kept = new Set(tunnelLines(board).map((l) => l.ends.join()));
      for (const { ends } of tunnelLines(prev)) {
        if (kept.has(ends.join())) continue;
        t.goneTunnels.push({ ends, start: builtStart(ends[0]) });
        t.end = Math.max(t.end, builtStart(ends[0]) + BUILD_MS);
      }
    }
    tweens.current = t;
    shown.current = board;
    kick.current();
  }, [scene]);

  /** The tile under a point on the canvas, or -1 between tiles and off the map. */
  const pick = (px: number, py: number) => {
    const board = shown.current;
    const { s, ox, oy } = layout.current;
    if (!board || !s) return -1;
    const rowGuess = Math.round((py - oy) / (1.5 * s));
    let best = -1;
    let bestDist = Infinity;
    for (let r = rowGuess - 1; r <= rowGuess + 1; r++) {
      if (r < 0 || r >= board.rows) continue;
      const colGuess = Math.round((px - ox) / (SQRT3 * s) - 0.5 * (r & 1));
      for (let c = colGuess - 1; c <= colGuess + 1; c++) {
        if (c < 0 || c >= board.cols) continue;
        const i = r * board.cols + c;
        const ctr = center(board, i);
        const dist = Math.hypot(ox + ctr.x * s - px, oy + ctr.y * s - py);
        if (dist < bestDist) {
          bestDist = dist;
          best = i;
        }
      }
    }
    return bestDist < s ? best : -1;
  };

  const send = (type: TilePointer['type']) => (e: ReactPointerEvent<HTMLCanvasElement>) => {
    if (!interactive || !onPointer) return;
    const rect = e.currentTarget.getBoundingClientRect();
    if (type === 'down') {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    onPointer({
      type,
      tile: pick(e.clientX - rect.left, e.clientY - rect.top),
      button: e.button,
      shift: e.shiftKey,
    });
  };

  return (
    <canvas
      ref={canvasRef}
      className="terrain"
      data-interactive={interactive ? 'true' : 'false'}
      data-pressable={onPress ? 'true' : 'false'}
      aria-hidden
      onPointerDown={send('down')}
      onPointerMove={send('move')}
      onPointerUp={send('up')}
      onPointerLeave={send('leave')}
      onClick={() => !interactive && onPress?.()}
      onContextMenu={(e) => interactive && e.preventDefault()}
    />
  );
}
