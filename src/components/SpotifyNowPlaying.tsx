'use client';

import { useState, useEffect, useRef } from 'react';
import Image from 'next/image';
import { MdPushPin } from 'react-icons/md';

type PlaybackState = {
  is_playing: boolean;
  artist?: string | string[];
  track?: string;
  album?: string;
  image?: string;
  progress?: number;
  duration?: number;
  external_url?: string;
  artist_uri?: string[];
  album_uri?: string;
};

const formatTime = (ms: number): string => {
  const totalSeconds = Math.floor(ms / 1000);
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
};

export function useSpotifyPlayback() {
  const [playback, setPlayback] = useState<PlaybackState | null>(null);

  useEffect(() => {
    const fetchPlaybackData = async () => {
      try {
        const res = await fetch('/api/spotify/now-playing');
        if (!res.ok) throw new Error('Failed to fetch playback');
        const data = await res.json();
        setPlayback(data);
      } catch (err) {
        console.error('Error fetching playback:', err);
        setPlayback(null);
      }
    };

    fetchPlaybackData(); // Initial fetch
    const interval = setInterval(fetchPlaybackData, 15000); // Fetch every 15 seconds
    return () => clearInterval(interval);
  }, []);

  return playback;
}

export default function SpotifyNowPlaying({ isVisible = true, isPinned = false, onUnpin, navbarMode = false, onPin }: { isVisible?: boolean; isPinned?: boolean; onUnpin?: () => void; navbarMode?: boolean; onPin?: () => void }) {
  const playback = useSpotifyPlayback();
  const [localProgress, setLocalProgress] = useState(0);
  const trackRef = useRef<HTMLDivElement>(null);
  const artistRef = useRef<HTMLDivElement>(null);
  const [trackScroll, setTrackScroll] = useState(false);
  const [artistScroll, setArtistScroll] = useState(false);
  const [trackOverflow, setTrackOverflow] = useState(0);
  const [artistOverflow, setArtistOverflow] = useState(0);
  const [trackDuration, setTrackDuration] = useState(6);
  const [artistDuration, setArtistDuration] = useState(6);

  // Constant scroll speed in pixels per second
  const SCROLL_SPEED = 30; // pixels per second
  // Keyframe percentages: 10% pause, 40% scroll forward, 20% pause, 30% scroll back
  // Scroll portions = 70% of duration (40% forward + 30% back), so duration = scroll_time / 0.7

  // Sync local progress with playback data
  useEffect(() => {
    if (playback?.progress !== undefined) {
      setLocalProgress(playback.progress);
    }
  }, [playback?.progress]);

  // Animate progress bar
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (playback?.is_playing && playback.duration) {
      interval = setInterval(() => {
        setLocalProgress(prev => {
          const newProgress = prev + 1000;
          return newProgress >= playback.duration! ? playback.duration! : newProgress;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [playback?.is_playing, playback?.duration]);

  // Check if text overflows and enable scrolling
  useEffect(() => {
    if (!playback?.track) return;

    const checkOverflow = () => {
      // Check track overflow - use parent of trackRef as container
      if (trackRef.current) {
        const textElement = trackRef.current;
        const container = textElement.parentElement;
        if (container) {
          const containerWidth = container.clientWidth || container.offsetWidth;
          const textWidth = textElement.scrollWidth;
          const isOverflowing = textWidth > containerWidth && containerWidth > 0;
          setTrackScroll(isOverflowing);
          if (isOverflowing) {
            const overflow = textWidth - containerWidth;
            setTrackOverflow(overflow);
            // Calculate duration based on overflow amount and constant speed
            const scrollDistance = overflow * 2; // forward + back
            const scrollTime = scrollDistance / SCROLL_SPEED;
            // Keyframes use 70% of duration for scrolling (40% forward + 30% back)
            const calculatedDuration = scrollTime / 0.7;
            setTrackDuration(Math.max(calculatedDuration, 4));
          } else {
            setTrackScroll(false);
            setTrackOverflow(0);
          }
        }
      }

      // Check artist overflow - use parent of artistRef as container
      if (artistRef.current) {
        const textElement = artistRef.current;
        const container = textElement.parentElement;
        if (container) {
          const containerWidth = container.clientWidth || container.offsetWidth;
          const textWidth = textElement.scrollWidth;
          const isOverflowing = textWidth > containerWidth && containerWidth > 0;
          setArtistScroll(isOverflowing);
          if (isOverflowing) {
            const overflow = textWidth - containerWidth;
            setArtistOverflow(overflow);
            const scrollDistance = overflow * 2;
            const scrollTime = scrollDistance / SCROLL_SPEED;
            const calculatedDuration = scrollTime / 0.7;
            setArtistDuration(Math.max(calculatedDuration, 4));
          } else {
            setArtistScroll(false);
            setArtistOverflow(0);
          }
        }
      }
    };

    // Use multiple timeouts to ensure DOM is ready and rendered
    const timeout1 = setTimeout(checkOverflow, 50);
    const timeout2 = setTimeout(checkOverflow, 200);
    const timeout3 = setTimeout(checkOverflow, 500);

    window.addEventListener('resize', checkOverflow);
    return () => {
      clearTimeout(timeout1);
      clearTimeout(timeout2);
      clearTimeout(timeout3);
      window.removeEventListener('resize', checkOverflow);
    };
  }, [playback?.track, playback?.artist, playback?.album, SCROLL_SPEED]);

  // Show message if not playing anything
  if (!playback || !playback.track) {
    return (
      <div className="mt-8 flex flex-col gap-3 max-w-md text-center p-6 rounded-xl">
        <div className="text-sm md:text-base text-gray-500">
          Not currently listening to anything
        </div>
        <div className="text-xs md:text-sm text-gray-400">
          Check back later to see what I'm listening to!
        </div>
      </div>
    );
  }

  const progressPercentage = playback.duration
    ? (localProgress / playback.duration) * 100
    : 0;

  const artistName = Array.isArray(playback.artist)
    ? playback.artist.join(', ')
    : playback.artist || 'Unknown Artist';

  const remainingTime = playback.duration
    ? playback.duration - localProgress
    : 0;

  // ── compact horizontal navbar layout ────────────────────────────────────────
  if (navbarMode) {
    if (!playback || !playback.track) {
      return (
        <div className="flex items-center gap-3 text-sm text-gray-400 w-full">
          <span>not listening to anything right now</span>
          {isPinned && (
            <button onClick={onUnpin} className="ml-auto p-1 rounded hover:bg-gray-200 transition-colors text-gray-400 hover:text-gray-700 cursor-pointer" aria-label="Unpin">
              <MdPushPin size={15} />
            </button>
          )}
        </div>
      );
    }

    return (
      <div className="flex items-center gap-4 w-full min-w-0" style={{ fontFamily: 'var(--font-bricolage)' }}>
        {/* Album art */}
        {playback.image && (
          <a href={playback.external_url} target="_blank" rel="noopener noreferrer" className="flex-shrink-0">
            <Image
              src={playback.image}
              alt={`${playback.track}`}
              width={48} height={48}
              className="rounded shadow-md hover:opacity-80 transition-opacity"
            />
          </a>
        )}

        {/* Track + artist — takes remaining space, scrolling */}
        <div className="flex flex-col justify-center min-w-0 flex-1 gap-0.5">
          <div className="text-[10px] uppercase tracking-widest text-gray-400 leading-none">
            {playback.is_playing ? 'now playing' : 'paused'}
          </div>

          {/* Track name */}
          <div className="font-semibold text-sm leading-tight overflow-hidden">
            <div
              ref={trackRef}
              className="whitespace-nowrap"
              style={trackScroll ? {
                '--scroll-amount': `-${trackOverflow}px`,
                animation: `scrollTextBackForth ${trackDuration}s linear infinite`,
              } as React.CSSProperties & { '--scroll-amount'?: string } : {}}
            >
              {playback.external_url
                ? <a href={playback.external_url} target="_blank" rel="noopener noreferrer" className="hover:underline">{playback.track}</a>
                : playback.track}
            </div>
          </div>

          {/* Artist · album */}
          <div className="text-xs text-gray-500 overflow-hidden">
            <div
              ref={artistRef}
              className="whitespace-nowrap"
              style={artistScroll ? {
                '--scroll-amount': `-${artistOverflow}px`,
                animation: `scrollTextBackForth ${artistDuration}s linear infinite`,
              } as React.CSSProperties & { '--scroll-amount'?: string } : {}}
            >
              {Array.isArray(playback.artist) && playback.artist_uri
                ? playback.artist.map((a, i) => (
                    <span key={i}>
                      <a href={`https://open.spotify.com/artist/${playback.artist_uri![i]?.split(':')[2]}`} target="_blank" rel="noopener noreferrer" className="hover:underline">{a}</a>
                      {i < playback.artist.length - 1 && ', '}
                    </span>
                  ))
                : <span>{artistName}</span>
              }
              {playback.album && <span> · {playback.album}</span>}
            </div>
          </div>
        </div>

        {/* Progress bar + timestamps */}
        <div className="flex flex-col gap-1 w-36 flex-shrink-0">
          <div className="w-full h-1 bg-gray-200 rounded-full overflow-hidden">
            <div
              className="h-full bg-(--spotify-foreground) rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-[10px] text-gray-400 leading-none">
            <span>{formatTime(localProgress)}</span>
            <span>-{formatTime(remainingTime)}</span>
          </div>
        </div>

        {/* Pin button */}
        <button
          onClick={isPinned ? onUnpin : onPin}
          className={`flex-shrink-0 p-1.5 rounded-full hover:bg-gray-100 transition-all cursor-pointer ${isPinned ? 'text-gray-700' : 'text-gray-300 hover:text-gray-600'}`}
          aria-label={isPinned ? 'Unpin' : 'Pin'}
        >
          <MdPushPin size={15} />
        </button>
      </div>
    );
  }

  return (
    <div className="mt-8 flex flex-col gap-4 max-w-md p-6 rounded-lg">
      {/* Album Art and Track Info */}
      <div className="flex items-center gap-5">
        {playback.image && (
          <a
            href={playback.external_url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex-shrink-0"
          >
            <Image
              src={playback.image}
              alt={`${playback.track} by ${artistName}`}
              width={96}
              height={96}
              className="rounded-md shadow-md hover:opacity-80 transition-opacity"
            />
          </a>
        )}
        <div className="flex-1 min-w-0 overflow-hidden">
          <div className="text-sm md:text-base text-gray-500 mb-2">
            {playback.is_playing ? 'Now playing' : 'Paused'}
          </div>
          {playback.external_url ? (
            <a
              href={playback.external_url}
              target="_blank"
              rel="noopener noreferrer"
              className="block font-semibold text-base md:text-lg lg:text-xl hover:underline overflow-hidden"
            >
              <div
                ref={trackRef}
                className={`whitespace-nowrap ${trackScroll ? 'animate-scroll-text' : ''}`}
                style={trackScroll ? {
                  '--scroll-amount': `-${trackOverflow}px`,
                  animation: `scrollTextBackForth ${trackDuration}s linear infinite`
                } as React.CSSProperties & { '--scroll-amount'?: string } : {}}
              >
                {playback.track}
              </div>
            </a>
          ) : (
            <div className="font-semibold text-base md:text-lg lg:text-xl overflow-hidden">
              <div
                ref={trackRef}
                className={`whitespace-nowrap ${trackScroll ? 'animate-scroll-text' : ''}`}
                style={trackScroll ? {
                  '--scroll-amount': `-${trackOverflow}px`,
                  animation: `scrollTextBackForth ${trackDuration}s linear infinite`
                } as React.CSSProperties & { '--scroll-amount'?: string } : {}}
              >
                {playback.track}
              </div>
            </div>
          )}
          <div className="text-sm md:text-base text-gray-600 overflow-hidden">
            <div
              ref={artistRef}
              className={`whitespace-nowrap ${artistScroll ? 'animate-scroll-text' : ''}`}
              style={artistScroll ? {
                '--scroll-amount': `-${artistOverflow}px`,
                animation: `scrollTextBackForth ${artistDuration}s linear infinite`
              } as React.CSSProperties & { '--scroll-amount'?: string } : {}}
            >
              {Array.isArray(playback.artist) && playback.artist_uri ? (
                playback.artist.map((artist, index) => (
                  <span key={index}>
                    <a
                      href={`https://open.spotify.com/artist/${playback.artist_uri[index]?.split(':')[2]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {artist}
                    </a>
                    {index < playback.artist.length - 1 && ', '}
                  </span>
                ))
              ) : (
                <span>{artistName}</span>
              )}
              {playback.album && (
                <>
                  {' · '}
                  {playback.album_uri ? (
                    <a
                      href={`https://open.spotify.com/album/${playback.album_uri.split(':')[2]}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="hover:underline"
                    >
                      {playback.album}
                    </a>
                  ) : (
                    <span>{playback.album}</span>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Progress Bar and Time */}
      <div className="space-y-2">
        <div className="w-full h-1.5 bg-gray-300 rounded-full overflow-hidden cursor-pointer group">
          <div
            className="h-full bg-(--spotify-foreground) rounded-full transition-all duration-1000 ease-linear"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
        <div className="flex justify-between text-sm md:text-base text-gray-500">
          <span>{formatTime(localProgress)}</span>
          <span>-{formatTime(remainingTime)}</span>
        </div>
      </div>
    </div>
  );
}
