// src/app/api/spotify/callback/route.ts
import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const redirectUri = process.env.SPOTIFY_REDIRECT_URI!;

  try {
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
        grant_type: 'authorization_code',
        code: code!,
        redirect_uri: redirectUri,
      }),
    });

    const { access_token, refresh_token, expires_in } = await response.json();
    
    // Set secure HTTP-only cookie
    const res = NextResponse.redirect(`${process.env.NEXTAUTH_URL}/`);
    res.cookies.set('spotify_refresh', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365, // 1 year
      path: '/',
      sameSite: 'lax'
    });

    return res;

  } catch (error) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/?error=authentication_failed`
    );
  }
}
