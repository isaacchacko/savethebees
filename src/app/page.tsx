'use client';

import ColorPaletteEditor from '@/components/ColorPaletteEditor';
import CanvasBackground from '@/components/CanvasBackground';
import TextCycler from '@/components/TextCycler';
import useResponsiveBees from '@/hooks/useResponsiveBees';
import Hero from '@/components/Hero';
import Navbar from "@/components/Navbar";

export default function Home() {
  const numBees = useResponsiveBees();
  const spawnRadius = 100;

  return (
    <div className="relative font-sans">
      <CanvasBackground numBees={numBees} spawnRadius={spawnRadius} />

      <div className="relative flex flex-col z-20 min-h-screen" style={{ pointerEvents: 'none' }}>
        {/* Navigation Bar */}
        <Navbar spotifyStatus={false} learnMorePath="/about" />

        {/* Main Content Area */}
        <Hero />
      </div>
    </div>
  );
}
