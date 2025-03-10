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
            <h1 className="hidden xl:block text-4xl font-bold pr-3">Isaac Chacko</h1>
            <h1 className="block xl:hidden text-4xl font-bold pr-3">IC</h1>
            <ColorPaletteEditor />
          </div>
          <div className="flex justify-end gap-10">
            <a href="#about" className="block sm:hidden hover:text-gray-900 font-bold text-xl transition-colors">Learn More ></a>
            <a href="#about" className="hidden sm:block hover:text-gray-900 font-bold text-xl transition-colors">About</a>
            <a href="#projects" className="hidden sm:block hover:text-gray-900 font-bold text-xl transition-colors">Projects</a>
            <a href="#tracking" className="hidden sm:block hover:text-gray-900 font-bold text-xl transition-colors">Tracking</a>
            <a href="#arch" className="hidden sm:block hover:text-gray-900 font-bold text-xl transition-colors">Arch</a>
          </div>
        </nav>

        {/* Main Content Area */}
        <Hero />
      </div>
    </div>
  );
}
