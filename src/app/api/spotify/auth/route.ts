import { NextResponse } from 'next/server';
import { randomBytes } from 'crypto';
import { SCOPES } from '@/lib/spotifyTokens';

// Spotify refresh tokens die six months after consent, so this is the door
// back in: visiting it walks the owner through consent and the callback
// stores fresh tokens.
export async function GET() {
  const state = randomBytes(16).toString('hex');
  const params = new URLSearchParams({
    response_type: 'code',
    client_id: process.env.SPOTIFY_CLIENT_ID!,
    scope: SCOPES,
    redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
    state,
  });

  const res = NextResponse.redirect(`https://accounts.spotify.com/authorize?${params}`);
  res.cookies.set('spotify_auth_state', state, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/api/spotify',
    maxAge: 600,
  });
  return res;
}
