// src/lib/wellnessLivingClient.js
import axios from "axios";
import crypto from "crypto"; // Needed for SHA3 hash if we implement password hashing

// Staging credentials provided by the user - to be set in .env.local or Vercel env vars
const WL_USERNAME = process.env.WL_USERNAME;
const WL_PASSWORD = process.env.WL_PASSWORD;
// const WL_BUSINESS_ID = process.env.WL_BUSINESS_ID; // Not directly used in auth calls but for other API calls
const WL_AUTHORIZATION_CODE = process.env.WL_AUTHORIZATION_CODE; // This is the "secret code" for signature
const WL_AUTHORIZATION_ID = process.env.WL_AUTHORIZATION_ID; // This is the "application ID"

const WL_API_BASE_URL = "https://staging.wellnessliving.com/api/"; // As per user email and SDK examples

// API Endpoints derived from PHP SDK structure
const NOTEPAD_ENDPOINT = "Core/Passport/Login/Enter/Notepad.json";
const ENTER_ENDPOINT = "Core/Passport/Login/Enter/Enter.json";

let sessionCookies = null; // To store session cookies (e.g., "sp=...; st=...")

/**
 * Helper function to parse 'set-cookie' headers into a simple cookie string.
 * This is a basic implementation and might need to be more robust.
 */
function parseAndStoreCookies(setCookieHeader) {
  if (!setCookieHeader) return;
  let newCookies = "";
  if (Array.isArray(setCookieHeader)) {
    newCookies = setCookieHeader.map(cookie => cookie.split(";")[0]).join("; ");
  } else if (typeof setCookieHeader === "string") {
    newCookies = setCookieHeader.split(";")[0];
  }
  // Simplistic merge: new cookies overwrite old ones if names clash.
  // A proper cookie jar would handle this better (path, domain, expiry etc.)
  if (sessionCookies) {
    const existing = sessionCookies.split("; ").reduce((acc, c) => {
      const [name] = c.split("=");
      acc[name] = c;
      return acc;
    }, {});
    const incoming = newCookies.split("; ").reduce((acc, c) => {
      const [name] = c.split("=");
      acc[name] = c;
      return acc;
    }, {});
    sessionCookies = Object.values({ ...existing, ...incoming }).join("; ");
  } else {
    sessionCookies = newCookies;
  }
  console.log("[WL Auth] Updated sessionCookies:", sessionCookies);
}

/**
 * Hashes the password with the notepad value using SHA3-512 (if available) or a simpler hash.
 * The PHP SDK uses its own hash function, which might be complex to replicate exactly.
 * The NotepadModel response includes `s_hash` (e.g., "sha3").
 * For simplicity, this is a placeholder. True SHA3 might require a library like `js-sha3`.
 */
async function hashPassword(password, notepad, hashAlgorithm = "sha3") {
  // The PHP SDK's NotepadModel->hash() method is what we need to replicate.
  // It might be more complex than a simple concatenation and hash.
  // For now, let's assume a simple concatenation for demonstration.
  // IMPORTANT: This is likely NOT the correct hashing method used by WellnessLiving.
  // It's a placeholder and needs to be verified against the PHP SDK's actual implementation.
  console.warn("[WL Auth] Password hashing is a placeholder and likely incorrect. Needs verification.");
  if (hashAlgorithm.toLowerCase() === "sha3" || hashAlgorithm.toLowerCase() === "sha3-512") {
    try {
      // Node.js crypto doesn't have SHA3 built-in directly for older versions.
      // For a real implementation, you might use a library like 'js-sha3'.
      // const sha3 = await import("js-sha3");
      // return sha3.sha3_512(password + notepad);
      // Fallback to sha256 for now if sha3 library not integrated
      const hash = crypto.createHash("sha256");
      hash.update(password + notepad);
      return hash.digest("hex");
    } catch (e) {
      console.error("SHA3 hashing failed (library might be missing), falling back to simple concat for demo:", e);
      return password + notepad; // Highly insecure, for structure demo only
    }
  } else {
    // Fallback for other hash types or if SHA3 is not specified
    const hash = crypto.createHash("sha256"); // Default to SHA256 if algo unknown
    hash.update(password + notepad);
    return hash.digest("hex");
  }
}

