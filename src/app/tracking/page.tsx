'use client';

import CanvasBackground from '@/components/CanvasBackground';
import useResponsiveBees from '@/hooks/useResponsiveBees';
import Navbar from "@/components/Navbar";
import RunningStats from '@/components/RunningStats';
import AlbumCoverCarousel from "@/components/AlbumCoverCarousel";

export default function Home() {
  const numBees = useResponsiveBees();
  const spawnRadius = 100;

  return (
    <div className="relative font-sans">
      <CanvasBackground numBees={numBees} spawnRadius={spawnRadius} />

      <div className="pointer-events-none relative flex flex-col min-h-screen justify-start">
        <Navbar showColorPalette={false} learnMorePath="/arch" />
      
        <div className="slide-down-fade-in">
          <div className="pointer-events-auto flex flex-col w-full max-w-4xl mx-auto p-4 md:p-8 mt-8 backdrop-blur-sm relative bg-(--spotify-background) rounded-lg shadow">
            <div className="text-base leading-relaxed text-center md:text-left">
              <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-(--primary-color) font-black pb-1 md:pb-6">
                Tracking
              </h2>
              <p className="text-sm sm:text-base md:text-lg lg:text-xl">
                When life gets hectic, you write it down. Here is my digitial scrapbook of anything I care to track.
              </p>
            </div>
          </div>

          <div className="pointer-events-auto flex flex-col w-full max-w-4xl mx-auto py-4 md:py-8 mt-4 backdrop-blur-sm relative bg-(--spotify-background) rounded-lg shadow">
            <AlbumCoverCarousel />
          </div>

          <div className="pointer-events-auto flex flex-col w-full max-w-4xl mx-auto p-4 md:p-8 mt-4 backdrop-blur-sm relative bg-(--spotify-background) rounded-lg shadow">
            <RunningStats />
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
      </div>
        <footer className="absolute bottom-2 left-2 contactInfo">
          <p>Copyright &copy; 2025 Isaac Chacko</p>
        </footer>
    </div>
  );
}
