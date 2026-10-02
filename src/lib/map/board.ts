// What sits on the map: terrain, and on top of it houses, parks, stations,
// tunnels and rail. Pure functions that take a board and return a new one
// (or null when the move isn't allowed), so the rules can be tested without a
// canvas. The rules are the ones in docs/map-spec.md.

import { neighborAt, neighbors, tileCount } from './hex.ts';
import { LAND, MOUNTAIN, WATER, type TerrainMap } from './terrain.ts';
import type { ToolId } from './tools.ts';

// build values; 1–3 are a house of that many people
export const EMPTY = 0;
export const PARK = 4;
export const STATION = 5;
export const TUNNEL = 6;

export type Board = TerrainMap & {
  build: Uint8Array;
  /** Rail exits per tile: bit d for direction d (0 = east, clockwise). */
  rail: Uint8Array;
  /** For a tunnel mouth, the tile of its other end; -1 everywhere else. */
  partner: Int32Array;
};

export const isHouse = (v: number) => v >= 1 && v <= 3;

export function emptyBoard(map: TerrainMap): Board {
  const n = tileCount(map);
  return {
    ...map,
    tiles: map.tiles.slice(),
    build: new Uint8Array(n),
    rail: new Uint8Array(n),
    partner: new Int32Array(n).fill(-1),
  };
}

function copy(b: Board): Board {
  return { ...b, tiles: b.tiles.slice(), build: b.build.slice(), rail: b.rail.slice(), partner: b.partner.slice() };
}

const bits = (m: number) => {
  let c = 0;
  for (; m; m &= m - 1) c++;
  return c;
};

export const touchesWater = (b: Board, i: number) => neighbors(b, i).some((n) => b.tiles[n] === WATER);

function dirTo(b: Board, from: number, to: number): number {
  for (let d = 0; d < 6; d++) if (neighborAt(b, from, d) === to) return d;
  return -1;
}

/** A tile rail may run through: land that is bare, a station, or a tunnel mouth. */
export function carriesRail(b: Board, i: number): boolean {
  const v = b.build[i];
  return b.tiles[i] === LAND && (v === EMPTY || v === STATION || v === TUNNEL);
}

/**
 * How many rail ends a tile can hold. A station takes any number; a tunnel
 * mouth one, since the tunnel is its other end; anything else two — which is
 * what keeps rail from crossing anywhere but a station.
 */
function capacity(b: Board, i: number): number {
  const v = b.build[i];
  return v === STATION ? 6 : v === TUNNEL ? 1 : 2;
}

export function canPlace(b: Board, tool: ToolId, i: number): boolean {
  const land = b.tiles[i] === LAND;
  const v = b.build[i];
  const bare = land && v === EMPTY && b.rail[i] === 0;
  switch (tool) {
    case 'house':
      return bare || v === 1 || v === 2;
    case 'park':
      return bare;
    case 'station':
      return land && v === EMPTY && bits(b.rail[i]) <= 2;
    case 'tunnel':
      return bare && touchesWater(b, i);
    case 'rail':
      return carriesRail(b, i);
    case 'land':
      return b.tiles[i] !== LAND;
    case 'water':
      return b.tiles[i] !== WATER;
    case 'mountain':
      return b.tiles[i] !== MOUNTAIN;
    case 'erase':
      return v !== EMPTY || b.rail[i] !== 0;
  }
}

/** Houses, parks, stations and terrain. Tunnels go down in pairs (placeTunnel) and rail by link/layRoute. */
export function place(b: Board, tool: ToolId, i: number): Board | null {
  if (!canPlace(b, tool, i)) return null;
  if (tool === 'land') return paintTerrain(b, i, LAND);
  if (tool === 'water') return paintTerrain(b, i, WATER);
  if (tool === 'mountain') return paintTerrain(b, i, MOUNTAIN);
  if (tool === 'erase') return erase(b, i);
  if (tool === 'tunnel' || tool === 'rail') return null;
  const next = copy(b);
  if (tool === 'house') next.build[i] = isHouse(b.build[i]) ? b.build[i] + 1 : 1;
  else next.build[i] = tool === 'park' ? PARK : STATION;
  return next;
}

/**
 * The water a tunnel between a and c would run under: the tiles strictly
 * between them on a straight line (one of the six hex directions, no turns),
 * every one of them water. Null if there is no such line.
 */
