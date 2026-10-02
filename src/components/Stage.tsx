'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ExitGlyph } from '@/components/glyphs';
import TerrainCanvas from '@/components/TerrainCanvas';
import { SQRT3 } from '@/lib/map/hex';
import { generateTerrain, type TerrainMap } from '@/lib/map/terrain';

/** The three ways to play with the map. "site" is none of them: the card is up. */
export const MODES = ['idle', 'free', 'game'] as const;

export type Mode = 'site' | (typeof MODES)[number];

const ModeContext = createContext<{
  mode: Mode;
  setMode: (mode: Mode) => void;
  /** Rolls a fresh map, sized to the window as it is now. */
  newTerrain: () => void;
}>({
  mode: 'site',
  setMode: () => {},
  newTerrain: () => {},
});

/** The fp page has a url of its own, so a reload keeps you in free play. */
export const FP_HREF = '/play/free';

/** Where leaving the fp page goes: back to the intro page it was entered from. */
export const INTRO_HREF = '/play';

/** The map's mode, for controls that live outside the stage's own markup. */
export const useMapMode = () => useContext(ModeContext);

const HINTS: Record<Mode, string> = {
  site: '',
  idle: 'idle · a town that builds itself · coming soon',
  free: 'free play',
  game: 'game mode · not built yet',
};

/** Hex radius in px that the grid is sized for when a map is made. */
const TILE_PX = 24;

/**
 * Enough tiles to cover a w × h box, with a ring spare on every side. The grid
 * is fixed when a map is made; a later resize scales it instead (see the spec).
 */
function gridFor(w: number, h: number) {
  return {
    cols: Math.ceil(w / (SQRT3 * TILE_PX)) + 2,
    rows: Math.ceil(h / (1.5 * TILE_PX)) + 3,
  };
}

const randomSeed = () => Math.floor(Math.random() * 2 ** 32);

/**
 * The map behind the site, and which of its three modes is on — they are
 * entered from the intro page ("free" is the fp page, "game" the game page).
 * The card gets out of the way (globals.css keys off data-mode): it slides off
 * for idle and the game page, and shrinks to the toolbar on the fp page. The
 * nav hides in all of them, so each has its own X to bring the card back.
 */
export default function Stage({ children }: { children: ReactNode }) {
  const stageRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  // idle and the game page are plain state for now; free play follows the url
  const [stateMode, setStateMode] = useState<Mode>('site');
  const mode: Mode = pathname === FP_HREF ? 'free' : stateMode;

  const setMode = useCallback(
    (next: Mode) => {
      if (next === 'free') {
        setStateMode('site');
        router.push(FP_HREF);
      } else if (pathname === FP_HREF) {
        setStateMode(next);
        router.push(INTRO_HREF);
      } else {
        setStateMode(next);
      }
    },
    [pathname, router]
  );
  const [terrain, setTerrain] = useState<TerrainMap | null>(null);

  const newTerrain = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    setTerrain(generateTerrain(gridFor(stage.clientWidth, stage.clientHeight), randomSeed()));
  }, []);

  useEffect(newTerrain, [newTerrain]);

  return (
    <ModeContext.Provider value={{ mode, setMode, newTerrain }}>
      <div ref={stageRef} className="stage" data-mode={mode}>
        <TerrainCanvas terrain={terrain} />
        {children}
        {mode !== 'site' ? (
          <div className="modebar">
            {/* the fp page's toolbar has its own exit; these modes have no
                toolbar, and the nav is hidden in all of them */}
            {mode !== 'free' ? (
              <button type="button" className="map-btn" aria-label="exit" onClick={() => setMode('site')}>
                <ExitGlyph />
              </button>
            ) : null}
            <span className="mode-hint">
              {HINTS[mode]}
              {terrain ? ` · seed ${terrain.seed}` : ''}
            </span>
          </div>
        ) : null}
      </div>
    </ModeContext.Provider>
  );
}
