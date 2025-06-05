// debug_api_route.js
const axios = require('axios');

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

// Create Authorization header for WellnessLiving API requests
function getWellnessLivingAuthHeader( ) {
  return `Basic ${Buffer.from(`${WL_CONFIG.AUTHORIZATION_ID}:${WL_CONFIG.AUTHORIZATION_CODE}`).toString('base64')}`;
}

// Make a request to WellnessLiving API with detailed logging
async function makeWellnessLivingRequest(endpoint, params = {}) {
  const url = `${WL_CONFIG.API_BASE_URL}${endpoint}`;
  const headers = {
    'Authorization': getWellnessLivingAuthHeader(),
    'Content-Type': 'application/json'
  };

  console.log(`Making request to: ${url}`);
  console.log(`With params:`, params);

  try {
    const response = await axios({
      method: 'get',
      url: url,
      headers: headers,
      params: params
    });

    return {
      request: {
        method: 'GET',
        url: url,
        headers: headers,
        params: params
      },
      response: {
        status: response.status,
        statusText: response.statusText,
        headers: response.headers,
        data: response.data
      },
      error: null
    };
  } catch (error) {
    console.error(`Error making request to ${url}:`, error.message);

    const debugInfo = {
      request: {
        method: 'GET',
        url: url,
        headers: headers,
        params: params
      },
      error: {
        message: error.message,
        name: error.name
      }
    };

    if (error.response) {
      debugInfo.response = {
        status: error.response.status,
        statusText: error.response.statusText,
        headers: error.response.headers,
        data: error.response.data
      };
    }

    return debugInfo;
  }
}

// Format debug info for support
function formatDebugInfoForSupport(results) {
  let formattedOutput = '# WellnessLiving API Debug Information\n\n';
  
  for (const [endpointName, result] of Object.entries(results)) {
    formattedOutput += `## ${endpointName}\n\n`;
    
    // Request details
    formattedOutput += '### Request\n\n';
    formattedOutput += `- **Method**: ${result.request.method}\n`;
    formattedOutput += `- **URL**: ${result.request.url}\n`;
    formattedOutput += '- **Headers**:\n';
    
    for (const [headerName, headerValue] of Object.entries(result.request.headers)) {
      // Mask authorization header value for security
      const displayValue = headerName.toLowerCase() === 'authorization' 
        ? 'Basic [CREDENTIALS MASKED]' 
        : headerValue;
      formattedOutput += `  - ${headerName}: ${displayValue}\n`;
    }
    
    formattedOutput += '- **Parameters**:\n';
    for (const [paramName, paramValue] of Object.entries(result.request.params)) {
      formattedOutput += `  - ${paramName}: ${paramValue}\n`;
    }
    
    // Response details
    formattedOutput += '\n### Response\n\n';
    
    if (result.error) {
      formattedOutput += `- **Error**: ${result.error.name} - ${result.error.message}\n`;
    }
    
    if (result.response) {
      formattedOutput += `- **Status**: ${result.response.status} ${result.response.statusText}\n`;
      formattedOutput += '- **Headers**:\n';
      
      for (const [headerName, headerValue] of Object.entries(result.response.headers)) {
        formattedOutput += `  - ${headerName}: ${headerValue}\n`;
      }
      
      formattedOutput += '- **Data**:\n```json\n';
      formattedOutput += JSON.stringify(result.response.data, null, 2);
      formattedOutput += '\n```\n';
    }
    
    formattedOutput += '\n---\n\n';
  }
  
  return formattedOutput;
}

// Run this script directly with Node.js
async function main() {
  console.log("Collecting WellnessLiving API debug information...");
  
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

  // Log raw results for debugging
  console.log(JSON.stringify(results, null, 2));
  
  // Format results for support
  const formattedOutput = formatDebugInfoForSupport(results);
  console.log("\n\n=== FORMATTED DEBUG INFO FOR SUPPORT ===\n\n");
  console.log(formattedOutput);
  
  return { results, formattedOutput };
}

main().catch(console.error);
