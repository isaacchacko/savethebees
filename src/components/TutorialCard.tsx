'use client';

import { LAST_STEP, type TutorialView } from '@/components/useTutorial';

/**
 * The tutorial's step, as a small card in the corner of the map: a title, a
 * line, and buttons only where play can't move it on — reading the score, and
 * the end. A met step ticks its title before the next slides in.
 */
export default function TutorialCard({
  step,
  onFinish,
}: {
  step: TutorialView;
  /** Leaves the tutorial for the real game, from the end or from skip. */
  onFinish: () => void;
}) {
  const last = step.index === LAST_STEP;

  return (
    <aside key={step.index} className="tutorial" data-met={step.met ? 'true' : 'false'} aria-live="polite">
      <span className="tutorial-count">
        tutorial · {step.index + 1}/{step.count}
      </span>
      <h2 className="tutorial-title">
        {step.title}
        <span className="tutorial-tick" aria-hidden>
          ✓
        </span>
      </h2>
      <p>{step.text}</p>
      <div className="tutorial-actions">
        {last ? (
          <button type="button" className="mode-btn" data-primary="true" onClick={onFinish}>
            Play for real
          </button>
        ) : step.manual ? (
          <button type="button" className="mode-btn" data-primary="true" onClick={step.next}>
            Got it
          </button>
        ) : null}
        {last ? null : (
          <button type="button" className="tutorial-skip" onClick={onFinish}>
            skip tutorial
          </button>
        )}
      </div>
    </aside>
  );
}
