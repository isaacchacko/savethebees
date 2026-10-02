// node --test src/lib/map/*.test.ts

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { canPairTunnel, isHouse, layRoute, place, placeTunnel, route } from './board.ts';
import { hexDistance, neighbors, type Grid } from './hex.ts';
import { networks, score } from './score.ts';
import { LAND, WATER } from './terrain.ts';
import { tutorialIsland } from './tutorial.ts';

const GRIDS: Grid[] = [
  { cols: 25, rows: 20 },
  { cols: 34, rows: 25 },
  { cols: 18, rows: 14 },
];

test('the island is the same map every time', () => {
  for (const grid of GRIDS) assert.deepEqual(tutorialIsland(grid).board.tiles, tutorialIsland(grid).board.tiles);
});

test('each home is a house of two, the main two too far apart to share a station', () => {
  for (const grid of GRIDS) {
    const { board, homes } = tutorialIsland(grid);
    for (const h of Object.values(homes)) assert.equal(board.build[h], 2);
    assert.ok(hexDistance(board, homes.a, homes.b) > 2);
    assert.equal(board.build.filter(isHouse).length, 3);
  }
});

test('the islet is only reachable by a tunnel between the two shores', () => {
  for (const grid of GRIDS) {
    const { board, homes, shores } = tutorialIsland(grid);
    assert.ok(shores.every((s) => board.tiles[s] === LAND && neighbors(board, s).some((n) => board.tiles[n] === WATER)));
    assert.ok(canPairTunnel(board, shores[0], shores[1]));

    // stations by all three homes, rail between them, the islet through the tunnel
    const by = (home: number) => neighbors(board, home).find((n) => place(board, 'station', n) !== null)!;
    let b = board;
    const [sa, sb] = [by(homes.a), by(homes.b)];
    b = place(place(b, 'station', sa)!, 'station', sb)!;
    b = layRoute(b, route(b, sa, sb)!);
    assert.equal(score(b), 8);
    const sc = neighbors(b, homes.c).find((n) => n !== shores[1] && place(b, 'station', n) !== null)!;
    b = place(b, 'station', sc)!;
    assert.equal(route(b, sb, sc), null);
    b = placeTunnel(b, shores[0], shores[1])!;
    b = layRoute(b, route(b, sb, sc)!);
    const net = networks(b);
    assert.equal(net[sa], net[sc]);
    assert.equal(score(b), 24);
  }
});
