'use client';
import CanvasBackground from '../components/CanvasBackground';

export default function Home() {
  const spawnPosition = { x: 100, y: 100 };
  const numBees = 500;
  const spawnRadius = 50;

  return (
    <div className="relative min-h-screen">
      <CanvasBackground
        spawnPosition={spawnPosition}
        numBees={numBees}
        spawnRadius={spawnRadius}
        
      />

      {/* Navigation Bar */}
      <nav className="fixed w-full top-0 z-50 bg-white/80 backdrop-blur-sm border-b border-gray-200" style={{ pointerEvents: 'none' }}>
        <div className="container mx-auto px-6 py-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-gray-800">John Doe</h1>
          <div className="flex space-x-6">
            <a href="#about" className="text-gray-600 hover:text-gray-900 transition-colors">About</a>
            <a href="#projects" className="text-gray-600 hover:text-gray-900 transition-colors">Projects</a>
            <a href="#contact" className="text-gray-600 hover:text-gray-900 transition-colors">Contact</a>
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 pt-32 px-6" style={{ pointerEvents: 'none' }}>
        <div className="container mx-auto max-w-4xl text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-6">
            Full Stack Developer &<br />AI Enthusiast
          </h1>

          <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
            Building digital solutions that bridge creativity and technology.
            Passionate about open-source development and machine learning.
          </p>
        </div>
      </main>
    </div>
  );
}
