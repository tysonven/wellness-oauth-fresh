// multi_endpoint_test.js
// A test script to validate multiple WellnessLiving API endpoints with our authentication approach

import axios from "axios";

const { 
  PaginationHandler, 
  RateLimiter, 
  BatchProcessor, 
  QueryCache 
} = require('@/lib/performance_optimization');

// Staging credentials - to be set in .env.local or Vercel env vars
const WL_USERNAME = process.env.WL_USERNAME;
const WL_PASSWORD = process.env.WL_PASSWORD;
const WL_AUTHORIZATION_CODE = process.env.WL_AUTHORIZATION_CODE; // This is the "secret code" for signature
const WL_AUTHORIZATION_ID = process.env.WL_AUTHORIZATION_ID; // This is the "application ID"
const WL_BUSINESS_ID = process.env.WL_BUSINESS_ID; // Business ID for business-specific endpoints

const WL_API_BASE_URL = "https://staging.wellnessliving.com/api/"; // As per documentation

/**
 * Create Authorization header for WellnessLiving API requests
 */
function getAuthHeader() {
  if (!WL_AUTHORIZATION_ID || !WL_AUTHORIZATION_CODE) {
    throw new Error("WellnessLiving authorization credentials are not configured.");
  }
  
  // Using Basic Auth format as recommended by WellnessLiving team
  return `Basic ${Buffer.from(`${WL_AUTHORIZATION_ID}:${WL_AUTHORIZATION_CODE}`).toString('base64')}`;
}

/**
 * Make a GET request to the WellnessLiving API
 */
async function wellnessLivingApiGet(endpoint, params = {}) {
  try {
    const authHeader = getAuthHeader();
    
    console.log(`[WL API GET] Calling: ${WL_API_BASE_URL}${endpoint} with params:`, params);
    const response = await axios.get(`${WL_API_BASE_URL}${endpoint}`, {
      params: params,
      headers: {
        "Authorization": authHeader,
        "User-Agent": `ManusAI-Integration (Node.js)`,
        "Date": new Date().toUTCString(),
      }
    });
    
    return {
      success: true,
      status: response.status,
      data: response.data
    };
  } catch (error) {
    console.error(`[WL API GET Error] ${endpoint}:`, 
      error.response ? 
        { status: error.response.status, data: error.response.data } : 
        error.message
    );
    return {
      success: false,
      status: error.response?.status || 500,
      error: error.response?.data || error.message
    };
  }
}

/**
 * Test multiple WellnessLiving API endpoints
 */
async function testMultipleEndpoints() {
  console.log("=== TESTING MULTIPLE WELLNESSLIVING API ENDPOINTS ===");
  
  // Define endpoints to test
  const endpoints = [
    {
      name: "Business List",
      endpoint: "Wl/Business/BusinessList.json",
      params: {}
    },
    {
      name: "Business Account",
      endpoint: "Wl/Business/Account/BusinessAccountModel.json",
      params: { is_prospects: "false" }
    },
    {
      name: "Amazon Region",
      endpoint: "Wl/Business/AmazonRegion/AmazonRegionModel.json",
      params: {}
    },
    {
      name: "Business Information",
      endpoint: "Wl/Business/Information/BusinessInformationModel.json",
      params: { k_business: WL_BUSINESS_ID }
    },
    {
      name: "Staff List",
      endpoint: "Wl/Staff/StaffList.json",
      params: { k_business: WL_BUSINESS_ID }
    }
  ];
  
  // Test each endpoint
  const results = {};
  for (const endpoint of endpoints) {
    console.log(`\n--- Testing Endpoint: ${endpoint.name} ---`);
    const result = await wellnessLivingApiGet(endpoint.endpoint, endpoint.params);
    results[endpoint.name] = result;
    
    if (result.success) {
      console.log(`✅ ${endpoint.name} - SUCCESS (Status: ${result.status})`);
    } else {
      console.log(`❌ ${endpoint.name} - FAILED (Status: ${result.status})`);
      console.log("Error:", JSON.stringify(result.error, null, 2));
    }
  }
  
  // Summary of results
  console.log("\n=== ENDPOINT TEST SUMMARY ===");
  let successCount = 0;
  for (const [name, result] of Object.entries(results)) {
    if (result.success) {
      successCount++;
      console.log(`✅ ${name} - SUCCESS`);
    } else {
      console.log(`❌ ${name} - FAILED`);
    }
  }
  
  console.log(`\nTotal: ${endpoints.length} endpoints tested, ${successCount} succeeded, ${endpoints.length - successCount} failed`);
  
  return results;
}

// Export for use in Next.js API route
export { testMultipleEndpoints, wellnessLivingApiGet, getAuthHeader };

// For direct execution (if needed)
if (typeof require !== 'undefined' && require.main === module) {
  testMultipleEndpoints().catch(console.error);
}
