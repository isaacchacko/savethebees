'use client';

import CanvasBackground from '@/components/CanvasBackground';
import useResponsiveBees from '@/hooks/useResponsiveBees';
import Hero from '@/components/Hero';
import Navbar from "@/components/Navbar";

export default function Home() {
  const numBees = useResponsiveBees();
  const spawnRadius = 100;

  return (
    <div className="font-sans w-screen h-screen overflow-hidden flex justify-center items-center">
      <Navbar />
      <CanvasBackground numBees={numBees} spawnRadius={spawnRadius} />
      <Hero />
    </div>

  );
}
