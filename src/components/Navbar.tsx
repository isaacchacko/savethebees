'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import SpotifyNowPlaying, { type PlaybackState } from '@/components/SpotifyNowPlaying';
import HamburgerMenu from '@/components/HamburgerMenu';
import NavbarTypingPath from '@/components/NavbarTypingPath';

const LightGlyph = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0 }}>
    <line x1="11" y1="1" x2="11" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="1" y1="11" x2="21" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="3.929" y1="3.929" x2="18.071" y2="18.071" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <line x1="18.071" y1="3.929" x2="3.929" y2="18.071" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const DarkGlyph = () => (
  <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0 }}>
    <path
      d="M 15 4.1 A 8 8 0 1 0 15 17.9 A 2 2 0 1 1 15 4.1 Z"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinejoin="round"
    />
  </svg>
);

export type NavbarProps = {
  /** From home page `useSpotifyPlayback()`; omit on other routes (no polling). */
  spotifyPlayback?: PlaybackState | null;
  /** When true, URL bar cross-fades to Spotify (home: hover “music” in hero copy). */
  isHoveringMusic?: boolean;
  /** Segment after domain for typing animation (Linktree internal link hover only). */
  linktreePathSegment?: string | null;
};

export default function Navbar({
  spotifyPlayback = null,
  isHoveringMusic = false,
  linktreePathSegment = null,
}: NavbarProps) {
  const pathname = usePathname();
  const routePathSegment =
    pathname && pathname !== '/' ? pathname.slice(1) : null;

  const [isDark, setIsDark] = useState(() => {
    if (typeof document === 'undefined') return false;
    return document.documentElement.classList.contains('dark');
  });
  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  const shouldShowSpotify = isHoveringMusic;

  return (
    <div className="sticky top-0 z-[100] w-full shrink-0 bg-(--background)">
      <div
        className="flex items-center gap-3 px-4 py-4 text-reveal sm:gap-4 sm:px-6 sm:py-6"
        style={{ animationDelay: '0.2s' }}
      >
        <div className="relative flex min-w-0 flex-1 items-center">
          <div
            className="relative w-full transition-opacity duration-300"
            style={{ opacity: shouldShowSpotify ? 0 : 1, pointerEvents: shouldShowSpotify ? 'none' : 'auto' }}
          >
            <Link
              href="/"
              className="group min-w-0 select-none text-base font-black leading-tight text-[var(--primary-color)] sm:text-lg md:text-2xl lg:text-4xl xl:text-5xl"
            >
              <span className="transition-colors group-hover:text-[var(--accent)]">isaacchacko.com</span>
              {linktreePathSegment != null ? (
                <NavbarTypingPath segment={linktreePathSegment} />
              ) : routePathSegment != null ? (
                <span className="font-black inline-block min-w-[60px]">
                  /{routePathSegment}
                </span>
              ) : null}
            </Link>
          </div>

          <div
            className="absolute inset-0 flex items-center transition-opacity duration-300"
            style={{ opacity: shouldShowSpotify ? 1 : 0, pointerEvents: shouldShowSpotify ? 'auto' : 'none' }}
          >
            <SpotifyNowPlaying navbarMode playback={spotifyPlayback} />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setIsDark((prev) => !prev)}
          className="relative flex shrink-0 items-center justify-center hover:opacity-60"
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', width: 22, height: 22 }}
          aria-label="Toggle dark/light mode"
        >
          <span
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isDark ? 0 : 1,
              transform: isDark ? 'scale(0.6) rotate(60deg)' : 'scale(1) rotate(0deg)',
              transition: 'opacity 0.35s ease, transform 0.35s ease',
            }}
          >
            <LightGlyph />
          </span>
          <span
            style={{
              position: 'absolute',
              inset: 0,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              opacity: isDark ? 1 : 0,
              transform: isDark ? 'scale(1) rotate(0deg)' : 'scale(0.6) rotate(-60deg)',
              transition: 'opacity 0.35s ease, transform 0.35s ease',
            }}
          >
            <DarkGlyph />
          </span>
        </button>

        <HamburgerMenu />
      </div>
    </div>
  );
}
