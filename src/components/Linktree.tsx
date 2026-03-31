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
  'text-[10px] text-gray-600 dark:text-gray-300 md:text-xs uppercase tracking-wide';

const TITLE_CLASS =
  'mb-4 text-sm font-semibold tracking-tight text-gray-600 dark:text-gray-400 sm:mb-5 md:mb-4 md:text-base lg:mb-5';

/**
 * Mobile (&lt;sm): larger tap targets. sm–2xl: scale up with viewport so hero fits without scroll (md–2xl).
 */
const GLYPH_CLASS =
  'h-7 w-7 transition-colors duration-200 ease-out sm:h-6 sm:w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 xl:h-9 xl:w-9 2xl:h-10 2xl:w-10';
const GLYPH_WRAP_CLASS =
  'flex h-10 w-10 shrink-0 items-center justify-center text-[var(--primary-color)] group-hover:text-[var(--accent)] sm:h-9 sm:w-9 md:h-10 md:w-10 lg:h-11 lg:w-11 xl:h-12 xl:w-12 2xl:h-14 2xl:w-14';

/** Path segment shown after the domain in the hero URL bar (no leading slash). */
function hrefToTypingSegment(href: string): string {
  if (href.startsWith('/')) return href.slice(1);
  return href;
}

function LinkTile({
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
    'group flex flex-col items-center gap-1 rounded-lg px-0 py-0.5 outline-none transition-transform duration-200 ease-out hover:bg-[color-mix(in_srgb,var(--foreground)_6%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--background)] sm:gap-0.5 sm:px-0.5 sm:py-0.5 md:gap-1 md:px-0.5 md:py-0.5 lg:gap-1 lg:px-1 lg:py-1 xl:gap-1.5 2xl:gap-1.5 sm:hover:scale-110 sm:hover:bg-transparent';

  const inner = (
    <>
      <span className={GLYPH_WRAP_CLASS}>
        <LinktreeGlyph id={glyph} className={GLYPH_CLASS} />
      </span>
      <span className="flex min-w-0 flex-row flex-wrap items-center justify-center gap-1 sm:flex-col sm:gap-0">
        <span className={`text-center ${LABEL_CLASS}`}>
          {label}
        </span>
        {external ? (
          <FiArrowUpRight
            className="h-3 w-3 shrink-0 text-gray-400 opacity-80 transition-opacity group-hover:opacity-100 sm:hidden"
            aria-hidden
          />
        ) : null}
      </span>
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
  className?: string;
};

/** Row-major order: internal first, then external (matches 2×5 grid fill). */
const ALL_LINKS_ORDER: ReadonlyArray<{
  entry: LinktreeLink;
  external: boolean;
}> = [
    ...LINKTREE_INTERNAL_LINKS.map((entry) => ({ entry, external: false as const })),
    ...LINKTREE_EXTERNAL_LINKS.map((entry) => ({ entry, external: true as const })),
  ];

/** sm+: 2 rows × 5 columns; 9 links fill left-to-right, top-to-bottom (one empty cell). */
const DESKTOP_GRID_CLASS =
  'hidden sm:grid sm:grid-cols-5 sm:grid-rows-2 sm:justify-items-center sm:gap-x-2 sm:gap-y-2 md:gap-x-3 md:gap-y-2 lg:gap-x-4 lg:gap-y-3 xl:gap-x-5 xl:gap-y-3 2xl:gap-x-6 2xl:gap-y-4';

export default function Linktree({ onInternalPathHover, className }: LinktreeProps) {
  return (
    <nav
      className={`text-reveal w-full max-w-2xl [font-family:var(--font-bricolage)] sm:max-w-none${className ? ` ${className}` : ''}`}
      style={{ animationDelay: '0.65s', pointerEvents: 'auto' }}
      aria-labelledby="linktree-heading"
    >
      {/* Below sm: 2-column grid */}
      <ul className="grid grid-cols-2 gap-x-2 gap-y-5 sm:hidden">
        {ALL_LINKS_ORDER.map(({ entry, external }) => (
          <LinkTile
            key={entry.href}
            {...entry}
            external={external}
            onInternalPathHover={onInternalPathHover}
          />
        ))}
      </ul>

      {/* sm+: 2×5 grid — row 1: five internals; row 2: four externals + one empty cell */}
      <ul className={DESKTOP_GRID_CLASS}>
        {ALL_LINKS_ORDER.map(({ entry, external }) => (
          <LinkTile
            key={entry.href}
            {...entry}
            external={external}
            onInternalPathHover={onInternalPathHover}
          />
        ))}
      </ul>
    </nav>
  );
}
