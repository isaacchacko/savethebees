'use client';

import { useEffect } from 'react';
import RollingNumber from '@/components/RollingNumber';
import { useMapMode } from '@/components/Stage';
import TilePreview from '@/components/TilePreview';
import { isCatastropheDay } from '@/lib/map/game';
import type { Breakdown } from '@/lib/map/score';
import type { ToolId } from '@/lib/map/tools';

// the three kinds of points, each shown with the tile that earns it
const PARTS: { part: Exclude<keyof Breakdown, 'total'>; tool: ToolId; label: string }[] = [
  { part: 'housing', tool: 'house', label: 'from housing' },
  { part: 'park', tool: 'park', label: 'from greenery' },
  { part: 'mountain', tool: 'mountain', label: 'from mountains' },
];

/**
 * Where the nav sits, built like it: the map's own readout while free play
 * or the game is on. It fades in as the nav fades out and back (Card passes
 * the same switch to both). Hovering the score unfolds, to the left, where
 * the points came from.
 *
 * In the game it also keeps the day: during one, a bar running down to its
 * end and the score against the day's target; between them, a breather with
 * the button (or enter) that starts the next — and a warning before a
 * catastrophe day, and the news when one strikes.
 *
 * While watching, it is just "play?", the way to the intro page.
 */
export default function GameStatus({ hidden }: { hidden: boolean }) {
  const { mode, score, game, tutorial, playFromWatch } = useMapMode();
  // the tutorial holds the day back until it gets to it
  const between = game?.phase === 'break' && (!tutorial || tutorial.canStart);
  const hint = tutorial?.hint;

  useEffect(() => {
    if (!game || (game.phase !== 'day' && !between)) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.target instanceof HTMLElement && e.target.closest('input, textarea, select, button, a, [contenteditable]')) return;
      const space = e.code === 'Space';
      if (!space && !(e.key === 'Enter' && between)) return;
      e.preventDefault();
      if (e.repeat) return;
      if (between) game.startDay();
      else if (space) game.toggleSpeed();
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [between, game]);

  // watching has no score to keep, only an invitation
  if (mode === 'idle') {
    return (
      <div className="status" data-hidden={hidden ? 'true' : 'false'}>
        <button type="button" className="status-go" onClick={playFromWatch}>
          play?
        </button>
      </div>
    );
  }

  return (
    <div className="status" data-hidden={hidden ? 'true' : 'false'} aria-live="polite">
      {game ? (
        <span className="status-day">
          {between && game.day > 1 ? <span>Day {game.day - 1} cleared</span> : <span>Day {game.day}</span>}
          {between && isCatastropheDay(game.day) ? <span className="status-alert">catastrophe due</span> : null}
          {game.alert ? <span className="status-alert">{game.alert}</span> : null}
          {between ? (
            <button
              type="button"
              className="status-go"
              data-hint={hint === 'start' ? 'true' : undefined}
              onClick={game.startDay}
              aria-keyshortcuts="Space Enter"
              title="Start day (Space)"
            >
              Start day {game.day} ▸
            </button>
          ) : game.phase === 'break' ? null : (
            <span className="day-bar" role="progressbar" aria-valuenow={Math.round(game.left * 100)} aria-label="day left">
              <span style={{ transform: `scaleX(${game.left})` }} />
            </span>
          )}
          {game.phase === 'day' ? (
            <button type="button" className="status-go" onClick={game.toggleSpeed}
              aria-label={game.speed === 1 ? 'Switch to 2× speed' : 'Switch to normal speed'}
              aria-pressed={game.speed === 2} aria-keyshortcuts="Space" title="Toggle speed (Space)">
              {game.speed}×
            </button>
          ) : null}
        </span>
      ) : null}
      <span className="status-parts">
        {PARTS.map(({ part, tool, label }) => (
          <span key={part} className="status-part" title={label}>
            <TilePreview tool={tool} r={8} />
            <RollingNumber value={score[part]} />
          </span>
        ))}
      </span>
      <span className="status-score" data-hint={hint === 'score' ? 'true' : undefined}>
        <span>Score</span>
        <RollingNumber value={score.total} />
        {game ? (
          <span className="status-target" data-met={score.total >= game.target ? 'true' : 'false'}>
            / {game.target}
          </span>
        ) : null}
      </span>
    </div>
  );
}
