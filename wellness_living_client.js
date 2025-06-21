// File: wellness_living_client.js
import axios from 'axios';
import { CookieJar } from 'tough-cookie';
import { wrapper } from 'axios-cookiejar-support';
import fs from 'fs';

export function createWellnessLivingClient() {
  const jar = new CookieJar();

  // Load cookies from JSON file
  const cookies = JSON.parse(fs.readFileSync('./cookies.json', 'utf8'));
  for (const cookie of cookies) {
    jar.setCookieSync(
      `${cookie.key}=${cookie.value}; Domain=${cookie.domain}; Path=${cookie.path}; ${cookie.secure ? 'Secure;' : ''} ${cookie.httpOnly ? 'HttpOnly;' : ''}`,
      `https://${cookie.domain}`
    );
  }

  const client = wrapper(axios.create({
    baseURL: 'https://uat-api.wellnessliving.io/v1',
    jar,
    withCredentials: true,
    headers: {
      'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/114.0.0.0 Safari/537.36',
      'Accept': 'application/json, text/plain, */*'
    }
  }));

  return {
    async getBusinessInfo(params) {
      try {
        const response = await client.get('/location/view', { params });
        console.log('[GET] /location/view', params);
        return response.data;
      } catch (err) {
        console.error('❌ Error fetching business info:', err.response?.data || err.message);
        throw err;
      }
    }
  };
}