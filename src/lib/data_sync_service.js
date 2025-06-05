// src/lib/dataSyncService.js
import axios from "axios";

// Staging credentials - to be set in .env.local or Vercel env vars
const WL_USERNAME = process.env.WL_USERNAME;
const WL_PASSWORD = process.env.WL_PASSWORD;
const WL_AUTHORIZATION_CODE = process.env.WL_AUTHORIZATION_CODE;
const WL_AUTHORIZATION_ID = process.env.WL_AUTHORIZATION_ID;
const WL_BUSINESS_ID = process.env.WL_BUSINESS_ID;

const WL_API_BASE_URL = "https://staging.wellnessliving.com/api/";
const GHL_API_BASE_URL = "https://rest.gohighlevel.com/v1/";
const GHL_API_KEY = process.env.GHL_API_KEY;

/**
 * Create Authorization header for WellnessLiving API requests
 */
function getWellnessLivingAuthHeader() {
  if (!WL_AUTHORIZATION_ID || !WL_AUTHORIZATION_CODE) {
    throw new Error("WellnessLiving authorization credentials are not configured.");
  }
  
  return `Basic ${Buffer.from(`${WL_AUTHORIZATION_ID}:${WL_AUTHORIZATION_CODE}`).toString('base64')}`;
}

/**
 * Make a GET request to the WellnessLiving API
 */
async function wellnessLivingApiGet(endpoint, params = {}) {
  try {
    const authHeader = getWellnessLivingAuthHeader();
    
    console.log(`[WL API GET] Calling: ${WL_API_BASE_URL}${endpoint} with params:`, params);
    const response = await axios.get(`${WL_API_BASE_URL}${endpoint}`, {
      params: params,
      headers: {
        "Authorization": authHeader,
        "User-Agent": `ManusAI-Integration (Node.js)`,
        "Date": new Date().toUTCString(),
      }
    });
    
    // Check for business logic errors in successful responses
    if (response.data && response.data.a_error) {
      console.error(`Business logic error in ${endpoint}:`, response.data.a_error);
      return null;
    }
    
    return response.data;
  } catch (error) {
    console.error(`[WL API GET Error] ${endpoint}:`, 
      error.response ? 
        { status: error.response.status, data: error.response.data } : 
        error.message
    );
    return null;
  }
}

/**
 * Make a POST request to the GoHighLevel API
 */
