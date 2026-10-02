'use client';

import { useSlide } from '@/components/slide';
import { FP_HREF, GAME_HREF, useMapMode } from '@/components/Stage';

/**
 * The intro page's buttons: Let's Go! opens the game page, Free Play the fp
 * page, and Watch puts the card away to watch the town build itself (idle).
 * Once the tutorial has been through, a quieter link plays it again.
 */
export default function IntroActions() {
  const slide = useSlide();
  const { setMode, tutorialDone, replayTutorial } = useMapMode();

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
      {/* the first game is the tutorial anyway, so this only shows after it */}
      {tutorialDone ? (
        <button
          type="button"
          className="tutorial-skip"
          onClick={() => {
            replayTutorial();
            slide(GAME_HREF, -1);
          }}
        >
          tutorial
        </button>
      ) : null}
    </div>
  );
}
