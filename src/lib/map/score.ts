// How many points a board is worth, by the rules in docs/map-spec.md:
//
//   for each person, one point per other person they can reach, plus a bonus
//   per park they can reach — 2 for a small park (1–2 tiles), 5 for a medium
//   one (3–5), 10 for a large one (6 or more) — and one more for every side
//   the park shares with a mountain, for the view.
//
// People reach a place by boarding at a station next to home and getting off
// at a station next to it, the two stations joined by rail (tunnels count).
// Sharing one station counts too. People in the same house don't count each
// other.

import { PARK, STATION, TUNNEL, erase, isHouse, paintTerrain, type Board } from './board.ts';
import { components, neighborAt, neighbors, tileCount } from './hex.ts';
import { LAND, MOUNTAIN } from './terrain.ts';

/** The sides a group of park tiles shares with mountain tiles. */
export function mountainSides(b: Board, group: number[]): number {
  return group.reduce((sum, t) => sum + neighbors(b, t).filter((n) => b.tiles[n] === MOUNTAIN).length, 0);
}

export function parkBonus(tiles: number): number {
  if (tiles >= 6) return 10;
  if (tiles >= 3) return 5;
  return 2;
}

/**
 * Which network each station is on: stations joined by rail, directly or
 * through other stations and tunnels, share a number. -1 for non-stations.
 */
export function networks(b: Board): Int32Array {
  const n = tileCount(b);
  const net = new Int32Array(n).fill(-1);
  const seen = new Uint8Array(n);
  let id = 0;
  for (let start = 0; start < n; start++) {
    if (b.build[start] !== STATION || seen[start]) continue;
    const queue = [start];
    seen[start] = 1;
    for (let head = 0; head < queue.length; head++) {
      const t = queue[head];
      if (b.build[t] === STATION) net[t] = id;
      const next: number[] = [];
      for (let d = 0; d < 6; d++) if (b.rail[t] & (1 << d)) next.push(neighborAt(b, t, d));
      if (b.build[t] === TUNNEL && b.partner[t] >= 0) next.push(b.partner[t]);
      for (const u of next) {
        if (u >= 0 && !seen[u]) {
          seen[u] = 1;
          queue.push(u);
        }
      }
    }
    id++;
  }
  return net;
}

/**
 * The score split by what earned it, the three kinds of points there are:
 * people reaching people (housing), park size bonuses (park), and park sides
 * on mountains (mountain). They add up to `total`. Stations, rail and tunnels
 * earn nothing themselves; they are what lets the rest be reached.
 */
export type Breakdown = { total: number; housing: number; park: number; mountain: number };

export function scoreBreakdown(b: Board): Breakdown {
  const net = networks(b);
  // the networks a tile can be reached by: those of the stations beside it
  const reach = (i: number) => {
    const out = new Set<number>();
    for (const t of neighbors(b, i)) if (net[t] >= 0) out.add(net[t]);
    return out;
  };
  const meets = (a: Set<number>, c: Set<number>) => [...a].some((x) => c.has(x));

  const houses: { people: number; reach: Set<number> }[] = [];
  for (let i = 0; i < b.build.length; i++) {
    if (isHouse(b.build[i])) houses.push({ people: b.build[i], reach: reach(i) });
  }
  const parks = components(b, (i) => b.build[i] === PARK).map((group) => {
    const r = new Set<number>();
    for (const t of group) for (const x of reach(t)) r.add(x);
    return { size: parkBonus(group.length), sides: mountainSides(b, group), reach: r };
  });

  const out: Breakdown = { total: 0, housing: 0, park: 0, mountain: 0 };
  houses.forEach((h, k) => {
    if (h.reach.size === 0) return;
    houses.forEach((other, j) => {
      if (j !== k && meets(h.reach, other.reach)) out.housing += h.people * other.people;
    });
    for (const p of parks) {
      if (!meets(h.reach, p.reach)) continue;
      out.park += h.people * p.size;
      out.mountain += h.people * p.sides;
    }
  });
  out.total = out.housing + out.park + out.mountain;
  return out;
}

export function score(b: Board): number {
  return scoreBreakdown(b).total;
}

/**
 * What one tile is worth: how far the score would drop without it. Whatever
 * is built there goes (a house, park, station, a tunnel with both its ends,
 * or else the rail through it); a mountain is worth the park sides it gives.
 * Bare land and water are worth nothing.
 */
export function contribution(b: Board, i: number): number {
  const without = erase(b, i) ?? (b.tiles[i] === MOUNTAIN ? paintTerrain(b, i, LAND) : null);
  return without ? score(b) - score(without) : 0;
}
