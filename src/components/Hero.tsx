'use client';

import { useLayoutEffect, useRef, useState } from 'react';
import TextCycler from './TextCycler'

// hero text
import HeroAtLink from '@/components/HeroAtLink';

// glyphs
import IconLink from '@/components/IconLink';
import ColorPaletteEditor from "@/components/ColorPaletteEditor"
import {
  BiFile,          // Resume/file text
  BiMailSend,      // Mail/envelope
  BiRun,           // Running man
  BiDisc,          // CD/disc
} from 'react-icons/bi';
import { FiGithub } from "react-icons/fi";
import { AiOutlineLinkedin } from "react-icons/ai";
import { it } from "@public/fonts"
import DarkModeToggle from './DarkModeToggle';

const ICON_WIDTH_HEIGHT = "w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 ";
const HOWDY_TEXT_HEIGHT = "text-4xl md:text-4xl lg:text-6xl"
export default function Home() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const hiRef = useRef<HTMLSpanElement | null>(null);
  const isaacRef = useRef<HTMLSpanElement | null>(null);
  const [clipPath, setClipPath] = useState('circle(0px at 0px 0px)');
  const [transitionEnabled, setTransitionEnabled] = useState(false);
  const [showEllipsis, setShowEllipsis] = useState(true);

  useLayoutEffect(() => {
    const updateClip = () => {
      if (!containerRef.current || !hiRef.current || !isaacRef.current) {
        return;
      }

      const containerRect = containerRef.current.getBoundingClientRect();
      const hiRect = hiRef.current.getBoundingClientRect();
      const isaacRect = isaacRef.current.getBoundingClientRect();
      const centerX = isaacRect.left - containerRect.left;
      const centerY = isaacRect.bottom - containerRect.top;
      const initialRadius = 8;

      setTransitionEnabled(false);
      setClipPath(`circle(${Math.ceil(initialRadius)}px at ${centerX}px ${centerY}px)`);
      setShowEllipsis(true);

      const corners: Array<[number, number]> = [
        [0, 0],
        [containerRect.width, 0],
        [0, containerRect.height],
        [containerRect.width, containerRect.height],
      ];
      const maxRadius = Math.max(
        ...corners.map(([x, y]) => Math.hypot(x - centerX, y - centerY)),
      );

      window.requestAnimationFrame(() => {
        setTransitionEnabled(true);
        setClipPath(`circle(${Math.ceil(maxRadius)}px at ${centerX}px ${centerY}px)`);
        setShowEllipsis(false);
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
    <>
      <div
        ref={containerRef}
        className='w-screen h-screen overflow-hidden'
        style={{
          clipPath,
          transition: transitionEnabled ? 'clip-path 1.2s cubic-bezier(0, 0, 0.58, 1)' : 'none',
          willChange: 'clip-path',
        }}
      >
        <div className='w-screen h-[66vh] flex flex-col justify-end relative'>
          <div className='flex justify-start ml-3 mb-3 sm:ml-3 mb-3 lg:ml-5 lg:mb-5 inline relative z-10'>
            <div className='flex flex-col items-start'>
              <span
                ref={hiRef}
                className='inline-block font-semibold text-xl md:text-2xl lg:text-3xl xl:text-4xl select-none'
              >
                Howdy, I&apos;m{showEllipsis ? '...' : ''}
              </span>
              <span
                ref={isaacRef}
                className='font-black italic text-4xl md:text-6xl lg:text-8xl xl:text-9xl select-none'
              >
                Isaac Chacko
              </span>
            </div>
          </div>
        </div>
        <div className='w-screen h-[34vh] bg-[#181614] text-[#fdfbf9]'>
          <div className='flex justify-center'>
            <div className='w-[50vw] m-15 relative'>
              <div className="relative inline-block">
                {/* Text A (white or normal text) - hidden under reveal circle */}
                <p
                  id="hero-text-a"
                  className={`${it.className} text-md md:text-xl lg:text-3xl xl:text-4xl relative z-10 reveal-mask-target select-none`}
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
                  <span className="hover:scale-90 inline font-black transition-all duration-300">SISO</span>{' '}
                  and <span className="inline font-black transition-all duration-300">LUMINARE</span>.
                </p>

                {/* Text B (clipped background text, revealed inside circle) */}
                <p
                  id="junior-text"
                  className={`${it.className} absolute inset-0 text-md md:text-xl lg:text-3xl xl:text-4xl text-transparent bg-clip-text select-none`}
                  style={{
                    backgroundImage: "url('/water-lily-pond-x.jpg')",
                    backgroundSize: '100vw 100vh',
                    backgroundPosition: '0 0',
                    backgroundAttachment: 'fixed',
                  }}
                >
                  I&apos;m a junior studying CS at Texas A&amp;M! I previously interned at{' '}
                  <span className="hover:scale-90 inline font-black transition-all duration-300">SISO</span>{' '}
                  and <span className="inline font-black transition-all duration-300">LUMINARE</span>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
