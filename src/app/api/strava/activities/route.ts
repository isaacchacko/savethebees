import { NextResponse } from 'next/server';
import Redis from 'ioredis';

const redis = new Redis({
  host: process.env.REDIS_HOSTNAME,
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
});

const STRAVA_API_URL = 'https://www.strava.com/api/v3/athlete/activities';

export async function GET(request: Request) {
  const lockKey = 'strava_token_lock';
  const lockTTL = 10; // Lock expires after 10 seconds

  try {
    // Acquire lock to prevent concurrent token refresh
    const lockAcquired = await redis.set(lockKey, Date.now().toString(), 'NX', 'EX', lockTTL);
    if (!lockAcquired) {
      return NextResponse.json({ message: 'Token refresh in progress. Please try again later.' }, { status: 429 });
    }

    // Check if cached activities are not expired
    const expirationDate = await redis.get('cached_activities_expiration_date');
    const currentTime = new Date();
    if (expirationDate && new Date(expirationDate) > currentTime) {
      // Return cached activities if not expired
      const cachedActivities = await redis.get('cached_activities');
      if (cachedActivities) {
        await redis.del(lockKey); // Release lock
        return NextResponse.json(JSON.parse(cachedActivities), { status: 200 });
      }
    }

    // Check the expiration timestamp for tokens
    const tokenExpirationTimestamp = await redis.get('strava_token_expiration');
    let accessToken = await redis.get('strava_access_token');

    if (!tokenExpirationTimestamp || new Date(tokenExpirationTimestamp) <= currentTime) {
      // Refresh tokens
      const refreshToken = await redis.get('strava_refresh_token');
      if (!refreshToken) {
        throw new Error('Refresh token not found.');
      }

      const tokenResponse = await fetch('https://www.strava.com/api/v3/oauth/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: process.env.STRAVA_CLIENT_ID!,
          client_secret: process.env.STRAVA_CLIENT_SECRET!,
          grant_type: 'refresh_token',
          refresh_token: refreshToken,
        }),
      });

      if (!tokenResponse.ok) {
        throw new Error(`Failed to refresh tokens: ${tokenResponse.statusText}`);
      }

      const { access_token, refresh_token: newRefreshToken, expires_in } = await tokenResponse.json();

      // Update Redis with new tokens and expiration time
      await redis.set('strava_access_token', access_token);
      await redis.set('strava_refresh_token', newRefreshToken);
      const newTokenExpirationTime = new Date(currentTime.getTime() + expires_in * 1000).toISOString();
      await redis.set('strava_token_expiration', newTokenExpirationTime);

      accessToken = access_token; // Use the refreshed access token
    }

    // Fetch activities from Strava API
    const startOfYear = Math.floor(new Date(currentTime.getFullYear(), 0, 1).getTime() / 1000); // Start of current year (Unix timestamp)
    const activitiesResponse = await fetch(STRAVA_API_URL, {
      headers: { Authorization: `Bearer ${accessToken}` },
      method: 'GET',
    });

    if (!activitiesResponse.ok) {
      throw new Error(`Failed to fetch activities: ${activitiesResponse.statusText}`);
    }

    const activitiesData = await activitiesResponse.json();

    // Filter activities for the current year
    const filteredActivities = activitiesData.filter((activity: any) => {
      const activityDate = new Date(activity.start_date);
      return activityDate.getFullYear() === currentTime.getFullYear();
    });

    // Cache activities with expiration
    const cacheExpirationTime = new Date(currentTime.getTime() + 15 * 60 * 1000).toISOString(); // Expire in 15 minutes
    await redis.set('cached_activities', JSON.stringify(filteredActivities));
    await redis.set('cached_activities_expiration_date', cacheExpirationTime);

    // Release the lock
    await redis.del(lockKey);

    return NextResponse.json(filteredActivities, { status: 200 });
  } catch (error) {
    console.error('Error in activities endpoint:', error);
    return NextResponse.json({ message: error.message }, { status: 500 });
  }
}