async function goHighLevelApiPost(endpoint, data) {
  try {
    console.log(`[GHL API POST] Calling: ${GHL_API_BASE_URL}${endpoint} with data:`, data);
    const response = await axios.post(
      `${GHL_API_BASE_URL}${endpoint}`,
      data,
      {
        headers: {
          "Authorization": `Bearer ${GHL_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`[GHL API POST Error] ${endpoint}:`, 
      error.response ? 
        { status: error.response.status, data: error.response.data } : 
        error.message
    );
    return null;
  }
}

/**
 * Make a GET request to the GoHighLevel API
 */
async function goHighLevelApiGet(endpoint, params = {}) {
  try {
    console.log(`[GHL API GET] Calling: ${GHL_API_BASE_URL}${endpoint} with params:`, params);
    const response = await axios.get(
      `${GHL_API_BASE_URL}${endpoint}`,
      {
        params: params,
        headers: {
          "Authorization": `Bearer ${GHL_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`[GHL API GET Error] ${endpoint}:`, 
      error.response ? 
        { status: error.response.status, data: error.response.data } : 
        error.message
    );
    return null;
  }
}

/**
 * Sync staff data from WellnessLiving to GoHighLevel
 */
async function syncStaffData() {
  console.log("[Data Sync] Starting staff data synchronization...");
  
  try {
    // Get staff list from WellnessLiving
    const staffData = await wellnessLivingApiGet("Wl/Staff/StaffList.json", { 
      k_business: WL_BUSINESS_ID 
    });
    
    if (!staffData) {
      console.error("[Data Sync] Failed to retrieve staff data from WellnessLiving");
      return {
        success: false,
        message: "Failed to retrieve staff data from WellnessLiving"
      };
    }
    
    console.log("[Data Sync] Retrieved staff data:", staffData);
    
    // TODO: Map staff data to GoHighLevel custom fields
    // This will be implemented once we understand the structure of the staff data
    
    return {
      success: true,
      message: "Staff data retrieved successfully",
      data: staffData
    };
  } catch (error) {
    console.error("[Data Sync] Error syncing staff data:", error);
    return {
      success: false,
      message: `Error syncing staff data: ${error.message}`
    };
  }
}

/**
 * Sync business information from WellnessLiving to GoHighLevel
 */
async function syncBusinessInfo() {
  console.log("[Data Sync] Starting business information synchronization...");
  
  try {
    // Get business information from WellnessLiving
    const businessInfo = await wellnessLivingApiGet("Wl/Business/Information/BusinessInformationModel.json", { 
      k_business: WL_BUSINESS_ID 
    });
    
    if (!businessInfo) {
      console.error("[Data Sync] Failed to retrieve business information from WellnessLiving");
      return {
        success: false,
        message: "Failed to retrieve business information from WellnessLiving"
      };
    }
    
    console.log("[Data Sync] Retrieved business information:", businessInfo);
    
    // TODO: Map business information to GoHighLevel location data
    // This will be implemented once we understand the structure of the business information
    
    return {
      success: true,
      message: "Business information retrieved successfully",
      data: businessInfo
    };
  } catch (error) {
    console.error("[Data Sync] Error syncing business information:", error);
    return {
      success: false,
      message: `Error syncing business information: ${error.message}`
    };
  }
}

/**
 * Explore additional endpoints for client data
 * This is a placeholder function to test potential endpoints for client data
 */
async function exploreClientDataEndpoints() {
  console.log("[Data Sync] Exploring potential client data endpoints...");
  
  // List of potential endpoints to explore
  const potentialEndpoints = [
    {
      name: "Login Model",
      endpoint: "Wl/Login/LoginModel.json",
      params: { k_business: WL_BUSINESS_ID }
    },
    {
      name: "Login List",
      endpoint: "Wl/Login/LoginList.json",
      params: { k_business: WL_BUSINESS_ID }
    },
    {
      name: "Client List",
      endpoint: "Wl/Client/ClientList.json",
      params: { k_business: WL_BUSINESS_ID }
    }
  ];
  
  const results = {};
  
  for (const endpoint of potentialEndpoints) {
    console.log(`[Data Sync] Testing endpoint: ${endpoint.name}`);
    
    try {
      const data = await wellnessLivingApiGet(endpoint.endpoint, endpoint.params);
      
      results[endpoint.name] = {
        success: !!data,
        data: data
      };
      
      console.log(`[Data Sync] ${endpoint.name} result:`, results[endpoint.name].success ? "SUCCESS" : "FAILED");
    } catch (error) {
      results[endpoint.name] = {
        success: false,
        error: error.message
      };
      
      console.error(`[Data Sync] Error testing ${endpoint.name}:`, error);
    }
  }
  
  return {
    success: true,
    message: "Endpoint exploration completed",
    results: results
  };
}

/**
 * Run a full data synchronization
 */
async function runFullSync() {
  console.log("[Data Sync] Starting full data synchronization...");
  
  const results = {
    staffSync: await syncStaffData(),
    businessSync: await syncBusinessInfo(),
    endpointExploration: await exploreClientDataEndpoints()
  };
  
  console.log("[Data Sync] Full synchronization completed with results:", results);
  
  return {
    success: true,
    message: "Full data synchronization completed",
    results: results
  };
}

export {
  syncStaffData,
  syncBusinessInfo,
  exploreClientDataEndpoints,
  runFullSync,
  wellnessLivingApiGet,
  goHighLevelApiPost,
  goHighLevelApiGet
};
