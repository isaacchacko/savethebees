import { NextResponse } from 'next/server';
import Redis from 'ioredis';
import { createLock } from '@microfleet/ioredis-lock';

const redis = new Redis(process.env.REDIS_URL!);
const lock = createLock(redis, {
  timeout: 5000, // Lock expiration time in milliseconds
  retries: 3,    // Maximum number of retries to acquire the lock
  delay: 100,    // Delay between retries in milliseconds
});

export async function GET() {
  let accessToken: string | null = null;
  let refreshToken: string | null = null;
  let expiry: string | null = null;

  try {
    // Acquire lock with a predefined timeout set during lock creation
    await lock.acquire('spotify_token_refresh');
  } catch (lockError) {
    console.error('Error acquiring lock:', lockError);
    return NextResponse.json({ error: 'Failed to acquire lock' }, { status: 500 });
  }

  try {
    // Retrieve tokens and expiry from Redis
    accessToken = await redis.get('spotify_access_token');
    refreshToken = await redis.get('spotify_refresh_token');
    expiry = await redis.get('spotify_expiry');

    if (!accessToken || !refreshToken || !expiry) {
      throw new Error('Missing Spotify tokens or expiry in Redis');
    }
  } catch (redisError) {
    console.error('Error retrieving tokens from Redis:', redisError);
    await lock.release(); // Ensure lock is released
    return NextResponse.json({ error: 'Failed to retrieve tokens' }, { status: 500 });
  }

  const expiryTime = parseInt(expiry);

  if (Date.now() > expiryTime) {
    try {
      // Refresh the access token
      const authHeader = Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
      ).toString('base64');

      const response = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          Authorization: `Basic ${authHeader}`,
        },
        body: new URLSearchParams({
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      if (!response.ok) {
        throw new Error(`Failed to refresh token, status code: ${response.status}`);
      }

      const { access_token, expires_in } = await response.json();

      try {
        // Update Redis with new tokens and expiry time
        await redis.set('spotify_access_token', access_token);
        await redis.set('spotify_expiry', String(Date.now() + expires_in * 1000));
        accessToken = access_token; // Update local variable with new token
      } catch (redisUpdateError: unknown) {
        if (redisUpdateError instanceof Error) {
          throw new Error(`Failed to update Redis with refreshed token: ${redisUpdateError.message}`);
        } else {
          throw new Error(`Failed to update Redis with refreshed token: Unknown error`);
        }
      }
    } catch (redisUpdateError: unknown) {
      if (redisUpdateError instanceof Error) {
        throw new Error(`Failed to update Redis with refreshed token: ${redisUpdateError.message}`);
      } else {
        throw new Error(`Failed to update Redis with refreshed token: Unknown error`);
      }
    }
  }

  let playbackData;

  try {
    // Fetch currently playing track from Spotify API
    const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch currently playing track, status code: ${response.status}`);
    }

    playbackData = await response.json();
  } catch (fetchError) {
    console.error('Error fetching currently playing track:', fetchError);
    await lock.release(); // Ensure lock is released
    return NextResponse.json({ error: 'Failed to fetch currently playing track' }, { status: 500 });
  }

  try {
    // Release the lock after processing
    await lock.release();
  } catch (releaseError) {
    console.error('Error releasing lock:', releaseError);
    return NextResponse.json({ error: 'Failed to release lock' }, { status: 500 });
  }

  // Return playback data in the expected format
  return NextResponse.json({
    is_playing: playbackData.is_playing,
    track: playbackData.item.name,
    artist: playbackData.item.artists.map((a: { name: string }) => a.name).join(', '),
    album: playbackData.item.album.name,
    image: playbackData.item.album.images[0]?.url,
    progress: playbackData.progress_ms,
    duration: playbackData.item.duration_ms,
    explicit: playbackData.item.explicit,
    popularity: playbackData.item.popularity,
    track_url: playbackData.item.external_urls.spotify,
    external_url: playbackData.item.external_urls.spotify,
  });
}
