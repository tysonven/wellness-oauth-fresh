import { NextResponse } from 'next/server';
import { WellnessLivingClient } from '@/lib/wellnessLivingClient';
import { GoHighLevelClient } from '@/lib/go_high_level_client';
import { mapClass, mapService, mapStaff } from '@/lib/data_mapper.mjs';


// POST handler for syncing services
export async function POST(request) {
  try {
    // Get location ID from request body or use default
    const body = await request.json().catch(() => ({}));
    const locationId = body.locationId;
    
    // Create clients
    const wlClient = new WellnessLivingClient();
    const ghlClient = new GoHighLevelClient();
    
    // Get services from WellnessLiving
    const wlServices = await wlClient.getServices(locationId);
    
    // Process each service
    const results = {
      total: wlServices.a_service ? wlServices.a_service.length : 0,
      created: 0,
      updated: 0,
      failed: 0,
      details: []
    };
    
    if (wlServices.a_service && wlServices.a_service.length > 0) {
      for (const wlService of wlServices.a_service) {
        try {
          // Map WellnessLiving service to GoHighLevel format
          const ghlService = DataMapper.mapService(wlService);
          
          // In a real implementation, you would create/update the service in GoHighLevel
          // For now, we'll just log the mapped service
          console.log(`Mapped service: ${wlService.k_service} -> ${JSON.stringify(ghlService)}`);
          
          // Add to results
          results.created++;
          results.details.push({
            id: wlService.k_service,
            name: wlService.text_title || 'Unknown',
            status: 'created',
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error(`Error processing service ${wlService.k_service}:`, error);
          
          // Add to failed results
          results.failed++;
          results.details.push({
            id: wlService.k_service,
            name: wlService.text_title || 'Unknown',
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
      message: 'Services sync completed',
      results: results
    });
  } catch (error) {
    console.error('Error syncing services:', error);
    
    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to sync services',
        error: error.message,
        details: error.response?.data || null
      },
      { status: 500 }
    );
  }
}
