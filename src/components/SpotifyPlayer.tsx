'use client';
import { useState, useEffect } from 'react';

type PlaybackState = {
  is_playing: boolean;
  artist?: string;
  track?: string;
  album?: string;
  image?: string;
  progress?: number;
  duration?: number;
};

export default function SpotifyPlayer() {
  const [playback, setPlayback] = useState<PlaybackState | null>(null);
  const [status, setStatus] = useState<'loading' | 'authenticated' | 'unauthenticated' | 'error'>('loading');
  const [error, setError] = useState('');
  const [localProgress, setLocalProgress] = useState(0);
  const [localDuration, setLocalDuration] = useState(0);

  // Handle OAuth callback and initialization
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const accessToken = urlParams.get('access_token');

    if (accessToken) {
      localStorage.setItem('spotify_access_token', accessToken);
      window.history.replaceState({}, '', window.location.pathname);
      setStatus('authenticated');
    } else if (localStorage.getItem('spotify_access_token')) {
      setStatus('authenticated');
    } else {
      setStatus('unauthenticated');
    }
  }, []);

  // Fake progress updates
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (playback?.is_playing) {
      interval = setInterval(() => {
        setLocalProgress(prev => {
          const newProgress = prev + 1000;
          return newProgress > (playback.duration || 0) ? prev : newProgress;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [playback?.is_playing, playback?.duration]);

  // Fetch playback data
  const fetchPlaybackData = async () => {
    try {
      const token = localStorage.getItem('spotify_access_token');
      if (!token) throw new Error('No access token');

      const res = await fetch('/api/spotify/now-playing', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Failed to fetch playback');
      
      const data = await res.json();
      setPlayback(data);
      setStatus('authenticated');
      
      // Sync local progress with actual API values
      setLocalProgress(data.progress || 0);
      setLocalDuration(data.duration || 0);
      
    } catch (err) {
      localStorage.removeItem('spotify_access_token');
      setStatus('error');
      setError(err instanceof Error ? err.message : 'Unknown error');
    }
  };

  // Polling setup
  useEffect(() => {
    if (status === 'authenticated') {
      fetchPlaybackData();
      const interval = setInterval(fetchPlaybackData, 10000);
      return () => clearInterval(interval);
    }
  }, [status]);

  if (status === 'loading') {
    return (
      <div className="p-4 bg-gray-100 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-300 rounded w-1/3 mb-2"></div>
        <div className="h-4 bg-gray-300 rounded w-2/3"></div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="p-4 bg-blue-50 rounded-lg text-center">
        <p className="mb-3">Connect to Spotify to see current track</p>
        <button
          onClick={() => window.location.href = '/api/spotify/auth'}
          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
        >
          Connect Spotify
        </button>
      </div>
    );
  }

  if (status === 'error') {
    return (
      <div className="p-4 bg-red-50 rounded-lg">
        <p className="text-red-600">Error: {error}</p>
        <button
          onClick={() => window.location.reload()}
          className="mt-2 px-4 py-2 bg-red-100 rounded hover:bg-red-200"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!playback?.is_playing) {
    return (
      <div className="p-4 bg-yellow-50 rounded-lg">
        No music currently playing
      </div>
    );
  }

  const formatTime = (ms: number) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const progressPercentage = localDuration > 0 
    ? (localProgress / localDuration) * 100 
    : 0;

  return (
    <div className="p-4 bg-(--spotify-background) rounded-lg shadow flex items-start gap-4">
      {playback.image && (
        <img 
          src={playback.image} 
          alt="Album cover"
          className="hidden md:block w-16 h-16 rounded-lg object-cover"
        />
      )}
      
      <div className="flex-1 space-y-2">
        <div>
          <h3 className="font-semibold text-lg">{playback.track}</h3>
          <p className="text-gray-600">{playback.artist}</p>
          <p className="text-sm text-gray-500">{playback.album}</p>
        </div>

        <div className="space-y-1">
          <div className="w-full h-1 bg-gray-200 rounded-full">
            <div 
              className="h-full bg-(--spotify-foreground) rounded-full transition-all duration-1000"
              style={{ width: `${progressPercentage}%` }}
            />
          </div>
          <div className="flex justify-between text-xs text-gray-500">
            <span>{formatTime(localProgress)}</span>
            <span>{formatTime(localDuration)}</span>
          </div>
        </div>
      </div>

      <div className="top-2 right-2">
        <svg 
          role="img" 
          viewBox="0 0 496 496" 
          className="w-6 h-6 "
          xmlns="http://www.w3.org/2000/svg"
        >
          <path fill="var(--spotify-foreground)" d="M248 8C111.1 8 0 119.1 0 256s111.1 248 248 248 248-111.1 248-248S384.9 8 248 8Z"/>
          <path fill="var(--spotify-background)" d="M406.6 231.1c-5.2 0-8.4-1.3-12.9-3.9-71.2-42.5-198.5-52.7-280.9-29.7-3.6 1-8.1 2.6-12.9 2.6-13.2 0-23.3-10.3-23.3-23.6 0-13.6 8.4-21.3 17.4-23.9 35.2-10.3 74.6-15.2 117.5-15.2 73 0 149.5 15.2 205.4 47.8 7.8 4.5 12.9 10.7 12.9 22.6 0 13.6-11 23.3-23.2 23.3zm-31 76.2c-5.2 0-8.7-2.3-12.3-4.2-62.5-37-155.7-51.9-238.6-29.4-4.8 1.3-7.4 2.6-11.9 2.6-10.7 0-19.4-8.7-19.4-19.4s5.2-17.8 15.5-20.7c27.8-7.8 56.2-13.6 97.8-13.6 64.9 0 127.6 16.1 177 45.5 8.1 4.8 11.3 11 11.3 19.7-.1 10.8-8.5 19.5-19.4 19.5zm-26.9 65.6c-4.2 0-6.8-1.3-10.7-3.6-62.4-37.6-135-39.2-206.7-24.5-3.9 1-9 2.6-11.9 2.6-9.7 0-15.8-7.7-15.8-15.8 0-10.3 6.1-15.2 13.6-16.8 81.9-18.1 165.6-16.5 237 26.2 6.1 3.9 9.7 7.4 9.7 16.5s-7.1 15.4-15.2 15.4z"/>
        </svg>
      </div>
    </div>
  );
}
