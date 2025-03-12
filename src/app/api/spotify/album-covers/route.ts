
import { NextResponse } from 'next/server';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOSTNAME,
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
});

export async function GET(request: Request) {
  const url = new URL(request.url);
  const playlistId = url.searchParams.get('playlistId'); // Extract playlist ID from query params

  if (!playlistId) {
    return NextResponse.json({ error: 'Playlist ID is required' }, { status: 400 });
  }

  let accessToken: string | null = null;

  try {
    accessToken = await redis.get('spotify_access_token');
    if (!accessToken) {
      throw new Error('Missing Spotify access token');
    }
  } catch (error) {
    console.error('Error retrieving access token:', error.message);
    return NextResponse.json({ error: 'Failed to retrieve access token' }, { status: 500 });
  }

  try {
    const response = await fetch(`https://api.spotify.com/v1/playlists/${playlistId}/tracks`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch playlist tracks, status code: ${response.status}`);
    }

    const data = await response.json();
    const albumCovers = data.items.map((item: any) => item.track.album.images[0]?.url);

    return NextResponse.json({ albumCovers });
  } catch (error) {
    console.error('Error fetching playlist tracks:', error.message);
    return NextResponse.json({ error: 'Failed to fetch playlist tracks' }, { status: 500 });
  }
}
