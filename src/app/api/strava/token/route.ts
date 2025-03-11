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

    // Make a request to refresh the access token
    const response = await axios.post('https://www.strava.com/oauth/token', new URLSearchParams({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      refresh_token: currentRefreshToken,
      grant_type: 'refresh_token',
    }));

    if (response.status !== 200) {
      throw new Error(`Failed to refresh token: ${response.status} ${response.statusText}`);
    }

    const data = response.data;

    // Example response structure:
    // {
    //   "token_type": "Bearer",
    //   "access_token": "a9b723...",
    //   "expires_at": 1568775134,
    //   "expires_in": 20566,
    //   "refresh_token": "b5c569..."
    // }

    // Update cache with the new tokens
    setAccessToken(data.access_token);
    setRefreshToken(data.refresh_token);

    return NextResponse.json({ access_token: data.access_token });
  } catch (error) {
    console.error('Error in /api/strava/token:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
