// node --test src/lib/map/*.test.ts

import assert from 'node:assert/strict';
import { test } from 'node:test';
import {
  EMPTY,
  PARK,
  STATION,
  TUNNEL,
  canPairTunnel,
  canPlace,
  emptyBoard,
  erase,
  layRoute,
  link,
  paintTerrain,
  place,
  placeTunnel,
  route,
  type Board,
} from './board.ts';
import { neighborAt, tileCount, type Grid } from './hex.ts';
import { LAND, MOUNTAIN, WATER } from './terrain.ts';

const GRID: Grid = { cols: 12, rows: 8 };
const at = (col: number, row: number) => row * GRID.cols + col;

/** All land, with whatever water and mountain tiles are listed. */
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

const exits = (m: number) => m.toString(2).split('').filter((c) => c === '1').length;

test('a house goes on land and grows to three, then stops', () => {
  let b = board();
  const i = at(3, 3);
  for (const size of [1, 2, 3]) {
    b = must(place(b, 'house', i));
    assert.equal(b.build[i], size);
  }
  assert.equal(place(b, 'house', i), null);
});

test('nothing builds on water or mountains', () => {
  const b = board([at(2, 2)], [at(4, 4)]);
  for (const tool of ['house', 'park', 'station'] as const) {
    assert.equal(canPlace(b, tool, at(2, 2)), false);
    assert.equal(canPlace(b, tool, at(4, 4)), false);
  }
});

test('parks and stations need an empty tile', () => {
  let b = must(place(board(), 'park', at(1, 1)));
  assert.equal(b.build[at(1, 1)], PARK);
  assert.equal(canPlace(b, 'station', at(1, 1)), false);
  b = must(place(b, 'station', at(5, 1)));
  assert.equal(b.build[at(5, 1)], STATION);
  assert.equal(canPlace(b, 'park', at(5, 1)), false);
});

test('tunnel ends must touch water, and go down as a pair', () => {
  const water = [at(5, 3), at(5, 4), at(6, 3), at(6, 4)];
  const b = board(water);
  assert.equal(canPlace(b, 'tunnel', at(1, 1)), false);
  const next = must(placeTunnel(b, at(4, 3), at(7, 3)));
  assert.equal(next.build[at(4, 3)], TUNNEL);
  assert.equal(next.partner[at(4, 3)], at(7, 3));
  assert.equal(next.partner[at(7, 3)], at(4, 3));
  // erasing one end takes the other
  const gone = must(erase(next, at(7, 3)));
  assert.equal(gone.build[at(4, 3)], EMPTY);
});

test('a route joins two stations, prefers a straight line, and lays as rail', () => {
  let b = board();
  b = must(place(b, 'station', at(1, 3)));
  b = must(place(b, 'station', at(8, 3)));
  const path = must(route(b, at(1, 3), at(8, 3)));
  assert.deepEqual(path, [1, 2, 3, 4, 5, 6, 7, 8].map((c) => at(c, 3)));
  b = layRoute(b, path);
  for (const tile of path.slice(1, -1)) assert.equal(exits(b.rail[tile]), 2);
});

test('a route can stop short of a station, at any tile with room for a rail end', () => {
  let b = must(place(board(), 'station', at(1, 3)));
  const path = must(route(b, at(1, 3), at(6, 3)));
  assert.equal(path.at(-1), at(6, 3));
  b = layRoute(b, path);
  assert.equal(exits(b.rail[at(6, 3)]), 1);
  // but not into water
  assert.equal(route(must(place(board([at(6, 5)]), 'station', at(1, 5))), at(1, 5), at(6, 5)), null);
});

test('a route goes around water and mountains, and through a tunnel when that is the only way', () => {
  // a wall of water down column 5, broken by nothing
  const wall = Array.from({ length: GRID.rows }, (_, r) => at(5, r));
  let b = board(wall);
  b = must(place(b, 'station', at(2, 3)));
  b = must(place(b, 'station', at(8, 3)));
  assert.equal(route(b, at(2, 3), at(8, 3)), null);
  b = must(placeTunnel(b, at(4, 3), at(6, 3)));
  const path = must(route(b, at(2, 3), at(8, 3)));
  assert.ok(path.includes(at(4, 3)) && path.includes(at(6, 3)));
  assert.ok(!path.some((t) => wall.includes(t)));
});

test('rail never crosses other rail except at a station', () => {
  let b = board();
  // a north-south line through (5, 3)
  b = must(link(b, at(5, 2), at(5, 3)));
  b = must(link(b, at(5, 3), at(5, 4)));
  // a third exit on that plain tile is refused
  assert.equal(link(b, at(5, 3), at(6, 3)), null);
  // so a route east-west has to go round it
  b = must(place(b, 'station', at(1, 3)));
  b = must(place(b, 'station', at(9, 3)));
  const path = must(route(b, at(1, 3), at(9, 3)));
  assert.ok(!path.includes(at(5, 3)));
});

test('painting water clears what was there, and the rail running into it', () => {
  let b = board();
  b = must(link(b, at(3, 3), at(4, 3)));
  b = must(place(b, 'house', at(6, 6)));
  b = paintTerrain(b, at(4, 3), WATER);
  assert.equal(b.rail[at(4, 3)], 0);
  assert.equal(b.rail[at(3, 3)], 0);
  b = paintTerrain(b, at(6, 6), MOUNTAIN);
  assert.equal(b.build[at(6, 6)], EMPTY);
});

test('a tunnel only joins ends with a straight line of water between them', () => {
  // an L of water: straight across its top, but a turn to reach round the corner
  const water = [at(4, 2), at(5, 2), at(6, 2), at(6, 3), at(6, 4)];
  const b = board(water);
  assert.equal(canPairTunnel(b, at(3, 2), at(7, 2)), true);
  assert.equal(canPairTunnel(b, at(3, 2), at(6, 5)), false);
  // land in the way breaks the line too
  assert.equal(canPairTunnel(board([at(4, 2), at(6, 2)]), at(3, 2), at(7, 2)), false);
});

test('a tunnel cannot cross another tunnel', () => {
  // a lake, with one tunnel straight across its middle row
  const lake: number[] = [];
  for (let r = 1; r <= 5; r++) for (let c = 3; c <= 8; c++) lake.push(at(c, r));
  let b = board(lake);
  b = must(placeTunnel(b, at(2, 3), at(9, 3)));
  // a second line through the same water tile, going the other way
  const walk = (from: number, d: number) => {
    let t = from;
    while (b.tiles[neighborAt(b, t, d)] !== LAND) t = neighborAt(b, t, d);
    return neighborAt(b, t, d);
  };
  const top = walk(at(5, 3), 4);
  const bottom = walk(at(5, 3), 1);
  assert.equal(canPairTunnel(b, top, bottom), false);
  // but one that runs alongside, not through, is fine
  assert.equal(canPairTunnel(b, at(2, 1), at(9, 1)), true);
});

test('a tunnel loses both ends when its shore is filled in', () => {
  let b = board([at(5, 3)]);
  b = must(placeTunnel(b, at(4, 3), at(6, 3)));
  b = paintTerrain(b, at(5, 3), LAND);
  assert.equal(b.build[at(4, 3)], EMPTY);
  assert.equal(b.build[at(6, 3)], EMPTY);
});
