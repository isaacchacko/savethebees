// Canvas drawing for every kind of tile, shared by the map, the toolbar's
// glyphs and the tile previews so all three always look the same. Sizes are
// in units of r, the hex radius, so anything draws at any scale.

import { MOUNTAIN, WATER } from './terrain.ts';

export const COLORS = {
  field: '#a3c585',
  land: '#b9d69e',
  shallow: '#8cb8ad',
  deep: '#7aa99e',
  foam: 'rgba(238,243,230,.6)',
  crest: 'rgba(238,243,230,.5)',
  rock: '#b5b8ad',
  rockLit: '#8f9387',
  rockShade: '#666a5f',
  snow: '#eef3e6',
  ghost: 'rgba(18,32,10,.16)',
  ink: '#12200a',
  paper: '#eef3e6',
  park: '#93c46f',
  tree: '#4f7a3a',
  treeLit: '#6a9a4c',
};

/** Share of the radius left as a gap between tiles, so the field shows through. */
export const GAP = 0.07;

/** Track width, as a share of the radius. */
const TRACK = 0.26;

/** Per-tile drawing facts that depend on the neighbours, worked out once per map. */
export type Look = { deep: boolean; shore: number };

export const PLAIN: Look = { deep: false, shore: 0 };

/** A stable per-tile coin flip, so decorations don't reshuffle every frame. */
export const hash = (i: number) => {
  const v = Math.sin(i * 12.9898 + 78.233) * 43758.5453;
  return v - Math.floor(v);
};

export function hexPath(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  for (let j = 0; j < 6; j++) {
    const a = ((60 * j - 30) * Math.PI) / 180;
    ctx[j ? 'lineTo' : 'moveTo'](x + r * Math.cos(a), y + r * Math.sin(a));
  }
  ctx.closePath();
}

export function drawTile(
  ctx: CanvasRenderingContext2D,
  kind: number,
  i: number,
  x: number,
  y: number,
  r: number,
  look: Look
) {
  if (kind === WATER) {
    // no gap, so neighbouring water tiles merge into one body
    hexPath(ctx, x, y, r * 1.02);
    ctx.fillStyle = look.deep ? COLORS.deep : COLORS.shallow;
    ctx.fill();
    if (look.shore) drawShore(ctx, x, y, r, look.shore);
    if (look.deep && hash(i) < 0.22) drawWaves(ctx, x, y, r, hash(i * 7 + 3));
    return;
  }

  hexPath(ctx, x, y, r * (1 - GAP));
  ctx.fillStyle = kind === MOUNTAIN ? COLORS.rock : COLORS.land;
  ctx.fill();
  if (kind === MOUNTAIN) drawPeaks(ctx, x, y, r, hash(i));
}

/** A pale line just inside each edge where water meets land. */
function drawShore(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, mask: number) {
  const inset = r * 0.86;
  const corner = (j: number) => {
    const a = ((60 * j - 30) * Math.PI) / 180;
    return [x + inset * Math.cos(a), y + inset * Math.sin(a)];
  };
  ctx.beginPath();
  for (let d = 0; d < 6; d++) {
    if (!(mask & (1 << d))) continue;
    const [ax, ay] = corner(d);
    const [bx, by] = corner(d + 1);
    ctx.moveTo(ax, ay);
    ctx.lineTo(bx, by);
  }
  ctx.strokeStyle = COLORS.foam;
  ctx.lineWidth = Math.max(1, r * 0.1);
  ctx.lineCap = 'round';
  ctx.stroke();
}

/** One or two small rolling crests, nudged per tile so open water doesn't tile. */
function drawWaves(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, jitter: number) {
  const crest = (cx: number, cy: number, w: number) => {
    ctx.moveTo(cx - w, cy);
    ctx.quadraticCurveTo(cx - w / 2, cy - w * 0.55, cx, cy);
    ctx.quadraticCurveTo(cx + w / 2, cy - w * 0.55, cx + w, cy);
  };
  const dx = (jitter - 0.5) * r * 0.3;
  ctx.beginPath();
  crest(x - r * 0.12 + dx, y - r * 0.08, r * 0.24);
  if (jitter > 0.4) crest(x + r * 0.22 + dx, y + r * 0.28, r * 0.17);
  ctx.strokeStyle = COLORS.crest;
  ctx.lineWidth = Math.max(1, r * 0.075);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  ctx.stroke();
}

/**
 * A main peak, lit from the left with a snowcap, and on some tiles a smaller
 * one behind it — mirrored on half of those so a range doesn't look stamped.
 */
function drawPeaks(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, variant: number) {
  const base = y + r * 0.36;
  if (variant < 0.66) {
    const side = variant < 0.33 ? 1 : -1;
    peak(ctx, x + side * r * 0.26, base, r * 0.3, r * 0.52);
  }
  peak(ctx, x - r * 0.06, base, r * 0.44, r * 0.8);
}

