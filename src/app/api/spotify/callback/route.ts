import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/?error=${encodeURIComponent(error)}`
    );
  }

  if (!code) {
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/?error=missing_code`
    );
  }

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
        code,
        redirect_uri: process.env.SPOTIFY_REDIRECT_URI!,
      }),
    });

    const { refresh_token, expires_in } = await response.json();
    
    const redirect = NextResponse.redirect(`${process.env.NEXTAUTH_URL}/`);
    
    // Set secure HTTP-only cookie
    redirect.cookies.set('spotify_refresh', refresh_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 60 * 60 * 24 * 365,
      path: '/',
      sameSite: 'lax'
    });

    // Client-accessible expiry
    redirect.cookies.set('spotify_expiry', 
      String(Date.now() + expires_in * 1000), {
        path: '/',
        sameSite: 'lax'
      }
    );

    return redirect;

  } catch (error) {
    console.error('Authentication failed:', error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/?error=authentication_failed`
    );
  }
}
