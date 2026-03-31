'use client';

import { AnimatePresence, motion } from 'framer-motion';
import Image from 'next/image';
import { createPortal } from 'react-dom';
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react';
import { FiArrowUpRight, FiMaximize2, FiX } from 'react-icons/fi';
import ProjectRibbon from '@/components/projects/ProjectRibbon';
import { TechnologyChips, type TechChipName } from '@/components/projects/Technology';

/** Assumed display size for project media (1920×1080 assets). */
export const PROJECT_CARD_MEDIA_WIDTH = 1920;
export const PROJECT_CARD_MEDIA_HEIGHT = 1080;

export type ProjectMediaType = 'image' | 'video';

function inferMediaType(src: string): ProjectMediaType {
  const path = src.split('?')[0].split('#')[0].toLowerCase();
  return /\.(mp4|m4v|webm|mov|ogv|ogg)$/i.test(path) ? 'video' : 'image';
}

function videoMimeFromSrc(src: string): string | undefined {
  const ext = src.split('?')[0].split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'mp4':
    case 'm4v':
      return 'video/mp4';
    case 'webm':
      return 'video/webm';
    case 'mov':
      return 'video/quicktime';
    case 'ogv':
    case 'ogg':
      return 'video/ogg';
    default:
      return undefined;
  }
}

function subscribeHtmlDark(onStoreChange: () => void) {
  const root = document.documentElement;
  const mo = new MutationObserver(onStoreChange);
  mo.observe(root, { attributes: true, attributeFilter: ['class'] });
  return () => mo.disconnect();
}

function getHtmlDarkSnapshot() {
  return document.documentElement.classList.contains('dark');
}

function useHtmlDarkClass() {
  return useSyncExternalStore(subscribeHtmlDark, getHtmlDarkSnapshot, () => false);
}

const NEED_BORDER_VARIANTS = ['border-white', 'border-black'] as const;

export type ProjectProps = {
  ribbonName: string;
  name: string;
  subtext: string;
  stack: TechChipName[];
  blurb: string;
  /** Public path to a raster image or video file (e.g. `/projects/demo.mp4`). */
  mediaSrc: string;
  /** Image `alt` or short description for video (`aria-label`). Defaults to {@link name}. */
  mediaAlt?: string;
  /** Override automatic image vs video detection from the file extension. */
  mediaType?: ProjectMediaType;
  /** Repository URL for the “View on GitHub” link. */
  githubHref: string;
  /** Optional second link (e.g. live demo). Shown only when both are set. */
  customHref?: string;
  customLinkLabel?: string;
  /** When true, show a top-right arrow on the custom link (external affordance). */
  isCustomLinkExternal?: boolean;
  /** DOM id for in-page links (`#id`). */
  sectionId?: string;
  /** When true, frame uses black (light) / white (dark) via `(isDark + 1) % 2`. */
  needBorder?: boolean;
  className?: string;
};