function peak(ctx: CanvasRenderingContext2D, cx: number, base: number, half: number, height: number) {
  const apex: Point = [cx, base - height];
  const left: Point = [cx - half, base];
  const right: Point = [cx + half, base];
  const foot: Point = [cx + half * 0.18, base];

  fill(ctx, [left, apex, foot], COLORS.rockLit);
  fill(ctx, [apex, right, foot], COLORS.rockShade);

  const t = 0.34;
  const capLeft = lerp(apex, left, t);
  const capRight = lerp(apex, right, t);
  const notchDown = lerp(capLeft, capRight, 0.38);
  const notchUp = lerp(capLeft, capRight, 0.7);
  fill(
    ctx,
    [apex, capLeft, [notchDown[0], notchDown[1] + height * 0.07], [notchUp[0], notchUp[1] - height * 0.03], capRight],
    COLORS.snow
  );
}

type Point = [number, number];

const lerp = (a: Point, b: Point, t: number): Point => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

function fill(ctx: CanvasRenderingContext2D, points: Point[], color: string) {
  ctx.beginPath();
  points.forEach(([px, py], j) => (j ? ctx.lineTo(px, py) : ctx.moveTo(px, py)));
  ctx.closePath();
  ctx.fillStyle = color;
  ctx.fill();
}

// ---------- things you build ----------

/** A park tile: brighter grass with a couple of trees. */
export function drawPark(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, variant: number) {
  hexPath(ctx, x, y, r * (1 - GAP));
  ctx.fillStyle = COLORS.park;
  ctx.fill();
  const trees: Point[] =
    variant < 0.5
      ? [[-0.24, 0.02], [0.2, -0.16], [0.12, 0.26]]
      : [[-0.2, -0.14], [0.24, 0.04], [-0.1, 0.28]];
  for (const [dx, dy] of trees) tree(ctx, x + dx * r, y + dy * r, r * 0.2);
}

function tree(ctx: CanvasRenderingContext2D, x: number, y: number, size: number) {
  ctx.beginPath();
  ctx.arc(x, y, size, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.tree;
  ctx.fill();
  ctx.beginPath();
  ctx.arc(x - size * 0.3, y - size * 0.3, size * 0.45, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.treeLit;
  ctx.fill();
}

/**
 * Houses by population: one house; two with one in front of the other; or
 * three where the back one is overlapped by both of the others.
 */
export function drawHouses(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, size: 1 | 2 | 3) {
  const spots: [number, number, number][] =
    size === 1
      ? [[0, 0.04, 0.46]]
      : size === 2
        ? [[-0.16, -0.08, 0.38], [0.16, 0.12, 0.38]]
        : [[0, -0.14, 0.34], [-0.22, 0.14, 0.34], [0.22, 0.14, 0.34]];
  for (const [dx, dy, s] of spots) house(ctx, x + dx * r, y + dy * r, s * r);
}

function house(ctx: CanvasRenderingContext2D, x: number, y: number, w: number) {
  const half = w / 2;
  const wall = w * 0.42;
  const roof = w * 0.42;
  ctx.beginPath();
  ctx.moveTo(x - half, y + wall);
  ctx.lineTo(x - half, y);
  ctx.lineTo(x, y - roof);
  ctx.lineTo(x + half, y);
  ctx.lineTo(x + half, y + wall);
  ctx.closePath();
  ctx.fillStyle = COLORS.paper;
  ctx.fill();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = Math.max(1, w * 0.12);
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(x - w * 0.09, y + wall - w * 0.26, w * 0.18, w * 0.26);
}

/** A station: the transit-map circle, pale with an ink ring. */
export function drawStation(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.beginPath();
  ctx.arc(x, y, r * 0.4, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.paper;
  ctx.fill();
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = Math.max(1.5, r * 0.13);
  ctx.stroke();
}

/** A tunnel mouth: a dark arch set in a stone face. */
export function drawTunnel(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const base = y + r * 0.34;
  const outer = r * 0.42;
  const inner = r * 0.26;
  ctx.beginPath();
  ctx.moveTo(x - outer, base);
  ctx.lineTo(x - outer, base - outer * 0.5);
  ctx.arc(x, base - outer * 0.5, outer, Math.PI, 0);
  ctx.lineTo(x + outer, base);
  ctx.closePath();
  ctx.fillStyle = COLORS.rockLit;
  ctx.fill();
  ctx.beginPath();
  ctx.moveTo(x - inner, base);
  ctx.lineTo(x - inner, base - inner * 0.6);
  ctx.arc(x, base - inner * 0.6, inner, Math.PI, 0);
  ctx.lineTo(x + inner, base);
  ctx.closePath();
  ctx.fillStyle = COLORS.ink;
  ctx.fill();
}

/**
 * Track from the tile's center out through each edge in `mask` (bit d is
 * direction d, 0 = east, clockwise). A lone tile with no exits gets a stub
 * pair so a glyph still reads as track.
 */
export function drawTrack(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, mask: number) {
  const reach = (r * Math.sqrt(3)) / 2 + 0.5;
  ctx.beginPath();
  for (let d = 0; d < 6; d++) {
    if (!(mask & (1 << d))) continue;
    const a = (60 * d * Math.PI) / 180;
    ctx.moveTo(x, y);
    ctx.lineTo(x + reach * Math.cos(a), y + reach * Math.sin(a));
  }
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = r * TRACK;
  ctx.lineCap = 'butt';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, (r * TRACK) / 2, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.ink;
  ctx.fill();
}
