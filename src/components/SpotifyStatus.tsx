'use client';
import { useState, useEffect } from 'react';
import SpotifyLogo from './SpotifyLogo';

const Header = ({
  className = "font-bold text-lg 2xl:text-2xl text-white cursor-pointer pb-2",
  text,
  href = ""
}: HeaderProps): JSX.Element => (
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
    <SpotifyLogo />
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

export default function SpotifyStatus({condensed, className}: {condensed?: boolean, className?: string } ) {
  const BASE_CLASS_NAME = `relative p-4 bg-(--spotify-background) rounded-lg shadow ${className}`;
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated' | 'error'>('loading');
  const [error, setError] = useState('');
  const [localProgress, setLocalProgress] = useState(0);
  const [localDuration, setLocalDuration] = useState(0);
  const [shouldAnimate, setShouldAnimate] = useState(false);

  const checkAuth = async (): Promise<string> => {
    try {
      const res = await fetch('/api/spotify/refresh-token', { credentials: 'include' });

      if (!res.ok) {
        throw new Error('Token refresh failed');
      }

      const { access_token } = await res.json();
      return access_token;
    } catch (err) {
      setStatus('unauthenticated');
      throw err;
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const urlParams = new URLSearchParams(window.location.search);
        if (urlParams.get('error')) {
          throw new Error(urlParams.get('error')!);
        }

        // Check existing session
        const expiry = document.cookie.split('; ')
          .find(row => row.startsWith('spotify_expiry='))
          ?.split('=')[1];

        if (expiry && Date.now() < parseInt(expiry)) {
          setStatus('authenticated');
          return;
        }

        // Get new token if expired
        await checkAuth();
        setStatus('authenticated');
        
        if (status !== 'loading') {
          setTimeout(() => setShouldAnimate(true), 300);
        }

      } catch (err) {
        console.error('Auth initialization failed:', err);
        setStatus('unauthenticated');
        setTimeout(() => setShouldAnimate(true), 300);
      }
    };

    initializeAuth();
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

  const fetchPlaybackData = async () => {
    try {
      const token = await checkAuth();

      const res = await fetch('/api/spotify/now-playing', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (res.status === 401) {
        const newToken = await checkAuth();
        return fetchPlaybackData();
      }

      if (!res.ok) throw new Error('Failed to fetch playback');

      const data = await res.json();
      setPlayback(data);
      setLocalProgress(data.progress || 0);
      setLocalDuration(data.duration || 0);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setStatus('error');
    }
  };

  useEffect(() => {
    if (status === 'authenticated') {
      const fetchInitialData = async () => {
        await fetchPlaybackData();
        setTimeout(() => setShouldAnimate(true), 300); // Animate after data load
      };
      fetchInitialData();
      const interval = setInterval(fetchPlaybackData, 10000);
      return () => clearInterval(interval);
    }
  }, [status]);

  // Loading state
  if (status === 'loading') {
    return <div></div>;
  }

  // Unauthenticated state
  if (status === 'unauthenticated') {
    return (
      <div className="p-4 bg-blue-50 rounded-lg text-center">
        <button
          onClick={() => window.location.href = '/api/spotify/auth'}
          className={`${BASE_CLASS_NAME} whitespace-nowrap pr-10 ${shouldAnimate ? 'slide-down-fade-in' : 'opacity-0'}`}
          style={{ pointerEvents: 'auto'}}
        >
          Connect Spotify
        </button>
      </div>
    );
  }

  // Error state
  if (status === 'error') {
    return (
      <div className={`${BASE_CLASS_NAME} ${shouldAnimate ? 'slide-down-fade-in' : 'opacity-0'}`} style={{ pointerEvents: 'auto'}}>
        <button onClick={() => window.location.reload()}>
          Press to Reload
        </button>
      </div>
    );
  }

  // No current playback or playback is null
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
  
  if (condensed) {

  return (
<div className={`${BASE_CLASS_NAME} mx-10 flex flex-row gap-2 items-center ${shouldAnimate ? 'slide-down-fade-in' : 'opacity-0'} sm:flex sm:flex-row sm:gap-2 sm:items-center hidden sm:block flex-shrink`} style={{ pointerEvents: 'auto' }}>


          {playback?.image && (
            <img 
              src={playback.image} 
              alt="Album cover"
              className="hidden 2xl:block w-10 h-10 rounded-lg object-cover"
            />
          )}
          <a href={playback.external_url} target="_blank" rel="noopener noreferrer" className="font-black text-base md:text-xl 2xl:text-2xl text-white sm:hover:underline cursor-pointer truncate">
            {playback.track}
          </a>

          <p className="text-md font-black 2xl:text-xl">by {playback.artist}</p>
          <SpotifyLogo />

      </div>
    );
  }
  return (
    <div className={`${BASE_CLASS_NAME} w-full ${shouldAnimate ? 'slide-down-fade-in' : 'opacity-0'}`} style={{ pointerEvents: 'auto' }}>

      <Header text="I'm currently listening to:"/>
      <div className="flex flex-row gap-4">

        {/* Album art */}
        {playback?.image && (
          <img 
            src={playback.image} 
            alt="Album cover"
            className="hidden 2xl:block w-64 h-64 rounded-lg object-cover"
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
