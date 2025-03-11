'use client';

import CanvasBackground from '@/components/CanvasBackground';
import useResponsiveBees from '@/hooks/useResponsiveBees';
import Navbar from "@/components/Navbar";
import Card from "@/components/Card";

export default function Home() {
  const numBees = useResponsiveBees();
  const spawnRadius = 100;

  return (
    <div className="relative font-sans">
      <CanvasBackground numBees={numBees} spawnRadius={spawnRadius} />

      <div className="relative flex flex-col min-h-screen justify-start">
        <Navbar showColorPalette={false} learnMorePath="/arch" />
        <Card />
      </div>
    </div>
  );
}
