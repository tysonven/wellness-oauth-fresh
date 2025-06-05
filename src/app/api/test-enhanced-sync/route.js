/**
 * Test API route for the enhanced placeholder sync framework
 * This route allows testing different sync operations with the enhanced framework
 */

// Import the enhanced placeholder sync framework
import { 
    processNewClientSignup, 
    processMembershipChange, 
    processClassAttendance, 
    syncStaffData, 
    syncBusinessInfo, 
    exploreClientDataEndpoints, 
    runFullSync 
  } from "../../../lib/enhanced_placeholder_sync_framework";
  
  const { 
    PaginationHandler, 
    RateLimiter, 
    BatchProcessor, 
    QueryCache 
  } = require('@/lib/performance_optimization');
  
  /**
   * GET handler for the test API route
   * Supports different test types via the 'action' query parameter:
   * - new-client: Test new client signup
   * - membership: Test membership change
   * - attendance: Test class attendance
   * - staff: Test staff sync
   * - business: Test business info sync
   * - explore: Test endpoint exploration
   * - full: Test full sync (default)
   */
  export async function GET(request) {
    console.log('Test Enhanced Placeholder Sync API route hit');
    
    // Get the URL from the request
    const url = new URL(request.url);
    
    // Get the action parameter (default to 'full')
    const action = url.searchParams.get('action') || 'full';
    
    let result;
    
    try {
      console.log(`Running test with action: ${action}`);
      
      // Run the appropriate test based on the action parameter
      switch (action) {
        case 'new-client':
          result = await processNewClientSignup();
          break;
        case 'membership':
          result = await processMembershipChange();
          break;
        case 'attendance':
          result = await processClassAttendance();
          break;
        case 'staff':
          result = await syncStaffData();
          break;
        case 'business':
          result = await syncBusinessInfo();
          break;
        case 'explore':
          result = await exploreClientDataEndpoints();
          break;
        case 'full':
        default:
          result = await runFullSync();
          break;
      }
      
      // Return the result as JSON
      return new Response(JSON.stringify({
        success: true,
        action,
        result
      }), {
        status: 200,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error(`Error running test with action ${action}:`, error);
      
      // Return the error as JSON
      return new Response(JSON.stringify({
        success: false,
        action,
        error: {
          message: error.message,
          name: error.name,
          stack: error.stack
        }
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json'
        }
      });
    }
  }
  