import Redis from 'ioredis';

export const redis = new Redis({
  host: process.env.REDIS_HOSTNAME,
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASSWORD,
});

// The only Spotify account allowed to (re)authorize the site, so a stranger
// finishing the OAuth flow cannot swap their own playback onto the page.
export const OWNER_SPOTIFY_ID = 'isaacchacko';

export const SCOPES = 'user-read-currently-playing user-read-playback-state';

export function clientAuthHeader() {
  const credentials = `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`;
  return `Basic ${Buffer.from(credentials).toString('base64')}`;
}

/**
 * Posts to the token endpoint. Spotify answers every failure with 400, so the
 * status alone cannot tell invalid_grant (dead refresh token — since mid-2026
 * they expire six months after consent, refreshing does not extend them) from
 * invalid_client (bad id/secret). The body is the only thing that does.
 */
export async function requestTokens(params: Record<string, string>) {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Authorization: clientAuthHeader(),
    },
    body: new URLSearchParams(params),
  });

  if (!response.ok) {
    const body = await response.text();
    let code = 'unknown';
    try {
      code = JSON.parse(body).error || code;
    } catch {
      // non-JSON body, so the raw text below is all there is to go on
    }
    throw new Error(`token request rejected (${response.status} ${code}): ${body}`);
  }

  return (await response.json()) as {
    access_token: string;
    expires_in: number;
    refresh_token?: string;
  };
}

export async function storeTokens(tokens: {
  access_token: string;
  expires_in: number;
  refresh_token?: string;
}) {
  await redis.set('spotify_access_token', tokens.access_token);
  await redis.set('spotify_expiry', String(Date.now() + tokens.expires_in * 1000));
  // Spotify may hand back a rotated refresh token; dropping it would
  // invalidate the stored one and break every later refresh.
  if (tokens.refresh_token) {
    await redis.set('spotify_refresh_token', tokens.refresh_token);
  }
}
