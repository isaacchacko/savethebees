'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { ExitGlyph } from '@/components/glyphs';
import GameOver from '@/components/GameOver';
import MapCanvas, { type Scene } from '@/components/MapCanvas';
import { useFreePlay } from '@/components/useFreePlay';
import { useGame, type GameView } from '@/components/useGame';
import { useTownSim } from '@/components/useTownSim';
import { emptyBoard, type Board } from '@/lib/map/board';
import { affordable, left as leftToBuild, type Allowance } from '@/lib/map/game';
import { rng } from '@/lib/map/noise';
import { growTown, spawnHousing } from '@/lib/map/sim';
import { scoreBreakdown, type Breakdown } from '@/lib/map/score';
import { SQRT3 } from '@/lib/map/hex';
import { generateTerrain } from '@/lib/map/terrain';
import type { ToolId } from '@/lib/map/tools';

/** The three ways to play with the map. "site" is none of them: the card is up. */
export const MODES = ['idle', 'free', 'game'] as const;

export type Mode = 'site' | (typeof MODES)[number];

const ModeContext = createContext<{
  mode: Mode;
  setMode: (mode: Mode) => void;
  /** Rolls a fresh map, sized to the window as it is now. */
  newTerrain: () => void;
  /** The fp page's selected tool. */
  tool: ToolId;
  setTool: (tool: ToolId) => void;
  /** Takes back the fp page's last action. */
  undo: () => void;
  canUndo: boolean;
  /** What the board on the map is worth, split by what earned it (see lib/map/score). */
  score: Breakdown;
  /** Select mode on the fp page: tiles show what they're worth instead of being built on. */
  selecting: boolean;
  setSelecting: (on: boolean) => void;
  /** The game page's clock and day, when it's on. */
  game: GameView | null;
  /** What the game still lets you build, when it's on. */
  left: Allowance | null;
}>({
  mode: 'site',
  setMode: () => {},
  newTerrain: () => {},
  tool: 'house',
  setTool: () => {},
  undo: () => {},
  canUndo: false,
  score: { total: 0, housing: 0, park: 0, mountain: 0 },
  selecting: false,
  setSelecting: () => {},
  game: null,
  left: null,
});

/** The fp page has a url of its own, so a reload keeps you in free play. */
export const FP_HREF = '/play/free';

/** The game page has one too, so the card can wipe to it like any page. */
export const GAME_HREF = '/play/game';

/** Where leaving the fp or game page goes: back to the intro page they were entered from. */
export const INTRO_HREF = '/play';

/** The map's mode, for controls that live outside the stage's own markup. */
export const useMapMode = () => useContext(ModeContext);


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
  // free play and the game follow the url; idle is plain state
  const [stateMode, setStateMode] = useState<Mode>('site');
  const mode: Mode = pathname === FP_HREF ? 'free' : pathname === GAME_HREF ? 'game' : stateMode;

  const setMode = useCallback(
    (next: Mode) => {
      if (next === 'free' || next === 'game') {
        setStateMode('site');
        router.push(next === 'free' ? FP_HREF : GAME_HREF);
      } else if (pathname === FP_HREF || pathname === GAME_HREF) {
        setStateMode(next);
        router.push(INTRO_HREF);
      } else {
        setStateMode(next);
      }
    },
    [pathname, router]
  );
  const [scene, setScene] = useState<Scene | null>(null);
  const [tool, setTool] = useState<ToolId>('house');
  const [selecting, setSelecting] = useState(false);
  const board = scene?.board ?? null;

  /** A fresh map sized to the window, as `seed` lays it out. */
  const freshMap = useCallback((seed: number) => {
    const stage = stageRef.current;
    if (!stage) return null;
    return emptyBoard(generateTerrain(gridFor(stage.clientWidth, stage.clientHeight), seed));
  }, []);

  // a new map comes with a town already on it, which then keeps growing
  const newTerrain = useCallback(() => {
    const seed = randomSeed();
    const map = freshMap(seed);
    if (map) setScene({ board: growTown(map, rng(seed), 12) });
  }, [freshMap]);

  // the game starts on bare land with a few people already there and no
  // stations yet: building those is the player's job
  const freshGame = useCallback(() => {
    const seed = randomSeed();
    let b: Board | null = freshMap(seed);
    if (!b) return;
    const random = rng(seed);
    for (let k = 0; k < 3; k++) b = spawnHousing(b, random)?.board ?? b;
    setScene({ board: b });
  }, [freshMap]);

  useEffect(newTerrain, [newTerrain]);

  const playing = mode === 'free' || mode === 'game';
  // the game's budget, read through a ref because the day lives in useGame,
  // which needs this hook's history first
  const dayRef = useRef(1);
  const allow = useCallback((next: Board) => mode !== 'game' || affordable(next, dayRef.current), [mode]);
  const play = useFreePlay(board, tool, setScene, playing, selecting, allow);
  const game = useGame(board, setScene, mode === 'game', freshGame, play.clearHistory);
  dayRef.current = game.day;
  useTownSim(board, setScene, mode === 'site' || mode === 'idle');
  // on the map with hands on: free play, or a game that isn't over
  const building = mode === 'free' || (mode === 'game' && game.phase !== 'over');
  const freshGameAgain = game.restart;

  // the game has no houses or terrain to hand out, so start on stations
  useEffect(() => {
    if (mode !== 'game') return;
    setTool('station');
    setSelecting(false);
  }, [mode]);
  const points = useMemo(
    () => (board ? scoreBreakdown(board) : { total: 0, housing: 0, park: 0, mountain: 0 }),
    [board]
  );

  return (
    <ModeContext.Provider
      value={{
        mode,
        setMode,
        newTerrain,
        tool,
        setTool,
        undo: play.undo,
        canUndo: play.canUndo,
        score: points,
        selecting,
        setSelecting,
        game: mode === 'game' ? game : null,
        left: mode === 'game' && board ? leftToBuild(board, game.day) : null,
      }}
    >
      <div ref={stageRef} className="stage" data-mode={mode}>
        <MapCanvas
          scene={scene}
          interactive={building}
          ghost={building ? play.ghost : null}
          preview={play.preview}
          pendingTunnel={building ? play.pendingTunnel : -1}
          labels={building ? play.labels : []}
          onPointer={play.onPointer}
        />
        {children}
        {/* idle has no toolbar and no nav, so this X is its only way back;
            the fp and game pages have theirs in the toolbar */}
        {mode === 'game' && game.phase === 'over' && game.stats ? (
          <GameOver stats={game.stats} reached={game.target} onAgain={freshGameAgain} />
        ) : null}
        {mode === 'idle' ? (
          <div className="modebar">
            <button type="button" className="map-btn" aria-label="exit" onClick={() => setMode('site')}>
              <ExitGlyph />
            </button>
          </div>
        ) : null}
      </div>
    </ModeContext.Provider>
  );
}
