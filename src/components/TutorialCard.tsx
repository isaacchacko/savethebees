'use client';

import { useEffect, useState } from 'react';
import { LAST_STEP, type TutorialView } from '@/components/useTutorial';

/** Whether there's a keyboard to press keys on, as far as the pointer can tell. */
function useKeyboard() {
  const [keyboard, setKeyboard] = useState(true);
  useEffect(() => {
    const query = matchMedia('(hover: hover) and (pointer: fine)');
    const update = () => setKeyboard(query.matches);
    update();
    query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  return keyboard;
}

/** A step's line, with each [key] drawn as a key cap. */
function Line({ text }: { text: string }) {
  return (
    <p>
      {text.split(/\[([^\]]+)\]/).map((part, k) => (k % 2 ? <kbd key={k}>{part}</kbd> : part))}
    </p>
  );
}

/**
 * The tutorial's step, as a small card in the corner of the map: a title, a
 * line, and buttons only where play can't move it on — reading the score, and
 * the end. A met step ticks its title before the next slides in. A step that
 * points at something offers "show me", which dims the rest of the page.
 */
export default function TutorialCard({
  step,
  onFinish,
}: {
  step: TutorialView;
  /** Leaves the tutorial for the real game, from the end or from skip. */
  onFinish: () => void;
}) {
  const keyboard = useKeyboard();
  const last = step.index === LAST_STEP;
  const pointing = step.tiles.length > 0 || !!step.hint;

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
      <Line text={keyboard ? step.text : step.touch} />
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
        {pointing && !last ? (
          <button
            type="button"
            className="mode-btn tutorial-show"
            aria-pressed={step.showing}
            onClick={() => step.setShowing(!step.showing)}
          >
            {step.showing ? 'Showing' : 'Show me'}
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
