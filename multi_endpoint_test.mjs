// multi_endpoint_test.mjs

import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const endpoints = [
  'https://uat-api.wellnessliving.io/v1/member/info?id_region=1&k_business=50312',
  'https://uat-api.wellnessliving.io/v1/user',
  'https://uat-api.wellnessliving.io/v1/visit/status',
  'https://uat-api.wellnessliving.io/v1/business/info?k_business=50312',
  'https://uat-api.wellnessliving.io/v1/class/list?k_business=50312'
];

async function testEndpoint(url) {
  try {
    console.log(`\n🔍 Testing: ${url}`);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'x-firewall-rule': process.env.WL_CLOUDFLARE_HEADER_VALUE,
        'Authorization': `Bearer ${process.env.WL_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const contentType = res.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await res.json();
      console.log('✅ JSON response:', data);
    } else {
      const text = await res.text();
      console.warn('⚠️ Non-JSON response:');
      console.log(text);
    }
  } catch (err) {
    console.error('🔥 Error:', err.message);
  }
}

(async () => {
  for (const url of endpoints) {
    await testEndpoint(url);
  }
})();
