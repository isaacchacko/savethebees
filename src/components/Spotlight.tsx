'use client';

import { useEffect, useRef, useState } from 'react';
import type { Board } from '@/lib/map/board';
import { fitBoard, tileAt } from '@/lib/map/draw';

type Shapes = { w: number; h: number; hexes: number[][]; boxes: number[][] };

const EMPTY: Shapes = { w: 0, h: 0, hexes: [], boxes: [] };

// how far past a tile or a control the light reaches, so the soft edge
// doesn't eat into it
const HEX_REACH = 1.2;
const BOX_PAD = 10;

const hexPoints = ([x, y, r]: number[]) =>
  Array.from({ length: 6 }, (_, k) => {
    const a = (Math.PI / 3) * k - Math.PI / 6;
    return `${x + r * HEX_REACH * Math.cos(a)},${y + r * HEX_REACH * Math.sin(a)}`;
  }).join(' ');

/**
 * The tutorial's "show me": the whole page dimmed but for what the step
 * points at — its ringed tiles, and whatever control carries data-hint. It
 * never takes a click, so the lit parts stay usable. While on, it follows
 * those every frame, since the toolbar slides and the window can resize.
 */
export default function Spotlight({ on, board, tiles }: { on: boolean; board: Board | null; tiles: number[] }) {
  const ref = useRef<SVGSVGElement>(null);
  const [shapes, setShapes] = useState<Shapes>(EMPTY);

  useEffect(() => {
    if (!on) return;
    let frame = 0;
    let last = '';
    const measure = () => {
      const stage = ref.current?.parentElement;
      if (stage && board) {
        const box = stage.getBoundingClientRect();
        const fit = fitBoard(board, box.width, box.height);
        const round = (v: number) => Math.round(v);
        const next: Shapes = {
          w: round(box.width),
          h: round(box.height),
          hexes: tiles.map((i) => {
            const p = tileAt(board, fit, i);
            return [p.x, p.y, fit.s].map(round);
          }),
          boxes: Array.from(document.querySelectorAll('[data-hint="true"]'), (el) => {
            const r = el.getBoundingClientRect();
            return [r.left - box.left, r.top - box.top, r.width, r.height].map(round);
          }),
        };
        const key = JSON.stringify(next);
        if (key !== last) {
          last = key;
          setShapes(next);
        }
      }
      frame = requestAnimationFrame(measure);
    };
    measure();
    return () => cancelAnimationFrame(frame);
  }, [on, board, tiles]);

  const { w, h, hexes, boxes } = shapes;
  return (
    <svg ref={ref} className="spotlight" data-on={on ? 'true' : 'false'} width={w} height={h} aria-hidden>
      <defs>
        <filter id="spotlight-soft" filterUnits="userSpaceOnUse" x={0} y={0} width={w} height={h}>
          <feGaussianBlur stdDeviation="7" />
        </filter>
        <mask id="spotlight-mask">
          <rect width={w} height={h} fill="white" />
          <g fill="black" filter="url(#spotlight-soft)">
            {hexes.map((hex) => (
              <polygon key={hex.join()} points={hexPoints(hex)} />
            ))}
            {boxes.map(([x, y, bw, bh]) => (
              <rect
                key={`${x},${y}`}
                x={x - BOX_PAD}
                y={y - BOX_PAD}
                width={bw + 2 * BOX_PAD}
                height={bh + 2 * BOX_PAD}
                rx={8}
              />
            ))}
          </g>
        </mask>
      </defs>
      <rect width={w} height={h} className="spotlight-shade" mask="url(#spotlight-mask)" />
    </svg>
  );
}
