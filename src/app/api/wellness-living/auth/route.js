import { NextResponse } from 'next/server';
import { WellnessLivingClient } from '@/lib/wellnessLivingClient';

// GET handler for authentication testing
export async function GET() {
  try {
    // Create WellnessLiving client
    const wlClient = new WellnessLivingClient();
    
    // Test authentication by getting a token
    const token = await wlClient.getAccessToken();
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Successfully authenticated with WellnessLiving API',
      tokenExpiry: wlClient.tokenExpiry,
      expiresIn: Math.floor((wlClient.tokenExpiry - Date.now()) / 1000)
    });
  } catch (error) {
    console.error('Authentication error:', error);
    
    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to authenticate with WellnessLiving API',
        error: error.message,
        details: error.response?.data || null
      },
      { status: 500 }
    );
  }
}
