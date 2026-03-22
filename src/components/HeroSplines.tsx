'use client';

import { useEffect, useState } from 'react';
import splineData from '@public/spline-1774129137143.json';

interface Point { x: number; y: number; }

/** Catmull-Rom control points → SVG cubic bezier path string */
function buildPath(points: Point[]): string {
  if (points.length < 2) return '';

  let d = `M ${points[0].x} ${points[0].y}`;

  if (points.length === 2) {
    return d + ` L ${points[1].x} ${points[1].y}`;
  }

  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[Math.min(points.length - 1, i + 2)];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x.toFixed(2)} ${cp1y.toFixed(2)}, ${cp2x.toFixed(2)} ${cp2y.toFixed(2)}, ${p2.x.toFixed(2)} ${p2.y.toFixed(2)}`;
  }

  return d;
}

export default function HeroSplines() {
  const [vw, setVw] = useState(0);
  const [vh, setVh] = useState(0);

  useEffect(() => {
    const update = () => { setVw(window.innerWidth); setVh(window.innerHeight); };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);

  if (!vw || !vh) return null;

  // Scale normalised coords to current viewport
  const pts: Point[] = splineData.points.map(p => ({
    x: p.nx * vw,
    y: p.ny * vh,
  }));

  const shifted: Point[] = pts.map(p => ({ x: p.x + 400, y: p.y }));

  return (
    <svg
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        width: '100vw',
        height: '100vh',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'visible',
      }}
      viewBox={`0 0 ${vw} ${vh}`}
    >
      <path d={buildPath(pts)}     stroke="black" strokeWidth="1.5" fill="none" />
      <path d={buildPath(shifted)} stroke="black" strokeWidth="1.5" fill="none" />
    </svg>
  );
}
