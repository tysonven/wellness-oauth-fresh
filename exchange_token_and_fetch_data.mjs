import fetch from 'node-fetch';
import 'dotenv/config';

const AUTH_CODE = 'PASTE_YOUR_CODE_HERE'; // From your browser redirect

const TOKEN_URL = process.env.WL_PROXY_UAT_TOKEN_URL;
const CLIENT_ID = process.env.WL_PROXY_UAT_CLIENT_ID;
const CLIENT_SECRET = process.env.WL_PROXY_UAT_CLIENT_SECRET;
const REDIRECT_URI = 'https://oauth.pstmn.io/v1/callback';

async function fetchAccessToken() {
  const params = new URLSearchParams();
  params.append('grant_type', 'authorization_code');
  params.append('code', AUTH_CODE);
  params.append('redirect_uri', REDIRECT_URI);
  params.append('client_id', CLIENT_ID);
  params.append('client_secret', CLIENT_SECRET);

  const response = await fetch(TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params
  });

  const data = await response.json();
  if (data.access_token) {
    console.log('✅ Access Token:', data.access_token);
    return data.access_token;
  } else {
    console.error('❌ Failed to fetch token:', data);
    process.exit(1);
  }
}

async function fetchUserData(token) {
  const result = await fetch(`${process.env.WL_PROXY_UAT_BASE_URL}user/info`, {
    headers: {
      Authorization: `Bearer ${token}`
    }
  });
  const data = await result.json();
  console.log('👤 User Data:', data);
}

const main = async () => {
  const token = await fetchAccessToken();
  await fetchUserData(token);
};

main();
