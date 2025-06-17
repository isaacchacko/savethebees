'use client';

import { useState } from 'react';
import Image from 'next/image';
import CanvasBackground from '@/components/CanvasBackground';
import useResponsiveBees from '@/hooks/useResponsiveBees';
import Navbar from "@/components/Navbar";

import Footer from "@/components/Footer"
const ICON_WIDTH_HEIGHT = "w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 ";

import HeroAtLink from "@/components/HeroAtLink"

export default function Home() {
  const numBees = useResponsiveBees();
  const spawnRadius = 100;

  // State to track whether the card is flipped
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="relative font-sans">
      <CanvasBackground numBees={numBees} spawnRadius={spawnRadius} />
      <Navbar />

      <div className="slide-down-fade-in relative flex flex-col min-h-screen justify-start pointer-events-none">

        <div className="flex flex-col w-full max-w-4xl mx-auto p-4 md:p-8 my-8 backdrop-blur-sm relative bg-(--spotify-background) rounded-lg shadow">
          <div className="flex flex-col-reverse md:flex-row items-center justify-between gap-8">
            {/* About Me Text */}
            <div className="pointer-events-auto text-base leading-relaxed text-center md:text-left">
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-(--primary-color) font-black pb-1 md:pb-6">
                About Me
              </h2>
              <span className="text-sm sm:text-base md:text-lg lg:text-xl">
                I&apos;m Isaac. I&apos;m CS/Applied Math Engineering Honors{' '}
                <HeroAtLink text="TAMU" href="https://www.tamu.edu" hasPeriod={false} />{' '}
                and currently intern{' '}
                <HeroAtLink text="SISO" href="https://www.siso-eng.com" hasPeriod={true} />{' '}
                On the side, I&apos;m developing for <a target="_blank" href='https://www.eulerelo.vercel.app' rel="noopener noreferrer" className="font-bold text-(--primary-color) underline underline-offset-2 hover:text-white transition-color duration-300">Eulerelo</a>, a competitive math platform. For fun, I play board games, train for the Cheveron marathon, and eat lots of Blue Bell.</span>
            </div>

            {/* Flip Card Container */}
            <div
              className="pointer-events-none relative perspective w-[250px] sm:w-[400px] md:w-[600px] lg:w-[800px]"
              onClick={() => setIsFlipped(!isFlipped)}
            >
              {/* Inner Card */}
              <div
                className={`pointer-events-auto transition-transform duration-500 transform-style-preserve-3d ${isFlipped ? 'rotate-y-180' : ''
                  }`}
              >
                {/* Front Side (Image) */}
                <div className="backface-hidden">
                  <Image
                    src="/profile-picture.jpg"
                    alt="Your Name"
                    width={1500}
                    height={1500}
                    className="rounded-lg object-cover scale-90 hover:scale-100 transition-transform duration-300 ring-3 ring-(--tertiary-color)"
                  />
                </div>

                {/* Back Side (Blurb Text) */}
                <div className="absolute inset-0 bg-(--tertiary-color) rounded-lg flex items-center justify-center backface-hidden rotate-y-180">
                  <p className="text-center px-4 text-sm sm:text-base md:text-lg lg:text-xl">
                    ICDC @ Disney Land, April 2024.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <Footer ICON_WIDTH_HEIGHT={ICON_WIDTH_HEIGHT} />
      </div>
    </div>
  );
}
