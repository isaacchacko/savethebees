'use client';

import { useState, useEffect } from 'react';

export type PlaybackState = {
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

export function useSpotifyPlayback() {
  const [playback, setPlayback] = useState<PlaybackState | null>(null);

  useEffect(() => {
    const fetchPlaybackData = async () => {
      try {
        const res = await fetch('/api/spotify/now-playing', { cache: 'no-store' });
        if (!res.ok) throw new Error('Failed to fetch playback');
        setPlayback(await res.json());
      } catch (err) {
        console.error('Error fetching playback:', err);
        setPlayback(null);
      }
    };

    fetchPlaybackData();
    const interval = setInterval(fetchPlaybackData, 15000);
    return () => clearInterval(interval);
  }, []);

  return playback;
}
