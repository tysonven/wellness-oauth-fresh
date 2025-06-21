// fetch_all_clients.mjs

import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'https://uat-api.wellnessliving.io/v1';
const BUSINESS_ID = process.env.WL_BUSINESS_ID;

async function fetchAllClients() {
  try {
    console.log('\n🔍 Fetching all clients...');

    const url = `${BASE_URL}/client/index?k_business=${BUSINESS_ID}`;

    console.log(`🌐 Requesting URL: ${url}`);

    const res = await fetch(url, {
      method: 'GET',
      headers: {
        'x-firewall-rule': process.env.WL_CLOUDFLARE_HEADER_VALUE,
        'Authorization': `Bearer ${process.env.WL_ACCESS_TOKEN}`,
        'Content-Type': 'application/json'
      }
    });

    const json = await res.json();

    console.log('\n🧾 Full API Response:\n', JSON.stringify(json, null, 2));

    if (!Array.isArray(json.a_client) || json.a_client.length === 0) {
      console.log('❌ No clients found.');
      return;
    }

    console.log(`✅ Retrieved ${json.a_client.length} clients.`);
    console.log('\n📋 Client emails:');
    json.a_client.forEach((client, i) => {
      console.log(`${i + 1}. ${client.text_email} (${client.k_client})`);
    });
  } catch (err) {
    console.error('🔥 Error fetching clients:', err);
  }
}

fetchAllClients();
