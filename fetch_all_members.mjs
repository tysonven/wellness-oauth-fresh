// fetch_all_members.mjs

import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'https://uat-api.wellnessliving.io/v1';
const BUSINESS_ID = process.env.WL_BUSINESS_ID;
const REGION_ID = 1;

async function fetchAllMembers() {
  try {
    console.log('\n🔍 Fetching all members...');

    const url = `${BASE_URL}/member/index?k_business=${BUSINESS_ID}&id_region=${REGION_ID}`;

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

    if (!Array.isArray(json.a_member) || json.a_member.length === 0) {
      console.log('❌ No members found.');
      return;
    }

    console.log(`✅ Retrieved ${json.a_member.length} members.`);
    console.log('\n📋 Member emails:');
    json.a_member.forEach((member, i) => {
      console.log(`${i + 1}. ${member.text_email} (${member.k_member})`);
    });
  } catch (err) {
    console.error('🔥 Error fetching members:', err);
  }
}

fetchAllMembers();
