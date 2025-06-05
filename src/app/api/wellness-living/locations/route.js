import { NextResponse } from 'next/server';
import { WellnessLivingClient } from '@/lib/wellnessLivingClient';

// GET handler for locations
export async function GET() {
  try {
    // Create WellnessLiving client
    const wlClient = new WellnessLivingClient();
    
    // Get locations
    const locations = await wlClient.getLocations();
    
    // Return success response
    return NextResponse.json({
      success: true,
      data: locations
    });
  } catch (error) {
    console.error('Error fetching locations:', error);
    
    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch locations',
        error: error.message,
        details: error.response?.data || null
      },
      { status: 500 }
    );
  }
}
