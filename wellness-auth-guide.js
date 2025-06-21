// wellness-auth-guide.cjs

const axios = require('axios');
const qs = require('qs');
require('dotenv').config();

const clientId = process.env.WL_CLIENT_ID;
const clientSecret = process.env.WL_CLIENT_SECRET;
const redirectUri = process.env.WL_REDIRECT_URI;
const authCode = process.env.WL_AUTH_CODE; // Temporary manual step (from browser redirect)

async function getAccessToken() {
  const tokenUrl = 'https://access.uat-api.wellnessliving.com/oauth2/token';
  const data = qs.stringify({
    grant_type: 'authorization_code',
    code: authCode,
    redirect_uri: redirectUri,
    client_id: clientId,
    client_secret: clientSecret,
  });

  try {
    const response = await axios.post(tokenUrl, data, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
        Accept: 'application/json',
      },
    });

    console.log('✅ Access token:', response.data);
    return response.data.access_token;
  } catch (error) {
    console.error('❌ Failed to fetch token:', error.response ? error.response.data : error.message);
  }
}

(async () => {
  const token = await getAccessToken();
  if (!token) return;

  try {
    const response = await axios.get('https://access.uat-api.wellnessliving.com/business-info', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log('✅ Business Info:', response.data);
  } catch (error) {
    console.error('❌ Failed to fetch business info:', error.response ? error.response.data : error.message);
  }
})();
