import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');

  const authHeader = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString('base64');

  try {
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${authHeader}`,
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code!,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
      }),
    });

    const data = await response.json();
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/?access_token=${data.access_token}`
    );
  } catch (error) {
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
