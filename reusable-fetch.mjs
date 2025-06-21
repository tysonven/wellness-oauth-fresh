// reusable-fetch.mjs
import fetch from 'node-fetch';
import fs from 'fs';

const BASE_URL = 'https://uat-api.wellnessliving.io/v1';
const CACHE_PATH = './.cache.json';
const HEADERS = (token) => ({
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
});

export async function getAccessToken() {
  const cache = JSON.parse(fs.readFileSync(CACHE_PATH));
  return cache.access_token;
}

export async function fetchFromWL(endpoint, token, params = {}) {
  const url = new URL(BASE_URL + endpoint);
  Object.entries(params).forEach(([key, val]) => url.searchParams.append(key, val));
  const res = await fetch(url.href, { headers: HEADERS(token) });

  if (res.headers.get('content-type')?.includes('application/json')) {
    return res.json();
  }
  const text = await res.text();
  throw new Error(`Expected JSON but got: ${text}`);
}
