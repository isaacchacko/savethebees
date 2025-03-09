
// components/TextCycler.tsx
"use client";

import { useState, useEffect } from 'react';

export default function TextCycler({ 
  texts, 
  interval = 3000, 
  className = "" 
}: {
  texts: string[];
  interval?: number;
  className?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    const cycle = setInterval(() => {
      setIsExiting(true);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % texts.length);
        setIsExiting(false);
      }, 500); // Match animation duration
    }, interval);

    return () => clearInterval(cycle);
  }, [texts.length, interval]);

  return (
    <div className={`relative h-16 overflow-hidden ${className}`}>
      {/* Exiting text */}
      <div className={`absolute ${isExiting ? 'animate-drop-out' : ''}`}>
        <h1 className="font-sans text-4xl">
          {texts[activeIndex]}
        </h1>
      </div>
      
      {/* Entering text */}
      <div className={`absolute ${isExiting ? 'animate-drop-in' : ''}`}>
        <h1 className="font-sans text-4xl">
          {texts[(activeIndex + 1) % texts.length]}
        </h1>
      </div>
    </div>
  );
}
