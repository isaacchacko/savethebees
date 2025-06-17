'use client'; // Required for client-side interactivity

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import Link from 'next/link';
import ColorPaletteEditor from './ColorPaletteEditor';
import SpotifyStatus from '@/components/SpotifyStatus';
import DarkModeToggle from "./DarkModeToggle";

// to check if we're at home
import { useRouter } from 'next/router';

const HamburgerIcon = ({ onClick }: { onClick: () => void }) => (
  <button onClick={onClick} className="lg:hidden">
    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
    </svg>
  </button>
);

const BASE_CLASS_NAME = "hover:text-(--tertiary-color) font-bold text-4xl transition-colors duration-300";
const ICON_WIDTH_HEIGHT = "w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 ";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [height, setHeight] = useState(0);
  const navRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const isHome = mounted && window.location.pathname === "/";
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(
    () => {
      setMounted(true);
    }, []);

  useLayoutEffect(() => {
    if (!navRef.current) return;

    setHeight(navRef.current.getBoundingClientRect().height);

    const observer = new ResizeObserver(entries => {
      setHeight(entries[0].contentRect.height);
    });

    observer.observe(navRef.current);

    return () => observer.disconnect();

  }, [navRef.current]);

  return (
    <>
      <div style={{ height }}>
        <div className="fixed top-0 left-0 right-0 z-2" ref={navRef}>

          <nav
            className={`box-border cursor-pointer flex ${isHome ? "justify-end" : "justify-between"} lg:justify-start items-center p-4 px-8 gap-10 transition-colors duration-300 ${scrolled ? "bg-[rgba(20,20,20,0.7)] backdrop-blur-md shadow-lg" : "bg-transparent"}`} // bg-(--spotify-background)/80 backdrop-blur-sm border-b border-gray-500" 
            style={{ pointerEvents: 'auto' }}
          >

            <div className={` ${isHome ? "hidden" : ""} flex flex-row items-center gap-3`}>
              <Link href="/">
                <svg className={`scale-80 hover:scale-100 duration-300 ${ICON_WIDTH_HEIGHT}`} viewBox="0 0 24 24" fill="none">
                  <path fillRule="evenodd" clipRule="evenodd" d="M12 3.1875L21.4501 10.275L21.0001 11.625H20.25V20.25H3.75005V11.625H3.00005L2.55005 10.275L12 3.1875ZM5.25005 10.125V18.75H18.75V10.125L12 5.0625L5.25005 10.125Z" fill="#ffffff" />
                </svg>
              </Link>
              <DarkModeToggle ICON_WIDTH_HEIGHT={ICON_WIDTH_HEIGHT} />
              <ColorPaletteEditor widthHeight={ICON_WIDTH_HEIGHT} />
            </div>

            <SpotifyStatus />

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
      </div>
    </>
  );
}
