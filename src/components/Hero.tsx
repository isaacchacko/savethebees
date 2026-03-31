'use client';

import { useState } from 'react';
import Image from 'next/image';
import type { PlaybackState } from '@/components/SpotifyNowPlaying';
import Linktree from '@/components/Linktree';

const HERO_BODY_LINK_CLASS =
  'font-black underline-growing hover:text-[var(--accent)] transition-colors inline';

export type HeroProps = {
  playback: PlaybackState | null;
  onMusicHoverChange?: (hovering: boolean) => void;
  onLinktreePathHover?: (segment: string | null) => void;
};

/** Fluid image width: shrinks on shorter viewports (vmin) so md–2xl hero avoids scrolling. */
const HERO_IMAGE_BOX_CLASS =
  'group relative aspect-square max-w-full shrink-0 overflow-hidden rounded-lg transition-[opacity,transform] delay-400 duration-[1200ms] ease-out ' +
  'w-[min(11rem,82vw)] ' +
  'sm:w-[min(12rem,42vmin)] ' +
  'md:w-[min(13rem,38vmin)] ' +
  'lg:w-[min(14rem,34vmin)] ' +
  'xl:w-[min(15rem,32vmin)] ' +
  '2xl:w-[min(17rem,30vmin)]';

const Home = ({ playback, onMusicHoverChange, onLinktreePathHover }: HeroProps) => {
  const isPlaying = playback?.is_playing && playback?.track;
  const [heroImgLoaded, setHeroImgLoaded] = useState(false);

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col overflow-x-hidden"
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="flex w-full min-h-0 flex-1 flex-col justify-center px-4 pb-8 pt-4 sm:px-6 sm:pb-6 sm:pt-5 md:px-8 md:pb-5 md:pt-4 md:py-6 lg:px-10 lg:py-6 xl:px-12 xl:py-8 2xl:py-10"
        style={{ pointerEvents: 'auto' }}
      >
        <div className="relative mx-auto flex w-full min-h-0 max-w-[min(100%,96rem)] flex-col">
          <div className="z-10 flex w-full min-h-0 flex-col items-center justify-center gap-5 sm:gap-4 md:gap-3 lg:gap-4 xl:gap-5 2xl:gap-6">
            <div className="flex w-full min-w-0 min-h-0 flex-col items-stretch gap-5 sm:gap-4 sm:mx-auto sm:max-w-5xl md:gap-3 lg:gap-4 xl:gap-5 2xl:gap-6">
              <p
                className="reveal-mask-target w-full select-none text-left text-sm leading-snug text-reveal sm:text-[0.95rem] sm:leading-relaxed md:text-sm md:leading-snug lg:text-base lg:leading-relaxed xl:text-lg 2xl:text-xl"
                style={{ animationDelay: '0.4s' }}
              >
                Howdy! I'm a software engineer building at{' '}
                <a
                  href="https://dryft.ai"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={HERO_BODY_LINK_CLASS}
                >
                  Dryft
                </a>
                . I like to listen to{' '}
                <span
                  className={`cursor-default${isPlaying ? ' animate-pulse text-[var(--accent)]' : ''}`}
                  onMouseEnter={() => onMusicHoverChange?.(true)}
                  onMouseLeave={() => onMusicHoverChange?.(false)}
                >
                  music
                </span>
                , needlessly update my{' '}
                <a
                  href="/arch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={HERO_BODY_LINK_CLASS}
                >
                  dotfiles
                </a>

                , and organize hackathons at{' '}
                <a
                  href="https://tidaltamu.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={HERO_BODY_LINK_CLASS}
                >
                  TIDAL
                </a>

                . Previously at{' '}
                <a
                  href="https://siso-eng.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={HERO_BODY_LINK_CLASS}
                >
                  SISO
                </a>
                .
              </p>
              <div className="flex w-full min-w-0 min-h-0 flex-col gap-6 sm:flex-row sm:items-center sm:justify-between sm:gap-3 md:gap-4 lg:gap-5 xl:gap-6 2xl:gap-8">
                <Linktree
                  onInternalPathHover={onLinktreePathHover}
                  className="min-w-0 shrink"
                />
                {/* Image + caption only (no extra wrapper); hidden below sm */}
                <div
                  className={`${HERO_IMAGE_BOX_CLASS} hidden sm:block ${heroImgLoaded ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'
                    }`}
                >
                  <Image
                    src="/hero/ny.png"
                    alt=""
                    width={320}
                    height={320}
                    className="h-full w-full object-cover"
                    sizes="(max-width: 640px) 0px, (max-width: 1280px) 34vmin, 280px"
                    priority
                    onLoad={() => setHeroImgLoaded(true)}
                    onError={() => setHeroImgLoaded(true)}
                  />
                  <div
                    className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-black px-2 py-1 text-center opacity-0 transition-opacity duration-300 ease-out group-hover:opacity-100 sm:px-2.5 sm:py-1.5 md:px-3 md:py-2 lg:px-3.5 lg:py-2 xl:px-4 xl:py-2.5 2xl:px-4 2xl:py-3"
                    aria-hidden
                  >
                    <span className="select-none font-mono text-[0.5rem] uppercase tracking-[0.09em] text-white sm:text-[0.55rem] sm:tracking-[0.1em] md:text-[0.625rem] md:tracking-[0.11em] lg:text-xs lg:tracking-[0.12em] xl:text-xs xl:tracking-[0.12em] 2xl:text-sm 2xl:tracking-[0.13em]">
                      NEW YORK, NOV 2025
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Home;
