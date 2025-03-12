'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import SpotifyLogo from './SpotifyLogo';

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
          className="font-black text-white sm:hover:underline cursor-pointer"
        >
          {text}
        </a>
      </div>
    ) : (
      <div className={className}>
        <span>{text}</span>
      </div>
    )}
    <SpotifyLogo className="shrink-0"/>
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
};

interface SpotifyStatusProps {
    condensed?: boolean;
    className?: string;
    navRef?: React.RefObject<HTMLElement>;
}

export default function SpotifyStatus({ condensed, className, navRef }: SpotifyStatusProps) {
  const BASE_CLASS_NAME = `relative p-4 bg-(--spotify-background) rounded-lg shadow ${className}`;
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [localProgress, setLocalProgress] = useState(0);
  const [localDuration, setLocalDuration] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;
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
    interval = setInterval(fetchPlaybackData, 15000); // Fetch every 15 seconds
    return () => clearInterval(interval); // Cleanup interval on unmount
  }, []);

  useEffect(() => {
    if (playback) {
      setTimeout(() => setShouldAnimate(true), 300); // Animate after data load
    }
  }, [playback]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (playback?.is_playing) {
      interval = setInterval(() => {
        setLocalProgress(prev => Math.min(prev + 1000, playback.duration || 0));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [playback?.is_playing, playback?.duration]);

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
    if (condensed) {
      return (
        <div className={`${BASE_CLASS_NAME} ${shouldAnimate ? 'slide-down-fade-in' : 'opacity-0'}`}>
          <Header text="Not playing" />
        </div>
      );
    }
    return (
      <div className={`${BASE_CLASS_NAME} ${shouldAnimate ? 'slide-down-fade-in' : 'opacity-0'}`}>
        <Header text="I'm not listening to anything..." />
      </div>
    );
  }

  if (condensed) {
    return (
      <div className={`${BASE_CLASS_NAME} overflow-hidden max-w-2/3 mx-10 flex flex-row gap-2 items-center ${shouldAnimate ? 'slide-down-fade-in' : 'opacity-0'} sm:flex sm:flex-row sm:gap-2 sm:items-center hidden sm:block flex-shrink overflow-hidden whitespace-nowrap`} style={{ pointerEvents: 'auto' }}>
        {playback?.image && (
          <Image
            src={playback.image}
            alt="Album cover"
            width={40}
            height={40}
            className="hidden 2xl:block rounded-lg object-cover"
          />
        )}
        <div className="">
          <a href={playback.external_url} target="_blank" rel="noopener noreferrer" className={`font-black text-base md:text-xl 2xl:text-2xl text-white sm:hover:underline cursor-pointer`}>
            {playback.track}
          </a>

        </div>

        <p className={`text-md font-black 2xl:text-xl`}>by {playback.artist}</p>
        <SpotifyLogo className="shrink-0"/>
      </div>
    );
  }

  return (
    <div className={`${BASE_CLASS_NAME} w-full ${shouldAnimate ? 'slide-down-fade-in' : 'opacity-0'}`} style={{ pointerEvents: 'auto' }}>

      <Header text="I'm currently listening to:" />
      <div className="flex flex-row gap-4">

        {/* Album art */}
        {playback?.image && (
          <Image
            src={playback.image}
            alt="Album cover"
            width={256}
            height={256}
            className="hidden 2xl:block rounded-lg object-cover"
          />
        )}

        <div className="flex flex-col flex-1 gap-4 justify-between">

          <div>

            {/* Track info */}
            <div className="flex-1 space-y-2 overflow-ellipsis text-white">
              <div>
                <a
                  href={playback.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-black text-xl md:text-4xl 2xl:text-4xl text-white sm:hover:underline cursor-pointer"
                >
                  {playback.track}
                </a>
                <p className="text-md font-black 2xl:text-xl text-white">{playback.artist}</p>
                <p className="text-md 2xl:text-xl text-gray-500">{playback.album}</p>
              </div>

            </div>
          </div>

          {/* Progress bar */}
          <div className="space-y-1">
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
