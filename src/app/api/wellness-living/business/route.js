import { NextResponse } from 'next/server';
import { WellnessLivingClient } from '@/lib/wellnessLivingClient';

// GET handler for business information
export async function GET() {
  try {
    // Create WellnessLiving client
    const wlClient = new WellnessLivingClient();
    
    // Get business information
    const businessInfo = await wlClient.getBusinessInfo();
    
    // Return success response
    return NextResponse.json({
      success: true,
      data: businessInfo
    });
  } catch (error) {
    console.error('Error fetching business information:', error);
    
    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch business information',
        error: error.message,
        details: error.response?.data || null
      },
      { status: 500 }
    );
  }
}
