'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import type { GameView } from '@/components/useGame';
import type { Allowance } from '@/lib/map/game';
import { PARK, STATION, TUNNEL, canPlace, isHouse, type Board } from '@/lib/map/board';
import { neighbors } from '@/lib/map/hex';
import { networks, type Breakdown } from '@/lib/map/score';
import { tunnelPairs } from '@/lib/map/sim';
import type { Island } from '@/lib/map/tutorial';
import type { ToolId } from '@/lib/map/tools';

/** What a step points at off the map: a toolbar glyph, the undo button, or part of the status. */
export type Hint = ToolId | 'select' | 'undo' | 'start' | 'score';

type Now = {
  board: Board;
  island: Island;
  game: GameView;
  score: Breakdown;
  selecting: boolean;
  pinned: number;
  /** Since the step began: something was taken off the board, and undo was used. */
  erased: boolean;
  undid: boolean;
  /** The last catastrophe's headline, kept after the status lets it go. */
  struckBy: string;
  /** The tiles the tutorial's tsunami drowned. */
  washedOut: number[];
  /** What the day still lets the player build. */
  left: Allowance | null;
};

/** The tools the day rations, which a step can run out of. */
type Rationed = keyof Allowance;

type Step = {
  id: string;
  title: string | ((n: Now) => string);
  text: string | ((n: Now) => string);
  touch?: string;
  hint?: Hint | ((n: Now) => Hint);
  tiles?: (n: Now) => number[];
  /** Met by playing; a step without one waits for its button instead. */
  done?: (n: Now) => boolean;
  /** The rationed tool the step still needs, so running out of it can be caught. */
  needs?: Rationed | ((n: Now) => Rationed | null);
};

const NAMES: Record<Rationed, string> = { station: 'stations', park: 'parks', tunnel: 'tunnels', rail: 'rail' };

/**
 * Built where it can't help: a station no house needs (none beside it, or
 * each beside it has another), a park by no station. A
 * step that has run out of something rings these as the ones to erase.
 */
function strays(b: Board, tool: Rationed): number[] {
  const out: number[] = [];
  b.build.forEach((v, i) => {
    const by = (test: (n: number) => boolean) => neighbors(b, i).some(test);
    // a station is only needed by a house it alone serves
    const needed = by((n) => isHouse(b.build[n]) && stationsBy(b, n).length === 1);
    if (tool === 'station' && v === STATION && !needed) out.push(i);
    if (tool === 'park' && v === PARK && !by((n) => b.build[n] === STATION)) out.push(i);
  });
  return out;
}

const stationsBy = (b: Board, home: number) => neighbors(b, home).filter((n) => b.build[n] === STATION);
const spotsBy = (b: Board, home: number) => neighbors(b, home).filter((n) => canPlace(b, 'station', n));
const served = (b: Board, home: number) => stationsBy(b, home).length > 0;

function linked(b: Board, h: number, k: number): boolean {
  const net = networks(b);
  return stationsBy(b, h).some((s) => stationsBy(b, k).some((t) => net[s] === net[t]));
}

const builtCount = (b: Board) => b.build.reduce((n, v, i) => n + (v ? 1 : 0) + (b.rail[i] ? 1 : 0), 0);

/**
 * The tutorial, one thing at a time on the island (lib/map/tutorial): each
 * step names a thing, says the key that picks it, rings where it goes, and
 * moves on once it has been done — however the tool was picked. Then a short
 * day with a scripted tsunami in it, and the result.
 *
 * Text marks keys as [key], drawn as key caps. `touch` is the same line for a
 * device without a keyboard, where the toolbar is the only way to pick.
 */
