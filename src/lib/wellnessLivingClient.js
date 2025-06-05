// src/lib/wellnessLivingClient.js
import axios from "axios";

// Staging credentials provided by the user - to be set in .env.local or Vercel env vars
const WL_USERNAME = process.env.WL_USERNAME;
const WL_PASSWORD = process.env.WL_PASSWORD;
const WL_AUTHORIZATION_CODE = process.env.WL_AUTHORIZATION_CODE; // This is the "secret code" for signature
const WL_AUTHORIZATION_ID = process.env.WL_AUTHORIZATION_ID; // This is the "application ID"

const WL_API_BASE_URL = "https://staging.wellnessliving.com/api/"; // As per user email and SDK examples

/**
 * Initialize a session with WellnessLiving API using Authorization header
 * Based on feedback from WellnessLiving dev team, we should use Authorization header
 * instead of CSRF token for server-side API calls
 */
export async function initializeWellnessLivingSession() {
  if (!WL_AUTHORIZATION_ID || !WL_AUTHORIZATION_CODE) {
    console.error("[WL Auth] WellnessLiving authorization credentials are not configured.");
    return false;
  }
  
  console.log("[WL Auth] Testing WellnessLiving API connection with Authorization header...");

  try {
    // Create Authorization header
    // Note: The exact format may need to be updated based on WellnessLiving's guidance
    // Using a standard format for now
    const authHeader = `Basic ${Buffer.from(`${WL_AUTHORIZATION_ID}:${WL_AUTHORIZATION_CODE}`).toString('base64')}`;
    
    // Make a simple API call to test authentication
    // Using a simple endpoint that should be accessible with proper authentication
    const testEndpoint = "Wl/Business/BusinessList.json";
    
    console.log(`[WL Auth] Testing API connection with endpoint: ${WL_API_BASE_URL}${testEndpoint}`);
    const response = await axios.get(`${WL_API_BASE_URL}${testEndpoint}`, {
      headers: {
        "Authorization": authHeader,
        "User-Agent": `ManusAI-Integration (Node.js)`,
        "Date": new Date().toUTCString(),
      }
    });

    if (response.status === 200) {
      console.log("[WL Auth] API connection test successful");
      return true;
    } else {
      console.error("[WL Auth] API connection test failed with status:", response.status);
      return false;
    }
  } catch (error) {
    console.error("[WL Auth] Error during API connection test:", 
      error.response ? 
        { status: error.response.status, data: error.response.data } : 
        error.message
    );
    return false;
  }
}

/**
 * Make a GET request to the WellnessLiving API
 */
export async function wellnessLivingApiGet(endpoint, params = {}) {
  if (!WL_AUTHORIZATION_ID || !WL_AUTHORIZATION_CODE) {
    console.error("[WL API] Authorization credentials are not configured.");
    return null;
  }

  try {
    // Create Authorization header
    const authHeader = `Basic ${Buffer.from(`${WL_AUTHORIZATION_ID}:${WL_AUTHORIZATION_CODE}`).toString('base64')}`;
    
    console.log(`[WL API GET] Calling: ${WL_API_BASE_URL}${endpoint} with params:`, params);
    const response = await axios.get(`${WL_API_BASE_URL}${endpoint}`, {
      params: params,
      headers: {
        "Authorization": authHeader,
        "User-Agent": `ManusAI-Integration (Node.js)`,
        "Date": new Date().toUTCString(),
      }
    });
    
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
 * Make a POST request to the WellnessLiving API
 */
export async function wellnessLivingApiPost(endpoint, data = {}) {
  if (!WL_AUTHORIZATION_ID || !WL_AUTHORIZATION_CODE) {
    console.error("[WL API] Authorization credentials are not configured.");
    return null;
  }

  try {
    // Create Authorization header
    const authHeader = `Basic ${Buffer.from(`${WL_AUTHORIZATION_ID}:${WL_AUTHORIZATION_CODE}`).toString('base64')}`;
    
    console.log(`[WL API POST] Calling: ${WL_API_BASE_URL}${endpoint} with data:`, data);
    const response = await axios.post(
      `${WL_API_BASE_URL}${endpoint}`, 
      data,
      {
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json",
          "User-Agent": `ManusAI-Integration (Node.js)`,
          "Date": new Date().toUTCString(),
        }
      }
    );
    
    return response.data;
  } catch (error) {
    console.error(`[WL API POST Error] ${endpoint}:`, 
      error.response ? 
        { status: error.response.status, data: error.response.data } : 
        error.message
    );
    return null;
  }
}
