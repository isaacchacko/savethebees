'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Scene } from '@/components/MapCanvas';
import { PARK, STATION, isHouse, type Board } from '@/lib/map/board';
import { CATASTROPHE_AT, DAY_MS, SPREAD, arrivals, isCatastropheDay, targetFor, type Stats } from '@/lib/map/game';
import { neighbors } from '@/lib/map/hex';
import { score } from '@/lib/map/score';
import { catastrophe, spawnHousing, tunnelPairs } from '@/lib/map/sim';

/**
 * Where the game is: a breather before a day (to build and rearrange, the
 * clock stopped), a day running, or over.
 */
export type Phase = 'break' | 'day' | 'over';

export type GameView = {
  phase: Phase;
  /** The day being played, or about to be. */
  day: number;
  /** How much of the day is left, 1 → 0. */
  left: number;
  /** The score this day has to end on. */
  target: number;
  stats: Stats | null;
  /** What just hit the town, shown for a few seconds after it strikes. */
  alert: string | null;
  startDay: () => void;
  /** A whole new game, on a new map. */
  restart: () => void;
};

function statsOf(b: Board, days: number, best: number, catastrophes: number): Stats {
  let people = 0;
  let served = 0;
  let stations = 0;
  let rail = 0;
  let parks = 0;
  b.build.forEach((v, i) => {
    if (isHouse(v)) {
      people += v;
      if (neighbors(b, i).some((n) => b.build[n] === STATION)) served += v;
    }
    if (v === STATION) stations++;
    if (v === PARK) parks++;
    if (b.rail[i]) rail++;
  });
  const now = score(b);
  return {
    days,
    score: now,
    best: Math.max(best, now),
    people,
    served,
    stations,
    rail,
    tunnels: tunnelPairs(b),
    parks,
    catastrophes,
  };
}

/**
 * The game page's clock. Each day runs for DAY_MS while new residents turn up
 * at odd intervals, scattered; every other day a catastrophe strikes partway
 * through. When the day runs out the score is held against its target — 90%
 * of what the planner could do with the same people and allowance — and
 * reaching it earns a breather, with more to build with, before the next;
 * falling short ends it. `fresh` starts a new game when the page
 * is entered; `spawned` is told about each arrival so undo can forget it.
 */
export function useGame(
  board: Board | null,
  commit: (scene: Scene) => void,
  active: boolean,
  fresh: () => void,
  spawned: () => void
) {
  const [phase, setPhase] = useState<Phase>('break');
  const [day, setDay] = useState(1);
  const [left, setLeft] = useState(1);
  const [stats, setStats] = useState<Stats | null>(null);
  const boardRef = useRef(board);
  boardRef.current = board;
  const endsAt = useRef(0);
  const nextArrival = useRef(0);
  const strikesAt = useRef(Infinity);
  const best = useRef(0);
  const catastrophes = useRef(0);
  const [alert, setAlert] = useState<string | null>(null);
  const alertTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(alertTimer.current), []);

  // the target follows the people on the map, not what the player builds, so
  // it's only worked out again when someone arrives (or a new day begins)
  const homes = board ? board.build.map((v) => (isHouse(v) ? v : 0)).join('') : '';
  const target = useMemo(
    () => (board ? targetFor(board, day) : 1),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [homes, day, board?.seed]
  );

  const restart = useCallback(() => {
    fresh();
    setPhase('break');
    setDay(1);
    setLeft(1);
    setStats(null);
    setAlert(null);
    best.current = 0;
    catastrophes.current = 0;
  }, [fresh]);

  // a new game every time the page is entered
  useEffect(() => {
    if (active) restart();
  }, [active, restart]);

  const startDay = useCallback(() => {
    const now = performance.now();
    endsAt.current = now + DAY_MS;
    nextArrival.current = now + 1500;
    strikesAt.current = isCatastropheDay(day) ? now + DAY_MS * CATASTROPHE_AT : Infinity;
    setLeft(1);
    setPhase('day');
  }, [day]);

  useEffect(() => {
    if (!active || phase !== 'day') return;
    const id = setInterval(() => {
      const b = boardRef.current;
      if (!b) return;
      const now = performance.now();
      best.current = Math.max(best.current, score(b));

      if (now >= strikesAt.current) {
        strikesAt.current = Infinity;
        const hit = catastrophe(b, Math.random);
        commit(hit);
        spawned();
        catastrophes.current++;
        setAlert(hit.kind === 'flood' ? 'Flood!' : 'Landslide!');
        clearTimeout(alertTimer.current);
        alertTimer.current = setTimeout(() => setAlert(null), 5000);
        return;
      }

      if (now >= nextArrival.current) {
        const step = spawnHousing(b, Math.random, SPREAD);
        if (step) {
          commit(step);
          spawned();
        }
        nextArrival.current = now + (DAY_MS / arrivals(day)) * (0.5 + Math.random());
      }

      const remaining = endsAt.current - now;
      setLeft(Math.max(0, remaining / DAY_MS));
      if (remaining > 0) return;
      if (score(b) >= targetFor(b, day)) {
        setDay(day + 1);
        setPhase('break');
      } else {
        setStats(statsOf(b, day - 1, best.current, catastrophes.current));
        setPhase('over');
      }
    }, 200);
    return () => clearInterval(id);
  }, [active, phase, day, commit, spawned]);

  const view: GameView = { phase, day, left, target, stats, alert, startDay, restart };
  return view;
}
