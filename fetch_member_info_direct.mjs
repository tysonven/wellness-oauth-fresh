// fetch_member_info_direct.mjs
import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = process.env.WL_PROXY_UAT_BASE_URL || 'https://uat-api.wellnessliving.io/v1';
const ENDPOINT = `/member/info?id_region=1&k_business=${process.env.WL_BUSINESS_ID}`;

async function fetchMemberInfo() {
  try {
    const response = await fetch(`${BASE_URL}${ENDPOINT}`, {
      method: 'GET',
      headers: {
        'x-firewall-rule': process.env.WL_CLOUDFLARE_HEADER_VALUE,
        'Authorization': `Bearer ${process.env.WL_AUTHORIZATION_CODE}`,
        'Content-Type': 'application/json'
      }
    });

    const contentType = response.headers.get('content-type');
    if (!contentType || !contentType.includes('application/json')) {
      const text = await response.text();
      console.error('⚠️ Non-JSON response received. Likely Cloudflare block or HTML error page.');
      console.log(text);
      return;
    }

    const data = await response.json();
    console.log('✅ Member info:', data);
  } catch (err) {
    console.error('🔥 API call failed:', err);
  }
}

fetchMemberInfo();