const STEPS: Step[] = [
  {
    id: 'station',
    title: 'Stations',
    text: 'People board at a station next to home. Press [s], then build one by this house.',
    touch: 'People board at a station next to home. Pick the station, then build one by this house.',
    hint: 'station',
    needs: 'station',
    tiles: ({ board, island }) => spotsBy(board, island.homes.a),
    done: ({ board, island }) => served(board, island.homes.a),
  },
  {
    id: 'station-2',
    title: 'Another',
    text: 'And one by this house.',
    hint: 'station',
    needs: 'station',
    tiles: ({ board, island }) => spotsBy(board, island.homes.b),
    done: ({ board, island }) => served(board, island.homes.b),
  },
  {
    id: 'rail',
    title: 'Rail',
    text: 'Press [r], then drag from one station to the other.',
    touch: 'Pick rail, then drag from one station to the other.',
    hint: 'rail',
    tiles: ({ board, island }) => [...stationsBy(board, island.homes.a), ...stationsBy(board, island.homes.b)],
    done: ({ board, island }) => linked(board, island.homes.a, island.homes.b),
  },
  {
    id: 'points',
    title: 'Points',
    text: 'Everyone scores a point for each person they can reach.',
    hint: 'score',
  },
  {
    id: 'park',
    title: 'Parks',
    text: 'Anyone who can reach a park scores for it. Press [p] and build one by a station.',
    touch: 'Anyone who can reach a park scores for it. Pick the park and build one by a station.',
    hint: 'park',
    needs: 'park',
    tiles: ({ board }) => {
      const out = new Set<number>();
      board.build.forEach((v, i) => {
        if (v === STATION) for (const n of neighbors(board, i)) if (canPlace(board, 'park', n)) out.add(n);
      });
      return [...out];
    },
    done: ({ score }) => score.park > 0,
  },
  {
    id: 'tunnel',
    title: 'Tunnels',
    text: 'Only a tunnel crosses water. Press [t], then click this shore and that one.',
    touch: 'Only a tunnel crosses water. Pick the tunnel, then tap this shore and that one.',
    hint: 'tunnel',
    tiles: ({ board, island }) => island.shores.filter((s) => canPlace(board, 'tunnel', s)),
    done: ({ board }) => tunnelPairs(board) > 0,
  },
  {
    id: 'across',
    title: 'Across',
    text: 'Now get this house on the network: [s] for a station, [r] for rail.',
    touch: 'Now get this house on the network.',
    hint: ({ board, island }) => (served(board, island.homes.c) ? 'rail' : 'station'),
    needs: ({ board, island }) => (served(board, island.homes.c) ? null : 'station'),
    tiles: ({ board, island }) => {
      const c = island.homes.c;
      if (!served(board, c)) return spotsBy(board, c);
      const mouths = Array.from(board.build.keys()).filter((i) => board.build[i] === TUNNEL);
      return [...stationsBy(board, c), ...mouths];
    },
    done: ({ board, island: { homes } }) => linked(board, homes.a, homes.c) || linked(board, homes.b, homes.c),
  },
  {
    id: 'inspect',
    title: 'Inspect',
    text: 'Press [esc], then click any tile to see what it’s worth.',
    touch: 'Pick the magnifier, then tap any tile to see what it’s worth.',
    hint: 'select',
    done: ({ selecting, pinned }) => selecting && pinned >= 0,
  },
  {
    id: 'erase',
    title: 'Erase',
    text: 'Press [e] for the eraser and erase anything. Right-click erases too.',
    touch: 'Pick the eraser and erase anything.',
    hint: 'erase',
    done: ({ erased }) => erased,
  },
  {
    id: 'undo',
    title: 'Undo',
    text: 'Press [ctrl/cmd+z] to bring it back.',
    touch: 'Tap undo to bring it back.',
    hint: 'undo',
    done: ({ undid }) => undid,
  },
  {
    id: 'start',
    title: 'Day one',
    text: 'Press [enter] to start the clock. People keep moving in while it runs.',
    touch: 'Start the clock. People keep moving in while it runs.',
    hint: 'start',
    done: ({ game }) => game.phase !== 'break',
  },
  {
    id: 'grow',
    title: 'Keep up',
    text: 'Get the newcomers on the network. Beat the target by sundown.',
    hint: 'score',
    done: ({ game }) => game.struck > 0 || game.phase === 'over',
  },
  {
    id: 'strike',
    title: ({ struckBy }) => struckBy,
    text: 'It washed out your rail. Every other day the land fights back: rebuild before sundown.',
    tiles: ({ washedOut }) => washedOut,
    done: ({ game }) => game.phase === 'over',
  },
  {
    id: 'sundown',
    title: 'Sundown',
    text: ({ game }) => {
      const got = game.stats?.score ?? 0;
      return got >= game.target
        ? 'You beat the target. The real game asks for a bit more every day.'
        : `${game.target - got} short. In the real game, that ends it.`;
    },
  },
];

