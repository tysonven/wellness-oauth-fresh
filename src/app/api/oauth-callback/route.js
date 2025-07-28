'use server'

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const REDIRECT_URI = process.env.REDIRECT_URI;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect('https://wellness-oauth-fresh.vercel.app/error.html');
  }

  try {
    console.log('🔍 OAuth callback - received code:', code);
    console.log('🔍 OAuth callback - using redirect_uri:', REDIRECT_URI);
    console.log('🔍 OAuth callback - using client_id:', CLIENT_ID ? '***' : 'MISSING');
    console.log('🔍 OAuth callback - using client_secret:', CLIENT_SECRET ? '***' : 'MISSING');

    const formData = new FormData();
    formData.append('grant_type', 'authorization_code');
    formData.append('code', code);
    formData.append('client_id', CLIENT_ID);
    formData.append('client_secret', CLIENT_SECRET);
    formData.append('redirect_uri', REDIRECT_URI);
      
    const response = await fetch('https://marketplace.gohighlevel.com/oauth/token', {
      method: 'POST',
      body: formData,
    });

    console.log('🔍 OAuth callback - response status:', response.status);
    
    if (!response.ok) {
      const errorBody = await response.text();
      console.error('🔴 OAuth callback - error response body:', errorBody);
      throw new Error(`Token exchange failed: ${response.status} - ${errorBody}`);
    }

    const tokenResponse = await response.json();

    const access_token = tokenResponse.access_token;
    const refresh_token = tokenResponse.refresh_token;
    const expires_in = tokenResponse.expires_in;
    const userId = tokenResponse.userId || tokenResponse.user_id;
    const locationId = tokenResponse.locationId || tokenResponse.location_id;

    // ✅ Store tokens in Supabase
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { error } = await supabase.from('tokens').upsert({
      user_id: userId,
      location_id: locationId,
      access_token,
      refresh_token,
      expires_at: Math.floor(Date.now() / 1000) + expires_in,
    });

    if (error) {
      console.error('🔴 Error storing token to Supabase:', error);
      return NextResponse.redirect('https://wellness-oauth-fresh.vercel.app/error.html');
    }

    console.log('✅ Token stored successfully for user:', userId);

    return NextResponse.redirect('https://wellness-oauth-fresh.vercel.app/connected.html');
  } catch (err) {
    console.error('🔴 OAuth callback error:', err);
    return NextResponse.redirect('https://wellness-oauth-fresh.vercel.app/error.html');
  }
}
