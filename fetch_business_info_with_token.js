import axios from 'axios';

// Replace these with your actual values
const CLIENT_ID = '53lgp30qbq509e1lt528q4impb';
const CLIENT_SECRET = 'h3e9t5543uoa241dikhi5rotaab85m08dk7oincmr9rgruqj2ao';

async function getAccessToken() {
  const tokenUrl = 'https://access.uat-api.wellnessliving.io/oauth2/token';
  const payload = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET
  });

  try {
    const response = await axios.post(tokenUrl, payload.toString(), {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });
    return response.data.access_token;
  } catch (error) {
    console.error('❌ Error fetching token:', error.response?.data || error.message);
    process.exit(1);
  }
}

async function callProtectedEndpoint(token) {
  const url = 'https://uat-api.wellnessliving.io/v1/location/view?id_region=1&k_business=50312&k_location=5000000296&i_logo_height=100&i_logo_width=220';

  try {
    const response = await axios.get(url, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    });
    console.log('✅ Response:', response.data);
  } catch (error) {
    console.error('❌ API Call Error:', error.response?.data || error.message);
  }
}

(async () => {
  const token = await getAccessToken();
  await callProtectedEndpoint(token);
})();
