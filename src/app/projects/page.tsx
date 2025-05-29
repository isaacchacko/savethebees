'use client';

import { useState } from 'react';
import Image from 'next/image';
import CanvasBackground from '@/components/CanvasBackground';
import useResponsiveBees from '@/hooks/useResponsiveBees';
import Navbar from "@/components/Navbar";

// for the external links
import { ArrowTopRightOnSquareIcon } from '@heroicons/react/24/outline';

export default function Home() {
  const numBees = useResponsiveBees();
  const spawnRadius = 100;

  // State to track whether the card is flipped
  const [isFlipped, setIsFlipped] = useState(false);

  return (
    <div className="relative font-sans">
      <CanvasBackground numBees={numBees} spawnRadius={spawnRadius} />

      <div className="pointer-events-none relative flex flex-col min-h-screen justify-start">
        <Navbar />

        <div className="slide-down-fade-in">
          <div className="pointer-events-auto flex flex-col w-full max-w-4xl mx-auto p-4 md:p-8 mt-8 backdrop-blur-sm relative bg-(--spotify-background) rounded-lg shadow">
            <div className="text-base leading-relaxed text-center md:text-left">
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-(--primary-color) font-black pb-1 md:pb-6"> Projects
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl">
                Although a complete list can be found on my <a target="_blank" href='https://github.com/isaacchacko' rel="noopener noreferrer" className="text-(--primary-color) underline underline-offset-2 hover:text-(--tertiary-color)">GitHub</a>, here&apos;s a brief list of my more notable projects.
              </p>
            </div>
          </div>

          <div className="pointer-events-auto flex flex:w-col w-full max-w-4xl mx-auto p-4 md:p-8 mt-8 backdrop-blur-sm relative bg-(--spotify-background) rounded-lg shadow">
            <div className="text-base leading-relaxed">
              <div className="flex flex-row jusitfy-center items">

                <h2   className="font-black text-white text-2xl 2xl:text-4xl text-white text-bold cursor-pointer pb-2">
                  <a href="http://eulerelo.vercel.app" target="_blank" rel="noopener noreferrer" className="underline underline-offset-5 hover:text-(--primary-color)">

                    Eulerelo
                  </a>

                </h2>
                <ArrowTopRightOnSquareIcon className="ml-1 h-4 w-4" aria-label="Opens in new tab" />
              </div>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl">
                Challenge your math skills in real-time duels, climb the leaderboard, and master topics from arithmetic to calculus. Compete with others, solve problems faster, and see how you rank among math enthusiasts worldwide!
              </p>
            </div>
          </div>


          <div className="pointer-events-auto flex flex-col w-full max-w-4xl mx-auto p-4 md:p-8 mt-8 backdrop-blur-sm relative bg-(--spotify-background) rounded-lg shadow">
            <div className="text-base leading-relaxed">
              <h2   className="font-black text-white text-2xl 2xl:text-4xl text-white cursor-pointer pb-2">
                Under construction...
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl">
                I'll eventually cover this page with any metric you can think of. Red Bulls downed, late night hours grinded, my CS in League-- you name it.
              </p>
            </div>
          </div>

        </div>

        <footer className="absolute bottom-2 left-2 contactInfo">
          <p>Copyright &copy; 2025 Isaac Chacko</p>
        </footer>
      </div>
    </div>
  );
}
