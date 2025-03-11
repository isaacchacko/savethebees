import NodeCache from 'node-cache';

interface Cache {
  set(key: string, value: string): void;
  get(key: string): string | undefined;
}

declare global {
  let cache: Cache | undefined;
}

const cache = globalThis.cache || (globalThis.cache = new NodeCache({ stdTTL: 21600 })); // Cache expires in 6 hours

export function setAccessToken(token: string) {
  console.log('Saving access token...');
  cache.set('stravaAccessToken', token);
}

export function setRefreshToken(token: string) {
  console.log('Saving refresh token...');
  cache.set('stravaRefreshToken', token);
}

export function getAccessToken(): string | undefined {
  console.log('Retrieving access token...');
  return cache.get('stravaAccessToken');
}

export function getRefreshToken(): string | undefined {
  console.log('Retrieving refresh token...');
  return cache.get('stravaRefreshToken');
}
