import { NextRequest } from 'next/server';
import { OWNER_SPOTIFY_ID, requestTokens, storeTokens } from '@/lib/spotifyTokens';

function fail(status: number, message: string) {
  console.error(`spotify/callback: ${message}`);
  return new Response(message, { status });
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const code = searchParams.get('code');
  const state = searchParams.get('state');

  if (searchParams.get('error')) return fail(400, `consent denied: ${searchParams.get('error')}`);
  if (!code || !state || state !== request.cookies.get('spotify_auth_state')?.value) {
    return fail(400, 'state mismatch — start again at /api/spotify/auth');
  }

  try {
    const tokens = await requestTokens({
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
    });

    const me = await fetch('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    if (!me.ok) return fail(502, `could not identify account (/v1/me ${me.status})`);
    const { id } = (await me.json()) as { id: string };
    if (id !== OWNER_SPOTIFY_ID) return fail(403, `account ${id} is not the site owner`);

    await storeTokens(tokens);
  } catch (err) {
    return fail(502, err instanceof Error ? err.message : String(err));
  }

  const res = new Response('Spotify re-authorized — now playing is live again.', {
    headers: { 'Cache-Control': 'no-store' },
  });
  res.headers.append(
    'Set-Cookie',
    'spotify_auth_state=; Path=/api/spotify; Max-Age=0; HttpOnly; Secure; SameSite=Lax'
  );
  return res;
}
