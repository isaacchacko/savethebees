import { center, colOf, components, distanceFrom, neighbors, rowOf, tileCount, type Grid } from './hex.ts';
import { fbm, quantile, ridged, rng, type Rng } from './noise.ts';

export const LAND = 0;
export const WATER = 1;
export const MOUNTAIN = 2;

export type Terrain = typeof LAND | typeof WATER | typeof MOUNTAIN;

export type TerrainMap = Grid & { seed: number; tiles: Uint8Array };

/** Below this share of buildable land in one piece, the map is rerolled. */
export const MIN_LAND_SHARE = 0.42;

const MAX_ATTEMPTS = 12;

/**
 * Coastline, rivers, lakes, then mountain ranges, all from one seed. A seed that
 * comes out too wet or too chopped up rolls on to the next one, so the
 * returned map's `seed` can differ from the one asked for — it is the seed
 * that reproduces the map.
 */
export function generateTerrain(grid: Grid, seed: number): TerrainMap {
  let attempt = seed >>> 0;
  let tiles = build(grid, attempt);
  for (let n = 1; n < MAX_ATTEMPTS && largestLandShare(grid, tiles) < MIN_LAND_SHARE; n++) {
    attempt = (attempt + 1) >>> 0;
    tiles = build(grid, attempt);
  }
  return { ...grid, seed: attempt, tiles };
}

/**
 * How much of the map's edge is always ocean, whatever the seed: the outer
 * columns on the east and west and rows on the north and south sit under the
 * site's UI (nav, toolbar, status) or off screen, so nothing should spawn or
 * matter there.
 */
export const BORDER = { cols: 2, rows: 3 };

export function isBorder(grid: Grid, i: number): boolean {
  const col = colOf(grid, i);
  const row = rowOf(grid, i);
  return col < BORDER.cols || col >= grid.cols - BORDER.cols || row < BORDER.rows || row >= grid.rows - BORDER.rows;
}

/** Share of the map inside the ocean border taken by its largest connected piece of plain land. */
export function largestLandShare(grid: Grid, tiles: Uint8Array): number {
  const biggest = components(grid, (i) => tiles[i] === LAND)[0];
  let inside = 0;
  for (let i = 0; i < tileCount(grid); i++) if (!isBorder(grid, i)) inside++;
  return (biggest?.length ?? 0) / Math.max(1, inside);
}

function build(grid: Grid, seed: number): Uint8Array {
  const random = rng(seed);
  const n = tileCount(grid);
  const tiles = new Uint8Array(n);
  const elevation = coastElevation(grid, seed, random);

  // a random share of the map inside the border is sea, so some maps are a
  // peninsula and some are mostly land with a bay; the border is sea anyway
  const inside = Array.from(elevation).filter((_, i) => !isBorder(grid, i));
  const seaLevel = quantile(inside, 0.22 + random() * 0.2);
  for (let i = 0; i < n; i++) if (elevation[i] < seaLevel || isBorder(grid, i)) tiles[i] = WATER;

  const riverCount = 2 + Math.floor(random() * 2);
  for (let r = 0; r < riverCount; r++) carveRiver(grid, tiles, elevation, random);

  const lakeCount = 1 + Math.floor(random() * 3);
  for (let l = 0; l < lakeCount; l++) fillLake(grid, tiles, random);

  raiseMountains(grid, tiles, seed, random);
  // rivers and lakes can't reach the border, but make sure nothing else did
  for (let i = 0; i < n; i++) if (isBorder(grid, i)) tiles[i] = WATER;
  return tiles;
}

/**
 * Noise tilted toward one random side of the map. The tilt puts the sea along
 * that side, so water reads as a coastline rather than scattered lakes; the
 * noise makes the shore ragged.
 */
function coastElevation(grid: Grid, seed: number, random: Rng): Float32Array {
  const n = tileCount(grid);
  const far = center(grid, n - 1);
  const angle = random() * Math.PI * 2;
  const dx = Math.cos(angle);
  const dy = Math.sin(angle);
  const elevation = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const { x, y } = center(grid, i);
    const along = (x / far.x - 0.5) * dx + (y / far.y - 0.5) * dy;
    elevation[i] = fbm(seed, x / 13, y / 13, 4) + along * 1.1;
  }
  return elevation;
}

/**
 * A river starts somewhere high and walks downhill until it reaches water or
 * the edge of the map. A little noise on each step and a nudge to keep going
 * straight make it meander instead of zigzag.
 */
