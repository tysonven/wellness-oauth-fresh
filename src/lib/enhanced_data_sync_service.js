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
 * Error types for better error handling
 */
const ErrorTypes = {
  AUTHENTICATION: 'authentication_error',
  NETWORK: 'network_error',
  API: 'api_error',
  BUSINESS_LOGIC: 'business_logic_error',
  DATA_MAPPING: 'data_mapping_error',
  UNKNOWN: 'unknown_error'
};

/**
 * Custom error class for data sync errors
 */
class DataSyncError extends Error {
  constructor(message, type, originalError = null, context = {}) {
    super(message);
    this.name = 'DataSyncError';
    this.type = type;
    this.originalError = originalError;
    this.context = context;
    this.timestamp = new Date().toISOString();
  }
  
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      type: this.type,
      context: this.context,
      timestamp: this.timestamp,
      originalError: this.originalError ? 
        (this.originalError.toJSON ? this.originalError.toJSON() : String(this.originalError)) : 
        null
    };
  }
}

/**
 * Create Authorization header for WellnessLiving API requests
 */
function getWellnessLivingAuthHeader() {
  if (!WL_AUTHORIZATION_ID || !WL_AUTHORIZATION_CODE) {
    throw new DataSyncError(
      "WellnessLiving authorization credentials are not configured.",
      ErrorTypes.AUTHENTICATION,
      null,
      { missingCredentials: !WL_AUTHORIZATION_ID ? 'WL_AUTHORIZATION_ID' : 'WL_AUTHORIZATION_CODE' }
    );
  }
  
  return `Basic ${Buffer.from(`${WL_AUTHORIZATION_ID}:${WL_AUTHORIZATION_CODE}`).toString('base64')}`;
}

/**
 * Check for business logic errors in WellnessLiving API responses
 */
function checkForBusinessLogicErrors(response, endpoint) {
  // Check for error array in response
  if (response && response.a_error && Array.isArray(response.a_error) && response.a_error.length > 0) {
    const firstError = response.a_error[0];
    
    return new DataSyncError(
      firstError.s_message || 'Unknown business logic error',
      ErrorTypes.BUSINESS_LOGIC,
      null,
      {
        endpoint,
        errorDetails: response.a_error,
        errorClass: response.class,
        errorStatus: response.status,
        errorCode: response.code,
        logId: response.k_log
      }
    );
  }
  
  // Check for class and status indicating an exception
  if (response && response.class && response.class.includes('Exception')) {
    return new DataSyncError(
      response.message || 'API exception occurred',
      ErrorTypes.BUSINESS_LOGIC,
      null,
      {
        endpoint,
        errorClass: response.class,
        errorStatus: response.status,
        errorCode: response.code,
        logId: response.k_log
      }
    );
  }
  
  return null;
}

/**
 * Make a GET request to the WellnessLiving API with enhanced error handling
 */
async function wellnessLivingApiGet(endpoint, params = {}, retryCount = 0) {
  const maxRetries = 3;
  
  try {
    // Get auth header (this may throw an authentication error)
    const authHeader = getWellnessLivingAuthHeader();
    
    console.log(`[WL API GET] Calling: ${WL_API_BASE_URL}${endpoint} with params:`, params);
    
    const response = await axios.get(`${WL_API_BASE_URL}${endpoint}`, {
      params: params,
      headers: {
        "Authorization": authHeader,
        "User-Agent": `ManusAI-Integration (Node.js)`,
        "Date": new Date().toUTCString(),
      },
      timeout: 10000 // 10 second timeout
    });
    
    // Check for business logic errors in successful responses
    const businessLogicError = checkForBusinessLogicErrors(response.data, endpoint);
    if (businessLogicError) {
      console.error(`[WL API] Business logic error in ${endpoint}:`, businessLogicError);
      throw businessLogicError;
    }
    
    return response.data;
  } catch (error) {
    // Handle axios errors
    if (axios.isAxiosError(error)) {
      // Network errors
      if (error.code === 'ECONNABORTED' || error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
        const networkError = new DataSyncError(
          `Network error when calling ${endpoint}: ${error.message}`,
          ErrorTypes.NETWORK,
          error,
          { endpoint, params }
        );
        
        // Retry logic for network errors
        if (retryCount < maxRetries) {
          console.warn(`[WL API] Network error, retrying (${retryCount + 1}/${maxRetries})...`);
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          return wellnessLivingApiGet(endpoint, params, retryCount + 1);
        }
        
        console.error(`[WL API] Network error after ${maxRetries} retries:`, networkError);
        throw networkError;
      }
      
      // API errors (4xx, 5xx)
      if (error.response) {
        const apiError = new DataSyncError(
          `API error when calling ${endpoint}: ${error.response.status} ${error.response.statusText}`,
          ErrorTypes.API,
          error,
          { 
            endpoint, 
            params,
            status: error.response.status,
            data: error.response.data
          }
        );
        console.error(`[WL API] API error in ${endpoint}:`, apiError);
        throw apiError;
      }
    }
    
    // If it's already our custom error, just rethrow it
    if (error instanceof DataSyncError) {
      throw error;
    }
    
    // Unknown errors
    const unknownError = new DataSyncError(
      `Unknown error when calling ${endpoint}: ${error.message}`,
      ErrorTypes.UNKNOWN,
      error,
      { endpoint, params }
    );
    console.error(`[WL API] Unknown error in ${endpoint}:`, unknownError);
    throw unknownError;
  }
}

