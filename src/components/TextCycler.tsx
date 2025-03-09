"use client";
import { useState, useEffect, useRef } from "react";

export default function TextCycler({
  texts,
  interval = 3000,
  className = "",
}: {
  texts: string[];
  interval?: number;
  className?: string;
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);
  const textRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver>();

  const updateWidth = () => {
    if (textRef.current) {
      // Use getBoundingClientRect to account for zoom scaling
      const rect = textRef.current.getBoundingClientRect();
      setContainerWidth(rect.width);
    }
  };

  useEffect(() => {
    const handleResize = () => {
      requestAnimationFrame(updateWidth);
    };

    window.addEventListener("resize", handleResize);
    
    resizeObserverRef.current = new ResizeObserver(entries => {
      for (const entry of entries) {
        const { width } = entry.contentRect;
        setContainerWidth(width);
      }
    });

    if (textRef.current) {
      resizeObserverRef.current.observe(textRef.current);
    }

    return () => {
      window.removeEventListener("resize", handleResize);
      resizeObserverRef.current?.disconnect();
    };
  }, [activeIndex]); // Re-observe when text changes

  useEffect(() => {
    const cycle = () => {
      setIsExiting(true);
      setTimeout(() => {
        setActiveIndex((prev) => (prev + 1) % texts.length);
        setIsExiting(false);
        requestAnimationFrame(updateWidth);
      }, 500);
    };

    const intervalId = setInterval(cycle, interval);
    return () => clearInterval(intervalId);
  }, [texts.length, interval]);

  return (
    <div
      className={`relative h-[1.2em] whitespace-nowrap transition-[width] duration-300 ${className}`}
      style={{ width: containerWidth }}
    >
      <div 
        ref={textRef}
        className={`absolute ${isExiting ? "animate-drop-out" : ""}`}
      >
        {texts[activeIndex]}
      </div>
      
      <div className={`absolute ${isExiting ? "animate-drop-in" : "invisible"}`}>
        {texts[(activeIndex + 1) % texts.length]}
      </div>
    </div>
  );
}
