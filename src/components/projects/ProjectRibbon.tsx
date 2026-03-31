'use client';

import TextToSVG from 'text-to-svg';
import { useEffect, useLayoutEffect, useRef, useState } from 'react';

const GAP = '  ';
/** Bricolage Grotesque Latin 800 — WOFF for opentype.js (WOFF2 is not supported). */
const FONT_URL = '/fonts/bricolage-grotesque-latin-800-normal.woff';

const ANCHOR = 'left baseline' as const;
/** Degrees — Bricolage has no italic WOFF in Fontsource; faux italic via shear. */
const ITALIC_SKEW_DEG = -14;

function ribbonFontSizeForWidth(widthPx: number) {
  if (widthPx < 340) return 18;
  if (widthPx < 420) return 22;
  if (widthPx < 560) return 26;
  if (widthPx < 900) return 30;
  return 36;
}

export type ProjectRibbonProps = {
  /** Text repeated in the SVG ribbon (typically the project name). */
  name: string;
};

export default function ProjectRibbon({ name }: ProjectRibbonProps) {
  const phrase = name.trim() || '\u00a0';
  const containerRef = useRef<HTMLDivElement>(null);
  const [engine, setEngine] = useState<InstanceType<typeof TextToSVG> | null>(null);
  const [svgHeight, setSvgHeight] = useState(48);
  const [layout, setLayout] = useState({ fullWidthPx: 0, step: 288, count: 4, fontSize: 36 });

  useEffect(() => {
    let cancelled = false;
    TextToSVG.load(FONT_URL, (err, textToSVG) => {
      if (cancelled || err || !textToSVG) return;
      setEngine(textToSVG);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || !engine) return;

    const update = () => {
      const fullW = el.getBoundingClientRect().width;
      const fullWidthPx = Math.max(0, Math.round(fullW));
      const fontSize = ribbonFontSizeForWidth(fullW);
      const measureOpts = { fontSize, anchor: ANCHOR };

      const phraseW = engine.getWidth(phrase, measureOpts);
      const gapW = engine.getWidth(GAP, measureOpts);
      const step = phraseW + gapW;
      if (step <= 0) return;

      const count = Math.max(1, Math.ceil(fullW / step) + 3);

      setSvgHeight(Math.ceil(engine.getHeight(fontSize) + 6));
      setLayout({ fullWidthPx, step, count, fontSize });
    };

    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, [engine, phrase]);

  const { fontSize } = layout;
  const pathOpts = { fontSize, anchor: ANCHOR, y: fontSize };
  const strokeW = fontSize <= 22 ? 1 : 1.25;

  return (
    <div ref={containerRef} className="relative w-full overflow-hidden pl-2 sm:pl-3">
      <svg
        className="block w-full text-black dark:text-white"
        width="100%"
        height={svgHeight}
        aria-hidden
        role="presentation"
      >
        {engine && layout.fullWidthPx > 0 && (
          <g
            transform={`translate(0 ${fontSize}) skewX(${ITALIC_SKEW_DEG}) translate(0 ${-fontSize})`}
          >
            {Array.from({ length: layout.count }, (_, i) => (
              <path
                key={`${phrase}-${i}`}
                d={engine.getD(phrase, { ...pathOpts, x: i * layout.step })}
                fill={i === 0 ? 'currentColor' : 'none'}
                stroke={i === 0 ? 'none' : 'currentColor'}
                strokeWidth={i === 0 ? undefined : strokeW}
                strokeLinejoin="round"
              />
            ))}
          </g>
        )}
      </svg>
    </div>
  );
}
