import { NextResponse } from 'next/server';

export async function GET() {
  const stravaAuthUrl = `https://www.strava.com/oauth/authorize?client_id=${process.env.STRAVA_CLIENT_ID}&response_type=code&redirect_uri=http://localhost:3000/api/strava/callback&scope=activity:read_all&force=true`;

  return NextResponse.redirect(stravaAuthUrl);
}