export async function initializeWellnessLivingSession() {
  if (!WL_USERNAME || !WL_PASSWORD || !WL_AUTHORIZATION_ID || !WL_AUTHORIZATION_CODE) {
    console.error("[WL Auth] WellnessLiving credentials are not fully configured.");
    return false;
  }
  console.log("[WL Auth] Initializing WellnessLiving session...");
  sessionCookies = null; // Reset cookies for a fresh session attempt

  try {
    // Step 1: Get Notepad
    console.log(`[WL Auth] Step 1: Calling NotepadModel endpoint: ${WL_API_BASE_URL}${NOTEPAD_ENDPOINT}`);
    const notepadResponse = await axios.get(`${WL_API_BASE_URL}${NOTEPAD_ENDPOINT}`, {
      params: {
        s_login: WL_USERNAME,
        // s_type: "" // as per PHP SDK NotepadModel default
      },
      headers: {
        // The PHP SDK might add a Date header and User-Agent by default.
        // It also has a SIGNATURE constant, implying a signature might be needed even here.
        // For now, we try without a signature.
        "User-Agent": `ManusAI-Integration (Node.js/${process.version})`,
        "Date": new Date().toUTCString(),
      }
    });

    if (notepadResponse.data && notepadResponse.data.s_notepad) {
      const { s_notepad, s_hash } = notepadResponse.data;
      console.log("[WL Auth] Notepad received:", s_notepad, "Hash type:", s_hash);
      parseAndStoreCookies(notepadResponse.headers["set-cookie"]);

      // Step 2: Sign In (EnterModel)
      const hashedPassword = await hashPassword(WL_PASSWORD, s_notepad, s_hash);
      
      console.log(`[WL Auth] Step 2: Calling EnterModel endpoint: ${WL_API_BASE_URL}${ENTER_ENDPOINT}`);
      const enterPayload = {
        s_login: WL_USERNAME,
        s_notepad: s_notepad,
        s_password: hashedPassword,
        // s_remember: "", // as per PHP SDK EnterModel default
        // json_data: {}, // as per PHP SDK EnterModel default
      };

      const enterResponse = await axios.post(`${WL_API_BASE_URL}${ENTER_ENDPOINT}`, 
        new URLSearchParams(enterPayload).toString(), // Send as x-www-form-urlencoded
        {
        headers: {
          Cookie: sessionCookies,
          "Content-Type": "application/x-www-form-urlencoded",
          "User-Agent": `ManusAI-Integration (Node.js/${process.version})`,
          "Date": new Date().toUTCString(),
          // The Authorization ID is mentioned to be used in the request header.
          // The PHP SDK's WlModelAbstract also has a SIGNATURE constant.
          // This might be where WL_AUTHORIZATION_ID and a calculated signature are needed.
          // Example: 'Authorization': `WL_Signature ${WL_AUTHORIZATION_ID}:${calculated_signature}`
          // For now, we try without it.
        },
      });

      if (enterResponse.status === 200) { // Or check for specific success indicators in response.data
        console.log("[WL Auth] EnterModel call successful. Session should be established.");
        parseAndStoreCookies(enterResponse.headers["set-cookie"]);
        return true;
      } else {
        console.error("[WL Auth] EnterModel call failed:", enterResponse.status, enterResponse.data);
        sessionCookies = null;
        return false;
      }
    } else {
      console.error("[WL Auth] NotepadModel call failed or did not return s_notepad:", notepadResponse.data);
      sessionCookies = null;
      return false;
    }
  } catch (error) {
    console.error("[WL Auth] Error during session initialization:", error.response ? { status: error.response.status, data: error.response.data, headers: error.response.headers } : error.message);
    sessionCookies = null;
    return false;
  }
}

export async function wellnessLivingApiGet(endpoint, params = {}) {
  if (!sessionCookies) {
    console.log("[WL API] No active session. Attempting to initialize...");
    const sessionInitialized = await initializeWellnessLivingSession();
    if (!sessionInitialized) {
      console.error("[WL API] Failed to initialize session. Cannot make API call.");
      return null;
    }
  }

  try {
    console.log(`[WL API GET] Calling: ${WL_API_BASE_URL}${endpoint} with params:`, params);
    const response = await axios.get(`${WL_API_BASE_URL}${endpoint}`, {
      params: params,
      headers: {
        Cookie: sessionCookies,
        "User-Agent": `ManusAI-Integration (Node.js/${process.version})`,
        "Date": new Date().toUTCString(),
        // If a signature or specific auth header is needed for all calls:
        // 'Authorization': `WL_Header ${WL_AUTHORIZATION_ID}:...` 
      },
      // withCredentials: true, // axios handles cookies via headers by default when not in browser
    });
    return response.data;
  } catch (error) {
    console.error(`[WL API GET Error] ${endpoint}:`, error.response ? { status: error.response.status, data: error.response.data } : error.message);
    if (error.response && (error.response.status === 401 || error.response.status === 403)) {
      console.log("[WL API] Authentication error on GET. Attempting to re-initialize session.");
      sessionCookies = null;
      const reinitialized = await initializeWellnessLivingSession();
      if (reinitialized) {
        console.log("[WL API] Session re-initialized. Retrying API call.");
        return wellnessLivingApiGet(endpoint, params); // Retry the call once
      }
    }
    return null;
  }
}

// Example of how to potentially use it (for testing purposes, not for production directly here)
// async function testWLApi() {
//   // Ensure WL_USERNAME etc. are in your .env.local
//   // Example: WL_USERNAME=morninglighttest@test.com
//   const sessionOk = await initializeWellnessLivingSession();
//   if (sessionOk) {
//     console.log("Session established, attempting to get business info (example endpoint)");
//     // Replace with an actual valid endpoint that requires authentication
//     // const businessData = await wellnessLivingApiGet("Wl/Business/Data.json", { k_business: process.env.WL_BUSINESS_ID }); 
//     // console.log("Business Data:", businessData);
//   } else {
//     console.log("Failed to establish session.");
//   }
// }
// testWLApi();

