'use client';

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ExitGlyph, RefreshGlyph } from '@/components/glyphs';
import { useSlide } from '@/components/slide';
import { INTRO_HREF, useMapMode } from '@/components/Stage';
import TilePreview from '@/components/TilePreview';
import { TOOLS, type ToolId } from '@/lib/map/tools';

/** Coyote time: how long the info card waits after the mouse leaves a glyph,
 * so it can be crossed over to without vanishing on the way. */
const HIDE_AFTER_MS = 150;

/**
 * Free play's tools: the card shrinks to a tower of glyphs, one per thing you
 * can place, builds above the divider and terrain brushes below. Hovering a
 * glyph fades in a card beside the toolbar saying what it is, how it goes down
 * and what it scores; it lingers a moment after the mouse leaves, and stays
 * while the mouse is on it. That card is portaled into the stage because the tower's
 * own card clips anything outside it.
 *
 * The selected tool sits on the same ink highlight as the nav's current tab,
 * and it slides to the next tool when you pick one.
 */
export default function FreeToolbar() {
  const { newTerrain } = useMapMode();
  const slide = useSlide();
  const [selected, setSelected] = useState<ToolId>('house');
  const [hovered, setHovered] = useState<ToolId | null>(null);
  // the last tool hovered, kept while the info card fades out so it never
  // empties mid-fade
  const [shown, setShown] = useState<ToolId>('house');
  const [stage, setStage] = useState<HTMLElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => setStage(document.querySelector<HTMLElement>('.stage')), []);

  const tool = TOOLS.find((t) => t.id === shown) ?? TOOLS[0];
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(hideTimer.current), []);

  // no info card while the toolbar is still arriving (the card shrinking, the
  // glyphs sliding in) or already leaving; a glyph the mouse settled on
  // meanwhile opens once it is ready
  const [ready, setReady] = useState(false);
  const pointedAt = useRef<ToolId | null>(null);

  useEffect(() => {
    const toolbar = toolbarRef.current;
    const card = toolbar?.parentElement;
    if (!toolbar || !card) return;
    let live = true;
    // a frame in, so the shrink and the slide have both started
    const raf = requestAnimationFrame(() => {
      const moving = [...card.getAnimations(), ...toolbar.getAnimations()];
      Promise.all(moving.map((a) => a.finished.catch(() => {}))).then(() => {
        if (live) setReady(true);
      });
    });
    return () => {
      live = false;
      cancelAnimationFrame(raf);
    };
  }, []);

  useEffect(() => {
    if (ready && pointedAt.current) peek(pointedAt.current);
    // only when readiness changes; peek itself is recreated every render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const peek = (id: ToolId) => {
    pointedAt.current = id;
    if (!ready) return;
    clearTimeout(hideTimer.current);
    setHovered(id);
    setShown(id);
  };

  const hideSoon = () => {
    pointedAt.current = null;
    clearTimeout(hideTimer.current);
    hideTimer.current = setTimeout(() => setHovered(null), HIDE_AFTER_MS);
  };

  const leave = () => {
    setReady(false);
    setHovered(null);
    slide(INTRO_HREF, 1);
  };

  const keepOpen = () => clearTimeout(hideTimer.current);

  // placed straight on the DOM, like the nav's indicator, so React never
  // fights it over the style. Picking a tool slides it; anything else that
  // moves the glyphs — the card shrinking into the toolbar on the way in, a
  // window resize — snaps it, since the glyphs sit centered in a card whose
  // height is still changing.
  const selectedRef = useRef(selected);
  selectedRef.current = selected;

  // stable, so the resize observer below subscribes once — a fresh observe()
  // fires straight away, which would snap the highlight mid-slide
  const placeHighlight = useCallback((slide: boolean) => {
    const glyph = toolbarRef.current?.querySelector<HTMLElement>(
      `[data-tool="${selectedRef.current}"]`
    );
    const el = highlightRef.current;
    if (!glyph || !el) return;
    if (!slide) el.style.transition = 'none';
    el.style.top = `${glyph.offsetTop}px`;
    el.style.left = `${glyph.offsetLeft}px`;
    el.style.width = `${glyph.offsetWidth}px`;
    el.style.height = `${glyph.offsetHeight}px`;
    if (!slide) {
      void el.offsetHeight; // commit the jump before transitions come back
      el.style.transition = '';
    }
  }, []);

  const firstPlace = useRef(true);
  useLayoutEffect(() => {
    placeHighlight(!firstPlace.current);
    firstPlace.current = false;
  }, [selected, placeHighlight]);

  useEffect(() => {
    const toolbar = toolbarRef.current;
    if (!toolbar) return;
    const ro = new ResizeObserver(() => placeHighlight(false));
    ro.observe(toolbar);
    return () => ro.disconnect();
  }, [placeHighlight]);

  return (
    <>
      <div
        ref={toolbarRef}
        className="toolbar"
        role="toolbar"
        aria-label="free play tools"
        aria-orientation="vertical"
      >
        <div ref={highlightRef} className="glyph-highlight" aria-hidden />
        {/* the fp page hides the nav, so leaving and rerolling live up here */}
        <button type="button" className="glyph tool-action" aria-label="exit" onClick={leave}>
          <ExitGlyph size={12} />
        </button>
        <button type="button" className="glyph tool-action" aria-label="new terrain" onClick={newTerrain}>
          <RefreshGlyph size={15} />
        </button>
        <div className="toolbar-divider" />
        {TOOLS.map((t, i) => (
          <Fragment key={t.id}>
            {i > 0 && TOOLS[i - 1].group !== t.group ? <div className="toolbar-divider" /> : null}
            <button
              type="button"
              className="glyph"
              aria-label={t.name}
              aria-pressed={selected === t.id}
              onClick={() => setSelected(t.id)}
              data-tool={t.id}
              onMouseEnter={() => peek(t.id)}
              onMouseLeave={hideSoon}
              onFocus={() => peek(t.id)}
              onBlur={hideSoon}
            >
              <TilePreview tool={t.id} r={19} />
            </button>
          </Fragment>
        ))}
      </div>
      {stage
        ? createPortal(
            <aside
              className="tile-info"
              data-open={hovered ? 'true' : 'false'}
              aria-hidden={!hovered}
              onMouseEnter={keepOpen}
              onMouseLeave={hideSoon}
            >
              <div className="tile-scene">
                <TilePreview tool={tool.id} r={30} scene />
              </div>
              <h2 className="tile-name">{tool.name}</h2>
              <p>{tool.place}</p>
              <p>{tool.score}</p>
            </aside>,
            stage
          )
        : null}
    </>
  );
}
