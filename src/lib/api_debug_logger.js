// api_debug_logger.js
// A utility to capture detailed HTTP request and response information for WellnessLiving API debugging

import axios from 'axios';

// WellnessLiving sandbox credentials
const WL_CONFIG = {
  BUSINESS_ID: '50312',
  USERNAME: 'morninglighttest@test.com',
  PASSWORD: 'Morninglighttest123@test.com',
  USER_ID: '3004635',
  AUTHORIZATION_CODE: 'vEmOvZvGu1XSqD4RMqbq2tS1mdF8DPCxvxltMeEbUK5V',
  AUTHORIZATION_ID: 'uR8Zk908zCuEsjJc',
  API_BASE_URL: 'https://staging.wellnessliving.com/api/'
};

/**
 * Create Authorization header for WellnessLiving API requests
 */
function getWellnessLivingAuthHeader() {
  return `Basic ${Buffer.from(`${WL_CONFIG.AUTHORIZATION_ID}:${WL_CONFIG.AUTHORIZATION_CODE}`).toString('base64')}`;
}

/**
 * Make a request to WellnessLiving API with detailed logging
 * @param {string} endpoint - API endpoint path
 * @param {object} params - Query parameters
 * @returns {object} - Debug information including request and response details
 */
async function makeWellnessLivingRequest(endpoint, params = {}) {
  const url = `${WL_CONFIG.API_BASE_URL}${endpoint}`;
  const headers = {
    'Authorization': getWellnessLivingAuthHeader(),
    'Content-Type': 'application/json'
  };

  console.log(`Making request to: ${url}`);
  console.log(`With params:`, params);
  console.log(`With headers:`, headers);

  const debugInfo = {
    request: {
      method: 'GET',
      url: url,
      headers: headers,
      params: params,
      timestamp: new Date().toISOString()
    },
    response: null,
    error: null
  };

  try {
    const response = await axios({
      method: 'get',
      url: url,
      headers: headers,
      params: params
    });

    debugInfo.response = {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers,
      data: response.data,
      timestamp: new Date().toISOString()
    };

    return debugInfo;
  } catch (error) {
    console.error(`Error making request to ${url}:`, error.message);

    debugInfo.error = {
      message: error.message,
      name: error.name,
      stack: error.stack,
      timestamp: new Date().toISOString()
    };

    // If we have an axios error response, capture it
    if (error.response) {
      debugInfo.response = {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data,
        timestamp: new Date().toISOString()
      };
    }

    return debugInfo;
  }
}

/**
 * Test multiple WellnessLiving API endpoints and capture detailed debug information
 */
async function testEndpointsWithDebugInfo() {
  const results = {};

  // Test Business List endpoint
  results['Business List'] = await makeWellnessLivingRequest('Wl/Business/BusinessList.json', {});

  // Test Business Account endpoint
  results['Business Account'] = await makeWellnessLivingRequest('Wl/Business/Account/BusinessAccountModel.json', {
    is_prospects: 'false'
  });

  // Test Amazon Region endpoint
  results['Amazon Region'] = await makeWellnessLivingRequest('Wl/Business/AmazonRegion/AmazonRegionModel.json', {});

  // Test Business Information endpoint
  results['Business Information'] = await makeWellnessLivingRequest('Wl/Business/Information/BusinessInformationModel.json', {
    k_business: WL_CONFIG.BUSINESS_ID
  });

  // Test Staff List endpoint
  results['Staff List'] = await makeWellnessLivingRequest('Wl/Staff/StaffList.json', {
    k_business: WL_CONFIG.BUSINESS_ID
  });

  // Test additional endpoints that might be useful for client data
  results['Login Model'] = await makeWellnessLivingRequest('Wl/Login/LoginModel.json', {});
  
  results['Client List'] = await makeWellnessLivingRequest('Wl/Client/ClientList.json', {
    k_business: WL_CONFIG.BUSINESS_ID
  });

  results['Visit Model'] = await makeWellnessLivingRequest('Wl/Visit/VisitModel.json', {
    k_business: WL_CONFIG.BUSINESS_ID
  });

  return results;
}

/**
 * Format debug information for easy reading and sharing with support
 * @param {object} debugResults - Results from testEndpointsWithDebugInfo
 * @returns {string} - Formatted debug information
 */
function formatDebugInfoForSupport(debugResults) {
  let formattedOutput = '# WellnessLiving API Debug Information\n\n';
  
  for (const [endpoint, debugInfo] of Object.entries(debugResults)) {
    formattedOutput += `## ${endpoint}\n\n`;
    
    // Request details
    formattedOutput += '### Request\n\n';
    formattedOutput += '```\n';
    formattedOutput += `${debugInfo.request.method} ${debugInfo.request.url}\n`;
    formattedOutput += 'Headers:\n';
    
    // Mask authorization header for security
    const maskedHeaders = {...debugInfo.request.headers};
    if (maskedHeaders.Authorization) {
      maskedHeaders.Authorization = maskedHeaders.Authorization.substring(0, 10) + '...[MASKED]';
    }
    
    formattedOutput += JSON.stringify(maskedHeaders, null, 2) + '\n\n';
    formattedOutput += 'Params:\n';
    formattedOutput += JSON.stringify(debugInfo.request.params, null, 2) + '\n';
    formattedOutput += '```\n\n';
    
    // Response details
    formattedOutput += '### Response\n\n';
    if (debugInfo.response) {
      formattedOutput += '```\n';
      formattedOutput += `Status: ${debugInfo.response.status} ${debugInfo.response.statusText}\n`;
      formattedOutput += 'Headers:\n';
      formattedOutput += JSON.stringify(debugInfo.response.headers, null, 2) + '\n\n';
      formattedOutput += 'Data:\n';
      formattedOutput += JSON.stringify(debugInfo.response.data, null, 2) + '\n';
      formattedOutput += '```\n\n';
    } else {
      formattedOutput += 'No response received\n\n';
    }
    
    // Error details
    if (debugInfo.error) {
      formattedOutput += '### Error\n\n';
      formattedOutput += '```\n';
      formattedOutput += `Name: ${debugInfo.error.name}\n`;
      formattedOutput += `Message: ${debugInfo.error.message}\n`;
      formattedOutput += '```\n\n';
    }
    
    formattedOutput += '---\n\n';
  }
  
  return formattedOutput;
}

export {
  testEndpointsWithDebugInfo,
  formatDebugInfoForSupport,
  makeWellnessLivingRequest
};

