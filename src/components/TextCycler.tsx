"use client";
import { useState, useEffect, useRef } from 'react';

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
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const initialCycles = useRef(0);
  const resizeObserverRef = useRef<ResizeObserver>();

  const updateWidth = () => {
    if (textRef.current) {
      setContainerWidth(textRef.current.scrollWidth);
    }
  };

  useEffect(() => {
    let timeout2: NodeJS.Timeout, intervalId: NodeJS.Timeout;

    const cycle = () => {
      setIsExiting(true);
      setTimeout(() => {
        setActiveIndex(prev => (prev + 1) % texts.length);
        setIsExiting(false);
        initialCycles.current++;
      }, 500);
    };

    cycle();
    updateWidth();

    // Regular interval after initial cycles
    timeout2 = setTimeout(() => {
      intervalId = setInterval(cycle, interval);
    }, interval);

    return () => {
      clearTimeout(timeout2);
      clearInterval(intervalId);
    };
  }, [texts.length, interval]);

  return (
    <div 
      ref={containerRef}
      className={`relative h-[1.2em] whitespace-nowrap transition-all duration-300 ${className}`}
      style={{ width: containerWidth }}
    >
      {/* Hidden measurer */}
      <div 
        ref={textRef}
        className="absolute invisible whitespace-nowrap"
      >
        {texts[activeIndex]}
      </div>

      {/* Active text */}
      <div className={`absolute w-full ${isExiting ? 'animate-drop-out' : ''}`}>
        {texts[activeIndex]}
      </div>
      
      {/* Next text */}
      <div className={`absolute w-full ${isExiting ? 'animate-drop-in' : 'invisible'}`}>
        {texts[(activeIndex + 1) % texts.length]}
      </div>
    </div>
  );
}
