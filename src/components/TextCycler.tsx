'use client';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
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
  const [containerHeight, setContainerHeight] = useState(0);
  const timeoutRef = useRef<number>();
  const measureRef = useRef(null); 

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
  
  useLayoutEffect(() => {
    if (measureRef.current) {
      setContainerWidth(measureRef.current.offsetWidth);
      setContainerHeight(measureRef.current.offsetHeight);
    }
  }, [texts[index % texts.length]]);

  return (
    <>
      <span className={ " absolute whitespace-nowrap opacity-0 " + textClassName} ref={measureRef}>{texts[index % texts.length]}</span>
      <div className={"relative whitespace-nowrap h-[1em] " + divClassName} style={{width: containerWidth, height: containerHeight}}>
        <HeroLink
          href={hrefs[index % texts.length]}
          text={texts[index % texts.length]}
          isNewTab={isNewTabs[index % texts.length]}
          className={` ${textClassName} absolute inset-0 flex items-center justify-start  ${isMoving ? 'animate-drop-out' : ''}`}
        />
        <HeroLink
          href={hrefs[(index + 1) % texts.length]}
          text={texts[(index + 1) % texts.length]}
          isNewTab={isNewTabs[(index + 1) % texts.length]}
          className={` ${textClassName} absolute inset-0 flex items-center justify-start  ${isMoving ? 'animate-drop-in' : 'invisible'}`}
        />
      </div>
    </>
  );
}