function carveRiver(grid: Grid, tiles: Uint8Array, elevation: Float32Array, random: Rng) {
  const highLand: number[] = [];
  const cutoff = quantile(elevation, 0.7);
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] === LAND && elevation[i] >= cutoff) highLand.push(i);
  }
  if (highLand.length === 0) return;

  let at = highLand[Math.floor(random() * highLand.length)];
  let prev = -1;
  const visited = new Set([at]);
  const path = [at];
  const maxLength = Math.round((grid.cols + grid.rows) * 1.5);

  while (path.length < maxLength) {
    const options = neighbors(grid, at).filter((t) => !visited.has(t));
    if (options.length === 0) break;
    const heading = prev >= 0 ? direction(grid, prev, at) : null;
    let best = options[0];
    let bestCost = Infinity;
    for (const t of options) {
      const turn = heading ? 1 - dot(heading, direction(grid, at, t)) : 0;
      const cost = elevation[t] + random() * 0.08 + turn * 0.05;
      if (cost < bestCost) {
        bestCost = cost;
        best = t;
      }
    }
    prev = at;
    at = best;
    visited.add(at);
    path.push(at);
    if (tiles[at] === WATER || neighbors(grid, at).length < 6) break;
  }
  // in places the river spills a tile wider, so it reads as a real river
  for (const t of path) {
    tiles[t] = WATER;
    if (random() < 0.3) {
      const side = neighbors(grid, t);
      tiles[side[Math.floor(random() * side.length)]] = WATER;
    }
  }
}

/**
 * A small pond well inland: it starts on a tile at least three steps from any
 * water and spreads to random neighbours, so it comes out a rounded blob of a
 * few tiles rather than a line.
 */
function fillLake(grid: Grid, tiles: Uint8Array, random: Rng) {
  const toWater = distanceFrom(grid, (i) => tiles[i] === WATER);
  const inland: number[] = [];
  for (let i = 0; i < tiles.length; i++) {
    if (tiles[i] === LAND && toWater[i] >= 4 && neighbors(grid, i).length === 6) inland.push(i);
  }
  if (inland.length === 0) return;

  const lake = [inland[Math.floor(random() * inland.length)]];
  const size = 4 + Math.floor(random() * 9);
  while (lake.length < size) {
    const edge = lake.flatMap((t) => neighbors(grid, t)).filter((t) => !lake.includes(t));
    if (edge.length === 0) break;
    lake.push(edge[Math.floor(random() * edge.length)]);
  }
  for (const t of lake) tiles[t] = WATER;
}

/**
 * Ridged noise, stretched along a random axis, picks out long thin ridges.
 * They are kept a couple of tiles back from the water, and specks too small
 * to read as a range are dropped.
 */
function raiseMountains(grid: Grid, tiles: Uint8Array, seed: number, random: Rng) {
  const toWater = distanceFrom(grid, (i) => tiles[i] === WATER);
  const angle = random() * Math.PI;
  const cos = Math.cos(angle);
  const sin = Math.sin(angle);
  const ridge = new Float32Array(tiles.length);
  const candidates: number[] = [];
  for (let i = 0; i < tiles.length; i++) {
    const { x, y } = center(grid, i);
    const u = x * cos + y * sin;
    const v = -x * sin + y * cos;
    ridge[i] = ridged(seed + 7919, u / 22, v / 6, 3);
    if (tiles[i] === LAND && (toWater[i] < 0 || toWater[i] >= 2)) candidates.push(i);
  }
  if (candidates.length === 0) return;

  const share = 0.12 + random() * 0.12;
  const landCount = tiles.reduce((sum, t) => sum + (t === LAND ? 1 : 0), 0);
  const threshold = quantile(
    candidates.map((i) => ridge[i]),
    1 - Math.min(0.9, (share * landCount) / candidates.length)
  );
  const raised = new Uint8Array(tiles.length);
  for (const i of candidates) if (ridge[i] >= threshold) raised[i] = 1;

  for (const group of components(grid, (i) => raised[i] === 1)) {
    if (group.length >= 3) for (const i of group) tiles[i] = MOUNTAIN;
  }
}

function direction(grid: Grid, from: number, to: number) {
  const a = center(grid, from);
  const b = center(grid, to);
  const len = Math.hypot(b.x - a.x, b.y - a.y) || 1;
  return { x: (b.x - a.x) / len, y: (b.y - a.y) / len };
}

const dot = (a: { x: number; y: number }, b: { x: number; y: number }) => a.x * b.x + a.y * b.y;