export default function Project({
  ribbonName,
  name,
  subtext,
  stack,
  blurb,
  mediaSrc,
  mediaAlt,
  mediaType: mediaTypeProp,
  githubHref,
  customHref,
  customLinkLabel,
  isCustomLinkExternal,
  sectionId,
  needBorder = false,
  className,
}: ProjectProps) {
  const titleId = useId();
  const isDark = useHtmlDarkClass();
  const [mediaModalOpen, setMediaModalOpen] = useState(false);
  const [portalReady, setPortalReady] = useState(false);
  const previewVideoRef = useRef<HTMLVideoElement>(null);
  const modalVideoRef = useRef<HTMLVideoElement>(null);
  const closeModalButtonRef = useRef<HTMLButtonElement>(null);

  const label = mediaAlt ?? name;
  const kind = useMemo(
    () => mediaTypeProp ?? inferMediaType(mediaSrc),
    [mediaSrc, mediaTypeProp],
  );
  const videoMime = useMemo(() => (kind === 'video' ? videoMimeFromSrc(mediaSrc) : undefined), [kind, mediaSrc]);

  const customLink =
    customHref?.trim() && customLinkLabel?.trim()
      ? { href: customHref.trim(), label: customLinkLabel.trim() }
      : null;

  useEffect(() => {
    setPortalReady(true);
  }, []);

  useEffect(() => {
    if (!mediaModalOpen) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMediaModalOpen(false);
    };
    window.addEventListener('keydown', onKeyDown);
    const prevHtmlOverflow = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, [mediaModalOpen]);

  useLayoutEffect(() => {
    if (!mediaModalOpen || kind !== 'video') return;
    const preview = previewVideoRef.current;
    const modal = modalVideoRef.current;
    if (!preview || !modal) return;
    const t = preview.currentTime;
    const shouldPlay = !preview.paused;
    preview.pause();
    modal.currentTime = t;
    queueMicrotask(() => {
      if (shouldPlay) void modal.play().catch(() => { });
    });
    return () => {
      const p = previewVideoRef.current;
      const m = modalVideoRef.current;
      if (!p || !m) return;
      p.currentTime = m.currentTime;
      if (!m.paused) void p.play().catch(() => { });
      m.pause();
    };
  }, [mediaModalOpen, kind]);

  useEffect(() => {
    if (mediaModalOpen) closeModalButtonRef.current?.focus();
  }, [mediaModalOpen]);

  const mediaShellBorderClass = needBorder
    ? NEED_BORDER_VARIANTS[(Number(isDark) + 1) % 2]
    : 'border-[var(--foreground)]';

  const mediaFrameClass = `relative overflow-hidden rounded-lg border-2 ${mediaShellBorderClass}`;

  const mediaModalKey = `${sectionId ?? name}-media-modal`;

  const ribbonBarClass =
    'sticky top-0 z-20 w-full shrink-0 border-b border-[color-mix(in_srgb,var(--foreground)_12%,transparent)] bg-[var(--background)] shadow-sm ' +
    'relative isolate [transform:translateZ(0)] ' +
    "before:pointer-events-none before:absolute before:inset-x-0 before:-top-1 before:z-[1] before:h-1 before:bg-[var(--background)] before:content-[''] " +
    "after:pointer-events-none after:absolute after:inset-x-0 after:-bottom-1 after:z-[1] after:h-1 after:bg-[var(--background)] after:content-['']";

  return (
    <article
      id={sectionId}
      className={`flex w-full shrink-0 flex-col scroll-mt-[max(1rem,env(safe-area-inset-top,0px))] lg:scroll-mt-4 ${className ?? ''}`.trim()}
      aria-labelledby={titleId}
    >
      <div className={ribbonBarClass}>
        <ProjectRibbon name={ribbonName} />
      </div>

      <div className="flex w-full shrink-0 flex-col gap-0 lg:flex-row lg:gap-0">
        <aside className="flex w-full shrink-0 flex-col gap-4 px-3 pb-6 pt-5 sm:gap-5 sm:px-6 sm:pb-8 sm:pt-6 lg:w-1/2 lg:gap-6 lg:pb-12 lg:pt-8">
          <div className="space-y-2">
            <h1
              id={titleId}
              className="text-xl font-black tracking-tight text-(--primary-color) sm:text-2xl md:text-3xl lg:text-4xl"
            >
              {name}
            </h1>
            <p className="text-sm font-medium italic leading-snug text-gray-600 dark:text-gray-400 sm:text-base">
              {subtext}
            </p>
          </div>

          <div className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.14em] text-gray-500 dark:text-gray-400">
              Stack
            </h2>
            <TechnologyChips chips={stack} aria-label={`${name} technologies`} />
          </div>

          <p className="max-w-prose text-sm leading-relaxed text-(--foreground) sm:text-base">{blurb}</p>

          <div className="flex flex-col gap-1">
            <a
              href={githubHref}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-fit items-center text-sm italic text-gray-500 transition-colors hover:text-[var(--accent)] dark:text-gray-400"
            >
              View on GitHub
              <FiArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
            </a>
            {customLink ? (
              <a
                href={customLink.href}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-fit items-center text-sm italic text-gray-500 transition-colors hover:text-[var(--accent)] dark:text-gray-400"
              >
                {customLink.label}
                {isCustomLinkExternal ? (
                  <FiArrowUpRight className="h-3.5 w-3.5 shrink-0" aria-hidden />
                ) : null}
              </a>
            ) : null}
          </div>
        </aside>

        <div className="flex w-full shrink-0 flex-col lg:w-1/2">
          <div className="mx-3 mb-8 mt-0 flex flex-col justify-center sm:mx-6 lg:mx-6 lg:mb-12 lg:mt-8">
            <div className="flex flex-row justify-center">
              {kind === 'video' ? (
                <div className={`${mediaFrameClass} relative max-w-full`}>
                  <video
                    ref={previewVideoRef}
                    className="block h-auto max-w-full bg-black object-contain"
                    width={PROJECT_CARD_MEDIA_WIDTH}
                    height={PROJECT_CARD_MEDIA_HEIGHT}
                    controls
                    playsInline
                    preload="metadata"
                    aria-label={label}
                  >
                    {videoMime ? <source src={mediaSrc} type={videoMime} /> : <source src={mediaSrc} />}
                  </video>
                  <button
                    type="button"
                    onClick={() => setMediaModalOpen(true)}
                    className="absolute right-1.5 top-1.5 z-10 flex h-11 w-11 items-center justify-center rounded-md bg-black/55 text-white shadow-md backdrop-blur-sm transition-colors hover:bg-black/75 focus-visible:outline focus-visible:ring-2 focus-visible:ring-white/70 sm:right-2 sm:top-2 sm:h-9 sm:w-9"
                    aria-label={`Open ${label} in expanded view`}
                  >
                    <FiMaximize2 className="h-[1.15rem] w-[1.15rem] sm:h-4 sm:w-4" aria-hidden />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setMediaModalOpen(true)}
                  className={`${mediaFrameClass} group relative block w-full max-w-full cursor-zoom-in text-left transition-[box-shadow] hover:ring-2 hover:ring-[color-mix(in_srgb,var(--foreground)_25%,transparent)] focus-visible:outline focus-visible:ring-2 focus-visible:ring-[var(--accent)]`}
                  aria-label={`View ${label} larger`}
                >
                  <Image
                    src={mediaSrc}
                    alt={label}
                    width={PROJECT_CARD_MEDIA_WIDTH}
                    height={PROJECT_CARD_MEDIA_HEIGHT}
                    className="block h-auto max-w-full"
                    draggable={false}
                  />
                  <span
                    className="pointer-events-none absolute right-1.5 top-1.5 flex h-11 w-11 items-center justify-center rounded-md bg-black/45 text-white opacity-100 shadow-sm backdrop-blur-sm sm:right-2 sm:top-2 sm:h-9 sm:w-9 sm:bg-black/40 sm:opacity-0 sm:group-hover:opacity-100 sm:group-focus-visible:opacity-100"
                    aria-hidden
                  >
                    <FiMaximize2 className="h-[1.15rem] w-[1.15rem] sm:h-4 sm:w-4" />
                  </span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {portalReady
        ? createPortal(
          <AnimatePresence>
            {mediaModalOpen ? (
              <motion.div
                key={mediaModalKey}
                role="presentation"
                className="fixed inset-0 z-[200] flex items-stretch justify-center bg-black/75 p-0 backdrop-blur-[3px] sm:items-center sm:p-4 sm:p-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
                onClick={() => setMediaModalOpen(false)}
              >
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  aria-label={`${name} — media`}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: 'spring', damping: 26, stiffness: 320 }}
                  className="relative flex max-h-[100dvh] w-full max-w-none flex-col overflow-hidden rounded-none border-x-0 border-y-2 border-[color-mix(in_srgb,var(--foreground)_22%,transparent)] bg-[var(--background)] shadow-2xl sm:max-h-[min(92dvh,1080px)] sm:max-w-[min(96vw,1920px)] sm:rounded-xl sm:border-2 sm:border-solid"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    ref={closeModalButtonRef}
                    type="button"
                    onClick={() => setMediaModalOpen(false)}
                    className="absolute right-[max(0.5rem,env(safe-area-inset-right,0px))] top-[max(0.5rem,env(safe-area-inset-top,0px))] z-10 flex h-11 w-11 items-center justify-center rounded-lg bg-[color-mix(in_srgb,var(--foreground)_10%,var(--background))] text-(--primary-color) transition-colors hover:bg-[color-mix(in_srgb,var(--foreground)_16%,var(--background))] focus-visible:outline focus-visible:ring-2 focus-visible:ring-[var(--accent)] sm:h-10 sm:w-10"
                    aria-label="Close expanded media"
                  >
                    <FiX className="h-5 w-5" strokeWidth={2.25} aria-hidden />
                  </button>
                  <div className="flex min-h-0 flex-1 items-center justify-center overflow-y-auto p-2 pb-[max(0.75rem,env(safe-area-inset-bottom,0px))] pt-14 sm:max-h-[min(92dvh,1080px)] sm:p-3 sm:pt-14">
                    <div
                      className={`overflow-hidden rounded-lg border-2 ${mediaShellBorderClass} max-w-full`}
                    >
                      {kind === 'video' ? (
                        <video
                          ref={modalVideoRef}
                          className="max-h-[min(72dvh,1000px)] w-auto max-w-full bg-black object-contain sm:max-h-[min(82dvh,1000px)]"
                          controls
                          playsInline
                          preload="metadata"
                          aria-label={label}
                        >
                          {videoMime ? <source src={mediaSrc} type={videoMime} /> : <source src={mediaSrc} />}
                        </video>
                      ) : (
                        <Image
                          src={mediaSrc}
                          alt={label}
                          width={PROJECT_CARD_MEDIA_WIDTH}
                          height={PROJECT_CARD_MEDIA_HEIGHT}
                          className="h-auto max-h-[min(72dvh,1000px)] w-auto max-w-full object-contain sm:max-h-[min(82dvh,1000px)]"
                          priority
                        />
                      )}
                    </div>
                  </div>
                </motion.div>
              </motion.div>
            ) : null}
          </AnimatePresence>,
          document.body,
        )
        : null}
    </article>
  );
}
