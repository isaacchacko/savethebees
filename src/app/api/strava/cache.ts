import NodeCache from 'node-cache';

let cache;
if (!global.cache) {
  global.cache = new NodeCache({ stdTTL: 21600 }); // Cache expires in 6 hours
}
cache = global.cache;

export function setAccessToken(token) {
  console.log('Saving access token...');
  cache.set('stravaAccessToken', token);
}

export function setRefreshToken(token) {
  console.log('Saving refresh token...');
  cache.set('stravaRefreshToken', token);
}

export function getAccessToken() {
  console.log('Retrieving access token...');
  return cache.get('stravaAccessToken');
}

export function getRefreshToken() {
  console.log('Retrieving refresh token...');
  return cache.get('stravaRefreshToken');
}
