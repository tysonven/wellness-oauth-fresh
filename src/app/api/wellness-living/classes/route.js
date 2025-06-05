import { NextResponse } from 'next/server';
import { WellnessLivingClient } from '@/lib/wellnessLivingClient';

// GET handler for classes
export async function GET(request) {
  try {
    // Get location ID from query parameter or use default
    const { searchParams } = new URL(request.url);
    const locationId = searchParams.get('locationId');
    
    // Create WellnessLiving client
    const wlClient = new WellnessLivingClient();
    
    // Get classes for the location
    const classes = await wlClient.getClasses(locationId);
    
    // Return success response
    return NextResponse.json({
      success: true,
      data: classes
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    
    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch classes',
        error: error.message,
        details: error.response?.data || null
      },
      { status: 500 }
    );
  }
}
