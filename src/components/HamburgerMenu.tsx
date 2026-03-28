'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FiArrowUpRight } from 'react-icons/fi';
import { LINKTREE_EXTERNAL_LINKS, LINKTREE_INTERNAL_LINKS } from '@/data/linktreeLinks';
import { LinktreeGlyph } from '@/components/LinktreeGlyph';

const GLYPH_MENU_CLASS = 'h-4 w-4 shrink-0';

const glyphWrapClass =
  'flex shrink-0 items-center justify-center text-[var(--primary-color)] transition-colors duration-200 ease-out group-hover:text-[var(--accent)]';

export default function HamburgerMenu() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [menuOpen]);

  return (
    <div className="relative shrink-0" ref={menuRef}>
      <button
        type="button"
        onClick={() => setMenuOpen((o) => !o)}
        className="flex h-[22px] w-[22px] flex-col items-center justify-center gap-[3.25px] hover:opacity-60"
        style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer' }}
        aria-expanded={menuOpen}
        aria-label={menuOpen ? 'Close menu' : 'Open menu'}
      >
        <span
          className="block h-[1.5px] w-[14px] shrink-0 rounded-full bg-current transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{
            transformOrigin: '50% 50%',
            transform: menuOpen ? 'translateY(4.75px) rotate(45deg)' : 'translateY(0) rotate(0deg)',
          }}
        />
        <span
          className="block h-[1.5px] w-[14px] shrink-0 rounded-full bg-current transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{
            transform: menuOpen ? 'scaleX(0)' : 'scaleX(1)',
            opacity: menuOpen ? 0 : 1,
          }}
        />
        <span
          className="block h-[1.5px] w-[14px] shrink-0 rounded-full bg-current transition-[transform,opacity] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
          style={{
            transformOrigin: '50% 50%',
            transform: menuOpen ? 'translateY(-4.75px) rotate(-45deg)' : 'translateY(0) rotate(0deg)',
          }}
        />
      </button>
      {menuOpen && (
        <nav
          className="absolute right-0 top-full z-[60] mt-2 min-w-[11rem] rounded-md border border-gray-200/80 bg-[color-mix(in_srgb,var(--surface)_92%,transparent)] py-2 shadow-xl backdrop-blur-sm dark:border-gray-600/40 dark:bg-[color-mix(in_srgb,var(--surface)_94%,transparent)]"
          style={{ pointerEvents: 'auto', animation: 'slideDownFadeIn 0.28s ease-out forwards' }}
          aria-label="Site links"
        >
          {LINKTREE_INTERNAL_LINKS.map(({ href, label, glyph }) => (
            <Link
              key={href}
              href={href}
              className="group flex items-center gap-2 px-4 py-2 font-mono text-sm tracking-wide text-gray-800 hover:bg-black/[0.06] hover:text-[var(--foreground)] dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
              onClick={() => setMenuOpen(false)}
            >
              <span className={glyphWrapClass}>
                <LinktreeGlyph id={glyph} className={GLYPH_MENU_CLASS} />
              </span>
              <span className="min-w-0">{label}</span>
            </Link>
          ))}
          <div
            className="my-2 h-px bg-gray-300/80 dark:bg-gray-600/50"
            role="separator"
            aria-hidden
          />
          {LINKTREE_EXTERNAL_LINKS.map(({ href, label, glyph }) => (
            <a
              key={href}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex items-center gap-2 px-4 py-2 font-mono text-sm tracking-wide text-gray-800 hover:bg-black/[0.06] hover:text-[var(--foreground)] dark:text-gray-300 dark:hover:bg-white/10 dark:hover:text-white"
              onClick={() => setMenuOpen(false)}
            >
              <span className={glyphWrapClass}>
                <LinktreeGlyph id={glyph} className={GLYPH_MENU_CLASS} />
              </span>
              <span className="min-w-0 flex-1">{label}</span>
              <FiArrowUpRight
                className="h-3.5 w-3.5 shrink-0 text-gray-500 transition-colors duration-200 ease-out group-hover:text-[var(--accent)]"
                aria-hidden
              />
            </a>
          ))}
        </nav>
      )}
    </div>
  );
}
