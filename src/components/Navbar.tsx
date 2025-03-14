'use client'; // Required for client-side interactivity

import { useState, useEffect, useRef } from "react";
import Link from 'next/link';
import ColorPaletteEditor from './ColorPaletteEditor';
import SpotifyStatus from '@/components/SpotifyStatus';


const HamburgerIcon = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="lg:hidden">
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
    </svg>
  </button>
);

const BASE_CLASS_NAME = "hover:text-(--tertiary-color) font-bold text-xl transition-colors";

interface NavbarProps {
  showColorPalette?: boolean;
  spotifyStatus?: boolean;
  learnMorePath?: string;
}

export default function Navbar({
  showColorPalette = true,
  spotifyStatus = true,
}: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navbarHeight, setNavbarHeight] = useState(0);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateNavbarHeight = () => {
      if (navRef.current) {
        setNavbarHeight(navRef.current.offsetHeight);
      }
    };

    updateNavbarHeight();
    window.addEventListener('resize', updateNavbarHeight);

    return () => window.removeEventListener('resize', updateNavbarHeight);
  }, []);

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">
        <nav 
          ref={navRef}
          className="cursor-pointer flex justify-between items-center p-4 bg-(--spotify-background)/80 backdrop-blur-sm border-b border-gray-500" 
          style={{ pointerEvents: 'auto' }}
        >
          <div className="flex flex-row items-center relative mr-10">
            <div className="hover:text-(--tertiary-color) transition-colors">
              <Link href="/" className="hidden xl:block text-4xl font-bold">
                <h1>Isaac Chacko</h1>
              </Link>
              <Link href="/" className="block xl:hidden text-4xl font-bold">
                <h1>IC</h1>
              </Link>
            </div>
            {showColorPalette && <ColorPaletteEditor />}
          </div>

          {/* this doesn't take up space */}
          <div className="absolute invisible w-0 h-0 pointer-events-none">
            <ColorPaletteEditor />
          </div>

          {spotifyStatus && (
            <SpotifyStatus condensed={true} className="" />
          )}

          <div className="flex justify-between items-center gap-10 ml-10">
            <HamburgerIcon onClick={() => setIsMenuOpen(!isMenuOpen)} />

            <div className={`${isMenuOpen ? 'flex' : 'hidden'} lg:flex flex-col lg:flex-row absolute lg:relative top-full right-0 lg:top-auto lg:right-auto bg-(--spotify-background)/80 lg:bg-transparent p-4 lg:p-0 gap-4 lg:gap-10`}>
              <Link href="/projects" className={BASE_CLASS_NAME}>
                Projects
              </Link>
              <Link href="/tracking" className={BASE_CLASS_NAME}>
                Tracking
              </Link>
              <Link href="/arch" className={BASE_CLASS_NAME}>
                Arch
              </Link>
              <Link href="/about" className={BASE_CLASS_NAME}>
                About
              </Link>
            </div>
          </div>
        </nav>
      </div>
      <div style={{ marginTop: `${navbarHeight+50}px` }}></div>
    </>
  );
}
