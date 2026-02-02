'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';

export default function ClickRevealImage() {
  const [radius, setRadius] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [centerX, setCenterX] = useState(0);
  const [centerY, setCenterY] = useState(0);
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const [isMounted, setIsMounted] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const textClipSvgRef = useRef<SVGSVGElement>(null);
  const textClipContainerRef = useRef<HTMLDivElement>(null);
  const radiusRef = useRef(0);
  const animatedRadiusRef = useRef(0); // Tracks the current animated radius value
  const centerXRef = useRef(0); // Track center position for animation loop
  const centerYRef = useRef(0);
  const isDraggingRef = useRef(false);
  const animationFrameRef = useRef<number | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    setIsMounted(true);

    const updateDimensions = () => {
      if (containerRef.current) {
        setDimensions({
          width: window.innerWidth,
          height: window.innerHeight,
        });
      }
    };

    updateDimensions();
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  // Update position (always, no transition interference)
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0) return;

    const gradient = svgRef.current.querySelector('#radial-gradient') as SVGRadialGradientElement;
    const gradientInverse = svgRef.current.querySelector('#radial-gradient-inverse') as SVGRadialGradientElement;
    const circle = svgRef.current.querySelector('#mask-circle') as SVGCircleElement;
    const textACircle = svgRef.current.querySelector('#text-a-cut-circle') as SVGCircleElement;

    if (gradient && circle) {
      gradient.setAttribute('cx', centerX.toString());
      gradient.setAttribute('cy', centerY.toString());
      circle.setAttribute('cx', centerX.toString());
      circle.setAttribute('cy', centerY.toString());
    }

    if (gradientInverse) {
      gradientInverse.setAttribute('cx', centerX.toString());
      gradientInverse.setAttribute('cy', centerY.toString());
    }

    if (textACircle) {
      textACircle.setAttribute('cx', centerX.toString());
      textACircle.setAttribute('cy', centerY.toString());
    }

    // Update debug visible circle
    const debugCircle = svgRef.current.querySelector('#debug-visible-circle') as SVGCircleElement;
    if (debugCircle) {
      debugCircle.setAttribute('cx', centerX.toString());
      debugCircle.setAttribute('cy', centerY.toString());
    }
  }, [centerX, centerY, dimensions]);

  // Update radius ref
  useEffect(() => {
    radiusRef.current = radius;
  }, [radius]);

  useEffect(() => {
    isDraggingRef.current = isDragging;
  }, [isDragging]);

  // Update text clipPath to match original text
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const originalText = document.getElementById('junior-text');
    const textClipSvg = textClipSvgRef.current;
    const textClipContainer = textClipContainerRef.current;
    const textClipText = textClipSvg?.querySelector('#text-clip-text') as SVGTextElement;
    const maskRect = textClipSvg?.querySelector('#text-mask rect') as SVGRectElement;

    if (!originalText || !textClipSvg || !textClipContainer || !textClipText || !maskRect) return;

    const updateTextClip = () => {
      const rect = originalText.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(originalText);

      // Update SVG size and position - use screen dimensions
      const screenWidth = dimensions.width || window.innerWidth;
      const screenHeight = dimensions.height || window.innerHeight;

      textClipSvg.setAttribute('width', screenWidth.toString());
      textClipSvg.setAttribute('height', screenHeight.toString());
      textClipSvg.setAttribute('viewBox', `0 0 ${screenWidth} ${screenHeight}`);

      // Update mask rect size
      maskRect.setAttribute('width', screenWidth.toString());
      maskRect.setAttribute('height', screenHeight.toString());

      // Center the text in the screen
      const centerX = screenWidth / 2;
      const centerY = screenHeight / 2;

      // Position text in center of screen
      textClipText.setAttribute('x', centerX.toString());
      textClipText.setAttribute('y', centerY.toString());
      textClipText.setAttribute('text-anchor', 'middle');
      textClipText.setAttribute('dominant-baseline', 'middle');

      // Copy font styles from original text
      textClipText.setAttribute('font-size', computedStyle.fontSize);
      textClipText.setAttribute('font-family', computedStyle.fontFamily);
      textClipText.setAttribute('font-weight', computedStyle.fontWeight);
      textClipText.setAttribute('font-style', computedStyle.fontStyle);
      textClipText.setAttribute('letter-spacing', computedStyle.letterSpacing);
      textClipText.setAttribute('fill', 'white'); // White = visible in mask, black = transparent

      // Get text content (handle nested elements)
      const textContent = originalText.textContent || originalText.innerText || '';
      textClipText.textContent = textContent;

      // Adjust background position to match original text position
      const bgX = -rect.left;
      const bgY = -rect.top;
      textClipContainer.style.backgroundPosition = `${bgX}px ${bgY}px`;
    };

    // Wait for fonts to load before updating
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
      characterData: true
    });

    return () => {
      window.removeEventListener('resize', updateTextClip);
      window.removeEventListener('scroll', updateTextClip);
      observer.disconnect();
    };
  }, [dimensions]);

  // Log mask styles applied to hero text A for verification
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const el = document.getElementById('junior-text');
    if (!el) return;

    const cs = window.getComputedStyle(el);
    // #region agent log
    fetch('http://127.0.0.1:7243/ingest/5c6080b2-a485-4a72-a5f6-0548db74ff7d', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: 'debug-session',
        runId: 'initial',
        hypothesisId: 'H-text-a-mask-style',
        location: 'src/components/ClickRevealImage.tsx:useEffect:text-a-style',
        message: 'Computed styles for hero text A mask',
        data: {
          mask: (cs as any).mask,
          webkitMaskImage: (cs as any).WebkitMaskImage,
          webkitMask: (cs as any).WebkitMask,
        },
        timestamp: Date.now(),
      }),
    }).catch(() => { });
    // #endregion agent log
  }, [dimensions]);

  // Animate radius smoothly using requestAnimationFrame
  useEffect(() => {
    if (!svgRef.current || dimensions.width === 0 || dimensions.height === 0) return;

    const gradient = svgRef.current.querySelector('#radial-gradient') as SVGRadialGradientElement;
    const gradientInverse = svgRef.current.querySelector('#radial-gradient-inverse') as SVGRadialGradientElement;
    const circle = svgRef.current.querySelector('#mask-circle') as SVGCircleElement;
    const textACircle = svgRef.current.querySelector('#text-a-cut-circle') as SVGCircleElement;
    const debugCircle = svgRef.current.querySelector('#debug-visible-circle') as SVGCircleElement;

    if (!gradient || !circle) return;

    // Cancel any existing animation
    if (animationFrameRef.current !== null) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const startRadius = parseFloat(circle.getAttribute('r') || '0');
    const targetRadius = radius;
    const startTime = performance.now();
    const duration = 300; // 0.3s in milliseconds

    // Helper to update CSS variables on reveal targets (uses refs for latest position)
    const updateRevealTargets = (r: number) => {
      const revealTargets = document.querySelectorAll('.reveal-mask-target');
      revealTargets.forEach((el) => {
        const htmlEl = el as HTMLElement;
        const rect = htmlEl.getBoundingClientRect();
        const localX = centerXRef.current - rect.left;
        const localY = centerYRef.current - rect.top;

        if (r > 0) {
          htmlEl.style.setProperty('--reveal-cx', `${localX}px`);
          htmlEl.style.setProperty('--reveal-cy', `${localY}px`);
          htmlEl.style.setProperty('--reveal-r', `${r}px`);
        } else {
          htmlEl.style.setProperty('--reveal-cx', '-999px');
          htmlEl.style.setProperty('--reveal-cy', '-999px');
          htmlEl.style.setProperty('--reveal-r', '0px');
        }
      });
    };

    // If no change needed, set immediately
    if (Math.abs(startRadius - targetRadius) < 0.1) {
      gradient.setAttribute('r', targetRadius.toString());
      circle.setAttribute('r', targetRadius.toString());
      if (gradientInverse) {
        gradientInverse.setAttribute('r', targetRadius.toString());
      }
      if (textACircle) {
        textACircle.setAttribute('r', targetRadius.toString());
      }
      if (debugCircle) {
        debugCircle.setAttribute('r', targetRadius.toString());
      }
      animatedRadiusRef.current = targetRadius;
      updateRevealTargets(targetRadius);
      return;
    }

    // Animate function
    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Ease-out function
      const easeOut = 1 - Math.pow(1 - progress, 3);

      const currentRadius = startRadius + (targetRadius - startRadius) * easeOut;

      // Update animated radius ref so handleMouseMove uses the correct value
      animatedRadiusRef.current = currentRadius;

      gradient.setAttribute('r', currentRadius.toString());
      circle.setAttribute('r', currentRadius.toString());
      if (gradientInverse) {
        gradientInverse.setAttribute('r', currentRadius.toString());
      }
      if (textACircle) {
        textACircle.setAttribute('r', currentRadius.toString());
      }
      if (debugCircle) {
        debugCircle.setAttribute('r', currentRadius.toString());
      }
      updateRevealTargets(currentRadius);

      if (progress < 1) {
        animationFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Ensure final value is set
        gradient.setAttribute('r', targetRadius.toString());
        circle.setAttribute('r', targetRadius.toString());
        if (gradientInverse) {
          gradientInverse.setAttribute('r', targetRadius.toString());
        }
        if (textACircle) {
          textACircle.setAttribute('r', targetRadius.toString());
        }
        if (debugCircle) {
          debugCircle.setAttribute('r', targetRadius.toString());
        }
        animatedRadiusRef.current = targetRadius;
        updateRevealTargets(targetRadius);
        animationFrameRef.current = null;
      }
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [radius, dimensions]);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      // Check if click is on a link or button
      const target = e.target as HTMLElement;
      if (
        target.tagName === 'A' ||
        target.tagName === 'BUTTON' ||
        target.closest('a') ||
        target.closest('button')
      ) {
        return;
      }

      const x = e.clientX;
      const y = e.clientY;

      setCenterX(x);
      setCenterY(y);
      centerXRef.current = x;
      centerYRef.current = y;
      setIsDragging(true);
      // Expand with animation
      setRadius(300);
    };

    const handleMouseMove = (e: MouseEvent) => {
      if (!isDraggingRef.current) return;

      const x = e.clientX;
      const y = e.clientY;

      setCenterX(x);
      setCenterY(y);
      centerXRef.current = x;
      centerYRef.current = y;

      // Update reveal-mask-target elements ONLY if animation is not running
      const circleRadius = animatedRadiusRef.current;
      // During animation, the animation loop handles updates via updateRevealTargets
      if (animationFrameRef.current === null && circleRadius > 0) {
        const revealTargets = document.querySelectorAll('.reveal-mask-target');
        revealTargets.forEach((el) => {
          const htmlEl = el as HTMLElement;
          const rect = htmlEl.getBoundingClientRect();
          const localX = x - rect.left;
          const localY = y - rect.top;

          htmlEl.style.setProperty('--reveal-cx', `${localX}px`);
          htmlEl.style.setProperty('--reveal-cy', `${localY}px`);
          htmlEl.style.setProperty('--reveal-r', `${circleRadius}px`);
        });
      }
      // #endregion agent log
    };

    const handleMouseUp = () => {
      if (!isDraggingRef.current) return;

      // Set radius to 0 to trigger shrink animation
      // The animation loop will handle updating CSS variables on reveal targets
      setRadius(0);

      // Small delay to ensure animation starts before state change
      requestAnimationFrame(() => {
        setIsDragging(false);
      });
    };

    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousedown', handleMouseDown);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging]);

  return (
    <>
      <svg
        ref={svgRef}
        className="fixed inset-0 pointer-events-none"
        width={isMounted ? (dimensions.width || window.innerWidth) : 0}
        height={isMounted ? (dimensions.height || window.innerHeight) : 0}
        viewBox={isMounted ? `0 0 ${dimensions.width || window.innerWidth} ${dimensions.height || window.innerHeight}` : "0 0 0 0"}
        style={{ zIndex: -11 }}
      >
        <defs>
          <radialGradient id="radial-gradient" cx="0" cy="0" r="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="white" stopOpacity="1" />
            <stop offset="40%" stopColor="white" stopOpacity="0.95" />
            <stop offset="60%" stopColor="white" stopOpacity="0.7" />
            <stop offset="75%" stopColor="white" stopOpacity="0.4" />
            <stop offset="90%" stopColor="white" stopOpacity="0.15" />
            <stop offset="100%" stopColor="white" stopOpacity="0" />
          </radialGradient>
          <mask id="image-mask" maskUnits="userSpaceOnUse">
            <rect
              width={isMounted ? (dimensions.width || window.innerWidth) : 0}
              height={isMounted ? (dimensions.height || window.innerHeight) : 0}
              fill="black"
            />
            <circle
              id="mask-circle"
              cx="0"
              cy="0"
              r="0"
              fill="url(#radial-gradient)"
              style={{
                // Position only animates when not dragging (radius is manually animated)
                transition: isDragging ? 'cx 0s, cy 0s' : 'cx 0.3s ease-out, cy 0.3s ease-out',
              }}
            />
          </mask>
          {/* NEW: inverse mask for TEXT A */}
          <radialGradient id="radial-gradient-inverse" cx="0" cy="0" r="0" gradientUnits="userSpaceOnUse">
            {/* Center of circle = hidden (black), outside = visible (white) */}
            <stop offset="0%" stopColor="black" stopOpacity="1" />
            <stop offset="40%" stopColor="black" stopOpacity="0.9" />
            <stop offset="60%" stopColor="black" stopOpacity="0.6" />
            <stop offset="75%" stopColor="black" stopOpacity="0.3" />
            <stop offset="100%" stopColor="white" stopOpacity="1" />
          </radialGradient>

          <mask id="text-a-mask" maskUnits="userSpaceOnUse">
            {/* Default: everything visible */}
            <rect
              width={isMounted ? (dimensions.width || window.innerWidth) : 0}
              height={isMounted ? (dimensions.height || window.innerHeight) : 0}
              fill="white"
            />
            {/* Circle area: solid black = hidden under the reveal circle */}
            <circle
              id="text-a-cut-circle"
              cx="0"
              cy="0"
              r="0"
              fill="black"
            />
          </mask>
        </defs>
      </svg>
      {/* DEBUG: Visible red circle showing reveal circle position - separate SVG with high z-index */}
      <svg
        className="fixed inset-0 pointer-events-none"
        width={isMounted ? (dimensions.width || window.innerWidth) : 0}
        height={isMounted ? (dimensions.height || window.innerHeight) : 0}
        viewBox={isMounted ? `0 0 ${dimensions.width || window.innerWidth} ${dimensions.height || window.innerHeight}` : "0 0 0 0"}
        style={{ zIndex: 9999 }}
      >
        <circle
          id="debug-visible-circle"
          cx="0"
          cy="0"
          r="0"
          fill="none"
          stroke="red"
          strokeWidth="3"
          style={{
            transition: isDragging ? 'cx 0s, cy 0s' : 'cx 0.3s ease-out, cy 0.3s ease-out',
          }}
        />
      </svg>
      <div
        ref={containerRef}
        className="fixed inset-0 pointer-events-none"
        style={{
          mask: 'url(#image-mask)',
          WebkitMask: 'url(#image-mask)',
          zIndex: -10,
        }}
      >
        <Image
          src="/water-lily-pond-x.jpg"
          alt=""
          fill
          className="object-cover"
          priority
          unoptimized
        />
      </div>
      {/* SVG for text mask - must be rendered before the masked element */}
      {isMounted && (
        <svg
          ref={textClipSvgRef}
          className="fixed inset-0 pointer-events-none"
          width={dimensions.width || window.innerWidth}
          height={dimensions.height || window.innerHeight}
          style={{ zIndex: 9998, visibility: 'hidden' }}
        >
          <defs>
            <mask id="text-mask" maskUnits="userSpaceOnUse" maskContentUnits="userSpaceOnUse">
              <rect
                width={dimensions.width || window.innerWidth}
                height={dimensions.height || window.innerHeight}
                fill="black"
              />
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
      {/* Text copy with background image masked to text shape */}
      {isMounted && (
        <div
          ref={textClipContainerRef}
          className="fixed bunger inset-0 z-[1000] pointer-events-none"
          style={{
            backgroundImage: 'url(/water-lily-pond-x.jpg)',
            backgroundSize: `${dimensions.width || window.innerWidth}px ${dimensions.height || window.innerHeight}px`,
            backgroundRepeat: 'no-repeat',
            maskImage: 'url(#text-mask)',
            WebkitMaskImage: 'url(#text-mask)',
            maskSize: '100%',
            WebkitMaskSize: '100%',
            maskRepeat: 'no-repeat',
            WebkitMaskRepeat: 'no-repeat',
          }}
        />
      )}
    </>
  );
}
