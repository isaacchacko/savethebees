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
  const [containerWidth, setContainerWidth] = useState(566.167);
  const textRef = useRef<HTMLDivElement>(null);
  const resizeObserverRef = useRef<ResizeObserver>();

  const updateWidth = () => {
    if (textRef.current) {
      const rect = textRef.current.getBoundingClientRect();
      setContainerWidth(rect.width);
    }
  };

  useEffect(() => {
    const handleResize = () => requestAnimationFrame(updateWidth);
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
  }, [activeIndex]);

  useEffect(() => {
    const measureNextWidth = (text: string) => {
      if (!textRef.current) return 0;
      const tempEl = document.createElement("div");
      const styles = window.getComputedStyle(textRef.current);
      
      // Copy relevant styles
      tempEl.style.font = styles.font;
      tempEl.style.fontSize = styles.fontSize;
      tempEl.style.fontWeight = styles.fontWeight;
      tempEl.style.letterSpacing = styles.letterSpacing;
      tempEl.style.whiteSpace = "nowrap";
      tempEl.style.visibility = "hidden";
      tempEl.style.position = "absolute";
      tempEl.style.left = "-9999px";
      
      tempEl.textContent = text;
      document.body.appendChild(tempEl);
      const width = tempEl.getBoundingClientRect().width;
      document.body.removeChild(tempEl);
      return width;
    };

    const cycle = () => {
      const nextIndex = (activeIndex + 1) % texts.length;
      const nextText = texts[nextIndex];
      const currentWidth = containerWidth;
      const nextWidth = measureNextWidth(nextText);

      if (nextWidth > currentWidth) {
        // Longer text: Resize -> Animate -> Update
        setContainerWidth(nextWidth);
        setTimeout(() => {
          setIsExiting(true);
          setTimeout(() => {
            setActiveIndex(nextIndex);
            setIsExiting(false);
          }, 500);
        }, 300); // Match CSS transition duration
      } else {
        // Shorter/same text: Animate -> Update -> Resize
        setIsExiting(true);
        setTimeout(() => {
          setActiveIndex(nextIndex);
          setIsExiting(false);
          requestAnimationFrame(updateWidth);
        }, 500);
      }
    };

    const intervalId = setInterval(cycle, interval);
    return () => clearInterval(intervalId);
  }, [texts, interval, activeIndex, containerWidth]);

  return (
    <div
      className={`relative h-[1.2em] items-center whitespace-nowrap transition-[width] duration-300 ${className}`}
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
