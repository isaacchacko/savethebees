// The game's opponent: given the map, the people on it and a day's
// allowance, build the best town it can and see what that scores. The day's
// target is a share of it, so the target always means "nearly as well as a
// good planner would have done with what you were given".
//
// It's greedy, not exhaustive — a solid planner, not a perfect one — and it
// starts from bare land, ignoring whatever the player has built.

import {
  PARK,
  STATION,
  TUNNEL,
  canPlace,
  isHouse,
  layRoute,
  place,
  placeTunnel,
  railPieces,
  route,
  type Board,
} from './board.ts';
import type { Allowance } from './game.ts';
import { hexDistance, neighbors, tileCount } from './hex.ts';
import { networks, score } from './score.ts';
import { tunnelToward } from './sim.ts';

/** The map and its people, with everything anyone has built taken away. */
export function bareLand(b: Board): Board {
  const n = tileCount(b);
  const build = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (isHouse(b.build[i])) build[i] = b.build[i];
  return { ...b, tiles: b.tiles.slice(), build, rail: new Uint8Array(n), partner: new Int32Array(n).fill(-1) };
}

/** Stations where they cover the most people not yet covered, one at a time. */
function placeStations(b: Board, count: number): Board {
  let board = b;
  const covered = new Set<number>();
  for (let k = 0; k < count; k++) {
    let best = -1;
    let bestGain = 0;
    for (let t = 0; t < tileCount(board); t++) {
      if (!canPlace(board, 'station', t)) continue;
      let gain = 0;
      for (const n of neighbors(board, t)) if (isHouse(board.build[n]) && !covered.has(n)) gain += board.build[n];
      if (gain > bestGain) {
        bestGain = gain;
        best = t;
      }
    }
    if (best < 0) break;
    board = place(board, 'station', best) ?? board;
    for (const n of neighbors(board, best)) if (isHouse(board.build[n])) covered.add(n);
  }
  return board;
}

/**
 * Joins stations' networks while the rail lasts, each time with the join
 * that adds the most score per piece of rail: rail where it can go, a tunnel
 * and the rail through it when water's in the way. What can't be afforded is
 * left apart.
 */
function connect(b: Board, have: Allowance): Board {
  let board = b;
  let tunnelsLeft = have.tunnel;
  for (let pass = 0; pass < 40; pass++) {
    const net = networks(board);
    const stations = [...board.build.keys()].filter((i) => board.build[i] === STATION);
    // the nearest pairs of stations on different networks
    const pairs = stations
      .flatMap((s) => stations.filter((t) => net[t] > net[s]).map((t) => [s, t] as const))
      .sort((p, q) => hexDistance(board, p[0], p[1]) - hexDistance(board, q[0], q[1]));
    if (pairs.length === 0) break;

    const options: { next: Board; tunnel: boolean }[] = [];
    for (const [s, t] of pairs.slice(0, 12)) {
      const path = route(board, s, t);
      if (path) options.push({ next: layRoute(board, path), tunnel: false });
    }
    if (tunnelsLeft > 0) {
      for (const [s, t] of pairs.slice(0, 6)) {
        const pair = tunnelToward(board, s, t);
        const dug = pair ? placeTunnel(board, pair[0], pair[1]) : null;
        const path = dug ? route(dug, s, t) : null;
        if (dug && path) options.push({ next: layRoute(dug, path), tunnel: true });
      }
    }

    const base = score(board);
    const railLeft = have.rail - railPieces(board);
    let best: (typeof options)[number] | null = null;
    let bestRate = 0;
    for (const o of options) {
      const cost = railPieces(o.next) - railPieces(board);
      if (cost > railLeft) continue;
      const rate = (score(o.next) - base) / Math.max(1, cost);
      if (rate > bestRate) {
        bestRate = rate;
        best = o;
      }
    }
    if (!best) break;
    board = best.next;
    if (best.tunnel) tunnelsLeft--;
  }
  return board;
}

/** Parks one tile at a time, each where it adds the most to the score. */
function placeParks(b: Board, count: number): Board {
  let board = b;
  for (let k = 0; k < count; k++) {
    const base = score(board);
    let best: Board | null = null;
    let bestScore = base;
    for (let t = 0; t < tileCount(board); t++) {
      // only worth trying beside a station or another park
      if (!canPlace(board, 'park', t)) continue;
      if (!neighbors(board, t).some((n) => board.build[n] === STATION || board.build[n] === PARK)) continue;
      const next = place(board, 'park', t);
      if (!next) continue;
      const s = score(next);
      if (s > bestScore) {
        bestScore = s;
        best = next;
      }
    }
    if (!best) break;
    board = best;
  }
  return board;
}

/** The best town the planner can build from bare land with this allowance. */
export function bestPlan(b: Board, have: Allowance): Board {
  let board = bareLand(b);
  board = placeStations(board, have.station);
  board = connect(board, have);
  board = placeParks(board, have.park);
  return board;
}

/** What that best town scores: the day's maximum, as far as the planner can tell. */
export function maxScore(b: Board, have: Allowance): number {
  return score(bestPlan(b, have));
}

/** Tunnel pairs the plan used, for checking it kept to its allowance. */
export function tunnelsUsed(b: Board): number {
  let n = 0;
  for (let i = 0; i < b.build.length; i++) if (b.build[i] === TUNNEL && b.partner[i] > i) n++;
  return n;
}
