'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Ghost, Preview, Scene, TileLabel, TilePointer } from '@/components/MapCanvas';
import {
  EMPTY,
  STATION,
  canPairTunnel,
  canPlace,
  carriesRail,
  erase,
  isHouse,
  layRoute,
  link,
  place,
  placeTunnel,
  route,
  type Board,
} from '@/lib/map/board';
import { hexLine } from '@/lib/map/hex';
import { contribution } from '@/lib/map/score';
import type { ToolId } from '@/lib/map/tools';

/** What a press is in the middle of doing, from pointer down to up. */
type Press =
  | { kind: 'paint' }
  | { kind: 'erase' }
  | { kind: 'route'; from: number }
  | { kind: 'rail'; last: number }
  | null;

/**
 * Free play's hands on the board: turns pointer events over the map into
 * moves with the selected tool, and says what to draw faintly while pointing
 * (the ghost of the tool, a route about to be laid, a half-placed tunnel).
 *
 * - houses, parks, stations, terrain: click, or drag to paint. Clicking a
 *   house grows it; dragging over houses only adds new ones.
 * - tunnels: click one end, then the other — across a straight line of water,
 *   not crossing another tunnel; click the first again to cancel.
 * - rail: drag from a station and the route to the pointer is chosen and
 *   shown in gray — letting go lays it, ending at a station or wherever the
 *   pointer is. With no way through, the straight line shows in red instead
 *   and letting go does nothing. With shift, or starting off a station, drag
 *   paints rail tile by tile.
 * - the eraser, or right click / right drag with any tool, erases.
 * - select mode (esc, see FreeToolbar): clicking a tile pins what it's worth
 *   — how much the score would drop without it — and hovering shows others.
 * - ctrl/cmd + z undoes, one whole action at a time: a drag-paint, a route, a
 *   tunnel pair. A new map starts a fresh history.
 */
const HISTORY_LIMIT = 200;

