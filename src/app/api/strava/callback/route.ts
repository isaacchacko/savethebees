import { NextResponse } from 'next/server';
import axios from 'axios';
import { setAccessToken, setRefreshToken } from '@/app/api/strava/cache';

export async function GET(request: NextRequest) {
  const url = new URL(request.url); // Parse incoming request URL
  const code = url.searchParams.get('code'); // Extract 'code' parameter

  if (!code) {
    return NextResponse.json({ error: 'Authorization code is missing' }, { status: 400 });
  }

  try {
    // Exchange authorization code for tokens
    const response = await axios.post('https://www.strava.com/oauth/token', new URLSearchParams({
      client_id: process.env.STRAVA_CLIENT_ID,
      client_secret: process.env.STRAVA_CLIENT_SECRET,
      code, // Use extracted authorization code
      grant_type: 'authorization_code',
      redirect_uri: 'http://localhost:3000/api/strava/callback', // Must match redirect URI used in auth
    }));

    if (response.status !== 200) {
      throw new Error(`Failed to exchange authorization code for tokens: ${response.status} ${response.statusText}`);
    }

    const data = response.data;

    // Save access and refresh tokens to cache
    setAccessToken(data.access_token);
    setRefreshToken(data.refresh_token);

    // Return success response
    return NextResponse.json({ message: 'Tokens saved successfully', access_token: data.access_token });
  } catch (error) {
    console.error('Error exchanging authorization code:', error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
