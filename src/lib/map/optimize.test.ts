// node --test src/lib/map/*.test.ts

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { PARK, STATION, emptyBoard, isHouse, layRoute, place, railPieces, route, type Board } from './board.ts';
import { tileCount, type Grid } from './hex.ts';
import { bareLand, bestPlan, maxScore, tunnelsUsed } from './optimize.ts';
import { networks, score } from './score.ts';
import { LAND } from './terrain.ts';

const GRID: Grid = { cols: 16, rows: 10 };
const at = (col: number, row: number) => row * GRID.cols + col;
const board = (): Board => emptyBoard({ ...GRID, seed: 1, tiles: new Uint8Array(tileCount(GRID)).fill(LAND) });
const must = <T>(x: T | null): T => {
  assert.ok(x !== null);
  return x;
};

/** Two little neighbourhoods, apart. */
function town(): Board {
  let b = board();
  for (const t of [at(3, 3), at(4, 3), at(3, 4), at(11, 5), at(12, 5)]) b = must(place(b, 'house', t));
  return b;
}

test('bare land keeps the people and drops what was built', () => {
  let b = must(place(town(), 'station', at(5, 4)));
  b = must(place(b, 'park', at(7, 7)));
  const bare = bareLand(b);
  assert.equal(bare.build.filter(isHouse).length, 5);
  assert.ok(!bare.build.includes(STATION) && !bare.build.includes(PARK));
});

test('the plan keeps to its allowance', () => {
  const plan = bestPlan(town(), { station: 2, park: 1, tunnel: 0, rail: 20 });
  assert.ok(plan.build.filter((v) => v === STATION).length <= 2);
  assert.ok(plan.build.filter((v) => v === PARK).length <= 1);
  assert.equal(tunnelsUsed(plan), 0);
  assert.ok(railPieces(plan) <= 20);
});

test('without the rail to join them, the neighbourhoods are left apart', () => {
  const plan = bestPlan(town(), { station: 2, park: 0, tunnel: 0, rail: 3 });
  assert.equal(railPieces(plan), 0);
  const stations = [...plan.build.keys()].filter((i) => plan.build[i] === STATION);
  assert.equal(new Set(stations.map((s) => networks(plan)[s])).size, 2);
});

test('the planner does at least as well as a sensible hand-built town', () => {
  // by hand: a station in each neighbourhood, joined by rail
  let hand = must(place(town(), 'station', at(4, 4)));
  hand = must(place(hand, 'station', at(11, 4)));
  hand = layRoute(hand, must(route(hand, at(4, 4), at(11, 4))));
  const have = { station: 2, park: 0, tunnel: 0, rail: 20 };
  assert.ok(maxScore(town(), have) >= score(hand), `${maxScore(town(), have)} < ${score(hand)}`);
});

test('more to build with never lowers the best score', () => {
  const small = maxScore(town(), { station: 1, park: 0, tunnel: 0, rail: 0 });
  const big = maxScore(town(), { station: 3, park: 2, tunnel: 1, rail: 20 });
  assert.ok(big >= small);
});
