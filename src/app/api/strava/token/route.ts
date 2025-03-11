import { NextResponse } from 'next/server';
import axios from 'axios';
import { getRefreshToken, setAccessToken, setRefreshToken } from '@/app/api/strava/cache';

export async function GET() {
  try {
    // Retrieve the current refresh token from cache
    const currentRefreshToken = getRefreshToken();
    if (!currentRefreshToken) {
      throw new Error('Refresh token is missing');
    }

    if (!process.env.STRAVA_CLIENT_ID || !process.env.STRAVA_CLIENT_SECRET) {
      throw new Error('Missing client ID or secret');
    }

    // Make a request to refresh the access token
    const params = new URLSearchParams({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: currentRefreshToken,
      grant_type: 'refresh_token',
    });

    const response = await axios.post('https://www.strava.com/oauth/token', params);

    if (response.status !== 200) {
      throw new Error(`Failed to refresh token: ${response.status} ${response.statusText}`);
    }

    const data = response.data;

    // Update cache with the new tokens
    setAccessToken(data.access_token);
    setRefreshToken(data.refresh_token);

    return NextResponse.json({ access_token: data.access_token });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error in /api/strava/token:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      console.error('Unknown error occurred:', error);
      return NextResponse.json({ error: 'Unknown error occurred' }, { status: 500 });
    }
  }
}
