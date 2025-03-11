import { NextResponse } from 'next/server';
import axios from 'axios';
import { getAccessToken } from '@/app/api/strava/cache';

interface StravaActivity {
  type: string;
  // Add other properties as needed
}

export async function GET() {
  try {
    const accessToken = getAccessToken();

    if (!accessToken) {
      // If no cached token, redirect to fetch a new one
      return NextResponse.redirect('/api/strava/token');
    }

    const currentYear = new Date().getFullYear();
    const startOfYear = Math.floor(new Date(`${currentYear}-01-01`).getTime() / 1000); // UNIX timestamp

    const response = await axios.get(`https://www.strava.com/api/v3/activities?after=${startOfYear}`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status !== 200) {
      throw new Error(`Failed to fetch activities: ${response.status} ${response.statusText}`);
    }

    const data = response.data;

    // Filter only running activities
    const runs = data.filter((activity: StravaActivity) => activity.type === 'Run');

    return NextResponse.json(runs);
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error('Error in /api/strava/activities:', error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      console.error('Unknown error:', error);
      return NextResponse.json({ error: 'Unknown error occurred' }, { status: 500 });
    }
  }
}
