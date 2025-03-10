import { NextResponse } from 'next/server';

export async function GET() {
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    scope: 'user-read-currently-playing user-read-playback-state',
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
  });

  return NextResponse.redirect(
    `https://accounts.spotify.com/authorize?${params}`
  );
}
