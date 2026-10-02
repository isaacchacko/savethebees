// node --test src/lib/map/*.test.ts

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emptyBoard, erase, place, type Board } from './board.ts';
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
    assert.ok(b.station >= a.station && b.park >= a.park && b.tunnel >= a.tunnel);
  }
});

test('what is left comes from the board, so erasing hands it back', () => {
  let b = board();
  const start = left(b, 1).station;
  b = must(place(b, 'station', at(2, 2)));
  assert.equal(left(b, 1).station, start - 1);
  b = must(erase(b, at(2, 2)));
  assert.equal(left(b, 1).station, start);
});

test('a board over the allowance is not affordable', () => {
  let b = board();
  const n = allowance(1).station;
  for (let k = 0; k < n; k++) b = must(place(b, 'station', at(1 + 2 * k, 2)));
  assert.equal(affordable(b, 1), true);
  b = must(place(b, 'station', at(1, 6)));
  assert.equal(affordable(b, 1), false);
});
