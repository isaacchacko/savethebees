// node --test src/lib/map/*.test.ts

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emptyBoard, erase, layRoute, place, route, type Board } from './board.ts';
import { TARGET_SHARE, affordable, allowance, isCatastropheDay, left, targetFor } from './game.ts';
import { maxScore } from './optimize.ts';
import { tileCount, type Grid } from './hex.ts';
import { LAND } from './terrain.ts';

const GRID: Grid = { cols: 12, rows: 8 };
const at = (col: number, row: number) => row * GRID.cols + col;
const board = (): Board => emptyBoard({ ...GRID, seed: 1, tiles: new Uint8Array(tileCount(GRID)).fill(LAND) });
const must = <T>(x: T | null): T => {
  assert.ok(x !== null);
  return x;
};

test("the target is 90% of the planner's best with the same people and allowance", () => {
  let b = board();
  for (const t of [at(2, 2), at(3, 2), at(2, 3), at(8, 5), at(9, 5)]) b = must(place(b, 'house', t));
  for (const day of [1, 2, 4]) {
    assert.equal(targetFor(b, day), Math.max(1, Math.round(TARGET_SHARE * maxScore(b, allowance(day)))));
  }
  assert.ok(targetFor(b, 4) >= targetFor(b, 1));
});

test('catastrophes come every other day', () => {
  assert.deepEqual([1, 2, 3, 4, 5, 6, 10, 15].map(isCatastropheDay), [false, true, false, true, false, true, true, false]);
});

test('the allowance only ever grows', () => {
  for (let d = 1; d < 12; d++) {
    const a = allowance(d);
    const b = allowance(d + 1);
    assert.ok(b.station >= a.station && b.park >= a.park && b.tunnel >= a.tunnel && b.rail >= a.rail);
  }
});

test('the tutorial has extra rail for its tall island', () => {
  assert.equal(allowance(1).rail, 12);
  assert.equal(allowance(1, true).rail, 16);
  assert.deepEqual(left(board(), 1, true), allowance(1, true));
});

test('what is left comes from the board, so erasing hands it back', () => {
  let b = board();
  const start = left(b, 1).station;
  b = must(place(b, 'station', at(2, 2)));
  assert.equal(left(b, 1).station, start - 1);
  b = must(erase(b, at(2, 2)));
  assert.equal(left(b, 1).station, start);
});

test('rail is counted in pieces, and erasing it hands them back', () => {
  let b = must(place(board(), 'station', at(1, 2)));
  b = must(place(b, 'station', at(5, 2)));
  b = layRoute(b, must(route(b, at(1, 2), at(5, 2))));
  assert.equal(left(b, 1).rail, allowance(1).rail - 4);
  b = must(erase(b, at(3, 2)));
  assert.equal(left(b, 1).rail, allowance(1).rail - 2);
});

test('rail past the allowance is not affordable', () => {
  // two lines the width of the map: 22 pieces, more than day two's rail
  let b = board();
  for (const row of [0, 4]) {
    b = must(place(b, 'station', at(0, row)));
    b = must(place(b, 'station', at(GRID.cols - 1, row)));
    b = layRoute(b, must(route(b, at(0, row), at(GRID.cols - 1, row))));
  }
  assert.ok(left(b, 2).station >= 0);
  assert.ok(left(b, 2).rail < 0);
  assert.equal(affordable(b, 2), false);
});

test('a board over the allowance is not affordable', () => {
  let b = board();
  const n = allowance(1).station;
  for (let k = 0; k < n; k++) b = must(place(b, 'station', at(1 + 2 * k, 2)));
  assert.equal(affordable(b, 1), true);
  b = must(place(b, 'station', at(1, 6)));
  assert.equal(affordable(b, 1), false);
});
