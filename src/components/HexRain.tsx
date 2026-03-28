'use client';

import { useState, useEffect, CSSProperties } from 'react';
import { PRECOMP_FRAMES, getCell } from './hexrain-data';

const LINE_H = 13; // px per row
const TICK_MS = 40;

interface HexRainProps {
  rows: number;
  cols: number;
  startDelay?: number;
  opacity?: number;
  style?: CSSProperties;
  className?: string;
}

export default function HexRain({
  rows,
  cols,
  startDelay = 0,
  opacity = 1,
  style,
  className,
}: HexRainProps) {
  const [started, setStarted] = useState(false);
  const [frameIdx, setFrameIdx] = useState(0);

  useEffect(() => {
    const t = setTimeout(() => setStarted(true), startDelay);
    return () => clearTimeout(t);
  }, [startDelay]);

  useEffect(() => {
    const id = setInterval(
      () => setFrameIdx(f => (f + 1) % PRECOMP_FRAMES),
      TICK_MS,
    );
    return () => clearInterval(id);
  }, []);

  const copyH = rows * LINE_H;

  return (
    <div
      className={className}
      style={{
        overflow: 'hidden',
        pointerEvents: 'none',
        height: copyH,
        opacity: started ? opacity : 0,
        transition: 'opacity 1.2s ease',
        ...style,
      }}
    >
      <div
        style={{
          fontFamily: '"Fira Code", ui-monospace, "Courier New", monospace',
          fontSize: 11,
          whiteSpace: 'nowrap',
        }}
        className='text-(--accent)'
      >
        {Array.from({ length: rows }, (_, r) => (
          <div key={r} style={{ lineHeight: `${LINE_H}px` }}>
            {Array.from({ length: cols }, (_, c) => (
              <span key={c}>{getCell(frameIdx, r, c)}</span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