/** The card's last step: the one that hands over to the real game. */
export const LAST_STEP = STEPS.length - 1;

const START_STEP = STEPS.findIndex((s) => s.id === 'start');

/** How long a met step shows its tick before the next one comes up. */
const ADVANCE_MS = 700;

export type TutorialView = {
  index: number;
  count: number;
  title: string;
  text: string;
  /** The text for a device without a keyboard. */
  touch: string;
  /** Met, and about to move on. */
  met: boolean;
  /** Waiting on its button rather than on play. */
  manual: boolean;
  hint: Hint | null;
  tiles: number[];
  /** Whether the day may start yet: not until the steps before it are done. */
  canStart: boolean;
  next: () => void;
  /** Show me: the page dimmed but for what the step points at. It stays on from step to step. */
  showing: boolean;
  setShowing: (on: boolean) => void;
};

export function useTutorial(
  active: boolean,
  island: Island | null,
  now: Omit<Now, 'board' | 'island' | 'erased' | 'undid' | 'struckBy'> & { board: Board | null; undos: number }
): TutorialView | null {
  const [index, setIndex] = useState(0);
  const [erased, setErased] = useState(false);
  const [undosAtStart, setUndosAtStart] = useState(0);
  const [struckBy, setStruckBy] = useState('Tsunami!');
  const [showing, setShowing] = useState(false);
  const lastBoard = useRef(now.board);

  // every visit starts over, as does every fresh island
  useEffect(() => {
    setIndex(0);
    setShowing(false);
  }, [active, island]);

  useEffect(() => {
    setErased(false);
    setUndosAtStart(now.undos);
    // only when the step changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  useEffect(() => {
    const last = lastBoard.current;
    if (now.board && last && builtCount(now.board) < builtCount(last)) setErased(true);
    lastBoard.current = now.board;
  }, [now.board]);

  useEffect(() => {
    if (now.game.alert) setStruckBy(now.game.alert);
  }, [now.game.alert]);

  const step = STEPS[index];
  const { board } = now;
  const full: Now | null =
    island && board ? { ...now, board, island, erased, undid: now.undos > undosAtStart, struckBy } : null;
  const met = !!full && !!step.done?.(full);
  const read = <T>(v: T | ((n: Now) => T)) => (typeof v === 'function' ? (v as (n: Now) => T)(full!) : v);

  // run out of what the step needs (a stray station, a park out of reach)
  // and it turns into erasing one that isn't helping
  const needs = full && !met && step.needs ? read(step.needs) : null;
  const outOf = needs && full?.left && full.left[needs] <= 0 ? needs : null;

  useEffect(() => {
    if (!active || !met) return;
    const id = setTimeout(() => setIndex((i) => Math.min(i + 1, LAST_STEP)), ADVANCE_MS);
    return () => clearTimeout(id);
  }, [active, met, index]);

  const tiles = outOf ? strays(full!.board, outOf) : full && step.tiles && !met ? step.tiles(full) : null;
  const tilesKey = tiles?.join() ?? '';
  // the same rings keep the same array, so the canvas isn't told twice
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const stableTiles = useMemo(() => tiles ?? [], [tilesKey]);

  if (!active || !full) return null;
  const text = outOf
    ? `No ${NAMES[outOf]} left. Press [e] and erase one that isn’t helping, then try again.`
    : read(step.text);
  const touch = outOf
    ? `No ${NAMES[outOf]} left. Pick the eraser and clear one that isn’t helping, then try again.`
    : (step.touch ?? text);
  return {
    index,
    count: STEPS.length,
    title: read(step.title),
    text,
    touch,
    met,
    manual: !step.done,
    hint: outOf ? 'erase' : step.hint && !met ? read(step.hint) : null,
    tiles: stableTiles,
    canStart: index >= START_STEP,
    next: () => setIndex((i) => Math.min(i + 1, LAST_STEP)),
    showing,
    setShowing,
  };
}
