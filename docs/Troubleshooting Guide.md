# WellnessLiving to GoHighLevel Integration - Troubleshooting Guide

## Table of Contents

1. [Introduction](#introduction)
2. [Authentication Issues](#authentication-issues)
3. [Cloudflare Security Challenges](#cloudflare-security-challenges)
4. [API Errors](#api-errors)
5. [Data Synchronization Issues](#data-synchronization-issues)
6. [Environment Configuration Problems](#environment-configuration-problems)
7. [Deployment Issues](#deployment-issues)
8. [Logging and Monitoring](#logging-and-monitoring)
9. [Contact Information](#contact-information)

## Introduction

This document provides guidance for troubleshooting common issues with the WellnessLiving to GoHighLevel integration, including authentication problems, API errors, and data synchronization issues.

## Authentication Issues

### WellnessLiving Authentication Failures

**Symptoms:**
- Error message: "Invalid client credentials"
- Error message: "Authentication failed"
- Unable to obtain access token

**Possible Causes and Solutions:**

1. **Invalid Client ID or Secret**
   - Verify that the client ID and secret are correct in your environment variables
   - Check for extra spaces or special characters that might have been copied incorrectly
   - Ensure you're using the correct environment (UAT vs. Production) credentials

2. **Token Expiration**
   - The integration should automatically refresh tokens, but if you see token expiration errors:
   - Check the token refresh logic in `wellness_living_client.js`
   - Verify that the system clock is accurate
   - Try manually clearing any cached tokens and restarting the integration

3. **Environment Mismatch**
   - Ensure you're using UAT credentials for UAT environment and Production credentials for Production
   - Check the `NODE_ENV` environment variable to confirm the correct environment is being used

**Debugging Steps:**

```javascript
// Add this to wellness_living_client.js getAccessToken method for debugging
console.log('Requesting token with credentials:', {
  tokenUrl: this.envConfig.tokenUrl,
  clientId: this.envConfig.clientId.substring(0, 5) + '...',
  environment: this.environment
});
```

### GoHighLevel Authentication Failures

**Symptoms:**
- Error message: "Invalid API key"
- Error message: "Unauthorized"
- 401 status code from GoHighLevel API

**Possible Causes and Solutions:**

1. **Invalid API Key**
   - Verify the API key in your environment variables
   - Generate a new API key in GoHighLevel if necessary
   - Ensure the API key has the necessary permissions

2. **Location ID Issues**
   - If using location-specific endpoints, verify the location ID is correct
   - Check if the API key has access to the specified location

**Debugging Steps:**

```javascript
// Add this to go_high_level_client.js request method for debugging
console.log('Making GoHighLevel request with:', {
  url: url,
  apiKeyLength: this.apiKey ? this.apiKey.length : 0,
  locationId: this.locationId || 'not set'
});
```

## Cloudflare Security Challenges

**Symptoms:**
- Error message: "Access denied" or "Forbidden"
- HTML response containing Cloudflare challenge page
- 403 status code from WellnessLiving API

**Possible Causes and Solutions:**

1. **Missing or Incorrect Cloudflare Bypass Header**
   - Verify that the Cloudflare bypass header is correctly configured:
     ```javascript
     cloudflareBypass: {
       headerName: 'x-firewall-rule',
       headerValue: 'MorningLightStudio-HJutxWaYn5-flag'
     }
     ```
   - Check that the header is being included in all API requests
   - Ensure there are no typos in the header name or value

2. **Header Not Activated on WellnessLiving's End**
   - Contact WellnessLiving support to confirm they've activated the header on their end
   - Provide them with examples of your requests and the responses you're receiving
   - Ask them to verify the header configuration in their Cloudflare settings

3. **IP Restrictions**
   - If the Cloudflare bypass header isn't working, you might need IP whitelisting as a fallback
   - For Vercel deployments, this is challenging due to dynamic IPs
   - Consider using a dedicated server with a static IP if necessary

**Debugging Steps:**

```javascript
// Add this to wellness_living_client.js request method for debugging
console.log('Making request with Cloudflare bypass header:', {
  headerName: this.customHeaders ? Object.keys(this.customHeaders)[0] : 'not set',
  headerValue: this.customHeaders ? Object.values(this.customHeaders)[0] : 'not set'
});

// Check the response for Cloudflare challenge indicators
if (error.response && error.response.data && typeof error.response.data === 'string' && 
    (error.response.data.includes('Cloudflare') || error.response.data.includes('challenge'))) {
  console.error('Received Cloudflare challenge response. Bypass header may not be working.');
  // Log the first 500 characters of the response for analysis
  console.error('Response preview:', error.response.data.substring(0, 500));
}
```

## API Errors

### WellnessLiving API Errors

**Symptoms:**
- Error responses with status codes 400, 404, 500, etc.
- Error message: "Resource not found"
- Error message: "Invalid parameter"

**Possible Causes and Solutions:**

1. **Invalid Parameters**
   - Check that required parameters are included in your requests
   - Verify parameter formats (e.g., date formats, IDs)
   - Ensure business ID and region ID are correctly set

2. **Resource Not Found**
   - Verify that the requested resource exists
   - Check for typos in endpoint paths
   - Ensure you're using the correct environment (UAT vs. Production)

3. **Rate Limiting**
   - Implement exponential backoff for retries
   - Batch requests when possible
   - Add delays between consecutive requests

**Debugging Steps:**

```javascript
// Add this to wellness_living_client.js request method for debugging
console.log('WellnessLiving API request details:', {
  method: requestOptions.method,
  url: url,
  params: requestOptions.params,
  dataPreview: requestOptions.data ? JSON.stringify(requestOptions.data).substring(0, 100) + '...' : 'none'
});
```

### GoHighLevel API Errors

**Symptoms:**
- Error responses with status codes 400, 404, 500, etc.
- Error message: "Resource not found"
- Error message: "Invalid parameter"

**Possible Causes and Solutions:**

1. **Invalid Parameters**
   - Check that required parameters are included in your requests
   - Verify parameter formats (e.g., date formats, IDs)
   - Ensure location ID is correctly set if required

2. **Resource Not Found**
   - Verify that the requested resource exists
   - Check for typos in endpoint paths

3. **Rate Limiting**
   - Implement exponential backoff for retries
   - Batch requests when possible
   - Add delays between consecutive requests

**Debugging Steps:**

```javascript
// Add this to go_high_level_client.js request method for debugging
console.log('GoHighLevel API request details:', {
  method: requestOptions.method,
  url: url,
  params: requestOptions.params,
  dataPreview: requestOptions.data ? JSON.stringify(requestOptions.data).substring(0, 100) + '...' : 'none'
});
```

## Data Synchronization Issues

### Missing or Incomplete Data

**Symptoms:**
- Some entities are not synchronized
- Data is partially synchronized
- Sync process completes but data is missing

**Possible Causes and Solutions:**

1. **Pagination Issues**
   - Check that pagination is correctly implemented for large datasets
   - Verify that all pages are being processed
   - Implement logging to track pagination progress

2. **Data Mapping Errors**
   - Check for errors in the data mapping functions
   - Verify that all required fields are being mapped
   - Handle null or undefined values gracefully

3. **API Limitations**
   - Check for API rate limits or response size limits
   - Implement batch processing for large datasets
   - Add delays between requests if necessary

**Debugging Steps:**

```javascript
// Add this to sync_manager.js for debugging
function logSyncProgress(entityType, current, total) {
  console.log(`Syncing ${entityType}: ${current}/${total} (${Math.round(current/total*100)}%)`);
}

// Track entity counts before and after sync
console.log(`Before sync: ${entityType} count = ${beforeCount}`);
console.log(`After sync: ${entityType} count = ${afterCount}`);
```

### Data Inconsistencies

**Symptoms:**
- Data in GoHighLevel doesn't match WellnessLiving
- Some fields are missing or incorrect
- Relationships between entities are broken

**Possible Causes and Solutions:**

1. **Field Mapping Issues**
   - Review the data mapper functions for each entity type
   - Check for field name mismatches or format differences
   - Verify that all required fields are being mapped

2. **Data Type Conversions**
   - Check for data type conversion issues (e.g., dates, numbers, booleans)
   - Implement proper validation and conversion in the data mapper
   - Handle edge cases like null values, empty strings, etc.

3. **Relationship Mapping**
   - Verify that entity relationships are correctly maintained
   - Check that IDs are correctly mapped between systems
   - Implement proper ordering for dependent entities

**Debugging Steps:**

```javascript
// Add this to data_mapper.js for debugging
function debugMapping(sourceEntity, mappedEntity, entityType) {
  console.log(`Mapping ${entityType}:`, {
    source: {
      id: sourceEntity.id || sourceEntity.k_id,
      name: sourceEntity.text_title || sourceEntity.s_title || sourceEntity.text_name
    },
    mapped: {
      id: mappedEntity.id,
      name: mappedEntity.name || mappedEntity.title
    }
  });
}
```

## Environment Configuration Problems

**Symptoms:**
- Error message: "Missing required configuration"
- Integration fails to start
- Environment-specific features don't work

**Possible Causes and Solutions:**

1. **Missing Environment Variables**
   - Check that all required environment variables are set
   - Verify the format and values of environment variables
   - Use a `.env.local` file for local development

2. **Configuration Validation Errors**
   - Review the configuration validation logic
   - Check for typos in configuration keys
   - Ensure all required configuration is provided

3. **Environment Mismatch**
   - Verify that the `NODE_ENV` environment variable is correctly set
   - Check that environment-specific configuration is loaded
   - Test with different environment settings

**Debugging Steps:**

```javascript
// Add this to config.js for debugging
console.log('Loaded configuration:', {
  environment: config.environment,
  wellnessLivingProxy: {
    useProxy: config.wellnessLivingProxy.useProxy,
    environment: config.environment === 'production' ? 'production' : 'uat',
    hasClientId: !!config.wellnessLivingProxy[config.environment === 'production' ? 'production' : 'uat'].clientId,
    hasClientSecret: !!config.wellnessLivingProxy[config.environment === 'production' ? 'production' : 'uat'].clientSecret,
    hasCloudflareBypass: !!config.wellnessLivingProxy.cloudflareBypass
  },
  goHighLevel: {
    hasApiKey: !!config.goHighLevel.apiKey,
    hasLocationId: !!config.goHighLevel.locationId
  }
});
```

## Deployment Issues

### Vercel Deployment Failures

**Symptoms:**
- Build errors in Vercel
- Deployment fails
- Application works locally but not in production

**Possible Causes and Solutions:**

1. **Missing Environment Variables**
   - Check that all required environment variables are set in Vercel
   - Verify the format and values of environment variables
   - Use Vercel's environment variable UI to set them

2. **Build Errors**
   - Check the build logs for specific errors
   - Verify that all dependencies are installed
   - Test the build process locally before deploying

3. **Runtime Errors**
   - Check the function logs in Vercel
   - Implement proper error logging
   - Test with similar environment settings locally

**Debugging Steps:**

1. Use Vercel's environment variable UI to set all required variables
2. Check the build logs for specific errors
3. Test the build process locally:
   ```bash
   npm run build
   ```
4. Use Vercel's function logs to debug runtime errors

### Serverless Function Limitations

**Symptoms:**
- Functions timeout
- Memory limit exceeded
- Cold start performance issues

**Possible Causes and Solutions:**

1. **Function Timeout**
   - Optimize code for faster execution
   - Break large operations into smaller functions
   - Implement asynchronous processing where possible

2. **Memory Limit**
   - Optimize memory usage
   - Implement pagination and batch processing
   - Monitor memory usage during development

3. **Cold Start Issues**
   - Implement warm-up mechanisms
   - Optimize initialization code
   - Use scheduled functions to keep instances warm

**Debugging Steps:**

1. Monitor function execution time and memory usage
2. Implement logging to track performance metrics
3. Test with different function sizes and timeout settings

## Logging and Monitoring

### Setting Up Enhanced Logging

To improve troubleshooting, implement enhanced logging:

```javascript
// Add this to your main application file
const fs = require('fs');
const path = require('path');
const { createLogger, format, transports } = require('winston');

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir);
}

// Create logger
const logger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: format.combine(
    format.timestamp(),
    format.json()
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: path.join(logsDir, 'error.log'), level: 'error' }),
    new transports.File({ filename: path.join(logsDir, 'combined.log') })
  ]
});

// Use logger throughout your application
logger.info('Integration started');
logger.error('Error occurred', { error: err.message, stack: err.stack });
```

### Monitoring Integration Health

Implement health checks and monitoring:

```javascript
// Add this to your API routes
app.get('/api/health', (req, res) => {
  const status = {
    uptime: process.uptime(),
    timestamp: Date.now(),
    environment: process.env.NODE_ENV,
    services: {
      wellnessLiving: { status: 'unknown' },
      goHighLevel: { status: 'unknown' }
    }
  };
  
  // Check WellnessLiving connection
  checkWellnessLivingHealth()
    .then(wlStatus => {
      status.services.wellnessLiving = wlStatus;
      return checkGoHighLevelHealth();
    })
    .then(ghlStatus => {
      status.services.goHighLevel = ghlStatus;
      res.json(status);
    })
    .catch(err => {
      status.error = err.message;
      res.status(500).json(status);
    });
});

async function checkWellnessLivingHealth() {
  try {
    const wlClient = new WellnessLivingClient(config);
    await wlClient.getAccessToken();
    return { status: 'ok', lastChecked: Date.now() };
  } catch (err) {
    return { status: 'error', error: err.message, lastChecked: Date.now() };
  }
}

async function checkGoHighLevelHealth() {
  try {
    const ghlClient = new GoHighLevelClient(config);
    await ghlClient.getContacts({ limit: 1 });
    return { status: 'ok', lastChecked: Date.now() };
  } catch (err) {
    return { status: 'error', error: err.message, lastChecked: Date.now() };
  }
}
```

## Contact Information

If you encounter issues that cannot be resolved using this guide, contact:

### WellnessLiving Support
- Email: api-support@wellnessliving.com
- Reference: MorningLightStudio integration
- Include your business ID and environment details

### GoHighLevel Support
- Email: support@gohighlevel.com
- Reference: API integration issue
- Include your account details and API key (first few characters only)

### Integration Support
- Email: support@morninglightstudio.com
- Subject: WellnessLiving to GoHighLevel Integration Support
- Include detailed error information and logs
