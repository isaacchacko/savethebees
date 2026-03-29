'use client';

import Link from 'next/link';
import {
  LINKTREE_EXTERNAL_LINKS,
  LINKTREE_INTERNAL_LINKS,
  type LinktreeLink,
} from '@/data/linktreeLinks';
import { LinktreeGlyph } from '@/components/LinktreeGlyph';
import { FiArrowUpRight } from 'react-icons/fi';

const LABEL_CLASS =
  'text-[10px] text-gray-600 dark:text-gray-300 md:text-xs uppercase';

const SECTION_HEADING_CLASS =
  'mb-3 text-sm text-gray-500 dark:text-gray-400 md:text-base';

const GLYPH_CLASS = 'h-6 w-6';

/** Path segment shown after the domain in the hero URL bar (no leading slash). */
function hrefToTypingSegment(href: string): string {
  if (href.startsWith('/')) return href.slice(1);
  return href;
}

function LinkRow({
  href,
  label,
  glyph,
  external,
  onInternalPathHover,
}: LinktreeLink & {
  external: boolean;
  onInternalPathHover?: (pathSegment: string | null) => void;
}) {
  const typingSegment = hrefToTypingSegment(href);
  const className =
    'group flex items-center gap-3 rounded-lg transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)]';
  const inner = (
    <>
      <span className="flex h-9 w-9 shrink-0 items-center justify-center text-[var(--primary-color)] transition-colors duration-200 ease-out group-hover:text-[var(--accent)]">
        <LinktreeGlyph id={glyph} className={GLYPH_CLASS} />
      </span>
      <span className={`min-w-0 text-left ${LABEL_CLASS}`}>{label}</span>
      {external ? (
        <FiArrowUpRight
          className="hidden h-4 w-4 shrink-0 text-gray-400 opacity-80 transition-opacity group-hover:opacity-100 md:block"
          aria-hidden
        />
      ) : (
        <span className="hidden h-4 w-4 shrink-0 md:inline-block" aria-hidden />
      )}
    </>
  );

  return (
    <li>
      {external ? (
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className={className}
        >
          {inner}
        </a>
      ) : (
        <Link
          href={href}
          className={className}
          onMouseEnter={() => onInternalPathHover?.(typingSegment)}
          onMouseLeave={() => onInternalPathHover?.(null)}
        >
          {inner}
        </Link>
      )}
    </li>
  );
}

type LinktreeProps = {
  onInternalPathHover?: (pathSegment: string | null) => void;
};

export default function Linktree({ onInternalPathHover }: LinktreeProps) {
  return (
    <nav
      className="text-reveal w-full max-w-2xl [font-family:var(--font-bricolage)]"
      style={{ animationDelay: '0.65s', pointerEvents: 'auto' }}
      aria-label="Links"
    >
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10 xl:gap-12">
        <section aria-labelledby="linktree-internal-heading">
          <h2 id="linktree-internal-heading" className={SECTION_HEADING_CLASS}>
            Stay awhile!
          </h2>
          <ul className="flex flex-col gap-1">
            {LINKTREE_INTERNAL_LINKS.map((entry) => (
              <LinkRow
                key={entry.href}
                {...entry}
                external={false}
                onInternalPathHover={onInternalPathHover}
              />
            ))}
          </ul>
        </section>
        <section aria-labelledby="linktree-external-heading">
          <h2 id="linktree-external-heading" className={SECTION_HEADING_CLASS}>
            See ya...
          </h2>
          <ul className="flex flex-col gap-1">
            {LINKTREE_EXTERNAL_LINKS.map((entry) => (
              <LinkRow key={entry.href} {...entry} external />
            ))}
          </ul>
        </section>
      </div>
    </nav>
  );
}
