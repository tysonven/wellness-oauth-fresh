import fetch from 'node-fetch';
import dotenv from 'dotenv';
dotenv.config();

import { getAccessToken } from './lib/tokenManager.js';

const FLOW_OS_API_URL = 'https://rest.gohighlevel.com/v1/contacts/';
const LOCATION_ID = 'SoB562riPllSzjerO6XW';

const sampleMember = {
  firstName: 'Jane',
  lastName: 'Doe',
  email: 'janedoe@example.com',
  phone: '+1234567890',
  name: 'Jane Doe',
  birthday: '1990-01-01',
  customField: {
    wl_membership_status: 'Active',
    wl_classes_remaining: 5,
  },
};

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

async function syncMemberToFlowOS(member, retries = 3) {
  await delay(1500); // baseline throttling

  const accessToken = await getAccessToken(LOCATION_ID);
  if (!accessToken) {
    console.error(`❌ No token found for user_id ${LOCATION_ID}`);
    return;
  }

  console.log(`🔑 Using access token for ${LOCATION_ID}:`, accessToken);

  try {
    const response = await fetch(FLOW_OS_API_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        firstName: member.firstName,
        lastName: member.lastName,
        email: member.email,
        phone: member.phone,
        name: member.name,
        birthday: member.birthday,
        customField: member.customField,
      }),
    });

    const contentType = response.headers.get('content-type');
    let responseData;

    if (contentType && contentType.includes('application/json')) {
      responseData = await response.json();
    } else {
      const text = await response.text();
      throw new Error(`Non-JSON response: ${text}`);
    }

    if (!response.ok) {
      throw new Error(
        `API error: ${response.status} - ${JSON.stringify(responseData)}`
      );
    }

    console.log(`✅ Synced ${member.name}`);
  } catch (error) {
    if (error.message.includes('Too many requests') && retries > 0) {
      console.log(`⏳ Rate limited. Retrying in 10s... (${retries} left)`);
      await delay(10000);
      return syncMemberToFlowOS(member, retries - 1);
    }

    console.error(`🔥 Error syncing ${member.name}:`, error.message);
  }
}

console.log('🔁 Starting sync to Flow OS...');
syncMemberToFlowOS(sampleMember);
