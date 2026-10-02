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
  { part: 'park', tool: 'park', label: 'from parks' },
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
 */
export default function GameStatus({ hidden }: { hidden: boolean }) {
  const { score, game } = useMapMode();
  const between = game?.phase === 'break';

  useEffect(() => {
    if (!between || !game) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Enter' || e.metaKey || e.ctrlKey || e.altKey) return;
      e.preventDefault();
      game.startDay();
    };
    addEventListener('keydown', onKey);
    return () => removeEventListener('keydown', onKey);
  }, [between, game]);

  return (
    <div className="status" data-hidden={hidden ? 'true' : 'false'} aria-live="polite">
      {game ? (
        <span className="status-day">
          {between && game.day > 1 ? <span>Day {game.day - 1} cleared</span> : <span>Day {game.day}</span>}
          {between && isCatastropheDay(game.day) ? <span className="status-alert">catastrophe due</span> : null}
          {game.alert ? <span className="status-alert">{game.alert}</span> : null}
          {between ? (
            <button type="button" className="status-go" onClick={game.startDay}>
              Start day {game.day} ▸
            </button>
          ) : (
            <span className="day-bar" role="progressbar" aria-valuenow={Math.round(game.left * 100)} aria-label="day left">
              <span style={{ transform: `scaleX(${game.left})` }} />
            </span>
          )}
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
      <span className="status-score">
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
