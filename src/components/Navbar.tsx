'use client'; // Required for client-side interactivity

import { ms } from "@public/fonts";
import { useState, useEffect, useRef } from "react";
import Link from 'next/link';
import ColorPaletteEditor from './ColorPaletteEditor';
import SpotifyStatus from '@/components/SpotifyStatus';

// to check if we're at home
import { useRouter } from 'next/router';

const HamburgerIcon = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="lg:hidden">
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
    </svg>
  </button>
);

const BASE_CLASS_NAME = "hover:text-(--tertiary-color) font-bold text-4xl transition-colors";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [navbarHeight, setNavbarHeight] = useState(0);
  const navRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const isHome = mounted && window.location.pathname === "/";

  useEffect(
    () => {
      setMounted(true);
    }, []);
  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-50">

        <nav
          ref={navRef}
          className="cursor-pointer flex items-center p-4 px-8 gap-10" // bg-(--spotify-background)/80 backdrop-blur-sm border-b border-gray-500" 
          style={{ pointerEvents: 'auto' }}
        >

          <div className="flex flex-row items-center gap-3">
            <Link href="/">
              <svg className="scale-80 hover:scale-100 duration-300 w-15 h-15" viewBox="0 0 24 24" fill="none">
                <path fillRule="evenodd" clipRule="evenodd" d="M12 3.1875L21.4501 10.275L21.0001 11.625H20.25V20.25H3.75005V11.625H3.00005L2.55005 10.275L12 3.1875ZM5.25005 10.125V18.75H18.75V10.125L12 5.0625L5.25005 10.125Z" fill="#ffffff" />
              </svg>
            </Link>
          </div>

          <SpotifyStatus condensed={true} className="" />

          <div className="flex justify-between items-center gap-10">
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
    </>
  );
}
