'use client'; // Required for client-side interactivity

import Link from 'next/link';
import ColorPaletteEditor from './ColorPaletteEditor';
import SpotifyStatus from '@/components/SpotifyStatus';

const BASE_CLASS_NAME = "hover:text-(--tertiary-color) font-bold text-xl transition-colors";

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
      className="cursor-pointer flex justify-between items-center p-4 bg-(--spotify-background)/80 backdrop-blur-sm border-b border-gray-500" 
      style={{ pointerEvents: 'auto' }}
    >
      <div className="flex flex-row items-center relative">
        <div className="hover:text-(--tertiary-color) transition-colors">
          <Link href="/" className="hidden xl:block text-4xl font-bold">
            <h1>Isaac Chacko</h1>
          </Link>
          <Link href="/" className="block xl:hidden text-4xl font-bold">
            <h1>IC</h1>
          </Link>
        </div>
        {showColorPalette && <ColorPaletteEditor />}
      </div>
      
      {spotifyStatus && <SpotifyStatus condensed={true} className=""/>}

      <div className="flex justify-between gap-10 ml-10">
        {learnMorePath && (
          <Link 
            href={learnMorePath}
            className={BASE_CLASS_NAME + " block sm:hidden"}
          >
            Learn More &gt;
          </Link>
        )}
        
        <div className="hidden sm:flex gap-10">
          <Link href="/projects" className={BASE_CLASS_NAME}>
            Projects
          </Link>
          <Link href="/tracking" className={BASE_CLASS_NAME}>
            Tracking
          </Link>
          <Link href="/arch" className={BASE_CLASS_NAME}>
            Arch
          </Link>
          <Link href="/about" className={BASE_CLASS_NAME}>
            About
          </Link>
        </div>
      </div>
    </nav>
  );
}
