'use client';

import { useEffect, useRef, useState } from 'react';
import Markdown from '@/components/Markdown';
import type { CoolItem, CoolList } from '@/lib/cool';

// long enough to move the mouse across the gap from a link into the drawer
const CLOSE_DELAY_MS = 1000;

function hostname(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, '');
  } catch {
    return '';
  }
}

/**
 * The lists on the left; hovering an entry slides its screenshot and note into
 * a drawer pinned on the right. The drawer waits a beat before fading after
 * the mouse leaves a link, and stays put while the mouse is over it. It keeps
 * showing the last entry while it fades out, so it never flashes empty.
 */
export default function CoolLists({ lists }: { lists: CoolList[] }) {
  const [hovered, setHovered] = useState<CoolItem | null>(null);
  const [open, setOpen] = useState(false);
  const closeTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => () => clearTimeout(closeTimer.current), []);

  const keepOpen = () => {
    clearTimeout(closeTimer.current);
    setOpen(true);
  };

  const closeSoon = () => {
    clearTimeout(closeTimer.current);
    closeTimer.current = setTimeout(() => setOpen(false), CLOSE_DELAY_MS);
  };

  return (
    <div className="cool">
      <div className="cool-lists">
        {lists.map((list) => (
          <section key={list.id} className="cool-list">
            <div className="label">{list.title}</div>
            {list.description ? (
              <p className="muted">
                <Markdown content={list.description} inline />
              </p>
            ) : null}
            {list.items.length === 0 ? (
              <p className="muted cool-row">empty for now.</p>
            ) : (
              list.items.map((item) => {
                const host = hostname(item.url);
                return (
                  <div key={item.id} className="cool-row">
                    <span className="bullet" />
                    <span
                      className="favicon"
                      style={
                        host
                          ? {
                              backgroundImage: `url(https://www.google.com/s2/favicons?domain=${host}&sz=32)`,
                            }
                          : undefined
                      }
                    />
                    <a
                      href={item.url || undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      onMouseEnter={() => {
                        setHovered(item);
                        keepOpen();
                      }}
                      onMouseLeave={closeSoon}
                    >
                      {item.label || item.title}
                    </a>
                  </div>
                );
              })
            )}
          </section>
        ))}
      </div>

      <div
        className="cool-drawer"
        data-open={open ? 'true' : 'false'}
        aria-hidden
        onMouseEnter={keepOpen}
        onMouseLeave={closeSoon}
      >
        <div
          className="cool-shot"
          style={hovered?.shot ? { backgroundImage: `url(${hovered.shot})` } : undefined}
        >
          {hovered ? <span className="cool-host">↗ {hostname(hovered.url)}</span> : null}
        </div>
        {hovered?.note ? (
          <span className="cool-note">
            <Markdown content={hovered.note} inline />
          </span>
        ) : null}
      </div>
    </div>
  );
}
