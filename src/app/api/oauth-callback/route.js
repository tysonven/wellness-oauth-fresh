'use server'

import { NextResponse } from 'next/server';

export async function GET(req) {
  console.log('🚀 OAuth callback route hit');
  
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  console.log('🔍 OAuth callback - received code:', code);

  if (!code) {
    console.log('❌ No code received, redirecting to error');
    return NextResponse.redirect('https://wellness-oauth-fresh.vercel.app/error.html');
  }

  console.log('✅ Code received, redirecting to success');
  return NextResponse.redirect('https://wellness-oauth-fresh.vercel.app/connected.html');
}

