'use client';

import { useEffect, useRef } from 'react';
import type { Scene } from '@/components/MapCanvas';
import { isHouse, type Board } from '@/lib/map/board';
import { tileCount } from '@/lib/map/hex';
import { catastrophe, planStep, spawnHousing } from '@/lib/map/sim';

/** How often the town takes a step: a new resident, or the planner catching up. */
const STEP_MS = 1800;

/** Steps between catastrophes, about a minute and a half. */
const STEPS_PER_CATASTROPHE = 50;

/**
 * The town that grows behind the site, and in idle mode: people keep moving
 * in, and the planner (lib/map/sim) keeps them served and connected —
 * stations, rail, tunnels, parks, and land reshaped where it has to be. Now
 * and then a flood or landslide tears through the rail, and the planner
 * builds it back. It eases off once the town fills its share of the map, and
 * rests while the tab is hidden.
 */
export function useTownSim(board: Board | null, commit: (scene: Scene) => void, active: boolean) {
  const boardRef = useRef(board);
  boardRef.current = board;

  useEffect(() => {
    if (!active) return;
    let steps = 0;
    const id = setInterval(() => {
      const b = boardRef.current;
      if (!b || document.hidden) return;
      steps++;
      if (steps % STEPS_PER_CATASTROPHE === 0 && b.rail.some((r) => r !== 0)) {
        commit(catastrophe(b, Math.random));
        return;
      }
      const people = b.build.reduce((n, v) => n + (isHouse(v) ? v : 0), 0);
      const room = people < tileCount(b) / 9;
      const step =
        (Math.random() < 0.45 && room ? spawnHousing(b, Math.random) : null) ??
        planStep(b, Math.random) ??
        (room ? spawnHousing(b, Math.random) : null);
      if (step) commit(step);
    }, STEP_MS);
    return () => clearInterval(id);
  }, [active, commit]);
}
