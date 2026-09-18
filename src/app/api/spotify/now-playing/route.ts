import { NextResponse } from 'next/server';
import Redis from 'ioredis';
import { createLock } from '@microfleet/ioredis-lock';

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

const redis = new Redis({
  host: process.env.REDIS_HOSTNAME,
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
});

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
    // Spotify answers every refresh failure with 400, so the status alone
    // cannot tell invalid_grant (dead refresh token) from invalid_client
    // (bad id/secret). The body is the only thing that distinguishes them.
    const body = await response.text();
    let code = 'unknown';
    try {
      code = JSON.parse(body).error || code;
    } catch {
      // non-JSON body, so the raw text below is all there is to go on
    }
    throw new Error(`refresh rejected (${response.status} ${code}): ${body}`);
  }

  const { access_token, expires_in, refresh_token } = await response.json();

  await redis.set('spotify_access_token', access_token);
  await redis.set('spotify_expiry', String(Date.now() + expires_in * 1000));
  // Spotify may hand back a rotated refresh token; dropping it would
  // invalidate the stored one and break every later refresh.
  if (refresh_token) {
    await redis.set('spotify_refresh_token', refresh_token);
  }

  return access_token as string;
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
      throw new Error('no tokens in Redis — the site has not been authorized');
    }

    if (Date.now() > parseInt(expiry, 10)) {
      accessToken = await refreshAccessToken(refreshToken);
    }
  } catch (err) {
    return notPlaying('token unavailable', err);
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
        popularity: number;
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
      popularity: playback.item.popularity,
      track_url: playback.item.external_urls.spotify,
      external_url: playback.item.external_urls.spotify,
    });
  } catch (err) {
    return notPlaying('could not fetch current track', err);
  }
}
