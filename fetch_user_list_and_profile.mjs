// fetch_user_list_and_profile.mjs

import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

const BASE_URL = 'https://uat-api.wellnessliving.io/v1';
const BUSINESS_ID = process.env.WL_BUSINESS_ID;
const REGION_ID = 1;
const EMAIL_TO_LOOKUP = 'test@test.com'; // Update as needed

const HEADERS = {
  'x-firewall-rule': process.env.WL_CLOUDFLARE_HEADER_VALUE,
  'Authorization': `Bearer ${process.env.WL_ACCESS_TOKEN}`,
  'Content-Type': 'application/json'
};

async function fetchUserList() {
  try {
    console.log('\n🔍 Fetching user list...');
    const res = await fetch(`${BASE_URL}/user/list?id_region=${REGION_ID}&k_business=${BUSINESS_ID}`, {
      method: 'GET',
      headers: HEADERS
    });

    const json = await res.json();
    const users = json.a_user || [];

    console.log(`✅ Retrieved ${users.length} users.`);

    const matchedUser = users.find(user => user.email === EMAIL_TO_LOOKUP);
    if (!matchedUser) {
      console.error(`❌ No user found with email ${EMAIL_TO_LOOKUP}`);
      return;
    }

    console.log(`🔍 Matched user:`, matchedUser);
    await fetchUserProfile(matchedUser.uid);

  } catch (err) {
    console.error('🔥 Error fetching user list:', err);
  }
}

async function fetchUserProfile(uid) {
  try {
    console.log(`\n📥 Fetching full profile for UID ${uid}...`);
    const res = await fetch(`${BASE_URL}/user?id_region=${REGION_ID}&k_business=${BUSINESS_ID}&uid=${uid}`, {
      method: 'GET',
      headers: HEADERS
    });

    const data = await res.json();
    console.log('✅ Full user profile:', data);

  } catch (err) {
    console.error('🔥 Error fetching user profile:', err);
  }
}

fetchUserList();
