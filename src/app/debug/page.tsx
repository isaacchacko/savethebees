'use client';
import Hero from '@/components/Hero';
import Navbar from "@/components/Navbar";
import SplineCreator from "@/components/SplineCreator";

export default function Home() {
  return (
    <div className="bg-(--background)">
      <Hero />
      <Navbar />
      <SplineCreator />
    </div>
  );
}
