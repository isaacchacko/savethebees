import { NextResponse } from 'next/server';
import { getAccessToken, getRefreshToken } from '@/app/api/strava/cache';

export async function GET() {
  try {
    const accessToken = getAccessToken();
    const refreshToken = getRefreshToken();

    if (!accessToken && !refreshToken) {
      console.log('No tokens found in cache');
      return NextResponse.json({ error: 'No tokens found in cache' }, { status: 404 });
    }

    if (!accessToken) {
      console.log('Access token missing');
      return NextResponse.json({ error: 'Access token is missing' }, { status: 404 });
    }

    if (!refreshToken) {
      console.log('Refresh token missing');
      return NextResponse.json({ error: 'Refresh token is missing' }, { status: 404 });
    }

    console.log('Tokens retrieved successfully:', { accessToken, refreshToken });
    return NextResponse.json({ accessToken, refreshToken });
  } catch (error) {
    console.error('Error fetching tokens:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
