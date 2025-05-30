'use client';

import Image from 'next/image';
import { useState, useEffect } from 'react';
import SpotifyLogo from './SpotifyLogo';

const BASE_CLASS_NAME = "relative p-2 bg-(--spotify-background) rounded-lg shadow slide-down-fade-in";

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
        <div className={combinedClassName}>
          <Header text="Not playing" />
        </div>
      );
    }
    return (
      <div className={combinedClassName}>
        <Header text="I'm not listening to anything..." />
      </div>
    );
  }

  if (condensed) {
    return (
      <div className={`relative p-1 bg-(--spotify-background) rounded-lg shadow slide-down-fade-in mx-auto flex flex-row gap-2 items-center `}>
        {playback?.image && (
          <div className='h-20 w-20 relative'>
            <Image
              src={playback.image}
              alt="Album cover"
              fill
              className="pulse-border shrink-1 rounded-lg object-cover"
            />
          </div>
        )}
        <div className="hidden md:block flex items-center gap-2 min-w-0">
          <a
            href={playback.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="font-black text-base md:text-xl 2xl:text-2xl text-white sm:hover:underline cursor-pointer overflow-ellipsis "
          >
            {playback.track?.length ? playback.track?.length > 30 ? playback.track?.slice(0, 30).trimEnd() + '...' : playback.track : undefined}
          </a>

          <p className="hidden md:flex text-md font-black 2xl:text-xl truncate w- ">
            {playback.artist_uri && (
              <a
                href={`https://open.spotify.com/artist/${playback.artist_uri.split(':')[2]}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white sm:hover:underline cursor-pointer"
              >
                {playback.artist?.length ? playback.artist?.length > 30 ? playback.artist?.slice(0, 30).trimEnd() + '...' : playback.artist : undefined}
              </a>
            )}
          </p>
        </div>
        <SpotifyLogo className="shrink-0 ml-2" />
      </div>
    );
  }

  return (
    <div className={`${combinedClassName} w-full my-10 pointer-events-auto`}>

      <Header text="I'm currently listening to:" />
      <div className="flex flex-col xl:flex-row gap-4">

        {/* Album art */}
        {playback?.image && (
          <Image
            src={playback.image}
            alt="Album cover"
            width={256}
            height={256}
            className="pulse-border rounded-lg object-cover max-w-1/3"
          />
        )}

        <div className="flex flex-col flex-1 gap-4 justify-between">

          <div>

            {/* Track info */}
            <div className="flex-1 space-y-2 text-white">
              <div>
                <a
                  href={playback.external_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="overflow-hidden font-black text-xl md:text-4xl 2xl:text-4xl text-white sm:hover:underline cursor-pointer"
                >
                  {playback.track}
                </a>
                <p className={`text-md font-black 2xl:text-xl`}>
                  {playback.artist_uri && (
                    <a
                      href={`https://open.spotify.com/artist/${playback.artist_uri.split(':')[2]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-white sm:hover:underline cursor-pointer"
                    >
                      {playback.artist}
                    </a>
                  )}
                </p>
                <p className={`text-md 2xl:text-xl text-gray-500`}>
                  {playback.album_uri && (
                    <a
                      href={`https://open.spotify.com/album/${playback.album_uri.split(':')[2]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gray-500 sm:hover:underline cursor-pointer"
                    >
                      {playback.album}
                    </a>
                  )}
                </p>
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
