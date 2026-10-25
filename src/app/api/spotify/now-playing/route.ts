import { NextResponse } from 'next/server';
import { createLock } from '@microfleet/ioredis-lock';
import { redis, requestTokens, storeTokens } from '@/lib/spotifyTokens';

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET,OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

function jsonWithCors(
  body: unknown,
  init?: Parameters<typeof NextResponse.json>[1]
) {
  return NextResponse.json(body, {
    ...init,
    headers: {
      ...CORS_HEADERS,
      ...(init?.headers || {}),
    },
  });
}

const lock = createLock(redis, {
  timeout: 200000, // Lock timeout in milliseconds
  retries: 3,      // Number of retries
  delay: 100,      // Delay between retries in milliseconds
});

/**
 * The widget is decorative, so every failure degrades to "nothing playing"
 * rather than a 500 — a dead token should not put an error on every page load.
 * The cause is logged instead, which is where to look when it stops working.
 */
function notPlaying(context?: string, cause?: unknown) {
  if (context) {
    const detail = cause instanceof Error ? cause.message : cause;
    console.error(`spotify/now-playing: ${context}`, detail ?? '');
  }
  return jsonWithCors({ is_playing: false });
}

async function refreshAccessToken(refreshToken: string) {
  const tokens = await requestTokens({
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });
  await storeTokens(tokens);
  return tokens.access_token;
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function GET() {
  let accessToken: string | null = null;

  try {
    // Lock so concurrent polls cannot each kick off their own refresh
    await lock.acquire('spotify_token_refresh');
  } catch (err) {
    return notPlaying('could not acquire refresh lock', err);
  }

  try {
    accessToken = await redis.get('spotify_access_token');
    const refreshToken = await redis.get('spotify_refresh_token');
    const expiry = await redis.get('spotify_expiry');

    if (!accessToken || !refreshToken || !expiry) {
      throw new Error('no tokens in Redis — authorize at /api/spotify/auth');
    }

    if (Date.now() > parseInt(expiry, 10)) {
      accessToken = await refreshAccessToken(refreshToken);
    }
  } catch (err) {
    return notPlaying('token unavailable (re-authorize at /api/spotify/auth)', err);
  } finally {
    // Released before the slow Spotify call so concurrent polls do not queue
    try {
      await lock.release();
    } catch (err) {
      console.error('spotify/now-playing: lock release failed', err);
    }
  }

  try {
    const response = await fetch(
      'https://api.spotify.com/v1/me/player/currently-playing',
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    // Nothing playing: 204 has no body, so calling .json() on it would throw
    if (response.status === 204 || response.status === 202) return notPlaying();

    if (!response.ok) {
      throw new Error(`currently-playing returned ${response.status}`);
    }

    const text = await response.text();
    if (!text.trim()) return notPlaying();

    const playback = JSON.parse(text) as {
      is_playing?: boolean;
      progress_ms?: number;
      item: {
        name: string;
        artists: Array<{ name: string; uri: string }>;
        album: { name: string; uri: string; images: Array<{ url: string }> };
        duration_ms: number;
        explicit: boolean;
        external_urls: { spotify: string };
      } | null;
    };

    if (!playback.item) return notPlaying();

    return jsonWithCors({
      is_playing: playback.is_playing,
      track: playback.item.name,
      artist: playback.item.artists.map((a) => a.name),
      artist_uri: playback.item.artists.map((a) => a.uri),
      album: playback.item.album.name,
      album_uri: playback.item.album.uri,
      image: playback.item.album.images[0]?.url,
      progress: playback.progress_ms,
      duration: playback.item.duration_ms,
      explicit: playback.item.explicit,
      track_url: playback.item.external_urls.spotify,
      external_url: playback.item.external_urls.spotify,
    });
  } catch (err) {
    return notPlaying('could not fetch current track', err);
  }
}
