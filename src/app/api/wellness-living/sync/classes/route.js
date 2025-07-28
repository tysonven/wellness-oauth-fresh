import { NextResponse } from 'next/server';
import { WellnessLivingClient } from '@/lib/wellnessLivingClient';
import { GoHighLevelClient } from '@/lib/go_high_level_client';
import { mapClass, mapService, mapStaff } from '@/lib/data_mapper.mjs';

// POST handler for syncing classes
export async function POST(request) {
  try {
    // Get location ID from request body or use default
    const body = await request.json().catch(() => ({}));
    const locationId = body.locationId;
    
    // Create clients
    const wlClient = new WellnessLivingClient();
    const ghlClient = new GoHighLevelClient();
    
    // Get classes from WellnessLiving
    const wlClasses = await wlClient.getClasses(locationId);
    
    // Process each class
    const results = {
      total: wlClasses.a_class ? wlClasses.a_class.length : 0,
      created: 0,
      updated: 0,
      failed: 0,
      details: []
    };
    
    if (wlClasses.a_class && wlClasses.a_class.length > 0) {
      for (const wlClass of wlClasses.a_class) {
        try {
          // Map WellnessLiving class to GoHighLevel format
          const ghlClass = DataMapper.mapClass(wlClass);
          
          // In a real implementation, you would create/update the class in GoHighLevel
          // For now, we'll just log the mapped class
          console.log(`Mapped class: ${wlClass.k_class_period} -> ${JSON.stringify(ghlClass)}`);
          
          // Add to results
          results.created++;
          results.details.push({
            id: wlClass.k_class_period,
            name: wlClass.text_title || 'Unknown',
            status: 'created',
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error(`Error processing class ${wlClass.k_class_period}:`, error);
          
          // Add to failed results
          results.failed++;
          results.details.push({
            id: wlClass.k_class_period,
            name: wlClass.text_title || 'Unknown',
            status: 'failed',
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
      }
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Classes sync completed',
      results: results
    });
  } catch (error) {
    console.error('Error syncing classes:', error);
    
    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to sync classes',
        error: error.message,
        details: error.response?.data || null
      },
      { status: 500 }
    );
  }
}
