// fetch_token_and_data.js
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const {
  CLIENT_ID,
  CLIENT_SECRET,
  WL_PROXY_UAT_TOKEN_URL,
  WL_PROXY_UAT_BASE_URL,
  WL_BUSINESS_ID
} = process.env;

async function getAccessToken() {
  const tokenRes = await fetch(WL_PROXY_UAT_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type: 'client_credentials',
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET
    })
  });

  const tokenData = await tokenRes.json();
  if (!tokenData.access_token) throw new Error(`Token fetch failed: ${JSON.stringify(tokenData)}`);
  return tokenData.access_token;
}

async function fetchBusinessInfo(token) {
  const url = `${WL_PROXY_UAT_BASE_URL}business/view?k_business=${WL_BUSINESS_ID}`;
  const res = await fetch(url, {
    method: 'GET',
    headers: { Authorization: `Bearer ${token}` }
  });
  const data = await res.json();
  console.log('✅ Business Info:', data);
}

(async () => {
  try {
    const token = await getAccessToken();
    console.log('✅ Access Token:', token);
    await fetchBusinessInfo(token);
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
})();
