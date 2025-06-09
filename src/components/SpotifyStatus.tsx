'use client';

import Image from 'next/image';
import { useRef, useState, useEffect, useLayoutEffect } from 'react';
import SpotifyLogo from './SpotifyLogo';

const BASE_CLASS_NAME = "relative p-2 bg-(--spotify-background) rounded-lg shadow slide-down-fade-in";
const TEXT_SCROLL_SPEED = 0.020;
const TEXT_PAUSE_DURATION = 500;

interface HeaderProps {
  className?: string;
  text: string;
  href?: string;
}

const Header = ({
  className = "font-bold text-lg 2xl:text-2xl text-white cursor-pointer pb-2",
  text,
  href = ""
}: HeaderProps) => (
  <div className="flex flex-row justify-between items-center gap-4">
    {href !== "" ? (
      <div className={className}>
        <a
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="font-black text-white hover:underline cursor-pointer"
        >
          {text}
        </a>
      </div>
    ) : (
      <div className={className}>
        <span>{text}</span>
      </div>
    )}
    <SpotifyLogo className="shrink-0" />
  </div>
);

type PlaybackState = {
  is_playing: boolean;
  artist?: string;
  track?: string;
  album?: string;
  image?: string;
  progress?: number;
  duration?: number;
  external_url?: string;
  artist_uri?: string;
  album_uri?: string;
};

interface SpotifyStatusProps {
  condensed?: boolean;
  className?: string;
  navRef?: React.RefObject<HTMLElement>;
}

