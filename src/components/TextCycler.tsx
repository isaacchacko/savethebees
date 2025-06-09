'use client';

import React, { useState, useEffect, useRef, useLayoutEffect } from 'react';
import Link from 'next/link';

export default function TextCycler(
  {
    texts,
    hrefs,
    isNewTabs,
    interval = 5000,
    divClassName = "",
    textClassName = ""
  }:
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
  const measureRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!measureRef.current) return


    setContainerWidth(measureRef.current.getBoundingClientRect().width);
    setContainerHeight(measureRef.current.getBoundingClientRect().height);

    const observer = new ResizeObserver(entries => {
      setContainerWidth(entries[0].contentRect.width);
      setContainerHeight(entries[0].contentRect.height);
    });

    observer.observe(measureRef.current);

    return (() => {
      observer.disconnect();
    })

  }, [measureRef.current]);

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
      clearTimeout(timeoutRef.current);  // TODO
    };
  }, [] // means that it will run on mount and umount
  );

  return (
    <>
      <span className={" absolute whitespace-nowrap opacity-0 " + textClassName} ref={measureRef}>{texts[index % texts.length]}</span>
      <div className={"relative whitespace-nowrap h-[1em] " + divClassName}
        style={{
          width: containerWidth,
          height: containerHeight,
          transition: 'width 500ms ease-in-out, height 500ms ease-in-out'
        }}>
        <Link
          href={hrefs[index % hrefs.length]}
          target={isNewTabs[index % isNewTabs.length] ? "_blank" : ""}
          className={` ${textClassName} absolute inset-0 ${isMoving ? 'animate-drop-out' : ''} hover:text-white transition-colors duration-300`}
        >
          {texts[index % texts.length]}
        </Link>
        <Link
          href={hrefs[(index + 1) % hrefs.length]}
          target={isNewTabs[(index + 1) % isNewTabs.length] ? "_blank" : ""}
          className={` ${textClassName} absolute inset-0 ${isMoving ? 'animate-drop-in' : 'invisible'} hover:text-white transition-colors duration-300`}
        >
          {texts[(index + 1) % texts.length]}
        </Link>
      </div>
    </>
  );
}