/**
 * Make a POST request to the GoHighLevel API with enhanced error handling
 */
async function goHighLevelApiPost(endpoint, data, retryCount = 0) {
  const maxRetries = 3;
  
  try {
    if (!GHL_API_KEY) {
      throw new DataSyncError(
        "GoHighLevel API key is not configured.",
        ErrorTypes.AUTHENTICATION,
        null,
        { missingCredentials: 'GHL_API_KEY' }
      );
    }
    
    console.log(`[GHL API POST] Calling: ${GHL_API_BASE_URL}${endpoint} with data:`, data);
    
    const response = await axios.post(
      `${GHL_API_BASE_URL}${endpoint}`,
      data,
      {
        headers: {
          "Authorization": `Bearer ${GHL_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 10000 // 10 second timeout
      }
    );
    
    return response.data;
  } catch (error) {
    // Handle axios errors
    if (axios.isAxiosError(error)) {
      // Network errors
      if (error.code === 'ECONNABORTED' || error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
        const networkError = new DataSyncError(
          `Network error when calling ${endpoint}: ${error.message}`,
          ErrorTypes.NETWORK,
          error,
          { endpoint, data }
        );
        
        // Retry logic for network errors
        if (retryCount < maxRetries) {
          console.warn(`[GHL API] Network error, retrying (${retryCount + 1}/${maxRetries})...`);
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          return goHighLevelApiPost(endpoint, data, retryCount + 1);
        }
        
        console.error(`[GHL API] Network error after ${maxRetries} retries:`, networkError);
        throw networkError;
      }
      
      // API errors (4xx, 5xx)
      if (error.response) {
        const apiError = new DataSyncError(
          `API error when calling ${endpoint}: ${error.response.status} ${error.response.statusText}`,
          ErrorTypes.API,
          error,
          { 
            endpoint, 
            data,
            status: error.response.status,
            responseData: error.response.data
          }
        );
        console.error(`[GHL API] API error in ${endpoint}:`, apiError);
        throw apiError;
      }
    }
    
    // If it's already our custom error, just rethrow it
    if (error instanceof DataSyncError) {
      throw error;
    }
    
    // Unknown errors
    const unknownError = new DataSyncError(
      `Unknown error when calling ${endpoint}: ${error.message}`,
      ErrorTypes.UNKNOWN,
      error,
      { endpoint, data }
    );
    console.error(`[GHL API] Unknown error in ${endpoint}:`, unknownError);
    throw unknownError;
  }
}

/**
 * Make a GET request to the GoHighLevel API with enhanced error handling
 */
async function goHighLevelApiGet(endpoint, params = {}, retryCount = 0) {
  const maxRetries = 3;
  
  try {
    if (!GHL_API_KEY) {
      throw new DataSyncError(
        "GoHighLevel API key is not configured.",
        ErrorTypes.AUTHENTICATION,
        null,
        { missingCredentials: 'GHL_API_KEY' }
      );
    }
    
    console.log(`[GHL API GET] Calling: ${GHL_API_BASE_URL}${endpoint} with params:`, params);
    
    const response = await axios.get(
      `${GHL_API_BASE_URL}${endpoint}`,
      {
        params: params,
        headers: {
          "Authorization": `Bearer ${GHL_API_KEY}`,
          "Content-Type": "application/json"
        },
        timeout: 10000 // 10 second timeout
      }
    );
    
    return response.data;
  } catch (error) {
    // Handle axios errors
    if (axios.isAxiosError(error)) {
      // Network errors
      if (error.code === 'ECONNABORTED' || error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET') {
        const networkError = new DataSyncError(
          `Network error when calling ${endpoint}: ${error.message}`,
          ErrorTypes.NETWORK,
          error,
          { endpoint, params }
        );
        
        // Retry logic for network errors
        if (retryCount < maxRetries) {
          console.warn(`[GHL API] Network error, retrying (${retryCount + 1}/${maxRetries})...`);
          // Exponential backoff: 1s, 2s, 4s
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
          return goHighLevelApiGet(endpoint, params, retryCount + 1);
        }
        
        console.error(`[GHL API] Network error after ${maxRetries} retries:`, networkError);
        throw networkError;
      }
      
      // API errors (4xx, 5xx)
      if (error.response) {
        const apiError = new DataSyncError(
          `API error when calling ${endpoint}: ${error.response.status} ${error.response.statusText}`,
          ErrorTypes.API,
          error,
          { 
            endpoint, 
            params,
            status: error.response.status,
            responseData: error.response.data
          }
        );
        console.error(`[GHL API] API error in ${endpoint}:`, apiError);
        throw apiError;
      }
    }
    
    // If it's already our custom error, just rethrow it
    if (error instanceof DataSyncError) {
      throw error;
    }
    
    // Unknown errors
    const unknownError = new DataSyncError(
      `Unknown error when calling ${endpoint}: ${error.message}`,
      ErrorTypes.UNKNOWN,
      error,
      { endpoint, params }
    );
    console.error(`[GHL API] Unknown error in ${endpoint}:`, unknownError);
    throw unknownError;
  }
}

/**
 * Map WellnessLiving staff data to GoHighLevel format
 * @throws {DataSyncError} If mapping fails
 */
function mapStaffDataToGHL(staffData) {
  try {
    // This is a placeholder implementation
    // We'll need to update this once we understand the structure of the staff data
    
    if (!staffData) {
      throw new Error("Staff data is null or undefined");
    }
    
    // Example mapping logic (to be updated based on actual data structure)
    const mappedData = {
      staffMembers: []
    };
    
    // Assuming staffData has an array of staff members
    if (staffData.staff && Array.isArray(staffData.staff)) {
      mappedData.staffMembers = staffData.staff.map(staff => ({
        name: `${staff.s_first_name || ''} ${staff.s_last_name || ''}`.trim(),
        email: staff.s_email || '',
        phone: staff.s_phone || '',
        role: staff.s_role || '',
        id: staff.k_staff || ''
      }));
    }
    
    return mappedData;
  } catch (error) {
    throw new DataSyncError(
      `Failed to map staff data: ${error.message}`,
      ErrorTypes.DATA_MAPPING,
      error,
      { staffData }
    );
  }
}

/**
 * Map WellnessLiving business info to GoHighLevel format
 * @throws {DataSyncError} If mapping fails
 */
function mapBusinessInfoToGHL(businessInfo) {
  try {
    // This is a placeholder implementation
    // We'll need to update this once we understand the structure of the business info
    
    if (!businessInfo) {
      throw new Error("Business info is null or undefined");
    }
    
    // Example mapping logic (to be updated based on actual data structure)
    const mappedData = {
      name: businessInfo.s_name || '',
      address: businessInfo.s_address || '',
      city: businessInfo.s_city || '',
      state: businessInfo.s_state || '',
      zip: businessInfo.s_zip || '',
      phone: businessInfo.s_phone || '',
      email: businessInfo.s_email || '',
      website: businessInfo.s_website || '',
      id: businessInfo.k_business || ''
    };
    
    return mappedData;
  } catch (error) {
    throw new DataSyncError(
      `Failed to map business info: ${error.message}`,
      ErrorTypes.DATA_MAPPING,
      error,
      { businessInfo }
    );
  }
}

/**
 * Sync staff data from WellnessLiving to GoHighLevel with enhanced error handling
 */
async function syncStaffData() {
  console.log("[Data Sync] Starting staff data synchronization...");
  
  try {
    // Get staff list from WellnessLiving
    const staffData = await wellnessLivingApiGet("Wl/Staff/StaffList.json", { 
      k_business: WL_BUSINESS_ID 
    });
    
    console.log("[Data Sync] Retrieved staff data:", staffData);
    
    // Map staff data to GoHighLevel format
    const mappedStaffData = mapStaffDataToGHL(staffData);
    
    console.log("[Data Sync] Mapped staff data:", mappedStaffData);
    
    // TODO: Send mapped data to GoHighLevel
    // This will be implemented once we have the GoHighLevel API endpoints
    
    return {
      success: true,
      message: "Staff data synchronized successfully",
      data: {
        raw: staffData,
        mapped: mappedStaffData
      }
    };
  } catch (error) {
    // Handle specific error types
    if (error instanceof DataSyncError) {
      console.error(`[Data Sync] ${error.type} during staff sync:`, error);
      
      return {
        success: false,
        message: error.message,
        error: {
          type: error.type,
          details: error.toJSON()
        }
      };
    }
    
    // Handle unexpected errors
    console.error("[Data Sync] Unexpected error syncing staff data:", error);
    return {
      success: false,
      message: `Unexpected error syncing staff data: ${error.message}`,
      error: {
        type: ErrorTypes.UNKNOWN,
        message: error.message,
        stack: error.stack
      }
    };
  }
}

/**
 * Sync business information from WellnessLiving to GoHighLevel with enhanced error handling
 */
async function syncBusinessInfo() {
  console.log("[Data Sync] Starting business information synchronization...");
  
  try {
    // Get business information from WellnessLiving
    const businessInfo = await wellnessLivingApiGet("Wl/Business/Information/BusinessInformationModel.json", { 
      k_business: WL_BUSINESS_ID 
    });
    
    console.log("[Data Sync] Retrieved business information:", businessInfo);
    
    // Map business information to GoHighLevel format
    const mappedBusinessInfo = mapBusinessInfoToGHL(businessInfo);
    
    console.log("[Data Sync] Mapped business information:", mappedBusinessInfo);
    
    // TODO: Send mapped data to GoHighLevel
    // This will be implemented once we have the GoHighLevel API endpoints
    
    return {
      success: true,
      message: "Business information synchronized successfully",
      data: {
        raw: businessInfo,
        mapped: mappedBusinessInfo
      }
    };
  } catch (error) {
    // Handle specific error types
    if (error instanceof DataSyncError) {
      console.error(`[Data Sync] ${error.type} during business info sync:`, error);
      
      return {
        success: false,
        message: error.message,
        error: {
          type: error.type,
          details: error.toJSON()
        }
      };
    }
    
    // Handle unexpected errors
    console.error("[Data Sync] Unexpected error syncing business information:", error);
    return {
      success: false,
      message: `Unexpected error syncing business information: ${error.message}`,
      error: {
        type: ErrorTypes.UNKNOWN,
        message: error.message,
        stack: error.stack
      }
    };
  }
}

/**
 * Explore additional endpoints for client data with enhanced error handling
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
    },
    {
      name: "Login Promotion",
      endpoint: "Wl/Login/Promotion/LoginPromotionModel.json",
      params: { k_business: WL_BUSINESS_ID }
    },
    {
      name: "Visit Model",
      endpoint: "Wl/Visit/VisitModel.json",
      params: { k_business: WL_BUSINESS_ID }
    }
  ];
  
  const results = {};
  
  for (const endpoint of potentialEndpoints) {
    console.log(`[Data Sync] Testing endpoint: ${endpoint.name}`);
    
    try {
      const data = await wellnessLivingApiGet(endpoint.endpoint, endpoint.params);
      
      results[endpoint.name] = {
        success: true,
        data: data
      };
      
      console.log(`[Data Sync] ${endpoint.name} result: SUCCESS`);
    } catch (error) {
      results[endpoint.name] = {
        success: false,
        error: error instanceof DataSyncError ? error.toJSON() : error.message
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
 * Run a full data synchronization with enhanced error handling
 */
async function runFullSync() {
  console.log("[Data Sync] Starting full data synchronization...");
  
  try {
    const results = {
      staffSync: await syncStaffData(),
      businessSync: await syncBusinessInfo(),
      endpointExploration: await exploreClientDataEndpoints()
    };
    
    console.log("[Data Sync] Full synchronization completed with results:", results);
    
    // Calculate overall success
    const overallSuccess = results.staffSync.success && results.businessSync.success;
    
    return {
      success: overallSuccess,
      message: overallSuccess ? 
        "Full data synchronization completed successfully" : 
        "Full data synchronization completed with some errors",
      results: results
    };
  } catch (error) {
    console.error("[Data Sync] Critical error during full synchronization:", error);
    
    return {
      success: false,
      message: `Critical error during full synchronization: ${error.message}`,
      error: error instanceof DataSyncError ? error.toJSON() : {
        type: ErrorTypes.UNKNOWN,
        message: error.message,
        stack: error.stack
      }
    };
  }
}

export {
  syncStaffData,
  syncBusinessInfo,
  exploreClientDataEndpoints,
  runFullSync,
  wellnessLivingApiGet,
  goHighLevelApiPost,
  goHighLevelApiGet,
  ErrorTypes,
  DataSyncError
};
