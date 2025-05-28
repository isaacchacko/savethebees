'use client';

import CanvasBackground from '@/components/CanvasBackground';
import useResponsiveBees from '@/hooks/useResponsiveBees';
import Hero from '@/components/Hero';
import Navbar from "@/components/Navbar";

export default function Home() {
  const numBees = useResponsiveBees();
  const spawnRadius = 100;

  return (
    <div className="relative font-sans w-screen h-screen flex justify-center items-center">
      <Navbar spotifyStatus={false} learnMorePath="/about" />
      <CanvasBackground numBees={numBees} spawnRadius={spawnRadius} />
      <Hero />
    </div>

  );
}
