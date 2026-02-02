'use client';

import { useEffect, useRef, useState } from 'react';
import type { MouseEvent as ReactMouseEvent } from 'react';
import { it } from '@public/fonts';
import ClickRevealImage from '@/components/ClickRevealImage';

export default function DebugPage() {
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const [isMaskedPanelActive, setIsMaskedPanelActive] = useState(false);
  const originalTextRef = useRef<HTMLParagraphElement>(null);
  const textClipSvgRef = useRef<SVGSVGElement>(null);
  const textClipContainerRef = useRef<HTMLDivElement>(null);
  const clippedTextRef = useRef<HTMLParagraphElement>(null);
  const debugMaskedTextRef = useRef<HTMLParagraphElement>(null);

  const handleMaskedPanelMouseMove = (e: ReactMouseEvent<HTMLDivElement>) => {
    const el = debugMaskedTextRef.current;
    if (!el) return;

    const rect = el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const radius = 80;
    el.style.setProperty('--debug-cut-cx', `${x}px`);
    el.style.setProperty('--debug-cut-cy', `${y}px`);
    el.style.setProperty('--debug-cut-r', `${radius}px`);

    // Simple intersection check: is mouse within radius of text center?
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const dist = Math.hypot(x - centerX, y - centerY);
    setIsMaskedPanelActive(dist <= radius);
  };

  const handleMaskedPanelMouseLeave = () => {
    setIsMaskedPanelActive(false);
  };

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsMounted(true);

    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Update text clipPath to match original text
  useEffect(() => {
    if (typeof window === 'undefined' || !isMounted) return;

    const originalText = originalTextRef.current;
    const textClipSvg = textClipSvgRef.current;
    const textClipContainer = textClipContainerRef.current;
    const clippedText = clippedTextRef.current;
    const textClipText = textClipSvg?.querySelector('#text-clip-text') as SVGTextElement;
    const maskRect = textClipSvg?.querySelector('mask#debug-text-mask rect') as SVGRectElement;

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/5c6080b2-a485-4a72-a5f6-0548db74ff7d', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'initial',
        hypothesisId: 'H1',
        location: 'src/app/debug/page.tsx:useEffect:init',
        message: 'Initial refs for text clip effect',
        data: {
          hasOriginalText: !!originalText,
          hasTextClipSvg: !!textClipSvg,
          hasTextClipContainer: !!textClipContainer,
          hasClippedText: !!clippedText,
          textClipSvgChildren: textClipSvg ? textClipSvg.childElementCount : null,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => { });
    // #endregion agent log

    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/5c6080b2-a485-4a72-a5f6-0548db74ff7d', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'initial',
        hypothesisId: 'H1b',
        location: 'src/app/debug/page.tsx:useEffect:init-refs-detail',
        message: 'Detailed ref availability for text clip effect',
        data: {
          hasOriginalText: !!originalText,
          hasTextClipSvg: !!textClipSvg,
          hasTextClipContainer: !!textClipContainer,
          hasTextClipText: !!textClipText,
          hasMaskRect: !!maskRect,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => { });
    // #endregion agent log

    if (!originalText || !textClipSvg || !textClipContainer || !textClipText || !maskRect) return;

    const updateTextClip = () => {
      const rect = originalText.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(originalText);

      // Get container position for sizing (we'll keep the copy anchored within its own card)
      const containerRect = textClipContainer.parentElement?.getBoundingClientRect();
      if (!containerRect) return;

      // #region agent log
      fetch('http://127.0.0.1:7243/ingest/5c6080b2-a485-4a72-a5f6-0548db74ff7d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'initial',
          hypothesisId: 'H2',
          location: 'src/app/debug/page.tsx:updateTextClip:before-layout',
          message: 'Text and container rects before layout updates',
          data: {
            textRect: {
              left: rect.left,
              top: rect.top,
              width: rect.width,
              height: rect.height,
            },
            containerRect: {
              left: containerRect.left,
              top: containerRect.top,
              width: containerRect.width,
              height: containerRect.height,
            },
            fontSize: computedStyle.fontSize,
            fontFamily: computedStyle.fontFamily,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => { });
      // #endregion agent log

      // Anchor the clipped text within its own card instead of mirroring the original's absolute position
      const relativeLeft = 0;
      const relativeTop = 0;
      const textWidth = rect.width;
      const textHeight = rect.height;

      // Update SVG size to match container
      const svgWidth = containerRect.width;
      const svgHeight = containerRect.height;

      textClipSvg.setAttribute('width', svgWidth.toString());
      textClipSvg.setAttribute('height', svgHeight.toString());
      textClipSvg.setAttribute('viewBox', `0 0 ${svgWidth} ${svgHeight}`);

      // Update mask rect size
      maskRect.setAttribute('width', svgWidth.toString());
      maskRect.setAttribute('height', svgHeight.toString());

      // Position text at the same position as the original text (relative to container)
      const textX = textWidth / 2;
      const textY = textHeight / 2;

      // Position text
      textClipText.setAttribute('x', textX.toString());
      textClipText.setAttribute('y', textY.toString());
      textClipText.setAttribute('text-anchor', 'middle');
      textClipText.setAttribute('dominant-baseline', 'middle');

      // Copy font styles from original text
      textClipText.setAttribute('font-size', computedStyle.fontSize);
      textClipText.setAttribute('font-family', computedStyle.fontFamily);
      textClipText.setAttribute('font-weight', computedStyle.fontWeight);
      textClipText.setAttribute('font-style', computedStyle.fontStyle);
      textClipText.setAttribute('letter-spacing', computedStyle.letterSpacing);
      textClipText.setAttribute('fill', 'white'); // White = visible in mask

      // Get text content
      const textContent = originalText.textContent || originalText.innerText || '';
      textClipText.textContent = textContent;

      // Position container to match text position relative to its parent
      textClipContainer.style.position = 'absolute';
      textClipContainer.style.left = `${relativeLeft}px`;
      textClipContainer.style.top = `${relativeTop}px`;
      textClipContainer.style.width = `${textWidth}px`;
      textClipContainer.style.height = `${textHeight}px`;

      // Adjust background position to match original text position on the page
      const bgX = -rect.left;
      const bgY = -rect.top;
      textClipContainer.style.backgroundPosition = `${bgX}px ${bgY}px`;

      // Apply background-clip:text to the copied text so the image only shows through the glyphs
      const clippedTextEl = clippedTextRef.current;
      if (clippedTextEl) {
        clippedTextEl.style.backgroundImage = 'url(/water-lily-pond-x.jpg)';
        clippedTextEl.style.backgroundSize = `${dimensions.width || window.innerWidth}px ${dimensions.height || window.innerHeight}px`;
        clippedTextEl.style.backgroundRepeat = 'no-repeat';
        clippedTextEl.style.backgroundPosition = `${bgX}px ${bgY}px`;
        (clippedTextEl.style as any).WebkitBackgroundClip = 'text';
        clippedTextEl.style.backgroundClip = 'text';
        clippedTextEl.style.color = 'transparent';
      }

      // #region agent log
      const containerStyle = window.getComputedStyle(textClipContainer);
      const clippedTextElForLog = clippedTextRef.current;
      const clippedStyle = clippedTextElForLog ? window.getComputedStyle(clippedTextElForLog) : null;
      fetch('http://127.0.0.1:7243/ingest/5c6080b2-a485-4a72-a5f6-0548db74ff7d', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: 'debug-session',
          runId: 'initial',
          hypothesisId: 'H3',
          location: 'src/app/debug/page.tsx:updateTextClip:after-layout',
          message: 'Container styles after layout updates',
          data: {
            styleWidth: containerStyle.width,
            styleHeight: containerStyle.height,
            styleLeft: containerStyle.left,
            styleTop: containerStyle.top,
            backgroundImage: containerStyle.backgroundImage,
            webkitMaskImage: (containerStyle as any).WebkitMaskImage,
            maskImage: containerStyle.maskImage,
            clippedBackgroundImage: clippedStyle ? clippedStyle.backgroundImage : null,
            clippedBackgroundClip: clippedStyle ? clippedStyle.backgroundClip : null,
            clippedColor: clippedStyle ? clippedStyle.color : null,
            visibility: containerStyle.visibility,
          },
          timestamp: Date.now(),
        }),
      }).catch(() => { });
      // #endregion agent log
    };

    // Wait for fonts to load
    const updateWhenReady = () => {
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => {
          setTimeout(updateTextClip, 100);
        });
      } else {
        setTimeout(updateTextClip, 100);
      }
    };

    updateWhenReady();
    window.addEventListener('resize', updateTextClip);
    window.addEventListener('scroll', updateTextClip);

    // Use MutationObserver to watch for content changes
    const observer = new MutationObserver(updateTextClip);
    observer.observe(originalText, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style'],
      characterData: true,
    });

    return () => {
      window.removeEventListener('resize', updateTextClip);
      window.removeEventListener('scroll', updateTextClip);
      observer.disconnect();
    };
  }, [isMounted, dimensions]);

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      {/* Include ClickRevealImage to provide SVG masks */}
      <ClickRevealImage />
      <h1 className="text-3xl font-bold mb-8 text-center">Debug: Text Clip Comparison</h1>

      <div className="flex gap-8 justify-center items-start flex-wrap">
        {/* Original Text */}
        <div className="flex-1 min-w-[400px] max-w-[600px]">
          <h2 className="text-xl font-semibold mb-4">Original Text</h2>
          <div className="bg-white p-6 rounded-lg shadow-lg">
            <p
              ref={originalTextRef}
              className={`${it.className} text-md md:text-xl lg:text-3xl xl:text-4xl`}
            >
              I&apos;m a junior studying CS at Texas A&amp;M! I previously interned at{' '}
              <span className="hover:scale-90 inline font-black transition-all duration-300">
                SISO
              </span>{' '}
              and{' '}
              <span className="inline font-black transition-all duration-300">LUMINARE</span>.
            </p>
          </div>
        </div>

        {/* Text Copy with Background Clipped */}
        <div className="flex-1 min-w-[400px] max-w-[600px]">
          <h2 className="text-xl font-semibold mb-4">Text Copy (Background Clipped)</h2>
          <div className="bg-white p-6 rounded-lg shadow-lg relative overflow-visible min-h-[200px]">
            {/* SVG for text mask */}
            {isMounted && (
              <svg
                ref={textClipSvgRef}
                className="absolute inset-0 pointer-events-none w-full h-full"
                style={{ visibility: 'hidden' }}
              >
                <defs>
                  <mask id="debug-text-mask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse">
                    <rect width={800} height={400} fill="black" />
                    <text
                      id="text-clip-text"
                      x="0"
                      y="0"
                      fill="white"
                    />
                  </mask>
                </defs>
              </svg>
            )}
            {/* Text copy with background image clipped to text */}
            {isMounted && (
              <div
                ref={textClipContainerRef}
                className="absolute"
              >
                <p
                  ref={clippedTextRef}
                  className={`${it.className} text-md md:text-xl lg:text-3xl xl:text-4xl`}
                >
                  I&apos;m a junior studying CS at Texas A&amp;M! I previously interned at{' '}
                  <span className="hover:scale-90 inline font-black transition-all duration-300">
                    SISO
                  </span>{' '}
                  and{' '}
                  <span className="inline font-black transition-all duration-300">LUMINARE</span>.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Text A with Inverse Mask (black bg, white text) */}
        <div className="flex-1 min-w-[400px] max-w-[600px] mt-8">
          <h2 className="text-xl font-semibold mb-4">
            Text A with Inverse Mask (Debug)
          </h2>
          <div
            className="bg-black p-6 rounded-lg shadow-lg relative overflow-hidden min-h-[200px]"
          >
            <p
              id="debug-masked-text"
              ref={debugMaskedTextRef}
              className={`${it.className} text-md md:text-xl lg:text-3xl xl:text-4xl text-white`}
              style={{
                WebkitMaskImage:
                  'radial-gradient(circle at var(--debug-cut-cx, -999px) var(--debug-cut-cy, -999px), transparent 0, transparent var(--debug-cut-r, 0px), black calc(var(--debug-cut-r, 0px) + 1px))',
                maskImage:
                  'radial-gradient(circle at var(--debug-cut-cx, -999px) var(--debug-cut-cy, -999px), transparent 0, transparent var(--debug-cut-r, 0px), black calc(var(--debug-cut-r, 0px) + 1px))',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
              }}
            >
              I&apos;m a junior studying CS at Texas A&amp;M! I previously interned at{' '}
              <span className="hover:scale-90 inline font-black transition-all duration-300">
                SISO
              </span>{' '}
              and{' '}
              <span className="inline font-black transition-all duration-300">
                LUMINARE
              </span>
              .
            </p>
            <div
              className={`mt-4 text-sm font-mono ${isMaskedPanelActive ? 'text-red-500 animate-pulse' : 'text-gray-400'
                }`}
            >
              {isMaskedPanelActive ? 'Mask overlap ACTIVE' : 'Mask overlap inactive'}
            </div>
          </div>
        </div>

        {/* Text A with CSS Variables driven by ClickRevealImage */}
        <div className="flex-1 min-w-[400px] max-w-[600px] mt-8">
          <h2 className="text-xl font-semibold mb-4">
            Text A with CSS Mask (Click/Drag to test)
          </h2>
          <div className="bg-black p-6 rounded-lg shadow-lg relative overflow-hidden min-h-[200px]">
            <p
              id="reveal-target-text"
              className={`${it.className} text-md md:text-xl lg:text-3xl xl:text-4xl text-white reveal-mask-target`}
              style={{
                WebkitMaskImage:
                  'radial-gradient(circle at var(--reveal-cx, -999px) var(--reveal-cy, -999px), transparent 0, transparent var(--reveal-r, 0px), black calc(var(--reveal-r, 0px) + 1px))',
                maskImage:
                  'radial-gradient(circle at var(--reveal-cx, -999px) var(--reveal-cy, -999px), transparent 0, transparent var(--reveal-r, 0px), black calc(var(--reveal-r, 0px) + 1px))',
                WebkitMaskRepeat: 'no-repeat',
                maskRepeat: 'no-repeat',
              }}
            >
              I&apos;m a junior studying CS at Texas A&amp;M! I previously interned at{' '}
              <span className="hover:scale-90 inline font-black transition-all duration-300">
                SISO
              </span>{' '}
              and{' '}
              <span className="inline font-black transition-all duration-300">
                LUMINARE
              </span>
              .
            </p>
            <div className="mt-4 text-sm font-mono text-gray-400">
              Uses CSS variables <code className="bg-gray-800 px-1 rounded">--reveal-cx/cy/r</code> set by ClickRevealImage
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
