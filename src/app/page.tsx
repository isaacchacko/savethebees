'use client';

import ColorPaletteEditor from '../components/ColorPaletteEditor';
import CanvasBackground from '../components/CanvasBackground';
import TextCycler from '../components/TextCycler';
import useResponsiveBees from '../hooks/useResponsiveBees';
import Hero from '../components/Hero';
import SpotifyPlayer from '../components/SpotifyPlayer';

export default function Home() {
  const numBees = useResponsiveBees();
  const spawnRadius = 100;

  return (
    <div className="relative font-sans">
      <CanvasBackground numBees={numBees} spawnRadius={spawnRadius} />

      <div className="relative flex flex-col z-20 min-h-screen" style={{ pointerEvents: 'none' }}>
        {/* Navigation Bar */}
        <nav className="cursor-pointer flex justify-between items-center p-4 bg-gray/80 backdrop-blur-sm border-b border-gray-500" style={{ pointerEvents: 'auto' }}>
          <div className="flex flex-row items-center relative">
            <h1 className="text-4xl font-bold pr-3">Isaac Chacko</h1>
            <ColorPaletteEditor />
          </div>
          <div className="flex justify-end gap-10">

          <SpotifyPlayer />
            <a href="#about" className="hover:text-gray-900 font-bold text-xl transition-colors">About</a>
            <a href="#projects" className="hover:text-gray-900 font-bold text-xl transition-colors">Projects</a>
            <a href="#tracking" className="hover:text-gray-900 font-bold text-xl transition-colors">Tracking</a>
            <a href="#arch" className="hover:text-gray-900 font-bold text-xl transition-colors">Arch</a>
          </div>
        </nav>

        {/* Main Content Area */}
        <Hero
          introText="Howdy! I'm a"
          cycleTexts={[
            "Software Developer",
            "Redbull Zealot",
            "Half-Marathon Runner",
            "Godot Developer",
            "Hackathon Addict",
            "CS Student",
            "Arch User",
            "Poker Junkie",
          ]}
          endingText="from Texas A&M University."
        />
      </div>
    </div>
  );
}
