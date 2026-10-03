// node --test src/lib/map/*.test.ts

import assert from 'node:assert/strict';
import { test } from 'node:test';
import { STATION, TUNNEL, canPairTunnel, isHouse, layRoute, place, placeTunnel, route } from './board.ts';
import { affordable } from './game.ts';
import { hexDistance, neighbors, type Grid } from './hex.ts';
import { networks, score } from './score.ts';
import { LAND, WATER } from './terrain.ts';
import { tsunami, tutorialIsland, type Orientation } from './tutorial.ts';

const GRIDS: [Grid, Orientation][] = [
  [{ cols: 25, rows: 20 }, 'wide'],
  [{ cols: 34, rows: 25 }, 'wide'],
  [{ cols: 18, rows: 14 }, 'wide'],
  [{ cols: 13, rows: 25 }, 'tall'],
  [{ cols: 12, rows: 20 }, 'tall'],
];

test('the island is the same map every time', () => {
  for (const [grid, o] of GRIDS) assert.deepEqual(tutorialIsland(grid, o).board.tiles, tutorialIsland(grid, o).board.tiles);
});

test('each home is a house of two, the main two too far apart to share a station', () => {
  for (const [grid, o] of GRIDS) {
    const { board, homes } = tutorialIsland(grid, o);
    for (const h of Object.values(homes)) assert.equal(board.build[h], 2);
    assert.ok(hexDistance(board, homes.a, homes.b) > 2);
    assert.equal(board.build.filter(isHouse).length, 3);
  }
});

test('the islet is only reachable by a tunnel between the two shores', () => {
  for (const [grid, o] of GRIDS) {
    const { board, homes, shores } = tutorialIsland(grid, o);
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
    assert.ok(affordable(b, 1, true), 'the whole tutorial fits in its allowance');

    // the tsunami always washes out rail, but never a building or the ground
    // beside a station or tunnel mouth
    const hit = tsunami(b, tutorialIsland(grid, o));
    assert.ok(hit.tiles.some((t) => b.rail[t]));
    assert.ok(hit.tiles.every((t) => hit.board.rail[t] === 0));
    const flooded = hit.tiles.filter((t) => hit.board.tiles[t] === WATER);
    assert.ok(flooded.length > 0);
    assert.deepEqual(hit.board.build, b.build);
    assert.ok(score(hit.board) < score(b));
    // and it is rebuilt the way it was built: station to station
    let fixed = hit.board;
    for (const [s, t] of [[sa, sb], [sb, sc]]) {
      const net = networks(fixed);
      if (net[s] === net[t]) continue;
      // as the player's drag routes: free to finish at a tunnel whose far side is still joined
      const path = route(fixed, s, t, false, true);
      assert.ok(path, 'a station-to-station drag rebuilds it');
      fixed = layRoute(fixed, path);
    }
    assert.equal(score(fixed), 24);
    for (let i = 0; i < b.build.length; i++) {
      if (b.build[i] !== STATION && b.build[i] !== TUNNEL) continue;
      assert.ok(neighbors(b, i).every((n) => !flooded.includes(n)));
    }
  }
});
