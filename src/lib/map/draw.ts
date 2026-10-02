// Canvas drawing for every kind of tile, shared by the map, the toolbar's
// glyphs and the tile previews so all three always look the same. Sizes are
// in units of r, the hex radius, so anything draws at any scale.

import { SQRT3, center, type Grid } from './hex.ts';
import { MOUNTAIN, WATER } from './terrain.ts';

/**
 * Where a board sits in a w × h box: hex radius s and the offset of tile 0's
 * centre. It covers the box, the outer ring of tiles hanging off the edges.
 */
export function fitBoard(g: Grid, w: number, h: number) {
  const s = Math.max(w / (SQRT3 * (g.cols - 1.5)), h / (1.5 * (g.rows - 2)));
  return { s, ox: (w - SQRT3 * (g.cols - 0.5) * s) / 2, oy: (h - 1.5 * (g.rows - 1) * s) / 2 };
}

/** A tile's centre in px within the box fitBoard laid it out in. */
export function tileAt(g: Grid, fit: ReturnType<typeof fitBoard>, i: number) {
  const c = center(g, i);
  return { x: fit.ox + c.x * fit.s, y: fit.oy + c.y * fit.s };
}

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
  yard: '#cde0b4',
  roof: '#b9654c',
  shadow: 'rgba(18,32,10,.18)',
  tree: '#4f7a3a',
  treeLit: '#6a9a4c',
};

/** Share of the radius left as a gap between tiles, so the field shows through. */
export const GAP = 0.07;

/** Rail width, as a share of the radius. */
const RAIL = 0.26;

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
//
// Each takes k, how far it has appeared: 0 is not there yet, 1 is settled.
// Erasing runs k back down to 0 with `leaving` set: the overshoot that makes
// an arrival pop would, played backwards, make a thing swell and linger
// before it goes, so leaving rails k straight and starts shrinking at once.

const clamp01 = (x: number) => Math.min(1, Math.max(0, x));

/** Overshoots a little before settling, for things that pop in. */
export function easeOutBack(x: number) {
  const t = clamp01(x) - 1;
  return 1 + 2.70158 * t * t * t + 1.70158 * t * t;
}

const easeOut = (x: number) => 1 - Math.pow(1 - clamp01(x), 3);

