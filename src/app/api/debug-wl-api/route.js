// src/app/api/debug-wl-api/route.js
import * as apiDebugLogger from "../../../lib/api_debug_logger";

// This would normally be imported from a local file
// For the actual implementation, copy the api_debug_logger.js content to src/lib/
// and update this import path
import * as apiDebugLogger from "../../../lib/api_debug_logger";

  const { 
    PaginationHandler, 
    RateLimiter, 
    BatchProcessor, 
    QueryCache 
} = require('@/lib/performance_optimization');


export async function GET(request) {
  console.log("API Debug route hit - collecting detailed request/response information");
  
  try {
    // Test all endpoints and collect debug information
    const debugResults = await apiDebugLogger.testEndpointsWithDebugInfo();
    
    // Format the debug information for support
    const formattedDebugInfo = apiDebugLogger.formatDebugInfoForSupport(debugResults);
    
    // Return both raw and formatted results
    return NextResponse.json({
      success: true,
      message: "API debug information collected successfully",
      formattedDebugInfo: formattedDebugInfo,
      rawResults: debugResults
    });
  } catch (error) {
    console.error("Error collecting API debug information:", error);
    
    return NextResponse.json(
      {
        success: false,
        message: `Error collecting API debug information: ${error.message}`,
        stack: error.stack
      },
      { status: 500 }
    );
  }
}
