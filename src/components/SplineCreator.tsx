'use client';

import { useEffect, useRef, useCallback } from 'react';
import { createRoot } from 'react-dom/client';

// ─── types ────────────────────────────────────────────────────────────────────

interface Point { x: number; y: number; }

interface SplineData {
  createdAt: string;
  viewport: { width: number; height: number };
  points: Array<{ x: number; y: number; nx: number; ny: number }>;
}

// ─── canvas drawing ───────────────────────────────────────────────────────────

/** Catmull-Rom → cubic Bezier segment */
function drawCatmullRomSegment(
  ctx: CanvasRenderingContext2D,
  p0: Point, p1: Point, p2: Point, p3: Point,
) {
  const cp1x = p1.x + (p2.x - p0.x) / 6;
  const cp1y = p1.y + (p2.y - p0.y) / 6;
  const cp2x = p2.x - (p3.x - p1.x) / 6;
  const cp2y = p2.y - (p3.y - p1.y) / 6;
  ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
}

function renderAll(
  canvas: HTMLCanvasElement,
  points: Point[],
  recording: boolean,
  hoveredIdx: number | null,
  draggingIdx: number | null,
) {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const accent = recording ? '#10B981' : '#6B7280';

  // ── spline curve ────────────────────────────────────────────────────────────
  if (points.length >= 2) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);

    if (points.length === 2) {
      ctx.lineTo(points[1].x, points[1].y);
    } else {
      for (let i = 0; i < points.length - 1; i++) {
        drawCatmullRomSegment(
          ctx,
          points[Math.max(0, i - 1)],
          points[i],
          points[i + 1],
          points[Math.min(points.length - 1, i + 2)],
        );
      }
    }

    ctx.strokeStyle = accent;
    ctx.lineWidth = 2;
    ctx.setLineDash([]);
    ctx.stroke();
  }

  // ── control points ──────────────────────────────────────────────────────────
  points.forEach((p, i) => {
    const active = i === draggingIdx || i === hoveredIdx;
    const r = active ? 7 : 5;

    // halo
    if (active) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, r + 7, 0, Math.PI * 2);
      ctx.fillStyle = accent + '28';
      ctx.fill();
    }

    // dot
    ctx.beginPath();
    ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
    ctx.fillStyle = i === draggingIdx ? '#fff' : accent;
    ctx.strokeStyle = accent;
    ctx.lineWidth = 1.5;
    ctx.fill();
    ctx.stroke();

    // index label
    ctx.font = 'bold 10px monospace';
    ctx.fillStyle = recording ? '#065f46' : '#374151';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(String(i), p.x, p.y - r - 3);
  });
}

// ─── save helper ──────────────────────────────────────────────────────────────

function triggerDownload(points: Point[]) {
  const w = window.innerWidth;
  const h = window.innerHeight;

  const data: SplineData = {
    createdAt: new Date().toISOString(),
    viewport: { width: w, height: h },
    points: points.map(p => ({
      x: Math.round(p.x),
      y: Math.round(p.y),
      nx: parseFloat((p.x / w).toFixed(5)),
      ny: parseFloat((p.y / h).toFixed(5)),
    })),
  };

  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `spline-${Date.now()}.json`;
  a.click();
  URL.revokeObjectURL(url);

  // Also print to console for quick copy
  console.log('[SplineCreator] saved points:', json);
}

// ─── component ────────────────────────────────────────────────────────────────

