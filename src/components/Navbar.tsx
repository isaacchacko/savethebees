'use client'; // Required for client-side interactivity

import { useState, useEffect, useRef, useLayoutEffect } from "react";
import Link from 'next/link';

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
      <div style={{}}>
        <div className="fixed top-0 left-0 right-0 z-[100]" ref={navRef}>

          <nav
            className="flex justify-left mt-5 ml-5"
          >
          </nav>
        </div>
      </div>
    </>
  );
}