export function tunnelLine(b: Board, a: number, c: number): number[] | null {
  for (let d = 0; d < 6; d++) {
    const line: number[] = [];
    let at = neighborAt(b, a, d);
    while (at >= 0 && at !== c && b.tiles[at] === WATER) {
      line.push(at);
      at = neighborAt(b, at, d);
    }
    if (at === c && line.length > 0) return line;
  }
  return null;
}

/** The underwater line of every tunnel on the board, one entry per pair. */
export function tunnelLines(b: Board): { ends: [number, number]; line: number[] }[] {
  const out: { ends: [number, number]; line: number[] }[] = [];
  for (let i = 0; i < b.partner.length; i++) {
    const p = b.partner[i];
    if (b.build[i] !== TUNNEL || p < i) continue;
    out.push({ ends: [i, p], line: tunnelLine(b, i, p) ?? [] });
  }
  return out;
}

/**
 * Whether a tunnel can join a and c: both are free shore, a straight line of
 * water runs between them, and that line shares no tile with another
 * tunnel's — on a hex grid two straight lines can only cross at a tile.
 */
export function canPairTunnel(b: Board, a: number, c: number): boolean {
  if (a === c || !canPlace(b, 'tunnel', a) || !canPlace(b, 'tunnel', c)) return false;
  const line = tunnelLine(b, a, c);
  if (!line) return false;
  const taken = new Set(tunnelLines(b).flatMap((t) => t.line));
  return !line.some((t) => taken.has(t));
}

export function placeTunnel(b: Board, a: number, c: number): Board | null {
  if (!canPairTunnel(b, a, c)) return null;
  const next = copy(b);
  next.build[a] = next.build[c] = TUNNEL;
  next.partner[a] = c;
  next.partner[c] = a;
  return next;
}

function removeTunnel(b: Board, i: number) {
  const p = b.partner[i];
  b.build[i] = EMPTY;
  b.partner[i] = -1;
  if (p >= 0) {
    b.build[p] = EMPTY;
    b.partner[p] = -1;
  }
}

function unlinkAll(b: Board, i: number) {
  for (let d = 0; d < 6; d++) {
    if (!(b.rail[i] & (1 << d))) continue;
    const n = neighborAt(b, i, d);
    if (n >= 0) b.rail[n] &= ~(1 << ((d + 3) % 6));
  }
  b.rail[i] = 0;
}

/**
 * New terrain on one tile. Anything the terrain can't hold is cleared, and a
 * tunnel whose straight line of water is broken loses both its ends.
 */
export function paintTerrain(b: Board, i: number, kind: number): Board {
  const next = copy(b);
  next.tiles[i] = kind;
  if (kind !== LAND) {
    if (next.build[i] === TUNNEL) removeTunnel(next, i);
    next.build[i] = EMPTY;
    unlinkAll(next, i);
  }
  for (const { ends, line } of tunnelLines(next)) {
    if (line.length === 0) removeTunnel(next, ends[0]);
  }
  return next;
}

/**
 * Right click: the building on a tile if there is one (a tunnel takes both
 * ends with it), otherwise its rail. A station that was a junction takes its
 * rail too, so no crossing is left behind without a station.
 */
export function erase(b: Board, i: number): Board | null {
  const v = b.build[i];
  if (v === EMPTY && b.rail[i] === 0) return null;
  const next = copy(b);
  if (v === TUNNEL) removeTunnel(next, i);
  else if (v !== EMPTY) {
    next.build[i] = EMPTY;
    if (v === STATION && bits(next.rail[i]) > 2) unlinkAll(next, i);
  } else unlinkAll(next, i);
  return next;
}

/** One piece of rail between neighbouring tiles, if both have room for it. */
export function link(b: Board, a: number, c: number): Board | null {
  const d = dirTo(b, a, c);
  if (d < 0 || !carriesRail(b, a) || !carriesRail(b, c)) return null;
  if (b.rail[a] & (1 << d)) return null;
  if (bits(b.rail[a]) >= capacity(b, a) || bits(b.rail[c]) >= capacity(b, c)) return null;
  const next = copy(b);
  next.rail[a] |= 1 << d;
  next.rail[c] |= 1 << ((d + 3) % 6);
  return next;
}

const JUMP = 6; // arrival "direction" for coming out of a tunnel

/** Whether a route can finish on tile t: a station, or anywhere with room for one more rail end. */
function canEndAt(b: Board, t: number): boolean {
  return b.build[t] === STATION || (carriesRail(b, t) && bits(b.rail[t]) < capacity(b, t));
}

