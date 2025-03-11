import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const refreshToken = request.cookies.get('spotify_refresh')?.value;
    
    if (!refreshToken) {
      return NextResponse.json(
        { error: 'No refresh token available' }, 
        { status: 401 }
      );
    }

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

    const { access_token, expires_in, refresh_token: newRefreshToken } = await response.json();
    
    const res = NextResponse.json({
      access_token,
      expires_in
    });

    // Update refresh token if rotated
    if (newRefreshToken) {
      res.cookies.set('spotify_refresh', newRefreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 365,
        path: '/',
        sameSite: 'lax'
      });
    }

    res.cookies.set('spotify_expiry', 
      String(Date.now() + expires_in * 1000), {
        path: '/',
        sameSite: 'lax'
      }
    );

    return res;

  } catch (error) {
    console.error('Token refresh failed:', error);
    return NextResponse.json(
      { error: 'Failed to refresh token' },
      { status: 500 }
    );
  }
}
