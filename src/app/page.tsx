'use client';

import ColorPaletteEditor from '../components/ColorPaletteEditor';
import CanvasBackground from '../components/CanvasBackground';
import TextCycler from '../components/TextCycler';

export default function Home() {
  const numBees = 400;
  const spawnRadius = 50;

  return (
    <div className="relative font-sans">
      <CanvasBackground numBees={numBees} spawnRadius={spawnRadius} />

      <div className="relative flex flex-col z-20 min-h-screen" style={{ pointerEvents: 'none' }}>
        {/* Navigation Bar */}
        <nav className="cursor-pointer flex justify-between items-center p-4 bg-gray/80 backdrop-blur-sm border-b border-gray-500" style={{ pointerEvents: 'auto' }}>
          <div className="flex flex-row items-center space-x-4 relative">
            <h1 className="text-4xl font-bold">Isaac Chacko</h1>
            <ColorPaletteEditor />
          </div>
          <div className="flex justify-end gap-10">
            <a href="#about" className="hover:text-gray-900 transition-colors">About</a>
            <a href="#projects" className="hover:text-gray-900 transition-colors">Projects</a>
            <a href="#contact" className="hover:text-gray-900 transition-colors">Contact</a>
          </div>
        </nav>

        {/* Main Content Area */}
        <div className="flex-1 flex items-center justify-center">
          <div className="flex content-center items-center gap-4"> {/* Changed to baseline alignment */}
            {/* Left static text */}
            <span className="text-4xl font-light text-gray-500 whitespace-nowrap">
              Howdy! I'm a 
            </span>

            {/* TextCycler with fixed width */}
            <TextCycler 
              texts={[
                "Fightin' Texas Aggie.",
                "Full Stack Developer.",
                "Redbull Zealot.", 
                "Half-Marathon Runner.",
                "Godot Developer.",
              ]}
              interval={5000}
              className="text-6xl font-bold mx-auto"
            />

          </div>
          <div>
          </div>
        </div>
      </div>
    </div>
  );
}
