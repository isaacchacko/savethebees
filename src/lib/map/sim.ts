// The town that grows on its own: houses turning up, and a rudimentary
// planner that keeps everyone connected. Idle mode and the site's background
// run both; the game uses the housing half. Each function takes one small
// step and returns the board after it (or null when there's nothing to do),
// so every step can animate on its own.

import {
  EMPTY,
  PARK,
  STATION,
  TUNNEL,
  canPairTunnel,
  canPlace,
  isHouse,
  layRoute,
  paintTerrain,
  place,
  placeTunnel,
  route,
  type Board,
} from './board.ts';
import type { Rng } from './noise.ts';
import { distanceFrom, hexDistance, hexLine, neighborAt, neighbors, tileCount } from './hex.ts';
import { networks } from './score.ts';
import { LAND, MOUNTAIN, WATER } from './terrain.ts';

/** A board after one step, and where its animation should start from. */
export type Step = { board: Board; origin?: number; order?: number[] };

const pick = <T>(random: Rng, items: T[]): T => items[Math.floor(random() * items.length)];

/** Picks an item with probability proportional to its weight. */
function weighted<T>(random: Rng, items: T[], weight: (t: T) => number): T | null {
  const ws = items.map(weight);
  const total = ws.reduce((a, b) => a + b, 0);
  if (total <= 0) return null;
  let r = random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= ws[i];
    if (r <= 0) return items[i];
  }
  return items[items.length - 1];
}

const houses = (b: Board) => {
  const out: number[] = [];
  for (let i = 0; i < b.build.length; i++) if (isHouse(b.build[i])) out.push(i);
  return out;
};

const stations = (b: Board) => {
  const out: number[] = [];
  for (let i = 0; i < b.build.length; i++) if (b.build[i] === STATION) out.push(i);
  return out;
};

const served = (b: Board, i: number) => neighbors(b, i).some((n) => b.build[n] === STATION);

/** A side rail could still leave a station by: open land, or another station. */
const openSide = (b: Board, t: number) =>
  b.build[t] === STATION || (b.tiles[t] === LAND && b.build[t] === EMPTY && b.rail[t] === 0);

/** A station needs this many open sides to stay reachable once houses crowd in. */
const BREATHING_ROOM = 2;

/** Whether building on t would leave a station beside it boxed in. */
function boxesIn(b: Board, t: number): boolean {
  return neighbors(b, t).some(
    (s) =>
      b.build[s] === STATION &&
      neighbors(b, s).filter((n) => n !== t && openSide(b, n)).length < BREATHING_ROOM
  );
}

/**
 * One new resident's worth of housing: usually a cottage on open land, drawn
 * to where people and stations already are so towns cluster, sometimes an
 * existing building growing a stage — served ones first, since that's where
 * people would want to live.
 */
export function spawnHousing(
  b: Board,
  random: Rng,
  /**
   * How often someone founds a new settlement instead of moving in next to
   * others: low for the site's tidy town, higher in the game so people turn
   * up in awkward places.
   */
  spread = 0.1
): Step | null {
  const homes = houses(b);
  const growable = homes.filter((i) => b.build[i] < 3);
  if (growable.length && random() < 0.35) {
    const i = weighted(random, growable, (t) => (served(b, t) ? 4 : 1));
    if (i !== null) {
      const next = place(b, 'house', i);
      if (next) return { board: next, origin: i };
    }
  }

  const toHome = distanceFrom(b, (i) => isHouse(b.build[i]));
  const toStation = distanceFrom(b, (i) => b.build[i] === STATION);
  const open: number[] = [];
  for (let i = 0; i < tileCount(b); i++) {
    // off the very edge of the map, where it's half hidden
    if (neighbors(b, i).length < 6) continue;
    // and somewhere a station could still serve it
    const reachable = neighbors(b, i).some((n) => b.build[n] === STATION || canPlace(b, 'station', n));
    if (canPlace(b, 'house', i) && b.build[i] === EMPTY && !boxesIn(b, i) && reachable) open.push(i);
  }
  const near = (d: number, within: number) => d >= 0 && d <= within;
  // the first home goes near the middle of the map; after that people move in
  // next to others, with the odd one founding a settlement of its own — which
  // is what gives the planner rail and tunnels to build between them
  const middle = Math.floor(b.rows / 2) * b.cols + Math.floor(b.cols / 2);
  const founding = homes.length === 0 || random() < spread;
  const i = weighted(random, open, (t) => {
    if (homes.length === 0) return near(hexDistance(b, t, middle), Math.max(3, b.cols / 5)) ? 1 : 0;
    if (founding) return near(toHome[t], 5) ? 0 : 1;
    // a looser town spreads over a wider neighbourhood
    let w = 0.02 + spread;
    if (near(toHome[t], 1)) w += 10 * (1 - spread);
    else if (near(toHome[t], 3)) w += 4;
    if (near(toStation[t], 1)) w += 6;
    return w;
  });
  if (i === null) return null;
  const next = place(b, 'house', i);
  return next ? { board: next, origin: i } : null;
}

