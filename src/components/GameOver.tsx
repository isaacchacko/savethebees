'use client';

import { useState } from 'react';
import { INTRO_HREF, useMapMode } from '@/components/Stage';
import type { Stats } from '@/lib/map/game';

/**
 * The end of a game: a card over the map with how it went, and ways to share
 * it, go again, or leave. Sharing uses the device's share sheet where there
 * is one, and otherwise copies the result to paste anywhere.
 */
export default function GameOver({
  stats,
  reached,
  onAgain,
}: {
  stats: Stats;
  /** The target the last day needed. */
  reached: number;
  onAgain: () => void;
}) {
  const { setMode } = useMapMode();
  const [shared, setShared] = useState<'idle' | 'copied' | 'failed'>('idle');
  const servedShare = stats.people ? Math.round((stats.served / stats.people) * 100) : 0;
  const days = stats.days === 1 ? '1 day' : `${stats.days} days`;

  const rows: [string, string][] = [
    ['days survived', String(stats.days)],
    ['best score', String(stats.best)],
    ['people', `${stats.people} · ${servedShare}% served`],
    ['stations', String(stats.stations)],
    ['rail', `${stats.rail} tiles`],
    ['tunnels', String(stats.tunnels)],
    ['greenery', String(stats.parks)],
    ['catastrophes', String(stats.catastrophes)],
  ];

  const share = async () => {
    const url = `${location.origin}${INTRO_HREF}`;
    const text = `Transit Control: I kept a town running for ${days}, best score ${stats.best}, ${stats.people} people on ${stats.stations} stations.`;
    try {
      if (navigator.share) {
        await navigator.share({ title: 'Transit Control', text, url });
        return;
      }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setShared('copied');
    } catch (e) {
      // closing the share sheet isn't a failure
      if ((e as Error)?.name !== 'AbortError') setShared('failed');
    }
  };

  return (
    <div className="game-over" role="dialog" aria-labelledby="game-over-title">
      <div className="game-over-card">
        <h1 id="game-over-title" className="card-title">
          Game over
        </h1>
        <p className="game-over-line">
          the town needed <strong>{reached}</strong> and got <strong>{stats.score}</strong>.
        </p>
        <dl className="game-over-stats">
          {rows.map(([label, value]) => (
            <div key={label}>
              <dt>{label}</dt>
              <dd>{value}</dd>
            </div>
          ))}
        </dl>
        <div className="intro-actions">
          <button type="button" className="mode-btn" data-primary="true" onClick={share}>
            {shared === 'copied' ? 'Copied!' : shared === 'failed' ? 'Couldn’t share' : 'Share'}
          </button>
          <button type="button" className="mode-btn" onClick={onAgain}>
            Play again
          </button>
          <button type="button" className="mode-btn" onClick={() => setMode('site')}>
            Leave
          </button>
        </div>
      </div>
    </div>
  );
}
