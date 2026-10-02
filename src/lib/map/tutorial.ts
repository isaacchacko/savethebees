// The tutorial's map: the same small island every time, so each step can
// point at the tiles it is about. A long main island with a mountain ridge
// and two homes far apart, and an islet across a strait with a third home
// that only a tunnel can reach.

import { emptyBoard, place, type Board } from './board.ts';
import { colOf, rowOf, tileCount, type Grid } from './hex.ts';
import { LAND, MOUNTAIN, WATER } from './terrain.ts';

export const ISLAND_SEED = 7;

/** Steps between two tiles given as cube q, r. */
const dist = (q: number, r: number, q2: number, r2: number) =>
  Math.max(Math.abs(q - q2), Math.abs(r - r2), Math.abs(q + r - q2 - r2));

// relative to the island's anchor, in cube q (east) and r (row)
const MAIN = [
  [0, 0],
  [2, 0],
];
const ISLET = [9, 0];
const RIDGE = [
  [1, -3],
  [2, -3],
  [3, -3],
];
const HOME_A = [-2, 1];
const HOME_B = [4, -1];
const HOME_C = [9, 0];
/** The two shores facing each other straight across the strait. */
const SHORES = [
  [5, 0],
  [8, 0],
];
// the island spans q -3 to 10, so the anchor sits this far left of the middle
const SPAN_MIDDLE = 3.5;

export type Island = {
  board: Board;
  /** The three homes: two on the main island, one on the islet. */
  homes: { a: number; b: number; c: number };
  /** A shore on each side of the strait, a tunnel's straight line apart. */
  shores: [number, number];
};

export function tutorialIsland(grid: Grid): Island {
  const midRow = Math.floor(grid.rows / 2);
  const midQ = Math.floor(grid.cols / 2) - (midRow - (midRow & 1)) / 2;
  const anchorQ = Math.round(midQ - SPAN_MIDDLE);
  const tileAt = ([dq, dr]: number[]) => {
    const r = midRow + dr;
    const col = anchorQ + dq + (r - (r & 1)) / 2;
    return r * grid.cols + col;
  };

  const tiles = new Uint8Array(tileCount(grid)).fill(WATER);
  for (let i = 0; i < tiles.length; i++) {
    const r = rowOf(grid, i);
    const q = colOf(grid, i) - (r - (r & 1)) / 2 - anchorQ;
    const dr = r - midRow;
    const onMain = MAIN.some(([mq, mr]) => dist(q, dr, mq, mr) <= 3);
    if (onMain || dist(q, dr, ISLET[0], ISLET[1]) <= 1) tiles[i] = LAND;
  }
  for (const t of RIDGE) tiles[tileAt(t)] = MOUNTAIN;

  const homes = { a: tileAt(HOME_A), b: tileAt(HOME_B), c: tileAt(HOME_C) };
  let board = emptyBoard({ ...grid, seed: ISLAND_SEED, tiles });
  for (const home of Object.values(homes)) {
    board = place(board, 'house', home)!;
    board = place(board, 'house', home)!;
  }
  return { board, homes, shores: [tileAt(SHORES[0]), tileAt(SHORES[1])] };
}
