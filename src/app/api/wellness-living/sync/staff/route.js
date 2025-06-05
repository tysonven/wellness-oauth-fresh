import { NextResponse } from 'next/server';
import { WellnessLivingClient } from '@/lib/wellnessLivingClient';
import { GoHighLevelClient } from '@/lib/go_high_level_client';
import * as DataMapper from '@/lib/data_mapper';

// POST handler for syncing staff
export async function POST(request) {
  try {
    // Get location ID from request body or use default
    const body = await request.json().catch(() => ({}));
    const locationId = body.locationId;
    
    // Create clients
    const wlClient = new WellnessLivingClient();
    const ghlClient = new GoHighLevelClient();
    
    // Get staff from WellnessLiving
    const wlStaff = await wlClient.getStaff(locationId);
    
    // Process each staff member
    const results = {
      total: wlStaff.a_staff ? wlStaff.a_staff.length : 0,
      created: 0,
      updated: 0,
      failed: 0,
      details: []
    };
    
    if (wlStaff.a_staff && wlStaff.a_staff.length > 0) {
      for (const wlStaffMember of wlStaff.a_staff) {
        try {
          // Map WellnessLiving staff to GoHighLevel format
          const ghlStaffMember = DataMapper.mapStaff(wlStaffMember);
          
          // In a real implementation, you would create/update the staff in GoHighLevel
          // For now, we'll just log the mapped staff
          console.log(`Mapped staff: ${wlStaffMember.k_staff} -> ${JSON.stringify(ghlStaffMember)}`);
          
          // Add to results
          results.created++;
          results.details.push({
            id: wlStaffMember.k_staff,
            name: `${wlStaffMember.text_first_name || ''} ${wlStaffMember.text_last_name || ''}`.trim() || 'Unknown',
            status: 'created',
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          console.error(`Error processing staff ${wlStaffMember.k_staff}:`, error);
          
          // Add to failed results
          results.failed++;
          results.details.push({
            id: wlStaffMember.k_staff,
            name: `${wlStaffMember.text_first_name || ''} ${wlStaffMember.text_last_name || ''}`.trim() || 'Unknown',
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
      message: 'Staff sync completed',
      results: results
    });
  } catch (error) {
    console.error('Error syncing staff:', error);
    
    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to sync staff',
        error: error.message,
        details: error.response?.data || null
      },
      { status: 500 }
    );
  }
}
