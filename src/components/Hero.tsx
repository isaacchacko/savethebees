'use client';

import { useSpotifyPlayback } from '@/components/SpotifyNowPlaying';
import Linktree from '@/components/Linktree';
import Epicycle from '@/components/Epicycle';

const HERO_BODY_LINK_CLASS =
  'font-black underline-growing hover:text-[var(--accent)] transition-colors inline';

export type HeroProps = {
  onMusicHoverChange?: (hovering: boolean) => void;
  onLinktreePathHover?: (segment: string | null) => void;
};

const Home = ({ onMusicHoverChange, onLinktreePathHover }: HeroProps) => {
  const playback = useSpotifyPlayback();
  const isPlaying = playback?.is_playing && playback?.track;

  return (
    <div
      className="relative flex min-h-0 flex-1 flex-col overflow-x-hidden"
      style={{ pointerEvents: 'none' }}
    >
      <div
        className="flex min-h-0 flex-1 flex-col justify-center overflow-x-hidden overflow-y-auto px-4 pb-10 pt-20 text-center sm:px-6 sm:pb-12 sm:pt-24 md:px-10 md:py-12 lg:mx-auto lg:max-w-[min(100%,96rem)] lg:px-[min(8vw,4rem)] lg:py-10 xl:px-[min(33vh,12rem)]"
        style={{ pointerEvents: 'auto' }}
      >
        <div className="relative z-10 w-full rounded-2xl bg-white/80 px-4 py-5 sm:px-6 md:px-7 md:py-6 dark:bg-[color-mix(in_srgb,var(--surface)_88%,transparent)]">
          <div className="flex w-full flex-col gap-8 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
            <div className="order-2 flex min-w-0 flex-1 flex-col items-stretch gap-8 lg:order-1 lg:items-center lg:gap-10">
              <p
                className="reveal-mask-target w-full select-none text-left text-sm leading-relaxed text-reveal sm:text-[0.95rem] md:text-base lg:text-xl xl:text-2xl"
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
              <Linktree onInternalPathHover={onLinktreePathHover} />
            </div>
            <div className="relative order-1 mx-auto h-[min(56vw,220px)] w-[min(56vw,220px)] shrink-0 sm:h-[min(44vw,240px)] sm:w-[min(44vw,240px)] lg:order-2 lg:mx-0 lg:h-[min(32vmin,260px)] lg:w-[min(32vmin,260px)] lg:self-start">
              <Epicycle embedded scaleX={1} />
            </div>
          </div>
        </div>
      </div>
    </div >
  );
}

export default Home;
