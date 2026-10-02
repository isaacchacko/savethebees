'use client';

import { usePathname, useRouter } from 'next/navigation';
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import GameOver from '@/components/GameOver';
import MapCanvas, { type Scene } from '@/components/MapCanvas';
import Spotlight from '@/components/Spotlight';
import TutorialCard from '@/components/TutorialCard';
import { useFreePlay } from '@/components/useFreePlay';
import { useGame, type GameView } from '@/components/useGame';
import { useTownSim } from '@/components/useTownSim';
import { useTutorial, type TutorialView } from '@/components/useTutorial';
import { emptyBoard, type Board } from '@/lib/map/board';
import { affordable, left as leftToBuild, type Allowance } from '@/lib/map/game';
import { rng } from '@/lib/map/noise';
import { growTown, spawnHousing } from '@/lib/map/sim';
import { scoreBreakdown, type Breakdown } from '@/lib/map/score';
import { SQRT3 } from '@/lib/map/hex';
import { generateTerrain } from '@/lib/map/terrain';
import type { ToolId } from '@/lib/map/tools';
import { islandSpan, tsunami, tutorialIsland, type Island } from '@/lib/map/tutorial';

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
  /** The tutorial's step, while the game is running it. */
  tutorial: TutorialView | null;
  /** Whether the tutorial has been played or skipped; null until it's known. */
  tutorialDone: boolean | null;
  /** Runs the tutorial again on the next game. */
  replayTutorial: () => void;
  /** From watching, straight to the intro page. */
  playFromWatch: () => void;
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
  tutorial: null,
  tutorialDone: null,
  replayTutorial: () => {},
  playFromWatch: () => {},
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

/** The tutorial's island is small, so it is drawn bigger where there's room. */
const TUTORIAL_TILE_PX = 36;

/** Below this width the site is laid out for a phone (globals.css has the same breakpoint). */
const PHONE_PX = 900;

/**
 * On a phone, what the game's UI covers: the status above, the tutorial card
 * and toolbar below — the toolbar taking two rows on the narrowest (see
 * globals.css).
 */
const phoneCovered = (w: number) => ({ top: 90, bottom: w < 380 ? 310 : 260 });

/** Remembers, per browser, that the tutorial has been played or skipped. */
const TUTORIAL_KEY = 'transit-control:tutorial-done';

function readTutorialDone(): boolean {
  try {
    return localStorage.getItem(TUTORIAL_KEY) === '1';
  } catch {
    return false;
  }
}

function writeTutorialDone(done: boolean) {
  try {
    if (done) localStorage.setItem(TUTORIAL_KEY, '1');
    else localStorage.removeItem(TUTORIAL_KEY);
  } catch {
    // private windows and blocked storage just see the tutorial again
  }
}

/**
 * Enough tiles to cover a w × h box, with a ring spare on every side. The grid
 * is fixed when a map is made; a later resize scales it instead (see the spec).
 */
function gridFor(w: number, h: number, tilePx = TILE_PX) {
  return {
    cols: Math.ceil(w / (SQRT3 * tilePx)) + 2,
    rows: Math.ceil(h / (1.5 * tilePx)) + 3,
  };
}

const randomSeed = () => Math.floor(Math.random() * 2 ** 32);

