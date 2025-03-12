import { NextResponse } from 'next/server';
import Redis from 'ioredis';
import { createLock } from '@microfleet/ioredis-lock';

const redis = new Redis({
  host: process.env.REDIS_HOSTNAME,
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
});

const STRAVA_API_URL = 'https://www.strava.com/api/v3/athlete/activities';

// Toggle to use cached activities or fetch from Strava API every time
const USE_CACHED_ACTIVITIES = true; // Set to false to always fetch from Strava API

export async function GET(request: Request) {
  const lockKey = 'strava_token_lock';
  const lockOptions = {
    timeout: 10000, // Lock timeout in milliseconds
    retries: 3, // Number of retries if lock acquisition fails
    delay: 100, // Delay between retries in milliseconds
  };

  const lock = createLock(redis, lockOptions);

  try {
    console.log('Attempting to acquire lock...');
    await lock.acquire(lockKey);

    console.log('Lock acquired successfully.');

    // Check if cached activities are not expired
    if (USE_CACHED_ACTIVITIES) {
      const expirationDate = await redis.get('cached_activities_expiration_date');
      const currentTime = new Date();
      if (expirationDate && new Date(expirationDate) > currentTime) {
        console.log('Cached activities are valid. Returning cached data...');
        const cachedActivities = await redis.get('cached_activities');
        if (cachedActivities) {
          await lock.release(); // Corrected: No arguments passed to release()
          return NextResponse.json(JSON.parse(cachedActivities), { status: 200 });
        }
      }
    }

    console.log('Cached activities are expired or caching is disabled. Proceeding with API call...');

    // Fetch access token and refresh token
    let accessToken = await redis.get('strava_access_token');
    const refreshToken = await redis.get('strava_refresh_token');

    // Ensure refreshToken is not null
    if (!refreshToken) {
      throw new Error('Refresh token not found in Redis.');
    }

    // Attempt to fetch activities
    let activitiesData;
    let retry = true;
    while (retry) {
      try {
        console.log('Fetching activities from Strava API...');
        const activitiesResponse = await fetch(STRAVA_API_URL, {
          headers: { Authorization: `Bearer ${accessToken}` },
          method: 'GET',
        });

        if (!activitiesResponse.ok) {
          throw new Error(`Failed to fetch activities: ${activitiesResponse.statusText}`);
        }

        activitiesData = await activitiesResponse.json();
        retry = false; // Successful fetch, exit loop
      } catch (error) {
        console.error('Error fetching activities:', error);
        console.log('Refreshing access token...');
        await refreshAccessToken(redis, refreshToken); // Safe because refreshToken is guaranteed to be a string
        accessToken = await redis.get('strava_access_token');
      }
    }

    console.log('Filtering activities for the current year...');
    // Filter activities for the current year
    const filteredActivities = activitiesData.filter((activity: any) => {
      const activityDate = new Date(activity.start_date);
      return activityDate.getFullYear() === new Date().getFullYear();
    });

    // Cache activities with expiration if using cached activities
    if (USE_CACHED_ACTIVITIES) {
      const cacheExpirationTime = new Date(new Date().getTime() + 15 * 60 * 1000).toISOString(); // Expire in 15 minutes
      await redis.set('cached_activities', JSON.stringify(filteredActivities));
      await redis.set('cached_activities_expiration_date', cacheExpirationTime);
      console.log('Cached filtered activities.');
    }

    console.log('Releasing lock...');
    await lock.release(); // Corrected: No arguments passed to release()

    return NextResponse.json(filteredActivities, { status: 200 });
  } catch (error) {
    console.error('Error in activities endpoint:', error);
    try {
      await lock.release(); // Ensure lock is released on error
    } catch (releaseError) {
      console.error('Error releasing lock:', releaseError);
      // Narrow the type of releaseError
      if (releaseError instanceof Error) {
        return NextResponse.json({ message: releaseError.message }, { status: 500 });
      } else {
        return NextResponse.json({ message: 'An unknown error occurred.' }, { status: 500 });
      }
    }

    // Narrow the type of error
    if (error instanceof Error) {
      if (error.message.includes('500')) { // Check if error is related to a 500 status
        let retryCount = 0;
        const maxRetries = 3;
        const retryDelay = 3000; // 3 seconds

        const retryFetch = async () => {
          try {
            // Attempt to fetch activities again
            const activitiesResponse = await fetch(STRAVA_API_URL, {
              headers: { Authorization: `Bearer ${await redis.get('strava_access_token')}` },
              method: 'GET',
            });

            if (!activitiesResponse.ok) {
              throw new Error(`Failed to fetch activities: ${activitiesResponse.statusText}`);
            }

            const activitiesData = await activitiesResponse.json();

            // Filter activities for the current year
            const filteredActivities = activitiesData.filter((activity: any) => {
              const activityDate = new Date(activity.start_date);
              return activityDate.getFullYear() === new Date().getFullYear();
            });

            // Cache activities with expiration if using cached activities
            if (USE_CACHED_ACTIVITIES) {
              const cacheExpirationTime = new Date(new Date().getTime() + 15 * 60 * 1000).toISOString(); // Expire in 15 minutes
              await redis.set('cached_activities', JSON.stringify(filteredActivities));
              await redis.set('cached_activities_expiration_date', cacheExpirationTime);
              console.log('Cached filtered activities.');
            }

            return NextResponse.json(filteredActivities, { status: 200 });
          } catch (retryError) {
            retryCount++;
            if (retryCount < maxRetries) {
              console.log(`Retry ${retryCount + 1} of ${maxRetries} in ${retryDelay / 1000} seconds...`);
              await new Promise(resolve => setTimeout(resolve, retryDelay));
              return retryFetch(); // Recursive retry
            } else {
              console.error('All retries failed:', retryError);
              return NextResponse.json({ message: retryError.message }, { status: 500 });
            }
          }
        };

        return retryFetch();
      } else {
        return NextResponse.json({ message: error.message }, { status: 500 });
      }
    } else {
      return NextResponse.json({ message: 'An unknown error occurred.' }, { status: 500 });
    }
  }
}

// Helper function to refresh access token
async function refreshAccessToken(redis: Redis, refreshToken: string) {
  try {
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
    const newTokenExpirationTime = new Date(new Date().getTime() + expires_in * 1000).toISOString();
    await redis.set('strava_token_expiration', newTokenExpirationTime);
  } catch (error) {
    console.error('Error refreshing access token:', error);
    throw error;
  }
}
