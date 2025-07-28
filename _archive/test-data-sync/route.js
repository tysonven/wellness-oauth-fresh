// src/app/api/test-data-sync/route.js
import { NextResponse } from "next/server";
import { 
  syncStaffData, 
  syncBusinessInfo, 
  exploreClientDataEndpoints, 
  runFullSync 
} from "../../../lib/enhanced_data_sync_service";

  const { 
    PaginationHandler, 
    RateLimiter, 
    BatchProcessor, 
    QueryCache 
} = require('@/lib/performance_optimization');


/**
 * Test API route for data synchronization
 * This route allows testing different aspects of the data sync service
 */
export async function GET(request) {
  // Get the sync type from the query parameters
  const { searchParams } = new URL(request.url);
  const syncType = searchParams.get('type') || 'full';
  
  console.log(`[Test Data Sync API] Starting ${syncType} sync test...`);
  
  try {
    let result;
    
    // Run the appropriate sync function based on the type parameter
    switch (syncType) {
      case 'staff':
        console.log('[Test Data Sync API] Testing staff data synchronization...');
        result = await syncStaffData();
        break;
        
      case 'business':
        console.log('[Test Data Sync API] Testing business information synchronization...');
        result = await syncBusinessInfo();
        break;
        
      case 'explore':
        console.log('[Test Data Sync API] Testing endpoint exploration...');
        result = await exploreClientDataEndpoints();
        break;
        
      case 'full':
      default:
        console.log('[Test Data Sync API] Testing full data synchronization...');
        result = await runFullSync();
        break;
    }
    
    console.log(`[Test Data Sync API] ${syncType} sync test completed with result:`, result);
    
    // Return the result
    return NextResponse.json({
      success: result.success,
      message: result.message,
      syncType: syncType,
      timestamp: new Date().toISOString(),
      data: result
    });
  } catch (error) {
    console.error(`[Test Data Sync API] Error during ${syncType} sync test:`, error);
    
    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: `Error during ${syncType} sync test: ${error.message}`,
        syncType: syncType,
        timestamp: new Date().toISOString(),
        error: error.toJSON ? error.toJSON() : {
          message: error.message,
          stack: error.stack
        }
      },
      { status: 500 }
    );
  }
}
