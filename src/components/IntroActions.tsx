'use client';

import { useSlide } from '@/components/slide';
import { FP_HREF, useMapMode } from '@/components/Stage';

/** The intro page's buttons: Let's Go! opens the game page, Free Play the fp page. */
export default function IntroActions() {
  const { setMode } = useMapMode();
  const slide = useSlide();

  return (
    <div className="intro-actions">
      <button
        type="button"
        className="mode-btn"
        data-primary="true"
        onClick={() => setMode('game')}
      >
        Let&rsquo;s Go!
      </button>
      <button type="button" className="mode-btn" onClick={() => slide(FP_HREF, -1)}>
        Free Play
      </button>
    </div>
  );
}
