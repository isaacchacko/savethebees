import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const token = request.headers.get('authorization')?.split(' ')[1];

  try {
    const response = await fetch(
      'https://api.spotify.com/v1/me/player/currently-playing',
      { headers: { Authorization: `Bearer ${token}` } }
    );

    if (response.status === 204) {
      return NextResponse.json({ is_playing: false });
    }

    const data = await response.json();
    return NextResponse.json({
      is_playing: data.is_playing,
      track: data.item.name,
      artist: data.item.artists.map((a: { name: string }) => a.name).join(', '),
      album: data.item.album.name,
      image: data.item.album.images[0]?.url,
      progress: data.progress_ms,
      duration: data.item.duration_ms,
      explicit: data.item.explicit,
      popularity: data.item.popularity,
      track_url: data.item.external_urls.spotify,
      external_url: data.item.external_urls.spotify,
    });
  } catch (err) {
    console.error('Error fetching playback:', err);
    return NextResponse.json(
      { error: 'Failed to fetch playback' },
      { status: 500 }
    );
  }
}