/**
 * The route rail would take from a station to another station — or to any
 * tile with room for a rail end, so a drag can lay a line that stops short:
 * cheapest path over tiles that can take it without crossing anything,
 * preferring straight runs, and allowed to dive through a tunnel. The path
 * lists tiles in order; a step between two tunnel mouths is the tunnel
 * itself. Null when there is no way.
 */
export function route(
  b: Board,
  from: number,
  to: number,
  /**
   * Also cross existing rail, at a cost, on the understanding that a station
   * will be put on each crossing — the planner's way past a rail wall.
   */
  crossings = false,
  /**
   * Also stop at a free tunnel mouth whose far end is already joined to `to`
   * by rail, since the tunnel finishes the trip — so a player's drag to a
   * station across water still works when only this side's line is missing.
   * The path then ends at that mouth.
   */
  join = false
): number[] | null {
  if (from === to || b.build[from] !== STATION || !canEndAt(b, to)) return null;
  const joined = join ? railFrom(b, to) : null;
  const n = tileCount(b);
  const crossable = (t: number) => crossings && b.build[t] === EMPTY && b.tiles[t] === LAND && bits(b.rail[t]) <= 2 && b.rail[t] !== 0;
  const passable = (t: number) =>
    t === to ||
    crossable(t) ||
    b.build[t] === STATION ||
    (carriesRail(b, t) && b.build[t] === EMPTY && b.rail[t] === 0) ||
    (b.build[t] === TUNNEL && b.rail[t] === 0);

  const cost = new Float64Array(n * 7).fill(Infinity);
  const prev = new Int32Array(n * 7).fill(-1);
  const heap: [number, number][] = [];
  const push = (c: number, s: number) => {
    heap.push([c, s]);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p][0] <= heap[i][0]) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop()!;
    if (heap.length) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        if (l < heap.length && heap[l][0] < heap[m][0]) m = l;
        if (r < heap.length && heap[r][0] < heap[m][0]) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };

  const start = from * 7 + JUMP;
  cost[start] = 0;
  push(0, start);
  let end = -1;
  while (heap.length) {
    const [c, s] = pop();
    if (c > cost[s]) continue;
    const u = Math.floor(s / 7);
    const arrived = s % 7;
    const joins = joined && b.build[u] === TUNNEL && u !== from && arrived !== JUMP && joined.has(b.partner[u]);
    if (u === to || joins) {
      end = s;
      break;
    }
    const relax = (t: number, dir: number, step: number) => {
      const ns = t * 7 + dir;
      if (c + step < cost[ns]) {
        cost[ns] = c + step;
        prev[ns] = s;
        push(c + step, ns);
      }
    };
    // a tunnel mouth reached over land can only go on into the tunnel
    if (b.build[u] === TUNNEL && u !== from && arrived !== JUMP) {
      const p = b.partner[u];
      if (p >= 0 && passable(p)) relax(p, JUMP, 2);
      continue;
    }
    for (let d = 0; d < 6; d++) {
      const t = neighborAt(b, u, d);
      if (t < 0 || !passable(t)) continue;
      const turn = arrived !== JUMP && arrived !== d && b.build[u] !== STATION ? 0.4 : 0;
      relax(t, d, 1 + turn + (crossable(t) ? 3 : 0));
    }
  }
  if (end < 0) return null;
  const path: number[] = [];
  for (let s = end; s >= 0; s = prev[s]) path.push(Math.floor(s / 7));
  return path.reverse();
}

/** Every tile rail and tunnels already join to tile t, t included. */
function railFrom(b: Board, t: number): Set<number> {
  const seen = new Set([t]);
  const queue = [t];
  for (let head = 0; head < queue.length; head++) {
    const u = queue[head];
    const next: number[] = [];
    for (let d = 0; d < 6; d++) if (b.rail[u] & (1 << d)) next.push(neighborAt(b, u, d));
    if (b.build[u] === TUNNEL && b.partner[u] >= 0) next.push(b.partner[u]);
    for (const n of next) {
      if (n < 0 || seen.has(n)) continue;
      seen.add(n);
      queue.push(n);
    }
  }
  return seen;
}

/** Lays a route from `route`: rail between each pair of neighbours along it. */
export function layRoute(b: Board, path: number[]): Board {
  const next = copy(b);
  for (let k = 1; k < path.length; k++) {
    const d = dirTo(next, path[k - 1], path[k]);
    if (d < 0) continue; // through a tunnel
    next.rail[path[k - 1]] |= 1 << d;
    next.rail[path[k]] |= 1 << ((d + 3) % 6);
  }
  return next;
}