export default function SpotifyStatus({ condensed, className }: SpotifyStatusProps) {
  const combinedClassName = BASE_CLASS_NAME + " " + className;
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [localProgress, setLocalProgress] = useState(0);
  const [localDuration, setLocalDuration] = useState(0);

  const [hovered, setHovered] = useState(false);

  // resizing effect
  const parentRef = useRef<HTMLDivElement>(null);
  const childRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);
  const [height, setHeight] = useState(0);

  // text scrolling effect
  const textRef = useRef<HTMLDivElement>(null);
  const [hiddenWidth, setHiddenWidth] = useState(0);
  const [translate, setTranslate] = useState(0);
  const [scrollState, setScrollState] = useState('ready');

  useEffect(() => {
    const fetchPlaybackData = async () => {
      try {
        const res = await fetch('/api/spotify/now-playing');

        if (!res.ok) throw new Error('Failed to fetch playback');

        const data = await res.json();
        setPlayback(data);
        setLocalProgress(data.progress || 0);
        setLocalDuration(data.duration || 0);
      } catch (err) {
        console.error('Error fetching playback:', err);
        setPlayback(null);
      }
    };

    fetchPlaybackData(); // Initial fetch
    const interval = setInterval(fetchPlaybackData, 15000); // Fetch every 15 seconds
    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (playback?.is_playing) {
      interval = setInterval(() => {
        setLocalProgress(prev => Math.min(prev + 1000, playback.duration || 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [playback?.is_playing, playback?.duration]);

  useLayoutEffect(() => {
    if (!parentRef.current) { return; }

    setWidth(parentRef.current.getBoundingClientRect().width);

    const observer = new ResizeObserver(entries => {
      setWidth(entries[0].contentRect.width);
    });

    observer.observe(parentRef.current);

    return () => {
      observer.disconnect();
    }
  }, [parentRef.current]);

  useLayoutEffect(() => {
    if (!childRef.current) { return; }

    setHeight(childRef.current.getBoundingClientRect().height);

    const observer = new ResizeObserver(entries => {
      setHeight(entries[0].contentRect.height);
    });

    observer.observe(childRef.current);

    return () => {
      observer.disconnect();
    }
  }, [childRef.current]);


  useLayoutEffect(() => {
    if (!textRef.current) return;

    const observer = new ResizeObserver(entries => {
      setHiddenWidth(entries[0].target.scrollWidth - entries[0].target.clientWidth);
    });

    observer.observe(textRef.current);

    return () => {
      observer.disconnect();
    }
  }, [textRef.current]);

  useEffect(() => {
    if (!textRef.current) { return; }

    setHiddenWidth(textRef.current.scrollWidth - textRef.current.clientWidth);

    let timeout: ReturnType<typeof setTimeout> | undefined;

    if (scrollState === "ready") {
      setTranslate(-hiddenWidth);
      setScrollState('left');
      timeout = setTimeout(() => {
        setScrollState('left-paused');
      }, hiddenWidth / TEXT_SCROLL_SPEED);
    } else if (scrollState === "left-paused") {
      timeout = setTimeout(() => {
        setTranslate(0);
        setScrollState('right');
      }, TEXT_PAUSE_DURATION);
    } else if (scrollState === "right-paused") {
      timeout = setTimeout(() => {
        setTranslate(-hiddenWidth);
        setScrollState('left');
      }, TEXT_PAUSE_DURATION);
    } else if (scrollState === "right") {
      timeout = setTimeout(() => {
        setScrollState('right-paused');
      }, hiddenWidth / TEXT_SCROLL_SPEED);
    } else if (scrollState === "left") {
      timeout = setTimeout(() => {
        setScrollState('left-paused');
      }, hiddenWidth / TEXT_SCROLL_SPEED);
    } else {  
      timeout = undefined; 
    }

    return () => clearTimeout(timeout);
  }, [scrollState, hiddenWidth]);

  // Format time helper
  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = localDuration > 0
    ? (localProgress / localDuration) * 100
    : 0;

  if (!playback || !playback.is_playing) {
    return (
      <div className='flex-grow flex justify-start items-center'>
        <div className='h-20 w-20 relative flex justify-center items-center'>
          <SpotifyLogo className="" />
        </div>
        <div className="relative p-2 bg-(--spotify-background) rounded-lg shadow slide-down-fade-in">
          <div className="flex flex-row justify-between items-center gap-4">
            <div className={className}>
              <p className="font-black text-white cursor-pointer">
                Isaac isn&apos;t not listening to anything...
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div onMouseEnter={() => setHovered(true)} onMouseLeave={() => setHovered(false)} ref={parentRef} style={{ height }} className='group flex flex-row flex-grow flex items-center'>
      <div className='h-20 w-20 relative flex justify-start items-center'>
        <SpotifyLogo className="" />
      </div>
      <div className="relative p-3 bg-(--spotify-background) rounded-lg flex flex-grow gap-2 items-center">
        <div style={{ height: hovered ? `${height}px` : 3 }} className="flex-grow flex flex-col justify-center ">
          <div className="w-full h-1 bg-gray-200 rounded-full">
            <div
              className="h-full bg-(--spotify-foreground) rounded-full transition-all duration-1000"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between 2xl:text-2xl text-gray-500">
          </div>
        </div>
      </div>
      <div ref={childRef} style={{ width }} className="absolute opacity-0 group-hover:opacity-100 transition-opacity duration-400 group-hover:delay-0 delay-300 ease-out p-3 bg-(--spotify-background) rounded-lg flex flex-row flex-grow gap-2 items-center">
        {playback?.image && (
          <div className='h-20 w-20 relative'>
            <Image
              src={playback.image}
              alt="Album cover"
              fill
              className="pulse-border rounded-lg object-cover"
            />
          </div>
        )}
        <div className="overflow-hidden flex flex-col gap-1 w-full">
          <div className={`flex flex-row gap-3 delay-1000 transition-transform ease-linear`}
            style={{ transform: `translateX(${translate}px)`,
                      transitionDuration: `${hiddenWidth / TEXT_SCROLL_SPEED}ms`}}
            ref={textRef}>
            <p className='font-bold md:text-xl 2xl:text-2xl text-white whitespace-nowrap'>
              Isaac is now listening to:{' '}
              <a
                href={playback.external_url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold md:text-xl 2xl:text-2xl text-white italic sm:hover:underline cursor-pointer "
              >
                {playback.track}
              </a>
            </p>

            {playback.artist_uri && (
              <>
                <a
                  href={`https://open.spotify.com/artist/${playback.artist_uri.split(':')[2]}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="whitespace-nowrap font-bold md:text-xl 2xl:text-2xl text-white sm:hover:underline cursor-pointer "
                >
                  by <p className="italic inline">{playback.artist}</p>
                </a>
              </>
            )}
          </div>
          <div className="">
            <div className="w-full h-1 bg-gray-200 rounded-full">
              <div
                className="h-full bg-(--spotify-foreground) rounded-full transition-all duration-1000"
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between 2xl:text-2xl text-gray-500">
              <span>{formatTime(localProgress)}</span>
              <span>{formatTime(localDuration)}</span>
            </div>
          </div>
        </div>

      </div>
    </div>
  );

}
