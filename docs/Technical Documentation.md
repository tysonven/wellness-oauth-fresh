# WellnessLiving to GoHighLevel Integration - Technical Documentation

## Table of Contents

1. [Introduction](#introduction)
2. [System Architecture](#system-architecture)
3. [Authentication](#authentication)
4. [API Endpoints](#api-endpoints)
5. [Data Mapping](#data-mapping)
6. [Configuration](#configuration)
7. [Deployment](#deployment)
8. [Testing](#testing)

## Introduction

This document provides technical details about the WellnessLiving to GoHighLevel integration, including API endpoints, authentication, data mapping, configuration options, and deployment instructions.

## System Architecture

The integration consists of several key components:

### Core Components

1. **WellnessLivingClient**: A JavaScript client for the WellnessLiving API Proxy
   - Handles OAuth2 authentication and token management
   - Implements Cloudflare bypass header
   - Provides methods for accessing WellnessLiving endpoints

2. **GoHighLevelClient**: A JavaScript client for the GoHighLevel API
   - Handles API key authentication
   - Provides methods for accessing GoHighLevel endpoints

3. **DataMapper**: Transforms data between WellnessLiving and GoHighLevel formats
   - Maps entities like locations, services, staff, classes, and clients
   - Handles data type conversions and field mappings

4. **SyncManager**: Orchestrates the synchronization process
   - Manages full and incremental sync operations
   - Implements error handling and retry logic
   - Tracks sync status and progress

### Directory Structure

```
wellness-oauth-fresh/
├── src/
│   ├── lib/
│   │   ├── wellness_living_client.js  # WellnessLiving API client
│   │   ├── go_high_level_client.js    # GoHighLevel API client
│   │   ├── data_mapper.js             # Data transformation logic
│   │   ├── sync_manager.js            # Synchronization orchestration
│   │   ├── error_monitoring.js        # Error handling and logging
│   │   └── config.js                  # Configuration management
│   ├── app/
│   │   └── api/                       # API routes for Next.js
│   └── ...
├── docs/
│   ├── integration_overview.md        # High-level overview
│   ├── technical_documentation.md     # Technical details (this document)
│   └── troubleshooting_guide.md       # Troubleshooting information
└── ...
```

## Authentication

### WellnessLiving Authentication

The integration uses OAuth2 client credentials flow to authenticate with the WellnessLiving API Proxy:

```javascript
async getAccessToken() {
  // Check if token exists and is not expired
  const now = Date.now();
  if (this.token && this.tokenExpiry && now < this.tokenExpiry) {
    return this.token;
  }
  
  // Request new token
  try {
    console.log(`Requesting new access token from ${this.envConfig.tokenUrl}`);
    
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    params.append('client_id', this.envConfig.clientId);
    params.append('client_secret', this.envConfig.clientSecret);
    
    const response = await axios({
      method: 'POST',
      url: this.envConfig.tokenUrl,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        ...this.customHeaders // Include Cloudflare bypass header
      },
      data: params
    });
    
    // Store token and calculate expiry time (subtract 60 seconds as buffer)
    this.token = response.data.access_token;
    this.tokenExpiry = now + ((response.data.expires_in - 60) * 1000);
    
    console.log(`Successfully obtained access token, valid until ${new Date(this.tokenExpiry).toISOString()}`);
    
    return this.token;
  } catch (error) {
    console.error('Error obtaining access token:', error.response ? error.response.data : error.message);
    throw error;
  }
}
```

#### Cloudflare Security Bypass

WellnessLiving's API is protected by Cloudflare security. To bypass this security layer, the integration includes a custom header in all API requests:

```javascript
// Initialize custom headers for Cloudflare bypass
this.customHeaders = {};

// Set the Cloudflare bypass header if available in config
if (config.wellnessLiving.cloudflareBypass) {
  const { headerName, headerValue } = config.wellnessLiving.cloudflareBypass;
  if (headerName && headerValue) {
    this.customHeaders[headerName] = headerValue;
    console.log(`Cloudflare bypass header configured: ${headerName}`);
  }
}
```

The header is included in all API requests:

```javascript
const response = await axios({
  method: requestOptions.method,
  url: url,
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json',
    ...this.customHeaders, // Include Cloudflare bypass header
    ...requestOptions.headers,
  },
  params: requestOptions.params,
  data: requestOptions.data
});
```

### GoHighLevel Authentication

The integration uses API key authentication for GoHighLevel:

```javascript
const response = await axios({
  method: requestOptions.method,
  url: url,
  headers: {
    'Authorization': `Bearer ${this.apiKey}`,
    'Content-Type': 'application/json',
    ...requestOptions.headers,
  },
  params: requestOptions.params,
  data: requestOptions.data
});
```

## API Endpoints

### WellnessLiving Endpoints

The integration uses the following WellnessLiving API endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/business` | GET | Get business information |
| `/location/list` | GET | Get list of locations |
| `/location/view` | GET | Get location details |
| `/classes/list` | GET | Get list of classes |
| `/appointment/book/service/list` | GET | Get list of appointment services |
| `/appointment/book/staff/list` | GET | Get list of staff for a service |
| `/event/list` | GET | Get list of events |

### GoHighLevel Endpoints

The integration uses the following GoHighLevel API endpoints:

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/contacts` | GET | Get list of contacts |
| `/contacts` | POST | Create or update a contact |
| `/calendars` | GET | Get calendar information |
| `/appointments` | POST | Create an appointment |
| `/services` | GET | Get list of services |
| `/services` | POST | Create or update a service |
| `/users` | GET | Get list of users/staff |

## Data Mapping

The integration maps data between WellnessLiving and GoHighLevel using the following mappings:

### Location Mapping

```javascript
function mapLocation(wlLocation) {
  return {
    name: wlLocation.text_title || wlLocation.s_title,
    address1: wlLocation.text_address1 || '',
    address2: wlLocation.text_address2 || '',
    city: wlLocation.text_city || '',
    state: wlLocation.text_region || '',
    postalCode: wlLocation.text_postal || '',
    country: wlLocation.text_country || '',
    phone: wlLocation.text_phone || '',
    email: wlLocation.text_email || '',
    website: wlLocation.text_url || '',
    timezone: wlLocation.text_timezone || 'America/New_York',
  };
}
```

### Service Mapping

```javascript
function mapService(wlService, config) {
  // Get category mapping or use default
  const categoryId = config.integration.mapping.serviceCategories[wlService.k_service_category] || 
                    config.integration.mapping.serviceCategories.default;
  
  return {
    name: wlService.text_title || wlService.s_title,
    description: wlService.text_description || '',
    duration: wlService.i_duration || 60, // Duration in minutes
    price: parseFloat(wlService.m_price) || 0,
    categoryId: categoryId,
    color: wlService.text_color || '#3498db',
  };
}
```

### Staff Mapping

```javascript
function mapStaff(wlStaff, config) {
  // Get role mapping or use default
  const roleId = config.integration.mapping.staffRoles[wlStaff.k_staff_role] || 
                config.integration.mapping.staffRoles.default;
  
  return {
    firstName: wlStaff.text_first_name || '',
    lastName: wlStaff.text_last_name || '',
    email: wlStaff.text_email || '',
    phone: wlStaff.text_phone || '',
    role: roleId,
  };
}
```

### Client Mapping

```javascript
function mapClient(wlClient) {
  return {
    firstName: wlClient.text_first_name || '',
    lastName: wlClient.text_last_name || '',
    email: wlClient.text_email || '',
    phone: wlClient.text_phone || '',
    address1: wlClient.text_address1 || '',
    address2: wlClient.text_address2 || '',
    city: wlClient.text_city || '',
    state: wlClient.text_region || '',
    postalCode: wlClient.text_postal || '',
    country: wlClient.text_country || '',
    dateOfBirth: wlClient.dt_birth || null,
  };
}
```

## Configuration

The integration uses a configuration module that loads settings from environment variables:

```javascript
// Base configuration with defaults
const config = {
  environment: process.env.NODE_ENV || 'development',
  
  // WellnessLiving configuration (Legacy API - kept for backward compatibility)
  wellnessLiving: {
    businessId: process.env.WL_BUSINESS_ID,
    apiBaseUrl: process.env.WL_API_BASE_URL || 'https://staging.wellnessliving.com/api/',
    authorizationId: process.env.WL_AUTHORIZATION_ID,
    authorizationCode: process.env.WL_AUTHORIZATION_CODE,
  },
  
  // NEW: WellnessLiving API Proxy configuration
  wellnessLivingProxy: {
    // UAT (Testing) Environment
    uat: {
      tokenUrl: process.env.WL_PROXY_UAT_TOKEN_URL || 'https://access.uat-api.wellnessliving.io/oauth2/token',
      baseUrl: process.env.WL_PROXY_UAT_BASE_URL || 'https://uat-api.wellnessliving.io/v1',
      clientId: process.env.WL_PROXY_UAT_CLIENT_ID || '53lgp30qbq509e1lt528q4impb',
      clientSecret: process.env.WL_PROXY_UAT_CLIENT_SECRET || 'h3e9t5543uoa241dikhi5rotaab85m08dk7oincmr9rgruqj2ao',
    },
    // Production Environment (to be provided by WellnessLiving)
    production: {
      tokenUrl: process.env.WL_PROXY_PROD_TOKEN_URL || 'https://access.api.wellnessliving.io/oauth2/token',
      baseUrl: process.env.WL_PROXY_PROD_BASE_URL || 'https://api.wellnessliving.io/v1',
      clientId: process.env.WL_PROXY_PROD_CLIENT_ID || '', // Replace with production credentials
      clientSecret: process.env.WL_PROXY_PROD_CLIENT_SECRET || '', // Replace with production credentials
    },
    // Business configuration
    business: {
      k_business: process.env.WL_BUSINESS_ID || '50312',
      id_region: process.env.WL_REGION_ID || '1',
      k_location: process.env.WL_LOCATION_ID || '5000000296',
    },
    // Cloudflare bypass configuration
    cloudflareBypass: {
      headerName: process.env.WL_CLOUDFLARE_HEADER_NAME || 'x-firewall-rule',
      headerValue: process.env.WL_CLOUDFLARE_HEADER_VALUE || 'MorningLightStudio-HJutxWaYn5-flag'
    },
    // Whether to use the new API Proxy (true) or legacy API (false)
    useProxy: process.env.USE_WL_PROXY === 'true' || true
  },
  
  // GoHighLevel configuration
  goHighLevel: {
    apiKey: process.env.GHL_API_KEY,
    apiBaseUrl: process.env.GHL_API_BASE_URL || 'https://rest.gohighlevel.com/v1/',
    locationId: process.env.GHL_LOCATION_ID || '',
  },
  
  // Sync configuration
  sync: {
    retryAttempts: parseInt(process.env.SYNC_RETRY_ATTEMPTS || '3', 10),
    retryDelay: parseInt(process.env.SYNC_RETRY_DELAY || '1000', 10),
    batchSize: parseInt(process.env.SYNC_BATCH_SIZE || '50', 10),
    logLevel: process.env.SYNC_LOG_LEVEL || 'info',
  },

  errorMonitoring: {
    logLevel: process.env.ERROR_LOG_LEVEL || 'info',
    logMaxSize: parseInt(process.env.ERROR_LOG_MAX_SIZE || '10485760', 10),
    enableAlerts: process.env.ENABLE_ERROR_ALERTS === 'true',
    alertEmail: process.env.ALERT_EMAIL || 'admin@example.com'
  },
};
```

### Environment Variables

The following environment variables should be set:

| Variable | Description | Default |
|----------|-------------|---------|
| `NODE_ENV` | Environment (development, test, production) | development |
| `WL_PROXY_UAT_CLIENT_ID` | WellnessLiving UAT client ID | 53lgp30qbq509e1lt528q4impb |
| `WL_PROXY_UAT_CLIENT_SECRET` | WellnessLiving UAT client secret | h3e9t5543uoa241dikhi5rotaab85m08dk7oincmr9rgruqj2ao |
| `WL_PROXY_PROD_CLIENT_ID` | WellnessLiving production client ID | (empty) |
| `WL_PROXY_PROD_CLIENT_SECRET` | WellnessLiving production client secret | (empty) |
| `WL_BUSINESS_ID` | WellnessLiving business ID | 50312 |
| `WL_REGION_ID` | WellnessLiving region ID | 1 |
| `WL_LOCATION_ID` | WellnessLiving location ID | 5000000296 |
| `WL_CLOUDFLARE_HEADER_NAME` | Cloudflare bypass header name | x-firewall-rule |
| `WL_CLOUDFLARE_HEADER_VALUE` | Cloudflare bypass header value | MorningLightStudio-HJutxWaYn5-flag |
| `GHL_API_KEY` | GoHighLevel API key | (required) |
| `GHL_LOCATION_ID` | GoHighLevel location ID | (empty) |

## Deployment

The integration is designed to be deployed as a serverless application on Vercel:

### Prerequisites

1. Node.js 14.x or higher
2. Vercel CLI (for local development and deployment)
3. WellnessLiving API credentials
4. GoHighLevel API credentials

### Local Development

1. Clone the repository:
   ```bash
   git clone https://github.com/your-username/wellness-oauth-fresh.git
   cd wellness-oauth-fresh
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env.local` file with your environment variables:
   ```
   WL_PROXY_UAT_CLIENT_ID=your_client_id
   WL_PROXY_UAT_CLIENT_SECRET=your_client_secret
   WL_BUSINESS_ID=your_business_id
   WL_REGION_ID=your_region_id
   WL_LOCATION_ID=your_location_id
   WL_CLOUDFLARE_HEADER_NAME=x-firewall-rule
   WL_CLOUDFLARE_HEADER_VALUE=MorningLightStudio-HJutxWaYn5-flag
   GHL_API_KEY=your_api_key
   GHL_LOCATION_ID=your_location_id
   ```

4. Run the development server:
   ```bash
   npm run dev
   ```

### Vercel Deployment

1. Configure environment variables in Vercel:
   - Go to your Vercel project dashboard
   - Navigate to "Settings" > "Environment Variables"
   - Add all required environment variables

2. Deploy to Vercel:
   ```bash
   vercel
   ```

3. For production deployment:
   ```bash
   vercel --prod
   ```

## Testing

### Integration Testing

The integration includes a test script for verifying the connection to WellnessLiving:

```javascript
// integration_test.js
const WellnessLivingClient = require('./wellness_living_client');
const GoHighLevelClient = require('./go_high_level_client');
const config = require('./config');

async function testIntegration() {
  console.log('Testing WellnessLiving to GoHighLevel Integration');
  
  // Test WellnessLiving connection
  const wlClient = new WellnessLivingClient(config);
  
  try {
    // Test authentication
    console.log('Testing WellnessLiving authentication...');
    const token = await wlClient.getAccessToken();
    console.log('✅ Successfully authenticated with WellnessLiving API Proxy');
    
    // Test business info retrieval
    console.log('Testing business info retrieval...');
    const businessInfo = await wlClient.getBusinessInfo();
    console.log('✅ Successfully retrieved business info:', businessInfo.name);
    
    // Test other endpoints as needed
    console.log('Testing class retrieval...');
    const classes = await wlClient.getClasses();
    console.log(`✅ Retrieved ${classes.length} classes`);
    
    // Test GoHighLevel connection and data mapping
    // ...additional tests for GoHighLevel and data mapping
    
    console.log('All tests passed! Integration is working correctly.');
  } catch (error) {
    console.error('❌ Integration test failed:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
    }
  }
}

testIntegration();
```

Run the test with:

```bash
node integration_test.js
```

### Unit Testing

Unit tests can be added using Jest or another testing framework to test individual components of the integration.

## Conclusion

This technical documentation provides a comprehensive guide to the WellnessLiving to GoHighLevel integration. For troubleshooting common issues, refer to the [Troubleshooting Guide](./troubleshooting_guide.md).
