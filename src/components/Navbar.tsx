
'use client'; // Required for client-side interactivity

import Link from 'next/link';
import ColorPaletteEditor from './ColorPaletteEditor';
import SpotifyStatus from '@/components/SpotifyStatus';

interface NavbarProps {
  showColorPalette?: boolean;
  spotifyStatus?: boolean;
  learnMorePath?: string;
}

export default function Navbar({
  showColorPalette = true,
  spotifyStatus = true,
  learnMorePath
  
}: NavbarProps) {
  return (
    <nav 
      className="cursor-pointer flex justify-between items-center p-4 bg-gray/80 backdrop-blur-sm border-b border-gray-500" 
      style={{ pointerEvents: 'auto' }}
    >
      <div className="flex flex-row items-center relative">
        <h1 className="hidden xl:block text-4xl font-bold pr-3">Isaac Chacko</h1>
        <h1 className="block xl:hidden text-4xl font-bold pr-3">IC</h1>
        {showColorPalette && <ColorPaletteEditor />}
      </div>
      
      {spotifyStatus && <SpotifyStatus condensed={true} className=""/>}

      <div className="flex justify-between gap-10">
        <Link 
          href={learnMorePath}
          className="block sm:hidden hover:text-gray-900 font-bold text-xl transition-colors"
        >
          Learn More &gt;
        </Link>
        
        <div className="hidden sm:flex gap-10">
          <Link href="#projects" className="hover:text-gray-900 font-bold text-xl transition-colors">
            Projects
          </Link>
          <Link href="#tracking" className="hover:text-gray-900 font-bold text-xl transition-colors">
            Tracking
          </Link>
          <Link href="#arch" className="hover:text-gray-900 font-bold text-xl transition-colors">
            Arch
          </Link>
          <Link 
            href={learnMorePath}
            className="hover:text-gray-900 font-bold text-xl transition-colors"
          >
            About
          </Link>
        </div>
      </div>
    </nav>
  );
}
