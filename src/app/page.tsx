'use client';
import { useLayoutEffect, useRef, useState } from 'react';
import useResponsiveBees from '@/hooks/useResponsiveBees';
import Hero from '@/components/Hero';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function Home() {
  const numBees = useResponsiveBees();
  const spawnRadius = 100;
  const containerRef = useRef<HTMLDivElement | null>(null);
  const disabled = true;
  const [clipPath, setClipPath] = useState(
    disabled ? 'none' : 'circle(0px at 0px 0px)'
  );
  const [transitionEnabled, setTransitionEnabled] = useState(false);
  const [isHoveringMusic, setIsHoveringMusic] = useState(false);
  const [linktreePathSegment, setLinktreePathSegment] = useState<string | null>(null);

  useLayoutEffect(() => {
    const updateClip = () => {
      if (!containerRef.current || disabled) {
        return;
      }
      const containerRect = containerRef.current.getBoundingClientRect();
      const initialRadius = 0;
      setTransitionEnabled(false);
      setClipPath(`circle(${Math.ceil(initialRadius)}px at 0px 0px)`);
      const corners: Array<[number, number]> = [
        [0, 0],
        [containerRect.width, 0],
        [0, containerRect.height],
        [containerRect.width, containerRect.height],
      ];
      const maxRadius = Math.max(
        ...corners.map(([x, y]) => Math.hypot(x, y)),
      );
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setTransitionEnabled(true);
          setClipPath(`circle(${Math.ceil(maxRadius)}px at 0px 0px)`);
        });
      });
    };
    updateClip();
    window.addEventListener('resize', updateClip);
    if (document.fonts?.ready) {
      document.fonts.ready.then(updateClip);
    }
    return () => {
      window.removeEventListener('resize', updateClip);
    };
  }, []);
  return (
    <div className={disabled ? "bg-(--background)" : "bg-(--background) relative"}>
      <div
        className=" bg-(--background) flex h-screen min-h-0 flex-col overflow-hidden"
        ref={containerRef}
        style={{
          clipPath,
          transition: transitionEnabled
            ? 'clip-path 1.2s cubic-bezier(0, 0, 0.58, 1), background-color 0.4s ease'
            : 'background-color 0.4s ease',
          willChange: 'clip-path',
        }}
      >
        <Navbar
          isHoveringMusic={isHoveringMusic}
          linktreePathSegment={linktreePathSegment}
        />
        <Hero
          onMusicHoverChange={setIsHoveringMusic}
          onLinktreePathHover={setLinktreePathSegment}
        />
        <Footer />
      </div>
    </div>
  );
}
