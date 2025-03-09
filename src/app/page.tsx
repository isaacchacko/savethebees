'use client';
import ColorPaletteEditor from '../components/ColorPaletteEditor';
import CanvasBackground from '../components/CanvasBackground';

export default function Home() {
  const numBees = 400;
  const spawnRadius = 50;

  return (
    <div className="relative font-sans">
      <CanvasBackground
        numBees={numBees}
        spawnRadius={spawnRadius}
      />

      <div className="relative flex flex-col z-20 cursor-none min-h-screen" style={{ pointerEvents: 'none' }}>
        {/* Navigation Bar */}
        {/*
        items-center : center vertically

        */}
        <nav className="cursor-pointer flex justify-between items-center p-4 bg-gray/80 backdrop-blur-sm border-b border-gray-200" style={{ pointerEvents: 'auto' }}>
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

        {/* Main Content Area - Centered using flexbox */}
        <main className="flex-1 flex items-center justify-center p-6">
          <div className="text-center flex flex-col gap-6">
            <h1 className="text-9xl font-bold">
              Full Stack Developer
            </h1>
            <p className="text-lg max-w-2xl mx-auto">
              Building digital solutions that bridge creativity and technology.
              Passionate about open-source development and machine learning.
            </p>
          </div>
        </main>

      </div>
    </div>
  );
}