/**
 * The free tile beside a house that would make the best station: one rail can
 * still reach once the street fills in (the most open sides), and then the one
 * next to the most unserved homes.
 */
function stationSpotFor(b: Board, home: number): number {
  let best = -1;
  let bestScore = -1;
  for (const t of neighbors(b, home)) {
    if (!canPlace(b, 'station', t)) continue;
    const open = Math.min(neighbors(b, t).filter((n) => openSide(b, n)).length, BREATHING_ROOM + 1);
    const lonely = neighbors(b, t).filter((n) => isHouse(b.build[n]) && !served(b, n)).length;
    const score = open * 10 + lonely;
    if (score > bestScore) {
      bestScore = score;
      best = t;
    }
  }
  return best;
}

/**
 * A tunnel that would get a line from station s over towards t: a pair of
 * free shores near s whose straight crossing lands as close to t as it can.
 */
export function tunnelToward(b: Board, s: number, t: number): [number, number] | null {
  let best: [number, number] | null = null;
  let bestDist = hexDistance(b, s, t);
  for (let a = 0; a < tileCount(b); a++) {
    if (hexDistance(b, a, s) > 4 || !canPlace(b, 'tunnel', a)) continue;
    for (let d = 0; d < 6; d++) {
      let at = neighborAt(b, a, d);
      while (at >= 0 && b.tiles[at] === WATER) at = neighborAt(b, at, d);
      if (at < 0 || !canPairTunnel(b, a, at)) continue;
      const dist = hexDistance(b, at, t);
      if (dist < bestDist) {
        bestDist = dist;
        best = [a, at];
      }
    }
  }
  return best;
}

/**
 * The planner's next move, one at a time so each can be seen happening:
 *
 * 1. a house with no station beside it gets one;
 * 2. stations on separate networks get joined by rail — through a tunnel if
 *    water is in the way, and if even that fails, by reshaping the land:
 *    the first water or mountain tile on the straight line between them is
 *    turned to land;
 * 3. a busy station with no park on its network gets one beside it.
 *
 * Null when everyone is served and connected.
 */
export function planStep(b: Board, random: Rng): Step | null {
  // 1. serve the unserved, the ones nearest an existing station first
  const lonely = houses(b).filter((i) => !served(b, i));
  if (lonely.length) {
    const toStation = distanceFrom(b, (i) => b.build[i] === STATION);
    lonely.sort((x, y) => (toStation[x] < 0 ? 99 : toStation[x]) - (toStation[y] < 0 ? 99 : toStation[y]));
    for (const home of lonely) {
      const spot = stationSpotFor(b, home);
      if (spot < 0) continue;
      const next = place(b, 'station', spot);
      if (next) return { board: next, origin: spot };
    }
  }

  // 2. join the networks: the smallest one reaches for the nearest station
  // outside it
  const net = networks(b);
  const all = stations(b);
  const ids = [...new Set(all.map((s) => net[s]))];
  if (ids.length > 1) {
    const size = (id: number) => all.filter((s) => net[s] === id).length;
    ids.sort((x, y) => size(x) - size(y));
    for (const id of ids) {
      const mine = all.filter((s) => net[s] === id);
      const theirs = all.filter((s) => net[s] !== id);
      const pairs = mine
        .flatMap((s) => theirs.map((t) => [s, t] as const))
        .sort((p, q) => hexDistance(b, p[0], p[1]) - hexDistance(b, q[0], q[1]))
        .slice(0, 6);
      // the clean route, unless it goes the long way round when crossing
      // some rail (a station at each crossing) would be much shorter
      for (const [s, t] of pairs) {
        const path = route(b, s, t);
        if (!path) continue;
        const crossing = route(b, s, t, true);
        if (crossing && path.length > crossing.length * 1.6 + 3) continue;
        return { board: layRoute(b, path), order: path };
      }
      // rail in the way: cross it, with a station at each crossing, since
      // that's the only place rail may cross rail
      for (const [s, t] of pairs) {
        const path = route(b, s, t, true);
        if (!path) continue;
        let next: Board | null = b;
        for (const tile of path) {
          if (next && tile !== s && tile !== t && next.rail[tile] && next.build[tile] === EMPTY) {
            next = place(next, 'station', tile);
          }
        }
        if (next) return { board: layRoute(next, path), order: path };
      }
      // a tunnel only if rail can then actually get from s through it to t
      for (const [s, t] of pairs) {
        const pair = tunnelToward(b, s, t);
        const next = pair ? placeTunnel(b, pair[0], pair[1]) : null;
        if (next && pair && (route(next, s, t) || route(next, s, t, true))) return { board: next, order: pair };
      }
      for (const [s, t] of pairs) {
        const blocker = hexLine(b, s, t).find((i) => b.tiles[i] === WATER || b.tiles[i] === MOUNTAIN);
        if (blocker !== undefined) return { board: paintTerrain(b, blocker, LAND), origin: blocker };
      }
    }
  }

  // 3. a park by a busy station whose network has none
  const parkNets = new Set<number>();
  for (let i = 0; i < b.build.length; i++) {
    if (b.build[i] !== PARK) continue;
    for (const n of neighbors(b, i)) if (net[n] >= 0) parkNets.add(net[n]);
  }
  const busy = all
    .filter((s) => !parkNets.has(net[s]))
    .filter((s) => neighbors(b, s).filter((n) => isHouse(b.build[n])).length >= 2);
  for (const s of busy) {
    const spots = neighbors(b, s).filter((t) => canPlace(b, 'park', t));
    if (!spots.length) continue;
    const spot = pick(random, spots);
    const next = place(b, 'park', spot);
    if (next) return { board: next, origin: spot };
  }
  return null;
}

