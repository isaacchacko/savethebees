'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import type { MouseEvent, ReactNode } from 'react';
import FreeToolbar from '@/components/FreeToolbar';
import GameStatus from '@/components/GameStatus';
import { SlideContext, SlideLink, type Slide } from '@/components/slide';
import { FP_HREF, GAME_HREF, useMapMode } from '@/components/Stage';
import SfClock from '@/components/SfClock';

/**
 * The intro page: the pitch for the game, with the buttons into the game page
 * and the fp page. It is the game tab, left of home.
 */
const INTRO_HREF = '/play';

const TABS = [
  { href: INTRO_HREF, label: 'game' },
  { href: '/', label: 'home' },
  { href: '/about', label: 'about' },
  { href: '/now', label: 'now' },
  { href: '/running', label: 'runs' },
  { href: '/blog', label: 'blog' },
  { href: '/library', label: 'library' },
];

// left to right as they sit in the nav, so a slide knows which way to go
const ORDER = TABS.map((t) => t.href);

/** Where a path sits left to right. */
function rank(pathname: string): number {
  return ORDER.indexOf(tabFor(pathname) ?? '');
}

const SOCIALS = [
  { href: '/Isaac_Chacko.pdf', label: 'resume' },
  { href: 'https://www.github.com/isaacchacko', label: 'github' },
  { href: 'https://www.linkedin.com/in/isaacchacko', label: 'linkedin' },
];

const SLIDE_PX = 56;
const SLIDE_OUT_MS = 260;
const NAVIGATE_AFTER_MS = 300;

function slideOut(el: HTMLElement, dir: 1 | -1) {
  el.getAnimations().forEach((a) => a.cancel());
  el.animate(
    [
      { transform: 'none', opacity: 1 },
      { transform: `translateX(${-dir * SLIDE_PX}px)`, opacity: 0 },
    ],
    { duration: SLIDE_OUT_MS, easing: 'cubic-bezier(.6,0,.8,.4)', fill: 'forwards' }
  );
}

function slideIn(el: HTMLElement, dir: number) {
  el.getAnimations().forEach((a) => a.cancel());
  if (!dir) return;
  el.animate(
    [
      { transform: `translateX(${dir * SLIDE_PX}px)`, opacity: 0 },
      { transform: 'none', opacity: 1 },
    ],
    { duration: 420, easing: 'cubic-bezier(.2,.7,.2,1)' }
  );
}

/**
 * The card's heading names the tab it is on; home, and anything off the nav,
 * says hi. A post shares its index's heading, so opening one leaves it put.
 */
function titleFor(pathname: string): string {
  const tab = tabFor(pathname);
  if (tab === INTRO_HREF) return 'Transit Control';
  if (!tab || tab === '/') return 'howdy!';
  return TABS.find((t) => t.href === tab)?.label ?? 'howdy!';
}

/** The fp and game pages: the card is the toolbar, the map is the page. */
const onMap = (pathname: string) => pathname === FP_HREF || pathname === GAME_HREF;

/** The tab a path lives under, or null for pages off the nav like /arch. */
function tabFor(pathname: string): string | null {
  // the fp and game pages sit under the game tab with the intro page they
  // are entered from
  if (pathname === INTRO_HREF || onMap(pathname)) return INTRO_HREF;
  if (pathname === '/') return '/';
  return (
    ORDER.find((href) => href !== '/' && (pathname === href || pathname.startsWith(href + '/'))) ??
    null
  );
}

/** home is a small card in the corner; the list-heavy tabs take the width */
function sizeFor(tab: string | null): 'sm' | 'md' | 'lg' {
  if (tab === '/') return 'sm';
  if (tab === '/blog' || tab === '/library') return 'lg';
  return 'md';
}