export default function SplineCreator() {
  const canvasRef    = useRef<HTMLCanvasElement>(null);
  const hudRef       = useRef<HTMLDivElement>(null);

  // All mutable state lives in refs so canvas callbacks are never stale.
  const recording      = useRef(false);
  const points         = useRef<Point[]>([]);
  const hoveredIdx     = useRef<number | null>(null);
  const draggingIdx    = useRef<number | null>(null);
  const dragOffset     = useRef<Point>({ x: 0, y: 0 });

  // ── helpers ─────────────────────────────────────────────────────────────────

  const redraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    renderAll(canvas, points.current, recording.current, hoveredIdx.current, draggingIdx.current);
  }, []);

  const updateHUD = useCallback(() => {
    const el = hudRef.current;
    if (!el) return;
    const rec = recording.current;
    const n = points.current.length;

    el.style.background    = rec ? '#10B981' : 'rgba(0,0,0,0.72)';
    el.style.color         = rec ? '#fff' : '#d1d5db';
    el.innerHTML = rec
      ? `<span style="width:8px;height:8px;border-radius:50%;background:#fff;display:inline-block;animation:pulse 1s infinite;margin-right:8px;flex-shrink:0"></span>
         <span>RECORDING — <b>${n}</b> pt${n !== 1 ? 's' : ''} &nbsp;·&nbsp; click&nbsp;=&nbsp;add &nbsp;·&nbsp; drag&nbsp;=&nbsp;move &nbsp;·&nbsp; right-click&nbsp;=&nbsp;delete &nbsp;·&nbsp; <kbd style="background:rgba(255,255,255,.2);padding:1px 5px;border-radius:3px">z</kbd>&nbsp;undo &nbsp;·&nbsp; <kbd style="background:rgba(255,255,255,.2);padding:1px 5px;border-radius:3px">c</kbd>&nbsp;save+stop</span>`
      : `<span style="width:8px;height:8px;border-radius:50%;background:#6b7280;display:inline-block;margin-right:8px;flex-shrink:0"></span>
         <span>SPLINE CREATOR &nbsp;·&nbsp; press <kbd style="background:rgba(255,255,255,.15);padding:1px 6px;border-radius:3px;color:#fff">c</kbd> to start recording</span>`;

    // cursor on canvas
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.style.pointerEvents = rec ? 'auto' : 'none';
      canvas.style.cursor = rec
        ? (hoveredIdx.current !== null || draggingIdx.current !== null ? 'grab' : 'crosshair')
        : 'default';
    }
  }, []);

  const hitTest = useCallback((x: number, y: number): number | null => {
    const pts = points.current;
    for (let i = pts.length - 1; i >= 0; i--) {
      const dx = pts[i].x - x;
      const dy = pts[i].y - y;
      if (dx * dx + dy * dy <= 14 * 14) return i;
    }
    return null;
  }, []);

  // ── resize ──────────────────────────────────────────────────────────────────

  useEffect(() => {
    const resize = () => {
      const canvas = canvasRef.current;
      if (!canvas) return;
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
      redraw();
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, [redraw]);

  // ── keyboard ────────────────────────────────────────────────────────────────

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (e.target as HTMLElement)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA') return;

      if (e.key === 'c' || e.key === 'C') {
        e.preventDefault();
        if (recording.current) {
          // save & stop
          if (points.current.length >= 2) triggerDownload(points.current);
          recording.current = false;
        } else {
          recording.current = true;
        }
        updateHUD();
        redraw();
        return;
      }

      if (!recording.current) return;

      if (e.key === 'z' || e.key === 'Z') {
        points.current = points.current.slice(0, -1);
        hoveredIdx.current = null;
        updateHUD();
        redraw();
      }
      if (e.key === 'Escape') {
        recording.current = false;
        draggingIdx.current = null;
        updateHUD();
        redraw();
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (draggingIdx.current === null) {
          points.current = points.current.slice(0, -1);
          updateHUD();
          redraw();
        }
      }
    };

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [redraw, updateHUD]);

  // ── mouse events ─────────────────────────────────────────────────────────────

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onMouseDown = (e: MouseEvent) => {
      if (!recording.current) return;
      if (e.button === 2) return;

      const { clientX: x, clientY: y } = e;
      const hit = hitTest(x, y);

      if (hit !== null) {
        draggingIdx.current = hit;
        dragOffset.current = { x: x - points.current[hit].x, y: y - points.current[hit].y };
        canvas.style.cursor = 'grabbing';
      } else {
        points.current = [...points.current, { x, y }];
        updateHUD();
        redraw();
      }
    };

    const onMouseMove = (e: MouseEvent) => {
      if (!recording.current) return;
      const { clientX: x, clientY: y } = e;

      if (draggingIdx.current !== null) {
        const next = [...points.current];
        next[draggingIdx.current] = {
          x: x - dragOffset.current.x,
          y: y - dragOffset.current.y,
        };
        points.current = next;
        redraw();
      } else {
        const prev = hoveredIdx.current;
        hoveredIdx.current = hitTest(x, y);
        if (prev !== hoveredIdx.current) {
          canvas.style.cursor = hoveredIdx.current !== null ? 'grab' : 'crosshair';
          redraw();
        }
      }
    };

    const onMouseUp = () => {
      if (draggingIdx.current !== null) {
        draggingIdx.current = null;
        canvas.style.cursor = 'crosshair';
        redraw();
      }
    };

    const onContextMenu = (e: MouseEvent) => {
      if (!recording.current) return;
      e.preventDefault();
      const hit = hitTest(e.clientX, e.clientY);
      if (hit !== null) {
        points.current = points.current.filter((_, i) => i !== hit);
        hoveredIdx.current = null;
        updateHUD();
        redraw();
      }
    };

    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('contextmenu', onContextMenu);
    // also release drag if mouse goes outside canvas
    window.addEventListener('mouseup', onMouseUp);

    return () => {
      canvas.removeEventListener('mousedown', onMouseDown);
      canvas.removeEventListener('mousemove', onMouseMove);
      canvas.removeEventListener('mouseup', onMouseUp);
      canvas.removeEventListener('contextmenu', onContextMenu);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [hitTest, redraw, updateHUD]);

  // ── render ───────────────────────────────────────────────────────────────────

  return (
    <>
      {/* full-screen canvas – pointer-events toggled via JS */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          inset: 0,
          zIndex: 9998,
          pointerEvents: 'none',
        }}
      />

      {/* HUD bar */}
      <div
        ref={hudRef}
        style={{
          position: 'fixed',
          top: 16,
          left: '50%',
          transform: 'translateX(-50%)',
          zIndex: 9999,
          pointerEvents: 'none',
          display: 'flex',
          alignItems: 'center',
          padding: '6px 14px',
          borderRadius: 8,
          fontFamily: 'monospace',
          fontSize: 12,
          background: 'rgba(0,0,0,0.72)',
          color: '#d1d5db',
          whiteSpace: 'nowrap',
          gap: 4,
        }}
      >
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#6b7280', display: 'inline-block', marginRight: 8, flexShrink: 0 }} />
        <span>
          SPLINE CREATOR &nbsp;·&nbsp; press{' '}
          <kbd style={{ background: 'rgba(255,255,255,.15)', padding: '1px 6px', borderRadius: 3, color: '#fff' }}>c</kbd>
          {' '}to start recording
        </span>
      </div>
    </>
  );
}
