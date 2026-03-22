'use client';

import Navbar from "@/components/Navbar";
import RunningStats from '@/components/RunningStats';
import AlbumCoverCarousel from "@/components/AlbumCoverCarousel";
import Footer from "@/components/Footer";

const ICON_WIDTH_HEIGHT = "w-6 h-6 sm:w-8 sm:h-8 md:w-9 md:h-9 lg:w-10 lg:h-10 ";

export default function Tracking() {
  return (
    <div className="bg-(--background)">
      <Navbar />

      <div className="relative flex flex-col min-h-screen justify-start">
        <div className="flex flex-col w-full max-w-4xl mx-auto p-4 md:p-8 mt-8 relative bg-(--surface) rounded-lg shadow">
          <div className="text-base leading-relaxed text-center md:text-left">
            <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl text-(--primary-color) font-black pb-1 md:pb-6">
              Tracking
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl">
              When life gets hectic, you write it down. Here is my digitial scrapbook of anything I care to track.
            </p>
          </div>
        </div>

        <div className="flex flex-col w-full max-w-4xl mx-auto py-4 md:py-8 mt-4 relative bg-(--spotify-background) rounded-lg shadow">
          <AlbumCoverCarousel />
        </div>

        <div className="flex flex-col w-full max-w-4xl mx-auto p-4 md:p-8 mt-4 relative bg-(--spotify-background) rounded-lg shadow">
          <RunningStats />
        </div>

        <div className="flex flex-col w-full max-w-4xl mx-auto p-4 md:p-8 mt-8 relative bg-(--surface) rounded-lg shadow">
          <div className="text-base leading-relaxed">
            <h2 className="font-black text-2xl 2xl:text-4xl cursor-pointer pb-2">
              Under construction...
            </h2>
            <p className="text-sm sm:text-base md:text-lg lg:text-xl">
              I'll eventually cover this page with any metric you can think of. Red Bulls downed, late night hours grinded, my CS in League-- you name it.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}
