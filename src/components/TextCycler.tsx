'use client';

import React, { useState, useEffect, useRef } from 'react';
import HeroLink from '@/components/HeroLink';

export default function TextCycler (
  { 
    texts,
    hrefs,
    isNewTabs,
    interval=5000,
    divClassName="",
    textClassName="" 
  } :
  { 
    texts: string[];
    hrefs: string[];
    isNewTabs: boolean[];
    interval?: number;
    divClassName?: string;
    textClassName?: string;
  }
) {
  
  const [index, setIndex] = useState(0);
  const [isMoving, setIsMoving] = useState(false);
  
  // black magic
  const [containerWidth, setContainerWidth] = useState(0);
  const timeoutRef = useRef<number>();
  
  useEffect(() => {

    const intervalID = setInterval(() => {
      setIsMoving(true);
      timeoutRef.current = setTimeout(() => {
        setIndex(prev => prev + 1);
        setIsMoving(false); 
      }, 500);
    }, interval);

    return () => {
      clearInterval(intervalID);
      clearTimeout(timeoutRef.current);
    };
  }, [] // means that it will run on mount and umount
  );

  return (
    <div className={"relative overflow-hidden text-nowrap h-[1em]" + divClassName}>
      <HeroLink
        href={hrefs[index % texts.length]}
        text={texts[index % texts.length]}
        isNewTab={isNewTabs[index % texts.length]}
        className={` ${textClassName} absolute inset-0 flex items-center justify-start  ${isMoving ? 'animate-drop-out' : ''}`}
      />
      <div className={` ${textClassName} absolute inset-0 flex items-center justify-start  ${isMoving ? 'animate-drop-in' : 'invisible'}`}>
        {texts[(index+1) % texts.length]}
      </div>
    </div>
  );
}