/** A park tile: brighter grass spreading from the middle, then its trees popping up one by one. */
export function drawPark(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  variant: number,
  k = 1,
  leaving = false
) {
  const grass = leaving ? clamp01(k) : easeOutBack(k / 0.6);
  if (grass <= 0) return;
  hexPath(ctx, x, y, r * (1 - GAP) * grass);
  ctx.fillStyle = COLORS.park;
  ctx.fill();
  const trees: Point[] =
    variant < 0.5
      ? [[-0.24, 0.02], [0.2, -0.16], [0.12, 0.26]]
      : [[-0.2, -0.14], [0.24, 0.04], [-0.1, 0.28]];
  trees.forEach(([dx, dy], j) => {
    const grow = leaving ? clamp01(k * 1.4) : easeOutBack((k - 0.3 - j * 0.12) / 0.4);
    if (grow > 0) tree(ctx, x + dx * r, y + dy * r, r * 0.2 * grow);
  });
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
 * Housing, one building per stage of growth: a cottage (1 person), a
 * townhouse (2), an apartment block (3). It stands on a pale yard that spreads
 * first; a new building drops in, and growing pops the next stage up in its
 * place (`settled` is the stage it grew from).
 */
export function drawHouses(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  size: 1 | 2 | 3,
  k = 1,
  settled = 0,
  leaving = false
) {
  const yard = settled > 0 ? 1 : leaving ? clamp01(k) : easeOut(k / 0.4);
  if (yard > 0) {
    hexPath(ctx, x, y, r * (1 - GAP) * yard);
    ctx.fillStyle = COLORS.yard;
    ctx.fill();
  }
  const local = settled > 0 ? 1 : leaving ? clamp01(k) : clamp01((k - 0.15) / 0.7);
  if (local <= 0) return;
  const base = y + r * 0.42;
  const drop = settled > 0 ? 0 : (1 - (leaving ? local : easeOutBack(local))) * -0.45 * r;
  // growing swaps the building for the next stage with a small pop
  const scale = settled > 0 ? (leaving ? 0.85 + 0.15 * clamp01(k) : 0.8 + 0.2 * easeOutBack(k)) : 1;
  const alpha = ctx.globalAlpha;
  ctx.globalAlpha = alpha * clamp01(local * 2.5);

  const w = r * (size === 1 ? 0.62 : size === 2 ? 0.56 : 0.6);
  ctx.fillStyle = COLORS.shadow;
  ctx.beginPath();
  ctx.ellipse(x + w * 0.06, base + w * 0.02, w * 0.55, w * 0.12, 0, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.translate(x, base + drop);
  ctx.scale(scale, scale);
  if (size === 1) cottage(ctx, w);
  else if (size === 2) townhouse(ctx, w);
  else apartment(ctx, w, r * 0.95);
  ctx.restore();
  ctx.globalAlpha = alpha;
}

// each drawn standing on (0, 0), the middle of its ground line

function walls(ctx: CanvasRenderingContext2D, w: number, h: number) {
  ctx.lineJoin = 'round';
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = Math.max(1, w * 0.08);
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(-w / 2, -h, w, h);
  ctx.strokeRect(-w / 2, -h, w, h);
}

function gable(ctx: CanvasRenderingContext2D, w: number, top: number, peak: number) {
  ctx.beginPath();
  ctx.moveTo(-w * 0.62, top);
  ctx.lineTo(0, top - peak);
  ctx.lineTo(w * 0.62, top);
  ctx.closePath();
  ctx.fillStyle = COLORS.roof;
  ctx.fill();
  ctx.stroke();
}

function door(ctx: CanvasRenderingContext2D, w: number) {
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(-w * 0.1, -w * 0.3, w * 0.2, w * 0.3);
}

function windows(ctx: CanvasRenderingContext2D, w: number, cols: number, rows: number, bottom: number, top: number) {
  const size = w * 0.14;
  ctx.fillStyle = COLORS.ink;
  for (let c = 0; c < cols; c++) {
    for (let r = 0; r < rows; r++) {
      const cx = -w / 2 + (w * (c + 1)) / (cols + 1);
      const cy = bottom + ((top - bottom) * (r + 0.5)) / rows;
      ctx.fillRect(cx - size / 2, cy - size / 2, size, size);
    }
  }
}

/** Stage 1: a one-storey cottage with a pitched roof. */
function cottage(ctx: CanvasRenderingContext2D, w: number) {
  const h = w * 0.5;
  walls(ctx, w, h);
  gable(ctx, w, -h, w * 0.5);
  door(ctx, w);
}

/** Stage 2: a two-storey townhouse, its upper floor windowed. */
function townhouse(ctx: CanvasRenderingContext2D, w: number) {
  const h = w * 0.95;
  walls(ctx, w, h);
  gable(ctx, w, -h, w * 0.45);
  windows(ctx, w, 2, 1, -h * 0.5, -h);
  door(ctx, w);
}

/** Stage 3: an apartment block, flat roof and a grid of windows. */
function apartment(ctx: CanvasRenderingContext2D, w: number, h: number) {
  walls(ctx, w, h);
  ctx.fillStyle = COLORS.roof;
  ctx.fillRect(-w / 2 - w * 0.06, -h - w * 0.1, w * 1.12, w * 0.14);
  ctx.strokeRect(-w / 2 - w * 0.06, -h - w * 0.1, w * 1.12, w * 0.14);
  windows(ctx, w, 3, 3, -w * 0.38, -h + w * 0.06);
  door(ctx, w);
}

/** A station: the transit-map circle. Its ring draws itself round, then it fills in, with a small pop. */
export function drawStation(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, k = 1, leaving = false) {
  if (k <= 0) return;
  const radius = r * 0.4 * (leaving ? 1 : 1 + 0.14 * Math.sin(Math.PI * clamp01(k)));
  const sweep = (leaving ? clamp01(k) : easeOut(k / 0.7)) * Math.PI * 2;
  const alpha = ctx.globalAlpha;
  ctx.globalAlpha = alpha * (leaving ? clamp01(k) : clamp01((k - 0.25) / 0.5));
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.paper;
  ctx.fill();
  ctx.globalAlpha = alpha;
  ctx.beginPath();
  ctx.arc(x, y, radius, -Math.PI / 2, -Math.PI / 2 + sweep);
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = Math.max(1.5, r * 0.13);
  ctx.lineCap = 'butt';
  ctx.stroke();
}

/** A tunnel mouth: a dark arch set in a stone face, rising up out of the ground. */
export function drawTunnel(ctx: CanvasRenderingContext2D, x: number, y: number, r: number, k = 1, leaving = false) {
  const rise = leaving ? clamp01(k) : easeOutBack(k);
  if (rise <= 0) return;
  const base = y + r * 0.34;
  const outer = r * 0.42;
  const inner = r * 0.26;
  ctx.save();
  ctx.translate(x, base);
  ctx.scale(1, rise);
  ctx.translate(-x, -base);
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
  ctx.restore();
}

/** The eraser: a tilted block, half paper and half ink, like a pencil eraser. */
export function drawEraser(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(-Math.PI / 5);
  const w = r * 0.8;
  const h = r * 0.38;
  ctx.fillStyle = COLORS.paper;
  ctx.fillRect(-w / 2, -h / 2, w * 0.55, h);
  ctx.fillStyle = COLORS.ink;
  ctx.fillRect(-w / 2 + w * 0.55, -h / 2, w * 0.45, h);
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = Math.max(1, r * 0.07);
  ctx.strokeRect(-w / 2, -h / 2, w, h);
  ctx.restore();
}

/** Select mode's glass: a paper lens in an ink ring, handle down to the right. */
export function drawMagnifier(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const lens = r * 0.26;
  const cx = x - r * 0.08;
  const cy = y - r * 0.08;
  ctx.beginPath();
  ctx.moveTo(cx + lens * 0.7, cy + lens * 0.7);
  ctx.lineTo(cx + lens * 1.9, cy + lens * 1.9);
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = Math.max(2, r * 0.14);
  ctx.lineCap = 'round';
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(cx, cy, lens, 0, Math.PI * 2);
  ctx.fillStyle = COLORS.paper;
  ctx.fill();
  ctx.lineWidth = Math.max(1.5, r * 0.1);
  ctx.stroke();
}

/** What the eraser is about to clear: an ink X over the tile. */
export function drawCross(ctx: CanvasRenderingContext2D, x: number, y: number, r: number) {
  const a = r * 0.3;
  ctx.beginPath();
  ctx.moveTo(x - a, y - a);
  ctx.lineTo(x + a, y + a);
  ctx.moveTo(x + a, y - a);
  ctx.lineTo(x - a, y + a);
  ctx.strokeStyle = COLORS.ink;
  ctx.lineWidth = Math.max(1.5, r * 0.12);
  ctx.lineCap = 'round';
  ctx.stroke();
}

/**
 * The curve rail takes across a tile between two of its edges: it leaves
 * each edge square to it, so it is the arc tangent to both edge normals — a
 * straight line for opposite edges, a gentle bend for edges one apart, a tight
 * one for neighbouring edges. Returns the point t of the way from edge a to b.
 */
function railCurve(x: number, y: number, r: number, a: number, b: number) {
  const ap = (r * Math.sqrt(3)) / 2 + 0.5;
  const dir = (d: number) => [Math.cos((60 * d * Math.PI) / 180), Math.sin((60 * d * Math.PI) / 180)];
  const [nax, nay] = dir(a);
  const [nbx, nby] = dir(b);
  const A = [x + ap * nax, y + ap * nay];
  const B = [x + ap * nbx, y + ap * nby];
  if ((b - a + 6) % 6 === 3) return (t: number) => [A[0] + (B[0] - A[0]) * t, A[1] + (B[1] - A[1]) * t];
  // the centre sits where the two lines across the edges (perpendicular to
  // their normals) meet: A + s(-nay, nax) = B + u(-nby, nbx)
  const det = -nay * nbx + nby * nax;
  const sx = ((B[0] - A[0]) * nbx + (B[1] - A[1]) * nby) / det;
  const cx = A[0] - nay * sx;
  const cy = A[1] + nax * sx;
  const radius = Math.hypot(A[0] - cx, A[1] - cy);
  const from = Math.atan2(A[1] - cy, A[0] - cx);
  let sweep = Math.atan2(B[1] - cy, B[0] - cx) - from;
  if (sweep > Math.PI) sweep -= 2 * Math.PI;
  if (sweep < -Math.PI) sweep += 2 * Math.PI;
  return (t: number) => [cx + radius * Math.cos(from + sweep * t), cy + radius * Math.sin(from + sweep * t)];
}

/**
 * Rail through a tile, with bit d of `mask` an exit through edge d (0 =
 * east, clockwise). A tile with two exits gets one curve between them; a
 * station (`hub`), a tunnel mouth, or the end of a line gets straight spokes
 * from its centre. Exits in `growing` are drawn only k of the way, out from
 * the middle, so newly laid rail draws itself along.
 */
export function drawRail(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  r: number,
  mask: number,
  growing = 0,
  k = 1,
  hub = false,
  color: string = COLORS.ink
) {
  const out = easeOut(k);
  const exits = [0, 1, 2, 3, 4, 5].filter((d) => mask & (1 << d));
  if (exits.length === 0) return;
  ctx.strokeStyle = color;
  ctx.lineWidth = r * RAIL;
  ctx.lineCap = 'butt';
  ctx.lineJoin = 'round';

  if (exits.length === 2 && !hub) {
    const [a, b] = exits;
    const at = railCurve(x, y, r, a, b);
    const growA = growing & (1 << a);
    const growB = growing & (1 << b);
    // the stretch of the curve to draw: the middle outward, or from a settled
    // end on toward the growing one
    const t0 = growA ? 0.5 - 0.5 * out : 0;
    const t1 = growB ? 0.5 + 0.5 * out : 1;
    if (t1 <= t0) return;
    ctx.beginPath();
    const steps = 16;
    for (let j = 0; j <= steps; j++) {
      const [px, py] = at(t0 + ((t1 - t0) * j) / steps);
      if (j) ctx.lineTo(px, py);
      else ctx.moveTo(px, py);
    }
    ctx.stroke();
    return;
  }

  const reach = (r * Math.sqrt(3)) / 2 + 0.5;
  let any = false;
  ctx.beginPath();
  for (const d of exits) {
    const len = growing & (1 << d) ? reach * out : reach;
    if (len <= 0) continue;
    const a = (60 * d * Math.PI) / 180;
    ctx.moveTo(x, y);
    ctx.lineTo(x + len * Math.cos(a), y + len * Math.sin(a));
    any = true;
  }
  if (!any) return;
  ctx.stroke();
  ctx.beginPath();
  ctx.arc(x, y, (r * RAIL) / 2, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
}