/**
 * Runs the town forward without animation: `homes` rounds of housing, each
 * followed by the planner catching up. Used to give a fresh map a town that's
 * already there.
 */
export function growTown(b: Board, random: Rng, homes: number): Board {
  let board = b;
  for (let n = 0; n < homes; n++) {
    const spawned = spawnHousing(board, random);
    if (spawned) board = spawned.board;
    for (let k = 0; k < 12; k++) {
      const step = planStep(board, random);
      if (!step) break;
      board = step.board;
    }
  }
  return board;
}

/** Tunnel pairs on the board, counted once each. */
export function tunnelPairs(b: Board): number {
  let n = 0;
  for (let i = 0; i < b.build.length; i++) if (b.build[i] === TUNNEL && b.partner[i] > i) n++;
  return n;
}

/**
 * Every fifth day of the game, the land turns on the town: a flood or a
 * landslide around a spot near the rail. It only ever remakes open ground,
 * rail, mountains and water — homes, stations, parks and tunnels (and the
 * water their tunnels run under) are left standing — but any rail it lands
 * on is gone.
 */
export function catastrophe(b: Board, random: Rng): Step & { kind: 'flood' | 'landslide' } {
  const kind = random() < 0.5 ? 'flood' : 'landslide';
  const railTiles: number[] = [];
  for (let i = 0; i < tileCount(b); i++) if (b.rail[i] && b.build[i] === EMPTY) railTiles.push(i);
  const inland: number[] = [];
  for (let i = 0; i < tileCount(b); i++) if (b.tiles[i] === LAND && neighbors(b, i).length === 6) inland.push(i);
  const epicentre = railTiles.length ? pick(random, railTiles) : pick(random, inland);
  const radius = 2 + Math.floor(random() * 2);

  const protectedWater = new Set(tunnelLinesOf(b));
  let next = b;
  for (let i = 0; i < tileCount(b); i++) {
    if (hexDistance(b, i, epicentre) > radius) continue;
    if (next.build[i] !== EMPTY || protectedWater.has(i)) continue;
    if (random() > (kind === 'flood' ? 0.75 : 0.65)) continue;
    next = paintTerrain(next, i, kind === 'flood' ? WATER : MOUNTAIN);
  }
  return { board: next, origin: epicentre, kind };
}

/** Every water tile a tunnel runs under. */
function tunnelLinesOf(b: Board): number[] {
  const out: number[] = [];
  for (let i = 0; i < tileCount(b); i++) {
    const p = b.partner[i];
    if (b.build[i] !== TUNNEL || p < i) continue;
    for (let d = 0; d < 6; d++) {
      const line: number[] = [];
      let at = neighborAt(b, i, d);
      while (at >= 0 && at !== p && b.tiles[at] === WATER) {
        line.push(at);
        at = neighborAt(b, at, d);
      }
      if (at === p) out.push(...line);
    }
  }
  return out;
}
