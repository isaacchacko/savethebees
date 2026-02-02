'use client';

import CanvasBackground from '@/components/CanvasBackground';
import useResponsiveBees from '@/hooks/useResponsiveBees';
import Hero from '@/components/Hero';
import Navbar from "@/components/Navbar";
import ClickRevealImage from '@/components/ClickRevealImage';

export default function Home() {
  const numBees = useResponsiveBees();
  const spawnRadius = 100;

  return (
    <div className="">
      <ClickRevealImage />
      <Navbar />
      <Hero />
    </div>

  );
}
