// node --test src/lib/map/*.test.ts

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { emptyBoard, layRoute, place, placeTunnel, route, type Board } from './board.ts';
import { tileCount, type Grid } from './hex.ts';
import { contribution, score, scoreBreakdown } from './score.ts';
import { LAND, MOUNTAIN, WATER } from './terrain.ts';

const GRID: Grid = { cols: 14, rows: 8 };
const at = (col: number, row: number) => row * GRID.cols + col;

function board(water: number[] = [], mountains: number[] = []): Board {
  const tiles = new Uint8Array(tileCount(GRID)).fill(LAND);
  for (const i of water) tiles[i] = WATER;
  for (const i of mountains) tiles[i] = MOUNTAIN;
  return emptyBoard({ ...GRID, seed: 1, tiles });
}

const must = <T>(x: T | null): T => {
  assert.ok(x !== null);
  return x;
};

/** Places `times` of a tool on each tile, in order. */
function build(b: Board, tool: 'house' | 'park' | 'station', tiles: number[], times = 1): Board {
  for (const t of tiles) for (let k = 0; k < times; k++) b = must(place(b, tool, t));
  return b;
}

function connect(b: Board, a: number, c: number): Board {
  return layRoute(b, must(route(b, a, c)));
}

test('an empty board, or houses with no station, score nothing', () => {
  assert.equal(score(board()), 0);
  assert.equal(score(build(board(), 'house', [at(2, 2), at(4, 2)])), 0);
});

test('two houses sharing a station reach each other', () => {
  let b = build(board(), 'station', [at(3, 3)]);
  b = build(b, 'house', [at(2, 3), at(4, 3)]);
  // one person each, each reaching the other
  assert.equal(score(b), 2);
});

test('people count by house size, and not their own housemates', () => {
  let b = build(board(), 'station', [at(3, 3)]);
  b = build(b, 'house', [at(2, 3)], 3);
  b = build(b, 'house', [at(4, 3)], 2);
  // 3 people reaching 2, and 2 reaching 3
  assert.equal(score(b), 3 * 2 + 2 * 3);
});

test('stations joined by rail join their neighbourhoods', () => {
  let b = build(board(), 'station', [at(2, 3), at(9, 3)]);
  b = build(b, 'house', [at(1, 3), at(10, 3)]);
  assert.equal(score(b), 0);
  b = connect(b, at(2, 3), at(9, 3));
  assert.equal(score(b), 2);
});

test('a tunnel joins stations across water', () => {
  const river = Array.from({ length: GRID.rows }, (_, r) => at(6, r));
  let b = build(board(river), 'station', [at(3, 3), at(9, 3)]);
  b = build(b, 'house', [at(2, 3), at(10, 3)]);
  b = must(placeTunnel(b, at(5, 3), at(7, 3)));
  b = connect(b, at(3, 3), at(9, 3));
  assert.equal(score(b), 2);
});

test('parks add their bonus once per park, by size', () => {
  let b = build(board(), 'station', [at(3, 3)]);
  b = build(b, 'house', [at(2, 3)]);
  // a one-tile park by the station: small, worth 2
  b = build(b, 'park', [at(4, 3)]);
  assert.equal(score(b), 2);
  // grown to three tiles touching: medium, worth 5, still counted once
  b = build(b, 'park', [at(5, 3), at(6, 3)]);
  assert.equal(score(b), 5);
});

test('a park earns a point more for every side it shares with a mountain', () => {
  // a station with a house west of it and a park east of it, and two
  // mountains touching the park: one east of it, one south-east
  const park = at(4, 2);
  let b = board([], [at(5, 2), at(4, 3)]);
  b = build(b, 'station', [at(3, 2)]);
  b = build(b, 'house', [at(2, 2)]);
  b = build(b, 'park', [park]);
  // a small park's 2, plus 2 mountain sides
  assert.equal(score(b), 2 + 2);
});

test('the breakdown splits the score into housing, park and mountain points', () => {
  let b = board([], [at(5, 2)]);
  b = build(b, 'station', [at(3, 2)]);
  b = build(b, 'house', [at(2, 2), at(3, 1)]);
  b = build(b, 'park', [at(4, 2)]);
  const parts = scoreBreakdown(b);
  // two single houses reach each other (1 + 1), each reaches a small park (2 + 2)
  // with one mountain side (1 + 1)
  assert.deepEqual(parts, { total: 8, housing: 2, park: 4, mountain: 2 });
  assert.equal(score(b), parts.total);
});

test('a tile is worth what the score loses without it', () => {
  let b = board([], [at(5, 2)]);
  b = build(b, 'station', [at(3, 2)]);
  b = build(b, 'house', [at(2, 2), at(3, 1)]);
  b = build(b, 'park', [at(4, 2)]);
  // without the station nobody reaches anything
  assert.equal(contribution(b, at(3, 2)), 8);
  // without the park: its 2 and its mountain side, for both houses
  assert.equal(contribution(b, at(4, 2)), 6);
  // without the mountain: its side, for both houses
  assert.equal(contribution(b, at(5, 2)), 2);
  // bare land is worth nothing
  assert.equal(contribution(b, at(9, 6)), 0);
});
