'use server'

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const REDIRECT_URI = process.env.REDIRECT_URI;
const CLIENT_ID = process.env.CLIENT_ID;
const CLIENT_SECRET = process.env.CLIENT_SECRET;

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

export async function GET(req) {
  console.log('🚀 OAuth callback route hit at:', new Date().toISOString());
  
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  console.log('🔍 OAuth callback - received code:', code);
  
  if (!code) {
    console.log('❌ No code received, redirecting to error');
    return NextResponse.redirect('https://wellness-oauth-fresh.vercel.app/error.html');
  }

  try {
    console.log('�� Exchanging code for tokens...');
    console.log('📋 Request details:', {
      redirect_uri: REDIRECT_URI,
      client_id: CLIENT_ID,
      client_secret: CLIENT_SECRET ? '***' : 'MISSING'
    });

    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://rest.gohighlevel.com/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type: 'authorization_code',
        code: code,
        redirect_uri: REDIRECT_URI,
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }),
    });

    console.log('📡 Token response status:', tokenResponse.status);
    
    if (!tokenResponse.ok) {
      const errorBody = await tokenResponse.text();
      console.error('❌ Token exchange failed:', errorBody);
      return NextResponse.redirect('https://wellness-oauth-fresh.vercel.app/error.html');
    }

    const tokenData = await tokenResponse.json();
    console.log('✅ Token exchange successful, received tokens');

    // Save tokens to Supabase
    const { error: upsertError } = await supabase
      .from('tokens')
      .upsert([{
        user_id: 'default_user', // You might want to get this from the token response
        access_token: tokenData.access_token,
        refresh_token: tokenData.refresh_token,
        expires_at: new Date(Date.now() + tokenData.expires_in * 1000).toISOString(),
        created_at: new Date().toISOString(),
      }], {
        onConflict: 'user_id',
      });

    if (upsertError) {
      console.error('❌ Error saving tokens to Supabase:', upsertError);
      return NextResponse.redirect('https://wellness-oauth-fresh.vercel.app/error.html');
    }

    console.log('💾 Tokens saved to Supabase successfully');
    console.log('✅ OAuth flow completed successfully');
    
    return NextResponse.redirect('https://wellness-oauth-fresh.vercel.app/connected.html');
    
  } catch (error) {
    console.error('❌ Error in OAuth callback:', error);
    return NextResponse.redirect('https://wellness-oauth-fresh.vercel.app/error.html');
  }
}

