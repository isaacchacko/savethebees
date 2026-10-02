'use client';

import { useSlide } from '@/components/slide';
import { FP_HREF, GAME_HREF, useMapMode } from '@/components/Stage';

/**
 * The intro page's buttons: Let's Go! opens the game page, Free Play the fp
 * page, and Watch puts the card away to watch the town build itself (idle).
 */
export default function IntroActions() {
  const slide = useSlide();
  const { setMode } = useMapMode();

  return (
    <div className="intro-actions">
      <button type="button" className="mode-btn" data-primary="true" onClick={() => slide(GAME_HREF, -1)}>
        Let&rsquo;s Go!
      </button>
      <button type="button" className="mode-btn" onClick={() => slide(FP_HREF, -1)}>
        Free Play
      </button>
      <button type="button" className="mode-btn" onClick={() => setMode('idle')}>
        Watch
      </button>
    </div>
  );
}
