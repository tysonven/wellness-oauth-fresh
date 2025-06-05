// src/app/api/test-wl-auth/route.js
import { NextResponse } from "next/server";
import { testMultipleEndpoints } from "../../../../multi_endpoint_test";

  const { 
    PaginationHandler, 
    RateLimiter, 
    BatchProcessor, 
    QueryCache 
} = require('@/lib/performance_optimization');

export async function GET(request) {
  console.log("Test WellnessLiving Auth API route hit - testing multiple endpoints");

  try {
    // Test multiple endpoints
    const results = await testMultipleEndpoints();
    
    // Count successful endpoints
    let successCount = 0;
    for (const result of Object.values(results)) {
      if (result.success) {
        successCount++;
      }
    }
    
    // Return results
    return NextResponse.json({ 
      success: successCount > 0, 
      message: `WellnessLiving API test completed: ${successCount} endpoints succeeded, ${Object.keys(results).length - successCount} failed`,
      results: results
    });
  } catch (error) {
    console.error("Error in test-wl-auth API route:", error);
    return NextResponse.json(
      { success: false, message: "An unexpected error occurred in the test route.", error: error.message },
      { status: 500 }
    );
  }
}
