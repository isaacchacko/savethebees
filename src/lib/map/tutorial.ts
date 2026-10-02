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
const RIDGE = [
  [1, -3],
  [2, -3],
  [3, -3],
];
const HOME_A = [-2, 1];
const HOME_B = [4, -1];

/**
 * Where the islet sits: east of the main island on a wide screen, south of it
 * on a tall one, so the whole map fits either way. Its home is its middle
 * tile; the shores face each other straight across the strait. The box is
 * the island's extent in tile widths (x = q + r/2) and rows, margin included.
 */
const LAYOUTS = {
  wide: { islet: [9, 0], shores: [[5, 0], [8, 0]], box: { x: [-4, 11], y: [-4, 4] } },
  tall: { islet: [0, 7], shores: [[0, 3], [0, 6]], box: { x: [-4, 6], y: [-4, 9] } },
};

export type Orientation = keyof typeof LAYOUTS;

/** The island's size in tiles, margin included, for picking a tile size that fits it. */
export function islandSpan(orientation: Orientation): { cols: number; rows: number } {
  const { x, y } = LAYOUTS[orientation].box;
  // and half a tile more each way, for where the island lands after rounding
  return { cols: x[1] - x[0] + 1, rows: y[1] - y[0] + 1 };
}

export type Island = {
  board: Board;
  /** The three homes: two on the main island, one on the islet. */
  homes: { a: number; b: number; c: number };
  /** A shore on each side of the strait, a tunnel's straight line apart. */
  shores: [number, number];
};

/**
 * The island on a grid, centred on the point `at` (fractions of the grid's
 * width and height), so it can sit in whatever part of the screen the UI
 * leaves free.
 */
export function tutorialIsland(grid: Grid, orientation: Orientation = 'wide', at = { x: 0.5, y: 0.5 }): Island {
  const { islet, shores, box } = LAYOUTS[orientation];
  const midRow = Math.round(grid.rows * at.y - (box.y[0] + box.y[1]) / 2);
  const midX = grid.cols * at.x - (box.x[0] + box.x[1]) / 2;
  // x = q + r/2 for the anchor's row; the map draws column centres a
  // quarter tile right of the grid's middle, hence the nudge before rounding
  const anchorQ = Math.round(midX - midRow / 2 - 0.25);
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
    if (onMain || dist(q, dr, islet[0], islet[1]) <= 1) tiles[i] = LAND;
  }
  for (const t of RIDGE) tiles[tileAt(t)] = MOUNTAIN;

  const homes = { a: tileAt(HOME_A), b: tileAt(HOME_B), c: tileAt(islet) };
  let board = emptyBoard({ ...grid, seed: ISLAND_SEED, tiles });
  for (const home of Object.values(homes)) {
    board = place(board, 'house', home)!;
    board = place(board, 'house', home)!;
  }
  return { board, homes, shores: [tileAt(shores[0]), tileAt(shores[1])] };
}
