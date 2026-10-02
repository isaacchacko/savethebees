'use client';

import { useEffect, useRef } from 'react';
import type { Scene } from '@/components/MapCanvas';
import { isHouse, type Board } from '@/lib/map/board';
import { tileCount } from '@/lib/map/hex';
import { planStep, spawnHousing } from '@/lib/map/sim';

/** How often the town takes a step: a new resident, or the planner catching up. */
const STEP_MS = 1800;

/**
 * The town that grows behind the site, and in idle mode: people keep moving
 * in, and the planner (lib/map/sim) keeps them served and connected —
 * stations, rail, tunnels, and land reshaped where it has to be. It eases off
 * once the town fills its share of the map, and rests while the tab is hidden.
 */
export function useTownSim(board: Board | null, commit: (scene: Scene) => void, active: boolean) {
  const boardRef = useRef(board);
  boardRef.current = board;

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => {
      const b = boardRef.current;
      if (!b || document.hidden) return;
      const people = b.build.reduce((n, v) => n + (isHouse(v) ? v : 0), 0);
      const room = people < tileCount(b) / 9;
      // the planner goes first when it has work, so nobody waits long
      const step = (Math.random() < 0.45 && room ? spawnHousing(b, Math.random) : null) ?? planStep(b, Math.random) ?? (room ? spawnHousing(b, Math.random) : null);
      if (step) commit(step);
    }, STEP_MS);
    return () => clearInterval(id);
  }, [active, commit]);
}