/**
 * The map behind the site, and which of its three modes is on — they are
 * entered from the intro page ("free" is the fp page, "game" the game page).
 * The card gets out of the way (globals.css keys off data-mode): it slides off
 * for idle and the game page, and shrinks to the toolbar on the fp page. The
 * nav hides in all of them, so each has its own X to bring the card back —
 * idle's is the map itself, which is also the way into it from any page but
 * the intro. The first game in a browser is the tutorial.
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

  // watching is left for the intro page by the status's "play?"; the card
  // waits off screen until the intro is there to slide back in with
  const leavingWatch = useRef(false);
  const playFromWatch = useCallback(() => {
    if (pathname === INTRO_HREF) {
      setStateMode('site');
      return;
    }
    leavingWatch.current = true;
    router.push(INTRO_HREF);
  }, [pathname, router]);
  useEffect(() => {
    if (pathname !== INTRO_HREF || !leavingWatch.current) return;
    leavingWatch.current = false;
    setStateMode('site');
  }, [pathname]);

  const [tutorialDone, setTutorialDone] = useState<boolean | null>(null);
  useEffect(() => setTutorialDone(readTutorialDone()), []);
  const finishTutorial = useCallback(() => {
    writeTutorialDone(true);
    setTutorialDone(true);
  }, []);
  const replayTutorial = useCallback(() => {
    writeTutorialDone(false);
    setTutorialDone(false);
  }, []);
  const inTutorial = mode === 'game' && tutorialDone === false;
  const [island, setIsland] = useState<Island | null>(null);
  const [washedOut, setWashedOut] = useState<number[]>([]);
  // the tutorial's catastrophe is always the same tsunami, on its island
  const scriptedStrike = useCallback(
    (b: Board) => {
      const hit = tsunami(b, island!);
      setWashedOut(hit.tiles);
      return { board: hit.board, origin: hit.origin, kind: 'tsunami' as const };
    },
    [island]
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

  // the tutorial's island instead: on its side on a tall screen, with tiles
  // small enough to fit it all in the room the UI leaves
  const freshIsland = useCallback(() => {
    const stage = stageRef.current;
    if (!stage) return;
    const w = stage.clientWidth;
    const h = stage.clientHeight;
    const orientation = h > w ? 'tall' : 'wide';
    const covered = w < PHONE_PX ? phoneCovered(w) : { top: 0, bottom: 0 };
    const room = h - covered.top - covered.bottom;
    const span = islandSpan(orientation);
    const tilePx = Math.min(TUTORIAL_TILE_PX, w / (SQRT3 * span.cols), room / (1.5 * span.rows));
    const made = tutorialIsland(gridFor(w, h, tilePx), orientation, {
      x: 0.5,
      y: (covered.top + room / 2) / h,
    });
    setIsland(made);
    setWashedOut([]);
    setScene({ board: made.board });
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
    if (inTutorial) {
      freshIsland();
      return;
    }
    const seed = randomSeed();
    let b: Board | null = freshMap(seed);
    if (!b) return;
    const random = rng(seed);
    for (let k = 0; k < 3; k++) b = spawnHousing(b, random)?.board ?? b;
    setScene({ board: b });
  }, [freshMap, freshIsland, inTutorial]);

  useEffect(newTerrain, [newTerrain]);

  const playing = mode === 'free' || mode === 'game';
  // the game's budget, read through a ref because the day lives in useGame,
  // which needs this hook's history first
  const dayRef = useRef(1);
  const allow = useCallback((next: Board) => mode !== 'game' || affordable(next, dayRef.current), [mode]);
  const play = useFreePlay(board, tool, setScene, playing, selecting, allow);
  // held back until it's known whether this game is the tutorial, so a first
  // visit doesn't flash a random map before the island
  const game = useGame(board, setScene, mode === 'game' && tutorialDone !== null, freshGame, play.clearHistory, inTutorial, inTutorial && island ? scriptedStrike : undefined);
  dayRef.current = game.day;
  useTownSim(board, setScene, mode === 'site' || mode === 'idle', newTerrain);
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
  const tutorial = useTutorial(inTutorial, island, {
    board,
    game,
    score: points,
    selecting,
    pinned: play.pinned,
    undos: play.undos,
    washedOut,
  });
  // show me lights what the step points at, so it needs something to point at
  const spotlit = !!tutorial?.showing && (tutorial.tiles.length > 0 || !!tutorial.hint);

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
        tutorial,
        tutorialDone,
        replayTutorial,
        playFromWatch,
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
          hints={tutorial?.tiles}
          onPointer={play.onPointer}
          // on any page but the intro, which has its own Watch button, the
          // map behind the card is a way into watching
          onPress={mode === 'site' && pathname !== INTRO_HREF ? () => setMode('idle') : undefined}
        />
        {children}
        {tutorial ? <Spotlight on={spotlit} board={board} tiles={tutorial.tiles} /> : null}
        {tutorial ? <TutorialCard step={tutorial} onFinish={finishTutorial} /> : null}
        {mode === 'game' && !inTutorial && game.phase === 'over' && game.stats ? (
          <GameOver stats={game.stats} reached={game.target} onAgain={freshGameAgain} />
        ) : null}
        {/* watching (idle) has no toolbar and no nav: a click anywhere on the
            map is the way back to the page it was entered from; the
            status's "play?" goes to the intro page instead */}
        {mode === 'idle' ? (
          <button type="button" className="watch-exit" aria-label="back to the site" onClick={() => setMode('site')} />
        ) : null}
      </div>
    </ModeContext.Provider>
  );
}
