'use client';

import { useEffect, useRef } from 'react';
import {
  PLAIN,
  drawEraser,
  drawMagnifier,
  drawHouses,
  drawPark,
  drawStation,
  drawTile,
  drawRail,
  drawTunnel,
  hash,
} from '@/lib/map/draw';
import { SQRT3 } from '@/lib/map/hex';
import { LAND, MOUNTAIN, WATER, type Terrain } from '@/lib/map/terrain';
import type { ToolId } from '@/lib/map/tools';

type SceneTile = {
  terrain: Terrain;
  build?: 'park' | 'station' | 'tunnel' | 'eraser' | 'magnifier' | 1 | 2 | 3;
  /** Rail exits, bit d for direction d (0 = east, clockwise). */
  rail?: number;
};

const bit = (...dirs: number[]) => dirs.reduce((m, d) => m | (1 << d), 0);
const land = (extra: Partial<SceneTile> = {}): SceneTile => ({ terrain: LAND, ...extra });
const water: SceneTile = { terrain: WATER };
const mountain: SceneTile = { terrain: MOUNTAIN };
const EAST_WEST = bit(0, 3);
const SW_NE = bit(2, 5);

/**
 * A flower of seven hexes per tool: the tool's tile in the middle (index 0)
 * and its six neighbours, east first, clockwise — enough context to show how
 * the tile is used.
 */
const SCENES: Record<ToolId | 'select', SceneTile[]> = {
  house: [land({ build: 3 }), land(), land(), land(), land({ build: 2 }), land(), land({ build: 1 })],
  park: [land({ build: 'park' }), land({ build: 'park' }), land({ build: 'park' }), land(), land(), land(), land()],
  station: [
    land({ build: 'station', rail: EAST_WEST }),
    land({ rail: EAST_WEST }),
    land(),
    land(),
    land({ rail: EAST_WEST }),
    land(),
    land(),
  ],
  tunnel: [
    land({ build: 'tunnel', rail: bit(3) }),
    water,
    water,
    land(),
    land({ rail: EAST_WEST }),
    land(),
    water,
  ],
  // a bend, to show rail curving from tile to tile
  rail: [land({ rail: bit(3, 5) }), land(), land(), land(), land({ rail: EAST_WEST }), land(), land({ rail: SW_NE })],
  land: [land(), land(), land(), land(), land(), land(), land()],
  water: [water, water, water, water, land(), land(), land()],
  mountain: [mountain, mountain, land(), land(), mountain, land(), land()],
  select: [land({ build: 'magnifier' }), land({ build: 3 }), land({ build: 'station' }), land(), land({ build: 1 }), land(), land()],
  erase: [land({ build: 'eraser' }), land({ build: 2 }), land(), land({ rail: EAST_WEST }), land(), land(), land()],
};

/** Offset of scene tile i from the middle, in units of r. */
function offset(i: number): [number, number] {
  if (i === 0) return [0, 0];
  const a = (60 * (i - 1) * Math.PI) / 180;
  return [SQRT3 * Math.cos(a), SQRT3 * Math.sin(a)];
}

/** Which of tile i's six directions face land inside the scene — where the shore line goes. */
function shoreOf(tiles: SceneTile[], i: number): number {
  const [x, y] = offset(i);
  let mask = 0;
  for (let d = 0; d < 6; d++) {
    const a = (60 * d * Math.PI) / 180;
    const nx = x + SQRT3 * Math.cos(a);
    const ny = y + SQRT3 * Math.sin(a);
    const j = tiles.findIndex((_, k) => {
      const [kx, ky] = offset(k);
      return Math.hypot(kx - nx, ky - ny) < 0.01;
    });
    if (j >= 0 && tiles[j].terrain !== WATER) mask |= 1 << d;
  }
  return mask;
}

function drawSceneTile(ctx: CanvasRenderingContext2D, tiles: SceneTile[], i: number, x: number, y: number, r: number) {
  const t = tiles[i];
  const look = t.terrain === WATER ? { ...PLAIN, shore: shoreOf(tiles, i) } : PLAIN;
  if (t.build === 'park') drawPark(ctx, x, y, r, hash(i));
  else drawTile(ctx, t.terrain, i, x, y, r, look);
  if (t.rail) drawRail(ctx, x, y, r, t.rail);
  if (t.build === 'station') drawStation(ctx, x, y, r);
  else if (t.build === 'tunnel') drawTunnel(ctx, x, y, r);
  else if (t.build === 'eraser') drawEraser(ctx, x, y, r);
  else if (t.build === 'magnifier') drawMagnifier(ctx, x, y, r);
  else if (typeof t.build === 'number') drawHouses(ctx, x, y, r, t.build);
}

/**
 * One tool drawn with the map's own renderer: just its tile for a toolbar
 * glyph, or with `scene` its seven-hex flower for the info card.
 */
export default function TilePreview({
  tool,
  r,
  scene = false,
}: {
  tool: ToolId | 'select';
  r: number;
  scene?: boolean;
}) {
  const ref = useRef<HTMLCanvasElement>(null);
  const w = scene ? 3 * SQRT3 * r : SQRT3 * r;
  const h = scene ? 5 * r : 2 * r;

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const dpr = window.devicePixelRatio || 1;
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, w, h);
    const tiles = SCENES[tool];
    const count = scene ? tiles.length : 1;
    for (let i = 0; i < count; i++) {
      const [dx, dy] = offset(i);
      drawSceneTile(ctx, tiles, i, w / 2 + dx * r, h / 2 + dy * r, r);
    }
  }, [tool, r, scene, w, h]);

  return <canvas ref={ref} style={{ width: w, height: h, display: 'block' }} aria-hidden />;
}
