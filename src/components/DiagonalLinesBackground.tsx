'use client';

import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';

interface DiagonalLinesBackgroundProps {
  className?: string;
}

interface Curve {
  id: number;
  x1: number; // Start point (top or bottom)
  y1: number;
  cx1: number; // Control point 1
  cy1: number;
  cx2: number; // Control point 2
  cy2: number;
  x2: number; // End point (mouse click)
  y2: number;
  startFromTop: boolean;
}

export default function DiagonalLinesBackground({ className = '' }: DiagonalLinesBackgroundProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 1920, height: 1080 });
  const [curves, setCurves] = useState<Curve[]>([]);
  const curveIdCounter = useRef(0);
  const tracePathsRef = useRef<Map<number, SVGPathElement>>(new Map());

  useEffect(() => {
    const updateDimensions = () => {
      if (typeof window !== 'undefined') {
        setDimensions({ width: window.innerWidth, height: window.innerHeight });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Calculate control points for a partial Bezier curve from t=0 to t=t1
  const getPartialBezier = (
    t1: number,
    x1: number,
    y1: number,
    cx1: number,
    cy1: number,
    cx2: number,
    cy2: number,
    x2: number,
    y2: number
  ): { x1: number; y1: number; cx1: number; cy1: number; cx2: number; cy2: number; x2: number; y2: number } => {
    // De Casteljau's algorithm for cubic Bezier
    const q0x = x1 + t1 * (cx1 - x1);
    const q0y = y1 + t1 * (cy1 - y1);
    const q1x = cx1 + t1 * (cx2 - cx1);
    const q1y = cy1 + t1 * (cy2 - cy1);
    const q2x = cx2 + t1 * (x2 - cx2);
    const q2y = cy2 + t1 * (y2 - cy2);

    const r0x = q0x + t1 * (q1x - q0x);
    const r0y = q0y + t1 * (q1y - q0y);
    const r1x = q1x + t1 * (q2x - q1x);
    const r1y = q1y + t1 * (q2y - q1y);

    const sx = r0x + t1 * (r1x - r0x);
    const sy = r0y + t1 * (r1y - r0y);

    return {
      x1,
      y1,
      cx1: q0x,
      cy1: q0y,
      cx2: r0x,
      cy2: r0y,
      x2: sx,
      y2: sy,
    };
  };

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const clickX = e.clientX - rect.left;
      const clickY = e.clientY - rect.top;

      const width = dimensions.width;
      const height = dimensions.height;

      // Create 4 curves on each click
      const newCurves: Curve[] = [];
      for (let i = 0; i < 4; i++) {
        // Randomly choose top or bottom
        const startFromTop = Math.random() > 0.5;

        // Random position on top or bottom edge
        const startX = Math.random() * width;
        const startY = startFromTop ? 0 : height;

        // End point is the mouse click position
        const endX = clickX;
        const endY = clickY;

        // Generate control points for a smooth curve
        // Control points positioned to create a nice curve
        const midX = (startX + endX) / 2;
        const midY = (startY + endY) / 2;

        // Add some randomness to control points for variety
        const offset1 = (Math.random() - 0.5) * width * 0.3;
        const offset2 = (Math.random() - 0.5) * width * 0.3;

        const cx1 = startX + (endX - startX) * 0.3 + offset1;
        const cy1 = startY + (endY - startY) * 0.3 + (Math.random() - 0.5) * height * 0.2;

        const cx2 = startX + (endX - startX) * 0.7 + offset2;
        const cy2 = startY + (endY - startY) * 0.7 + (Math.random() - 0.5) * height * 0.2;

        const newCurve: Curve = {
          id: curveIdCounter.current++,
          x1: startX,
          y1: startY,
          cx1,
          cy1,
          cx2,
          cy2,
          x2: endX,
          y2: endY,
          startFromTop,
        };

        newCurves.push(newCurve);
      }

      setCurves((prev) => [...prev, ...newCurves]);

      // Animate each curve
      newCurves.forEach((newCurve) => {
        requestAnimationFrame(() => {
          const tracePath = tracePathsRef.current.get(newCurve.id);
          if (!tracePath) return;

          // Start with trace at beginning
          const initialPartial = getPartialBezier(
            0.001,
            newCurve.x1,
            newCurve.y1,
            newCurve.cx1,
            newCurve.cy1,
            newCurve.cx2,
            newCurve.cy2,
            newCurve.x2,
            newCurve.y2
          );
          const initialPath = `M ${initialPartial.x1} ${initialPartial.y1} C ${initialPartial.cx1} ${initialPartial.cy1}, ${initialPartial.cx2} ${initialPartial.cy2}, ${initialPartial.x2} ${initialPartial.y2}`;

          tracePath.setAttribute('d', initialPath);
          tracePath.setAttribute('opacity', '1');

          // Animate from 0 to 1
          const duration = 1.5; // seconds
          const progressObj = { t: 0 };

          // Create animation that updates the path
          const updatePath = (t: number) => {
            const partial = getPartialBezier(
              t,
              newCurve.x1,
              newCurve.y1,
              newCurve.cx1,
              newCurve.cy1,
              newCurve.cx2,
              newCurve.cy2,
              newCurve.x2,
              newCurve.y2
            );
            const pathData = `M ${partial.x1} ${partial.y1} C ${partial.cx1} ${partial.cy1}, ${partial.cx2} ${partial.cy2}, ${partial.x2} ${partial.y2}`;
            tracePath.setAttribute('d', pathData);
          };

          // Animate progress from 0 to 1
          gsap.to(progressObj, {
            t: 1,
            duration,
            ease: 'power2.out',
            onUpdate: function() {
              updatePath(progressObj.t);
            },
            onComplete: () => {
              // Fade out after completion
              gsap.to(tracePath, {
                opacity: 0,
                duration: 0.5,
                ease: 'power2.out',
                onComplete: () => {
                  // Remove curve from state
                  setCurves((prev) => prev.filter((c) => c.id !== newCurve.id));
                  tracePathsRef.current.delete(newCurve.id);
                },
              });
            },
          });
        });
      });
    };

    container.addEventListener('click', handleClick);

    return () => {
      container.removeEventListener('click', handleClick);
    };
  }, [dimensions]);

  return (
    <div
      ref={containerRef}
      className={`inset-0 overflow-hidden ${className}`}
      style={{ zIndex: 0, pointerEvents: 'auto' }}
    >
      <svg
        className="w-full h-full"
        style={{ position: 'absolute', top: 0, left: 0, background: "#ff0000" }}
        viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
        preserveAspectRatio="none"
      >
        {curves.map((curve) => {
          return (
            <path
              key={curve.id}
              ref={(el) => {
                if (el) {
                  tracePathsRef.current.set(curve.id, el);
                } else {
                  tracePathsRef.current.delete(curve.id);
                }
              }}
              d={`M ${curve.x1} ${curve.y1} L ${curve.x1} ${curve.y1}`}
              fill="none"
              stroke="#3b82f6"
              strokeWidth="4"
              opacity="0"
              style={{ transition: 'none' }}
            />
          );
        })}
      </svg>
    </div>
  );
}
