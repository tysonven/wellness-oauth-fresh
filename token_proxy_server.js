// token_proxy_server.js
import express from 'express';
import axios from 'axios';
import qs from 'qs';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const PORT = process.env.TOKEN_PROXY_PORT || 3000;

const clientId = process.env.WL_PROXY_UAT_CLIENT_ID;
const clientSecret = process.env.WL_PROXY_UAT_CLIENT_SECRET;
const tokenUrl = 'https://access.uat-api.wellnessliving.io/oauth2/token';

let cachedToken = null;
let tokenExpiry = 0;

async function fetchTokenWithAxios() {
  const data = qs.stringify({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret
  });

  const response = await axios.post(tokenUrl, data, {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  });

  const { access_token, expires_in } = response.data;
  cachedToken = access_token;
  tokenExpiry = Date.now() + expires_in * 1000 - 10000; // Renew 10s early

  return response.data;
}

app.get('/token', async (req, res) => {
  try {
    if (cachedToken && Date.now() < tokenExpiry) {
      return res.json({ access_token: cachedToken, source: 'cache' });
    }

    const tokenData = await fetchTokenWithAxios();
    res.json({ access_token: tokenData.access_token, source: 'axios' });
  } catch (err) {
    console.error('❌ Error fetching token:', err.message);
    res.status(500).json({ error: 'Failed to retrieve token' });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Token proxy server running at http://localhost:${PORT}/token`);
});