export function useFreePlay(
  board: Board | null,
  tool: ToolId,
  commit: (scene: Scene) => void,
  active: boolean,
  selecting: boolean,
  /** Whether a board the player is about to make is allowed — the game's budget. */
  allow: (next: Board) => boolean = () => true
) {
  const [hover, setHover] = useState(-1);
  // select mode's clicked tile, whose worth stays shown while others are hovered
  const [pinned, setPinned] = useState(-1);
  useEffect(() => {
    if (!selecting) setPinned(-1);
  }, [selecting]);
  const [preview, setPreview] = useState<Preview | null>(null);
  const [pendingTunnel, setPendingTunnel] = useState(-1);
  const press = useRef<Press>(null);
  const boardRef = useRef(board);
  boardRef.current = board;

  // boards before each action, newest last. An action saves the board it
  // started from, but only once it actually changes something, so a click
  // that does nothing leaves no empty step to undo.
  const history = useRef<Board[]>([]);
  const before = useRef<Board | null>(null);
  const [undoable, setUndoable] = useState(0);
  // how many times undo has been used, for the tutorial to notice
  const [undos, setUndos] = useState(0);

  // a half-placed tunnel means nothing once the tool or the map changes
  useEffect(() => setPendingTunnel(-1), [tool, board?.seed]);

  useEffect(() => {
    history.current = [];
    setUndoable(0);
  }, [board?.seed]);

  const apply = useCallback(
    (next: Board | null, fx: Omit<Scene, 'board'>) => {
      if (!next || !allow(next)) return false;
      if (before.current) {
        history.current.push(before.current);
        if (history.current.length > HISTORY_LIMIT) history.current.shift();
        setUndoable(history.current.length);
        before.current = null;
      }
      boardRef.current = next;
      commit({ board: next, ...fx });
      return true;
    },
    [commit, allow]
  );

  /** Forgets every step: for changes the player didn't make, which undo mustn't take back. */
  const clearHistory = useCallback(() => {
    history.current = [];
    before.current = null;
    setUndoable(0);
  }, []);

  const undo = useCallback(() => {
    const prev = history.current.pop();
    if (!prev) return;
    setUndoable(history.current.length);
    setUndos((n) => n + 1);
    press.current = null;
    before.current = null;
    setPreview(null);
    setPendingTunnel(-1);
    boardRef.current = prev;
    commit({ board: prev });
  }, [commit]);

  useEffect(() => {
    if (!active) return;
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && !e.shiftKey && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        undo();
      }
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [active, undo]);

  const onPointer = useCallback(
    (e: TilePointer) => {
      const b = boardRef.current;
      if (!b) return;
      const i = e.tile;

      if (e.type === 'leave') {
        setHover(-1);
        return;
      }

      if (e.type === 'up') {
        const p = press.current;
        // routed again on the board as it is now, in case it changed under the drag
        const path = p?.kind === 'route' && preview?.ok ? route(b, p.from, preview.path[preview.path.length - 1]) : null;
        if (path) apply(layRoute(b, path), { order: path });
        press.current = null;
        before.current = null;
        setPreview(null);
        return;
      }

      if (e.type === 'down') {
        if (i < 0) return;
        if (selecting && e.button === 0) {
          setPinned((p) => (p === i ? -1 : i));
          return;
        }
        before.current = b;
        if (e.button === 2) {
          press.current = { kind: 'erase' };
          apply(erase(b, i), { origin: i });
          return;
        }
        if (e.button !== 0) return;

        if (tool === 'tunnel') {
          if (pendingTunnel < 0) {
            if (canPlace(b, 'tunnel', i)) setPendingTunnel(i);
          } else if (i === pendingTunnel) {
            setPendingTunnel(-1);
          } else if (apply(placeTunnel(b, pendingTunnel, i), { order: [pendingTunnel, i] })) {
            setPendingTunnel(-1);
          }
          return;
        }

        if (tool === 'rail') {
          if (!e.shift && b.build[i] === STATION) press.current = { kind: 'route', from: i };
          else if (carriesRail(b, i)) press.current = { kind: 'rail', last: i };
          return;
        }

        if (tool === 'erase') {
          press.current = { kind: 'erase' };
          apply(erase(b, i), { origin: i });
          return;
        }

        press.current = { kind: 'paint' };
        apply(place(b, tool, i), { origin: i });
        return;
      }

      // move
      setHover(i);
      const p = press.current;
      if (!p || i < 0) return;
      if (p.kind === 'erase') {
        apply(erase(b, i), { origin: i });
      } else if (p.kind === 'paint') {
        // dragging only puts down new things; growing a house takes a click
        if (tool === 'house' && b.build[i] !== EMPTY) return;
        apply(place(b, tool, i), { origin: i });
      } else if (p.kind === 'route') {
        if (i === p.from) {
          setPreview(null);
          return;
        }
        const path = route(b, p.from, i, false, true);
        setPreview(path ? { path, ok: true } : { path: hexLine(b, p.from, i), ok: false });
      } else if (p.kind === 'rail' && i !== p.last) {
        apply(link(b, p.last, i), { order: [p.last, i] });
        if (carriesRail(boardRef.current!, i)) press.current = { kind: 'rail', last: i };
      }
    },
    [apply, pendingTunnel, preview, selecting, tool]
  );

  // whether placing the tool on a tile would stay within budget, so the ghost
  // can say no before a click does
  const affordable = (t: ToolId, i: number) => {
    if (!board || t === 'rail' || t === 'erase' || t === 'tunnel') return true;
    const next = place(board, t, i);
    return !next || allow(next);
  };

  const routing = press.current?.kind === 'route' || press.current?.kind === 'rail';
  // over a house the house tool would grow it, which a ghost can't show well,
  // so it shows nothing there
  const overHouse = board && hover >= 0 && tool === 'house' && isHouse(board.build[hover]);
  const ghost: Ghost | null =
    board && hover >= 0 && !routing && !overHouse && !selecting
      ? {
          tile: hover,
          tool,
          ok:
            tool === 'tunnel' && pendingTunnel >= 0
              ? canPairTunnel(board, pendingTunnel, hover)
              : canPlace(board, tool, hover) && affordable(tool, hover),
        }
      : null;

  // in select mode, what the pinned and hovered tiles are each worth
  const labels: TileLabel[] = useMemo(() => {
    if (!board || !selecting) return [];
    const out: TileLabel[] = [];
    if (pinned >= 0) out.push({ tile: pinned, value: contribution(board, pinned), pinned: true });
    if (hover >= 0 && hover !== pinned) out.push({ tile: hover, value: contribution(board, hover), pinned: false });
    return out;
  }, [board, selecting, pinned, hover]);

  return { onPointer, ghost, preview, pendingTunnel, labels, pinned, undo, undos, canUndo: undoable > 0, clearHistory };
}