export default function Card({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { mode, game, score } = useMapMode();
  const scoreWarning = mode === 'game' && game?.phase === 'day' && game.left <= 0.1 && score.total < game.target;
  // set on click rather than on arrival, so the indicator and the card's size
  // move while the old page is still sliding out
  const [tab, setTab] = useState(() => tabFor(pathname));
  // where the card is headed, set on click like `tab`: the game tab covers the
  // intro page and the map pages, which take very different cards
  const [dest, setDest] = useState(pathname);
  const cardRef = useRef<HTMLDivElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const footerRef = useRef<HTMLElement>(null);
  // the title only rides along when the slide changes it, i.e. between tabs
  const titleSliding = useRef(false);
  const footerSliding = useRef(false);
  const pathnameRef = useRef(pathname);
  pathnameRef.current = pathname;

  // what a slide moves: the page, or on the fp and game pages the toolbar
  // standing in for it — so they wipe like pages sitting left of the others
  const contentOf = (path: string) =>
    onMap(path)
      ? cardRef.current?.querySelector<HTMLElement>('.toolbar')
      : bodyRef.current;
  const linksRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const enterDir = useRef(0);
  const navigateTimer = useRef<ReturnType<typeof setTimeout>>(undefined);

  const isPost = /^\/blog\/[^/]+$/.test(pathname);

  const updateProgress = useCallback(() => {
    const body = bodyRef.current;
    const bar = progressRef.current;
    if (!body || !bar) return;
    const max = body.scrollHeight - body.clientHeight;
    bar.style.width = `${max > 0 ? (body.scrollTop / max) * 100 : 100}%`;
  }, []);

  const slide = useCallback<Slide>(
    (href, dir) => {
      setTab(tabFor(href));
      setDest(href);
      clearTimeout(navigateTimer.current);
      if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
        router.push(href);
        return;
      }
      const leaving = contentOf(pathnameRef.current);
      if (leaving) slideOut(leaving, dir);
      titleSliding.current = titleFor(href) !== titleFor(pathnameRef.current);
      if (titleSliding.current && titleRef.current) slideOut(titleRef.current, dir);
      // into or out of free play the whole card changes, footer included
      footerSliding.current = onMap(href) !== onMap(pathnameRef.current);
      if (footerSliding.current && footerRef.current) slideOut(footerRef.current, dir);
      enterDir.current = dir;
      navigateTimer.current = setTimeout(() => router.push(href), NAVIGATE_AFTER_MS);
    },
    [router]
  );

  // runs on every arrival, including back/forward, which never went through slide
  useEffect(() => {
    setTab(tabFor(pathname));
    setDest(pathname);
    const body = bodyRef.current;
    if (!body) return;
    body.scrollTop = 0;
    updateProgress();
    const dir = enterDir.current;
    enterDir.current = 0;
    const arriving = contentOf(pathname);
    if (arriving) slideIn(arriving, dir);
    if (titleRef.current) slideIn(titleRef.current, titleSliding.current ? dir : 0);
    if (footerRef.current) slideIn(footerRef.current, footerSliding.current ? dir : 0);
    titleSliding.current = false;
    footerSliding.current = false;
  }, [pathname, updateProgress]);

  useLayoutEffect(() => {
    const measure = () => {
      const indicator = indicatorRef.current;
      const active = linksRef.current?.querySelector<HTMLElement>(`[data-tab="${tab}"]`);
      if (!indicator) return;
      indicator.style.opacity = active ? '1' : '0';
      if (active) {
        indicator.style.left = `${active.offsetLeft}px`;
        indicator.style.width = `${active.offsetWidth}px`;
      }
    };
    measure();
    document.fonts?.ready.then(measure);
    addEventListener('resize', measure);
    return () => removeEventListener('resize', measure);
  }, [tab]);

  useEffect(() => () => clearTimeout(navigateTimer.current), []);

  // the map's own modes: on as soon as one is clicked (the game page sets its
  // mode straight away; free play is a page, so it counts from the click),
  // and off only once the mode has gone. The vignette and the nav follow it.
  const mapOn = mode !== 'site' || onMap(dest);

  const go = (href: string) => {
    if (pathname === href) return;
    // same tab from deeper in (a post back to its index) slides back
    slide(href, rank(href) > rank(pathname) ? 1 : -1);
  };

  const onTab = (href: string) => (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
    e.preventDefault();
    go(href);
  };

  return (
    <SlideContext.Provider value={slide}>
      <div className="vignette" data-on={mapOn ? 'true' : 'false'} data-warning={scoreWarning ? 'true' : 'false'} />
      {/* size follows where the card is headed, set on click, so it resizes
          while the old contents wipe out; view follows where it actually is,
          so the toolbar and the page swap only once the url does. In free play
          the page is hidden, not unmounted, so it comes back as it was. */}
      <div
        ref={cardRef}
        className="card"
        data-size={onMap(dest) ? 'tool' : sizeFor(tab)}
        data-view={mode === 'free' || mode === 'game' ? 'tool' : 'page'}
      >
        <h1 ref={titleRef} className="card-title">
          {titleFor(pathname)}
        </h1>
        <div ref={bodyRef} className="card-body" onScroll={updateProgress}>
          {children}
        </div>
        {isPost ? (
          <div className="progress">
            <div ref={progressRef} className="progress-bar" />
          </div>
        ) : null}
        <footer ref={footerRef} className="card-footer">
          {SOCIALS.map((s) => (
            <a key={s.href} href={s.href} target="_blank" rel="noopener noreferrer">
              {s.label}
            </a>
          ))}
          <SfClock />
        </footer>
        {mode === 'free' || mode === 'game' ? <FreeToolbar /> : null}
      </div>

      <header className="topbar">
        <SlideLink href="/" dir={-1} className="brand">
          isaacchacko.com
        </SlideLink>
        {/* the nav and the status share one spot, swapping as a mode comes and goes */}
        <div className="topbar-right">
          <nav className="tabs" data-hidden={mapOn ? 'true' : 'false'}>
            <div ref={linksRef} className="tab-links">
              <div ref={indicatorRef} className="tab-indicator" />
              <div className="page-links">
                {TABS.map((t) => (
                  <Link
                    key={t.href}
                    href={t.href}
                    data-tab={t.href}
                    aria-current={t.href === tab ? 'page' : undefined}
                    onClick={onTab(t.href)}
                    className="tab"
                  >
                    {t.label}
                  </Link>
                ))}
              </div>
            </div>
          </nav>
          <GameStatus hidden={!mapOn} />
        </div>
      </header>
    </SlideContext.Provider>
  );
}
