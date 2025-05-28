'use client';

import CanvasBackground from '@/components/CanvasBackground';
import useResponsiveBees from '@/hooks/useResponsiveBees';
import Hero from '@/components/Hero';
import Navbar from "@/components/Navbar";

export default function Home() {
  const numBees = useResponsiveBees();
  const spawnRadius = 100;

  return (
    <div className="absolute top-0 left-0 font-sans w-screen h-screen">
      <Navbar spotifyStatus={false} learnMorePath="/about" />
      <CanvasBackground numBees={numBees} spawnRadius={spawnRadius} />
      <Hero />
    </div>

  );
}
