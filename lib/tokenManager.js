// lib/tokenManager.js
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function saveTokens({ user_id, access_token, refresh_token, expires_at }) {
  const { error } = await supabase.from('tokens').upsert([
    {
      user_id,
      access_token,
      refresh_token,
      expires_at,
      created_at: new Date().toISOString(),
    },
  ], {
    onConflict: 'user_id',
  });

  if (error) {
    console.error(`❌ Error saving tokens for ${user_id}:`, error);
    throw error;
  } else {
    console.log(`✅ Tokens saved for ${user_id}`);
  }
}

export async function getAccessToken(user_id) {
  const { data, error } = await supabase
    .from('tokens')
    .select('access_token')
    .eq('user_id', user_id)
    .single();

  if (error || !data) {
    console.error(`❌ No token found for user_id ${user_id}`, error);
    throw error || new Error('Token not found');
  }

  console.log(`🔑 Using access token for ${user_id}: ${data.access_token}`);
  return data.access_token;
}
