'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import SpotifyNowPlaying, { useSpotifyPlayback } from '@/components/SpotifyNowPlaying';
import HeroGlyphs from '@/components/HeroGlyphs';
import HeroSplines from '@/components/HeroSplines';
import HexRain from '@/components/HexRain';
import TrefoilHero from '@/components/TrefoilHero';

const URL_PATHS = [
  'arch',
  'projects',
  'tracking',
  'about',
  'resume'
];

const TypingPath = ({ isVisible, currentIndex, autoCycle = true }: { isVisible: boolean; currentIndex?: number; autoCycle?: boolean }) => {
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [displayedText, setDisplayedText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const activeIndex = currentIndex !== undefined ? currentIndex : currentPathIndex;

  useEffect(() => {
    if (!isVisible) {
      setDisplayedText('');
      return;
    }

    const currentPath = URL_PATHS[activeIndex];
    let charIndex = 0;
    setIsTyping(true);
    setDisplayedText('');

    const typeChar = () => {
      if (charIndex < currentPath.length) {
        setDisplayedText(currentPath.slice(0, charIndex + 1));
        charIndex++;
        typingTimeoutRef.current = setTimeout(typeChar, 100); // Typing speed
      } else {
        setIsTyping(false);
        // Wait before moving to next path only if autoCycle is enabled
        if (autoCycle && currentIndex === undefined) {
          typingTimeoutRef.current = setTimeout(() => {
            setCurrentPathIndex((prev) => (prev + 1) % URL_PATHS.length);
          }, 2000);
        }
      }
    };

    typeChar();

    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [activeIndex, isVisible, autoCycle, currentIndex]);

  if (!isVisible) return null;

  return (
    <span className="text-gray-400 font-normal inline-block min-w-[60px]">
      /{displayedText}
      {isTyping && <span className="animate-pulse">|</span>}
    </span>
  );
};

interface DebugBox { x: number; y: number; w: number; h: number }

const Home = () => {
  const [isHoveringMusic, setIsHoveringMusic] = useState(false);
  const [isHoveringUrl, setIsHoveringUrl] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [showHoverHint, setShowHoverHint] = useState(true);
  const [selectedPathIndex, setSelectedPathIndex] = useState(0);
  const [autoCycle, setAutoCycle] = useState(true);
  const [isDark, setIsDark] = useState(false);
  const [paragraphCenterY, setParagraphCenterY] = useState<number | null>(null);
  const paragraphRef = useRef<HTMLParagraphElement>(null);

  // ── debug bounding-box state ───────────────────────────────────────────────
  const [debugMode, setDebugMode] = useState(false);
  const [debugBox, setDebugBox] = useState<DebugBox | null>(null);
  const dragStart = useRef<{ x: number; y: number } | null>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === '`') setDebugMode(prev => !prev);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Derived debug params (fractions of viewport so they generalise across resolutions)
  const debugParams = useMemo(() => {
    if (!debugBox) return null;
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    const cx = debugBox.x + debugBox.w / 2;
    const cy = debugBox.y + debugBox.h / 2;
    const side = Math.min(debugBox.w, debugBox.h);
    // trefoil natural span = 6 units → scale = side / 6
    const scaleFactor = (side / 6) / Math.min(vw, vh);
    const cyFraction = cy / vh;
    const cxFraction = cx / vw;
    return { cy, cyFraction, cx, cxFraction, scaleFactor, vw, vh };
  }, [debugBox]);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', isDark);
  }, [isDark]);

  useEffect(() => {
    const measure = () => {
      if (!paragraphRef.current) return;
      const rect = paragraphRef.current.getBoundingClientRect();
      setParagraphCenterY(rect.top + rect.height / 2);
    };
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  const playback = useSpotifyPlayback();
  const isPlaying = playback?.is_playing && playback?.track;

  // Reset auto-cycle when hovering stops
  useEffect(() => {
    if (!isHoveringUrl) {
      setAutoCycle(true);
      setSelectedPathIndex(0);
    }
  }, [isHoveringUrl]);

  // Handle keyboard input when hovering
  useEffect(() => {
    if (!isHoveringUrl) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        setAutoCycle(false);
        setSelectedPathIndex((prev) => (prev + 1) % URL_PATHS.length);
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const selectedPath = URL_PATHS[selectedPathIndex];
        window.location.href = `/${selectedPath}`;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isHoveringUrl, selectedPathIndex]);

  const handleMusicClick = () => {
    setIsPinned(prev => !prev);
  };

  const shouldShowSpotify = isHoveringMusic || isPinned;


  const CrossSvg = () => (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0 }}>
      <line x1="11" y1="0" x2="11" y2="22" stroke="currentColor" strokeWidth="1.5" />
      <line x1="0" y1="11" x2="22" y2="11" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );

  // Light mode glyph: four-pointed asterisk
  const LightGlyph = () => (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" style={{ flexShrink: 0 }}>
      <line x1="11" y1="1" x2="11" y2="21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="1" y1="11" x2="21" y2="11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="3.929" y1="3.929" x2="18.071" y2="18.071" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="18.071" y1="3.929" x2="3.929" y2="18.071" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );

  // Dark mode glyph: crescent moon
  // Outer arc (r=8, centre 11,11) sweeps the left side from (15,4.1) to (15,17.9).
  // Inner arc (r=7, centre 14,11) closes back, creating the concave bite.
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

  return (
    <div className='relative flex justify-center items-center min-h-screen overflow-hidden' style={{ pointerEvents: 'none' }}>
      <TrefoilHero
        paragraphCenterY={debugParams ? debugParams.cy : paragraphCenterY}
        overrideCenterX={debugParams ? debugParams.cx : undefined}
        overrideScaleFactor={debugParams ? debugParams.scaleFactor : undefined}
      />

      {/* ── debug bounding-box overlay ──────────────────────────────────── */}
      {debugMode && (
        <div
          className='absolute inset-0 z-50'
          style={{ pointerEvents: 'auto', cursor: 'crosshair' }}
          onMouseDown={e => {
            dragStart.current = { x: e.clientX, y: e.clientY };
            setDebugBox(null);
          }}
          onMouseMove={e => {
            if (!dragStart.current) return;
            const x = Math.min(e.clientX, dragStart.current.x);
            const y = Math.min(e.clientY, dragStart.current.y);
            const w = Math.abs(e.clientX - dragStart.current.x);
            const h = Math.abs(e.clientY - dragStart.current.y);
            setDebugBox({ x, y, w, h });
          }}
          onMouseUp={() => { dragStart.current = null; }}
        >
          {/* crosshair grid lines */}
          <svg className='absolute inset-0 w-full h-full' style={{ pointerEvents: 'none' }}>
            <line x1='50%' y1='0' x2='50%' y2='100%' stroke='rgba(255,100,0,0.2)' strokeWidth='1' strokeDasharray='4 4' />
            <line x1='0' y1='50%' x2='100%' y2='50%' stroke='rgba(255,100,0,0.2)' strokeWidth='1' strokeDasharray='4 4' />
          </svg>

          {/* drawn box */}
          {debugBox && debugBox.w > 4 && debugBox.h > 4 && (
            <div
              style={{
                position: 'absolute',
                left: debugBox.x,
                top: debugBox.y,
                width: debugBox.w,
                height: debugBox.h,
                border: '2px dashed rgba(255,100,0,0.85)',
                boxSizing: 'border-box',
                pointerEvents: 'none',
              }}
            >
              {/* centre crosshair */}
              <div style={{ position: 'absolute', top: '50%', left: 0, right: 0, height: 1, background: 'rgba(255,100,0,0.5)' }} />
              <div style={{ position: 'absolute', left: '50%', top: 0, bottom: 0, width: 1, background: 'rgba(255,100,0,0.5)' }} />
            </div>
          )}

          {/* HUD */}
          <div
            className='absolute bottom-6 left-6 font-mono text-xs leading-5'
            style={{ pointerEvents: 'none', color: 'rgba(255,100,0,0.9)', background: 'rgba(0,0,0,0.75)', padding: '10px 14px', borderRadius: 6, border: '1px solid rgba(255,100,0,0.4)' }}
          >
            <div style={{ marginBottom: 4, fontWeight: 700, letterSpacing: '0.1em' }}>DEBUG · TREFOIL BOUNDS  [`  to exit]</div>
            {debugParams ? (
              <>
                <div>box  {debugBox!.w.toFixed(0)} × {debugBox!.h.toFixed(0)} px  @  ({(debugBox!.x + debugBox!.w / 2).toFixed(0)}, {(debugBox!.y + debugBox!.h / 2).toFixed(0)})</div>
                <div>viewport  {debugParams.vw} × {debugParams.vh}</div>
                <div style={{ marginTop: 6, color: '#6ee7b7' }}>── suggested code ───────────────────────</div>
                <div>cxFraction  <span style={{ color: '#fbbf24' }}>{debugParams.cxFraction.toFixed(4)}</span></div>
                <div>cyFraction  <span style={{ color: '#fbbf24' }}>{debugParams.cyFraction.toFixed(4)}</span></div>
                <div>scaleFactor  <span style={{ color: '#fbbf24' }}>{debugParams.scaleFactor.toFixed(4)}</span></div>
                <div style={{ marginTop: 4, color: '#6ee7b7' }}>const cx = W * {debugParams.cxFraction.toFixed(4)};</div>
                <div style={{ color: '#6ee7b7' }}>const cy = H * {debugParams.cyFraction.toFixed(4)};</div>
                <div style={{ color: '#6ee7b7' }}>const scale = Math.min(W, H) * {debugParams.scaleFactor.toFixed(4)};</div>
              </>
            ) : (
              <div style={{ opacity: 0.6 }}>drag to draw bounding box…</div>
            )}
          </div>
        </div>
      )}

      {/* ── top navbar: cross · [url ⟷ spotify] · cross ── */}
      <div
        className='absolute top-0 left-0 right-0 flex items-center gap-4 px-6 py-6 text-reveal'
        style={{ pointerEvents: 'auto', animationDelay: '0.2s' }}
      >
        <CrossSvg />

        {/* middle zone — url layer and spotify layer cross-fade */}
        <div className='flex-1 relative min-w-0 flex items-center'>

          {/* URL layer */}
          <div
            className='relative w-full transition-opacity duration-300'
            style={{ opacity: shouldShowSpotify ? 0 : 1, pointerEvents: shouldShowSpotify ? 'none' : 'auto' }}
          >
            <span
              className='font-black text-lg md:text-2xl lg:text-4xl xl:text-5xl select-none'
              onMouseEnter={() => setIsHoveringUrl(true)}
              onMouseLeave={() => setIsHoveringUrl(false)}
            >
              isaacchacko.com
              <TypingPath isVisible={isHoveringUrl} currentIndex={autoCycle ? undefined : selectedPathIndex} autoCycle={autoCycle} />
            </span>
          </div>

          {/* Spotify layer */}
          <div
            className='absolute inset-0 flex items-center transition-opacity duration-300'
            style={{ opacity: shouldShowSpotify ? 1 : 0, pointerEvents: shouldShowSpotify ? 'auto' : 'none' }}
          >
            <SpotifyNowPlaying
              navbarMode
              isPinned={isPinned}
              onUnpin={() => setIsPinned(false)}
              onPin={handleMusicClick}
            />
          </div>
        </div>

        <button
          onClick={() => setIsDark(prev => !prev)}
          className='flex items-center justify-center hover:opacity-60'
          style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', flexShrink: 0, position: 'relative', width: 22, height: 22 }}
          aria-label="Toggle dark/light mode"
        >
          <span style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: isDark ? 0 : 1,
            transform: isDark ? 'scale(0.6) rotate(60deg)' : 'scale(1) rotate(0deg)',
            transition: 'opacity 0.35s ease, transform 0.35s ease',
          }}>
            <LightGlyph />
          </span>
          <span style={{
            position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
            opacity: isDark ? 1 : 0,
            transform: isDark ? 'scale(1) rotate(0deg)' : 'scale(0.6) rotate(-60deg)',
            transition: 'opacity 0.35s ease, transform 0.35s ease',
          }}>
            <DarkGlyph />
          </span>
        </button>

        <CrossSvg />

        {/* Hint text — floats below the navbar, takes no space in it */}
        <span
          className='absolute top-full left-6 mt-1 text-xs md:text-sm text-gray-400 select-none pointer-events-none whitespace-nowrap transition-opacity duration-200'
          style={{ opacity: isHoveringUrl ? 1 : 0 }}
        >
          press{' '}
          <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-300 bg-gray-700 border border-gray-600 rounded shadow-sm">tab</kbd>
          {' '}to cycle,{' '}
          <kbd className="px-1.5 py-0.5 text-xs font-semibold text-gray-300 bg-gray-700 border border-gray-600 rounded shadow-sm">enter</kbd>
          {' '}to go
        </span>
      </div>

      {/* ── bottom crosses ── */}
      <div className='absolute bottom-6 left-6 pointer-events-none'><CrossSvg /></div>
      <div className='absolute bottom-6 right-6 pointer-events-none'><CrossSvg /></div>

      <div
        className='mx-[33vh] flex-1 overflow-hidden py-10 flex flex-col justify-center items-center text-center'
        style={{ pointerEvents: 'auto' }}
      >
        <p ref={paragraphRef} className="leading-relaxed text-md md:text-xl lg:text-3xl xl:text-4xl relative z-10 reveal-mask-target select-none text-left w-full text-reveal" style={{ animationDelay: '0.4s', backgroundColor: 'rgba(255, 255, 255, 0.0)' }}>
          Howdy! I'm a software engineer building at{' '}
          <a
            href="https://dryft.ai"
            target="_blank"
            rel="noopener noreferrer"
            className='font-black underline-growing hover:text-[#264aff] transition-colors inline'
          >
            Dryft
          </a>
          . I like to listen to{' '}
          <span
            className={`cursor-pointer hover:underline ${isPlaying ? 'spotify-pulse' : ''}`}
            onMouseEnter={() => setIsHoveringMusic(true)}
            onMouseLeave={() => setIsHoveringMusic(false)}
            onClick={handleMusicClick}
          >
            music
          </span>
          , needlessly update my{' '}
          <a
            href="/arch"
            target="_blank"
            rel="noopener noreferrer"
            className='font-black underline-growing hover:text-gray-400 transition-colors inline'
          >
            dotfiles
          </a>

          , and organize hackathons at{' '}
          <a
            href="https://tidaltamu.com"
            target="_blank"
            rel="noopener noreferrer"
            className='font-black underline-growing hover:text-[#20293e] transition-colors inline'
          >
            TIDAL
          </a>

          . Prev at{' '}
          <a
            href="https://siso-eng.com"
            target="_blank"
            rel="noopener noreferrer"
            className='font-black underline-growing hover:text-[#312683] transition-colors inline'
          >
            SISO
          </a>
          .
        </p>
        <HexRain
          rows={70}
          cols={30}
          startDelay={2000}
          style={{ position: 'absolute', top: 0, left: `70%`, zIndex: 0 }}
        />
        <HeroGlyphs />
      </div>
    </div >
  );
}

export default Home;
