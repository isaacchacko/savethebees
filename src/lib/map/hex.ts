// The board: a rectangle of pointy-top hexes in "odd-r" offset layout, where
// every odd row is pushed half a tile right. Tiles are addressed by index,
// row * cols + col, so per-tile data lives in flat arrays.

export const SQRT3 = Math.sqrt(3);

export type Grid = { cols: number; rows: number };

export const tileCount = (g: Grid) => g.cols * g.rows;

export const colOf = (g: Grid, i: number) => i % g.cols;

export const rowOf = (g: Grid, i: number) => Math.floor(i / g.cols);

/** Tile center in units of the hex radius, with tile 0 at the origin. */
export function center(g: Grid, i: number): { x: number; y: number } {
  const col = colOf(g, i);
  const row = rowOf(g, i);
  return { x: SQRT3 * (col + 0.5 * (row & 1)), y: 1.5 * row };
}

// neighbour offsets differ between even and odd rows in odd-r layout. Both
// lists run clockwise from east: E, SE, SW, W, NW, NE — so direction d faces
// the hex edge between corners d and d + 1 (corner j sits at 60j − 30°).
const EVEN_ROW = [[1, 0], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1]];
const ODD_ROW = [[1, 0], [1, 1], [0, 1], [-1, 0], [0, -1], [1, -1]];

/** The tile touching tile i in direction d (0 = east, clockwise), or -1 off the board. */
export function neighborAt(g: Grid, i: number, d: number): number {
  const row = rowOf(g, i);
  const [dc, dr] = (row & 1 ? ODD_ROW : EVEN_ROW)[d];
  const c = colOf(g, i) + dc;
  const r = row + dr;
  return c >= 0 && c < g.cols && r >= 0 && r < g.rows ? r * g.cols + c : -1;
}

/** The up-to-6 tiles touching tile i. Edge tiles have fewer. */
export function neighbors(g: Grid, i: number): number[] {
  const out: number[] = [];
  for (let d = 0; d < 6; d++) {
    const n = neighborAt(g, i, d);
    if (n >= 0) out.push(n);
  }
  return out;
}

/** Cube coordinates of tile i, where a straight line is easy to draw. */
function cube(g: Grid, i: number): [number, number, number] {
  const row = rowOf(g, i);
  const q = colOf(g, i) - (row - (row & 1)) / 2;
  return [q, row, -q - row];
}

/** Hex steps between two tiles, ignoring what's in the way. */
export function hexDistance(g: Grid, a: number, b: number): number {
  const A = cube(g, a);
  const B = cube(g, b);
  return Math.max(Math.abs(A[0] - B[0]), Math.abs(A[1] - B[1]), Math.abs(A[2] - B[2]));
}

/**
 * The tiles a straight line from a to b passes through, both ends included,
 * each one a neighbour of the last — the "as the crow flies" path, whatever
 * is in the way.
 */
export function hexLine(g: Grid, a: number, b: number): number[] {
  const A = cube(g, a);
  const B = cube(g, b);
  const n = Math.max(Math.abs(A[0] - B[0]), Math.abs(A[1] - B[1]), Math.abs(A[2] - B[2]));
  const out: number[] = [];
  for (let k = 0; k <= n; k++) {
    // nudged off the exact midpoint so ties round the same way every time
    const t = n === 0 ? 0 : k / n;
    const f = A.map((v, j) => v + (B[j] - v) * t + 1e-6 * (j + 1));
    let [q, r, s] = f.map(Math.round);
    const [dq, dr, ds] = [Math.abs(q - f[0]), Math.abs(r - f[1]), Math.abs(s - f[2])];
    if (dq > dr && dq > ds) q = -r - s;
    else if (dr > ds) r = -q - s;
    else s = -q - r;
    const col = q + (r - (r & 1)) / 2;
    const i = r * g.cols + col;
    if (out[out.length - 1] !== i) out.push(i);
  }
  return out;
}

/** Hex steps from every tile to the nearest tile where `isSource` holds. */
export function distanceFrom(g: Grid, isSource: (i: number) => boolean): Int32Array {
  const dist = new Int32Array(tileCount(g)).fill(-1);
  const queue: number[] = [];
  for (let i = 0; i < dist.length; i++) {
    if (isSource(i)) {
      dist[i] = 0;
      queue.push(i);
    }
  }
  for (let head = 0; head < queue.length; head++) {
    const i = queue[head];
    for (const n of neighbors(g, i)) {
      if (dist[n] < 0) {
        dist[n] = dist[i] + 1;
        queue.push(n);
      }
    }
  }
  return dist;
}

/** Connected groups of tiles where `inside` holds, largest first. */
export function components(g: Grid, inside: (i: number) => boolean): number[][] {
  const seen = new Uint8Array(tileCount(g));
  const groups: number[][] = [];
  for (let start = 0; start < seen.length; start++) {
    if (seen[start] || !inside(start)) continue;
    const group = [start];
    seen[start] = 1;
    for (let head = 0; head < group.length; head++) {
      for (const n of neighbors(g, group[head])) {
        if (!seen[n] && inside(n)) {
          seen[n] = 1;
          group.push(n);
        }
      }
    }
    groups.push(group);
  }
  return groups.sort((a, b) => b.length - a.length);
}
