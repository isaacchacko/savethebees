// node --test src/lib/map/*.test.ts

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { center, components, distanceFrom, neighborAt, neighbors, tileCount, type Grid } from './hex.ts';
import {
  LAND,
  MIN_LAND_SHARE,
  MOUNTAIN,
  WATER,
  generateTerrain,
  largestLandShare,
} from './terrain.ts';

// about what a laptop window fits at the site's tile size
const GRID: Grid = { cols: 34, rows: 22 };
const SEEDS = Array.from({ length: 40 }, (_, i) => i * 7919 + 1);

const count = (tiles: Uint8Array, kind: number) =>
  tiles.reduce((sum, t) => sum + (t === kind ? 1 : 0), 0);

test('neighbors are symmetric and at most six', () => {
  for (let i = 0; i < tileCount(GRID); i++) {
    const ns = neighbors(GRID, i);
    assert.ok(ns.length <= 6);
    for (const n of ns) assert.ok(neighbors(GRID, n).includes(i), `${i} <-> ${n}`);
  }
});

test('direction d points at 60·d degrees, clockwise from east', () => {
  for (const i of [5 * GRID.cols + 5, 6 * GRID.cols + 5]) {
    const from = center(GRID, i);
    for (let d = 0; d < 6; d++) {
      const to = center(GRID, neighborAt(GRID, i, d));
      const angle = (Math.atan2(to.y - from.y, to.x - from.x) * 180) / Math.PI;
      assert.ok(Math.abs(((angle - 60 * d + 540) % 360) - 180) < 1e-6, `row ${i} dir ${d}: ${angle}`);
    }
  }
});

test('the same seed gives the same map', () => {
  const a = generateTerrain(GRID, 42);
  const b = generateTerrain(GRID, 42);
  assert.equal(a.seed, b.seed);
  assert.deepEqual(a.tiles, b.tiles);
});

test('the returned seed reproduces the map', () => {
  for (const seed of SEEDS) {
    const map = generateTerrain(GRID, seed);
    assert.deepEqual(generateTerrain(GRID, map.seed).tiles, map.tiles);
  }
});

test('different seeds give different maps', () => {
  const maps = new Set(SEEDS.map((s) => generateTerrain(GRID, s).tiles.join('')));
  assert.ok(maps.size > SEEDS.length * 0.9);
});

test('every map has water, mountains and enough land in one piece', () => {
  for (const seed of SEEDS) {
    const { tiles } = generateTerrain(GRID, seed);
    assert.ok(count(tiles, WATER) > 0, `seed ${seed} has no water`);
    assert.ok(count(tiles, MOUNTAIN) > 0, `seed ${seed} has no mountains`);
    assert.ok(largestLandShare(GRID, tiles) >= MIN_LAND_SHARE, `seed ${seed} is too broken up`);
  }
});

test('water is mostly one coastline, not scattered ponds', () => {
  for (const seed of SEEDS) {
    const { tiles } = generateTerrain(GRID, seed);
    const bodies = components(GRID, (i) => tiles[i] === WATER);
    assert.ok(bodies[0].length >= count(tiles, WATER) * 0.6, `seed ${seed} water is scattered`);
  }
});

test('some maps have a lake: a small body of water away from the coast', () => {
  const withLake = SEEDS.filter((seed) => {
    const { tiles } = generateTerrain(GRID, seed);
    const bodies = components(GRID, (i) => tiles[i] === WATER);
    return bodies.slice(1).some((b) => b.length >= 3 && b.length <= 12);
  });
  assert.ok(withLake.length >= SEEDS.length / 4, `only ${withLake.length} maps have a lake`);
});

test('mountains come in ranges of three or more, back from the shore', () => {
  for (const seed of SEEDS) {
    const { tiles } = generateTerrain(GRID, seed);
    for (const range of components(GRID, (i) => tiles[i] === MOUNTAIN)) {
      assert.ok(range.length >= 3, `seed ${seed} has a mountain speck`);
    }
    const toWater = distanceFrom(GRID, (i) => tiles[i] === WATER);
    for (let i = 0; i < tiles.length; i++) {
      if (tiles[i] === MOUNTAIN) assert.ok(toWater[i] >= 2, `seed ${seed} mountain on the shore`);
    }
  }
});

test('every tile is one of the three terrains', () => {
  const { tiles } = generateTerrain(GRID, 7);
  for (const t of tiles) assert.ok(t === LAND || t === WATER || t === MOUNTAIN);
});
