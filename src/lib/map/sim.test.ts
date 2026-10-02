// node --test src/lib/map/*.test.ts

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { STATION, TUNNEL, emptyBoard, isHouse, place, type Board } from './board.ts';
import { neighbors, tileCount, type Grid } from './hex.ts';
import { rng } from './noise.ts';
import { networks, score } from './score.ts';
import { growTown, planStep, spawnHousing } from './sim.ts';
import { LAND, WATER } from './terrain.ts';

const GRID: Grid = { cols: 16, rows: 10 };
const at = (col: number, row: number) => row * GRID.cols + col;

function board(water: number[] = []): Board {
  const tiles = new Uint8Array(tileCount(GRID)).fill(LAND);
  for (const i of water) tiles[i] = WATER;
  return emptyBoard({ ...GRID, seed: 1, tiles });
}

const must = <T>(x: T | null): T => {
  assert.ok(x !== null);
  return x;
};

const count = (b: Board, f: (v: number) => boolean) => b.build.reduce((n, v) => n + (f(v) ? 1 : 0), 0);

test('housing turns up on open land, away from the edge', () => {
  const step = must(spawnHousing(board(), rng(1)));
  assert.equal(count(step.board, isHouse), 1);
  const home = step.board.build.findIndex(isHouse);
  assert.equal(neighbors(step.board, home).length, 6);
});

test('the planner gives a lonely house a station beside it', () => {
  const b = must(place(board(), 'house', at(5, 5)));
  const step = must(planStep(b, rng(1)));
  assert.ok(neighbors(step.board, at(5, 5)).some((n) => step.board.build[n] === STATION));
});

test('the planner joins stations that are on separate networks', () => {
  let b = must(place(board(), 'station', at(2, 4)));
  b = must(place(b, 'station', at(10, 4)));
  const step = must(planStep(b, rng(1)));
  const net = networks(step.board);
  assert.equal(net[at(2, 4)], net[at(10, 4)]);
});

test('across water the planner tunnels, or failing that reshapes the land', () => {
  const river = Array.from({ length: GRID.rows }, (_, r) => at(7, r));
  let b = must(place(board(river), 'station', at(4, 4)));
  b = must(place(b, 'station', at(10, 4)));
  const before = networks(b);
  assert.notEqual(before[at(4, 4)], before[at(10, 4)]);
  // a few steps: a tunnel (or land) first, then the rail through it
  for (let k = 0; k < 6; k++) {
    const step = planStep(b, rng(k));
    if (!step) break;
    b = step.board;
  }
  const net = networks(b);
  assert.equal(net[at(4, 4)], net[at(10, 4)]);
  const tunnelled = b.build.some((v) => v === TUNNEL);
  const filled = river.some((t) => b.tiles[t] === LAND);
  assert.ok(tunnelled || filled);
});

test('a grown town has people, every home served, and one network that scores', () => {
  const b = growTown(board(), rng(7), 10);
  const homes = [...b.build.keys()].filter((i) => isHouse(b.build[i]));
  // every round adds one person, as a new cottage or a building grown a stage
  const people = homes.reduce((n, h) => n + b.build[h], 0);
  assert.equal(people, 10);
  for (const h of homes) assert.ok(neighbors(b, h).some((n) => b.build[n] === STATION), `home ${h} unserved`);
  const net = networks(b);
  const nets = new Set([...b.build.keys()].filter((i) => b.build[i] === STATION).map((i) => net[i]));
  assert.equal(nets.size, 1);
  assert.ok(score(b) > 0);
});

test('on real generated maps, a town still ends up served and in one network', async () => {
  const { generateTerrain } = await import('./terrain.ts');
  for (const seed of [3, 11, 29, 47, 83, 131]) {
    let b = emptyBoard(generateTerrain({ cols: 34, rows: 22 }, seed));
    b = growTown(b, rng(seed), 14);
    // the planner may need a few more steps to finish joining things up
    for (let k = 0; k < 40; k++) {
      const step = planStep(b, rng(seed + k));
      if (!step) break;
      b = step.board;
    }
    const homes = [...b.build.keys()].filter((i) => isHouse(b.build[i]));
    const unserved = homes.filter((h) => !neighbors(b, h).some((n) => b.build[n] === STATION));
    assert.equal(unserved.length, 0, `seed ${seed}: ${unserved.length} unserved`);
    const net = networks(b);
    const nets = new Set([...b.build.keys()].filter((i) => b.build[i] === STATION).map((i) => net[i]));
    assert.equal(nets.size, 1, `seed ${seed}: ${nets.size} networks`);
  }
});

test('a catastrophe only remakes open ground, rail, water and mountains', async () => {
  const { catastrophe } = await import('./sim.ts');
  const { placeTunnel } = await import('./board.ts');
  const river = Array.from({ length: GRID.rows }, (_, r) => at(8, r));
  let b = growTown(board(river), rng(3), 10);
  b = placeTunnel(b, at(7, 2), at(9, 2)) ?? b;
  const kept = (x: Board) => [...x.build.keys()].filter((i) => x.build[i] !== 0).map((i) => `${i}:${x.build[i]}`).join();
  for (let seed = 0; seed < 20; seed++) {
    const { board: after, kind } = catastrophe(b, rng(seed));
    assert.ok(kind === 'flood' || kind === 'landslide');
    // every home, station, park and tunnel still standing
    assert.equal(kept(after), kept(b));
    // and the tunnel's water untouched
    assert.equal(after.tiles[at(8, 2)], WATER);
  }
});
