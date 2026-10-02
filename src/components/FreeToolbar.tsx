'use client';

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { MouseEvent } from 'react';
import { createPortal } from 'react-dom';
import { ExitGlyph, RefreshGlyph, UndoGlyph } from '@/components/glyphs';
import { useSlide } from '@/components/slide';
import { INTRO_HREF, useMapMode } from '@/components/Stage';
import TilePreview from '@/components/TilePreview';
import type { Allowance } from '@/lib/map/game';
import { TOOLS, type Tool, type ToolId } from '@/lib/map/tools';

/**
 * Select mode, as a glyph beside the eraser: not a thing to place but a way
 * to look, so it lives here rather than in TOOLS.
 */
const SELECT: Omit<Tool, 'id' | 'group'> & { id: 'select' } = {
  id: 'select',
  key: 'esc',
  name: 'select',
  place: 'click a tile to pin what it’s worth, then hover others to compare. esc goes in; esc again leaves the map.',
  score: 'a tile is worth how far the score would drop without it — so stations and rail show what they connect.',
};

type Shown = ToolId | 'select';

/** What the game hands the player: no houses (people turn up on their own) and no terrain. */
const GAME_TOOLS = new Set<ToolId>(['park', 'station', 'tunnel', 'rail', 'erase']);

/** The tools the game rations, by the allowance field that counts them. */
const BUDGETED = new Set<ToolId>(['station', 'park', 'tunnel']);

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
  const { mode, left, newTerrain, tool: selected, setTool, undo, canUndo, selecting, setSelecting, tutorial } =
    useMapMode();
  // what the tutorial's step wants pressed, if anything
  const hint = tutorial?.hint ?? null;
  const tools = mode === 'game' ? TOOLS.filter((t) => GAME_TOOLS.has(t.id)) : TOOLS;
  const toolsRef = useRef(tools);
  toolsRef.current = tools;
  // picking any tool, by click or key, leaves select mode
  const setSelected = useCallback(
    (id: ToolId) => {
      setTool(id);
      setSelecting(false);
    },
    [setTool, setSelecting]
  );
  const slide = useSlide();
  const [hovered, setHovered] = useState<Shown | null>(null);
  // the last tool hovered, kept while the info card fades out so it never
  // empties mid-fade
  const [shown, setShown] = useState<Shown>('house');
  const [stage, setStage] = useState<HTMLElement | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  useEffect(() => setStage(document.querySelector<HTMLElement>('.stage')), []);

  const tool = shown === 'select' ? SELECT : (TOOLS.find((t) => t.id === shown) ?? TOOLS[0]);

  // each tool's letter picks it (see tools.ts), and esc goes into select mode
  // — and from there, like the X, off the map;
  // left alone with a modifier held, so ctrl/cmd + z and the browser's own
  // shortcuts still work
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === 'Escape') {
        e.preventDefault();
        // the tutorial would be lost by leaving, so there it only toggles
        if (!selectingRef.current) setSelecting(true);
        else if (tutorialRef.current) setSelecting(false);
        else leaveRef.current();
        return;
      }
      // the target is the window or document when nothing has focus, and
      // neither has closest()
      const typing = e.target instanceof Element && e.target.closest('input, textarea, [contenteditable="true"]');
      if (typing) return;
      const picked = toolsRef.current.find((t) => t.key === e.key.toLowerCase());
      if (!picked) return;
      e.preventDefault();
      setSelected(picked.id);
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [setSelected, setSelecting]);
  const hideTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(hideTimer.current), []);

  // no info card while the toolbar is still arriving (the card shrinking, the
  // glyphs sliding in) or already leaving; a glyph the mouse settled on
  // meanwhile opens once it is ready
  const [ready, setReady] = useState(false);
  const pointedAt = useRef<Shown | null>(null);

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

  const peek = (id: Shown) => {
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
  const leaveRef = useRef(leave);
  leaveRef.current = leave;
  const tutorialRef = useRef(tutorial);
  tutorialRef.current = tutorial;

  const keepOpen = () => clearTimeout(hideTimer.current);

  // placed straight on the DOM, like the nav's indicator, so React never
  // fights it over the style. Picking a tool slides it; anything else that
  // moves the glyphs — the card shrinking into the toolbar on the way in, a
  // window resize — snaps it, since the glyphs sit centered in a card whose
  // height is still changing.
  const selectedRef = useRef(selected);
  selectedRef.current = selected;
  const selectingRef = useRef(selecting);
  selectingRef.current = selecting;

  // stable, so the resize observer below subscribes once — a fresh observe()
  // fires straight away, which would snap the highlight mid-slide
  const placeHighlight = useCallback((slide: boolean) => {
    const glyph = toolbarRef.current?.querySelector<HTMLElement>(
      `[data-tool="${selectingRef.current ? 'select' : selectedRef.current}"]`
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
  }, [selected, selecting, placeHighlight]);

  useEffect(() => {
    const toolbar = toolbarRef.current;
    if (!toolbar) return;
    const ro = new ResizeObserver(() => placeHighlight(false));
    ro.observe(toolbar);
    return () => ro.disconnect();
  }, [placeHighlight]);

  // a clicked glyph doesn't take focus: after any keyboard use the browser
  // would draw its focus ring on it, which a key shortcut never does. Tabbing
  // still focuses glyphs, ring and all.
  const noFocus = (e: MouseEvent<HTMLButtonElement>) => e.preventDefault();

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
        <button type="button" className="glyph tool-action" aria-label="exit" onMouseDown={noFocus} onClick={leave}>
          <ExitGlyph size={12} />
        </button>
        {/* a game is played out on the map it started with */}
        {mode === 'free' ? (
          <button
            type="button"
            className="glyph tool-action"
            aria-label="new terrain"
            onMouseDown={noFocus}
            onClick={newTerrain}
          >
            <RefreshGlyph size={15} />
          </button>
        ) : null}
        <button
          type="button"
          className="glyph tool-action"
          aria-label="undo"
          title="undo (ctrl/cmd + z)"
          disabled={!canUndo}
          data-hint={hint === 'undo' ? 'true' : undefined}
          onMouseDown={noFocus}
          onClick={undo}
        >
          <UndoGlyph size={14} />
        </button>
        <div className="toolbar-divider" />
        {tools.map((t, i) => (
          <Fragment key={t.id}>
            {i > 0 && tools[i - 1].group !== t.group ? <div className="toolbar-divider" /> : null}
            <button
              type="button"
              className="glyph"
              aria-label={left && BUDGETED.has(t.id) ? `${t.name}, ${left[t.id as keyof Allowance]} left` : t.name}
              aria-keyshortcuts={t.key}
              title={`${t.name} (${t.key})`}
              aria-pressed={!selecting && selected === t.id}
              onMouseDown={noFocus}
              onClick={() => setSelected(t.id)}
              data-tool={t.id}
              data-hint={hint === t.id ? 'true' : undefined}
              onMouseEnter={() => peek(t.id)}
              onMouseLeave={hideSoon}
              onFocus={() => peek(t.id)}
              onBlur={hideSoon}
            >
              <TilePreview tool={t.id} r={17} />
              {left && BUDGETED.has(t.id) ? (
                <span className="glyph-count">{left[t.id as keyof Allowance]}</span>
              ) : null}
            </button>
            {/* select mode sits with the eraser, after it */}
            {t.group === 'erase' ? (
              <button
                type="button"
                className="glyph"
                aria-label="select"
                aria-keyshortcuts="Escape"
                title="select (esc)"
                aria-pressed={selecting}
                onMouseDown={noFocus}
                onClick={() => setSelecting(true)}
                data-tool="select"
                data-hint={hint === 'select' ? 'true' : undefined}
                onMouseEnter={() => peek('select')}
                onMouseLeave={hideSoon}
                onFocus={() => peek('select')}
                onBlur={hideSoon}
              >
                <TilePreview tool="select" r={17} />
              </button>
            ) : null}
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
              <h2 className="tile-name">
                {tool.key.length === 1 ? (
                  <>
                    <span className="tile-key">[{tool.name[0]}]</span>
                    {tool.name.slice(1)}
                  </>
                ) : (
                  <>
                    {tool.name} <span className="tile-key">[{tool.key}]</span>
                  </>
                )}
              </h2>
              <p>{tool.place}</p>
              <p>{tool.score}</p>
            </aside>,
            stage
          )
        : null}
    </>
  );
}
