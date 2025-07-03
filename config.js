/**
 * Environment-specific configuration loader for WellnessLiving to GoHighLevel integration
 * 
 * This module loads configuration based on the current environment (development, test, production)
 * and provides a unified configuration object for the application.
 */

// Load environment variables from .env file if not in production
if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config();
}

/**
 * Get environment-specific configuration
 * @returns {Object} Configuration object
 */
function getConfig() {
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
      useProxy: process.env.USE_WL_PROXY === 'true' || process.env.USE_WL_PROXY === undefined
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
  
  // Environment-specific overrides
  switch (config.environment) {
    case 'production':
      // Production-specific settings
      config.wellnessLiving.apiBaseUrl = 'https://wellnessliving.com/api/';
      config.wellnessLivingProxy.useProxy = true; // Always use proxy in production
      break;
      
    case 'test':
      // Test-specific settings
      config.sync.logLevel = 'debug';
      break;
      
    case 'development':
    default:
      // Development-specific settings
      config.sync.logLevel = 'debug';
      break;
  }
  
  // Validate required configuration
  validateConfig(config);
  
  return config;
}

/**
 * Validate required configuration values
 * @param {Object} config - Configuration object to validate
 * @throws {Error} If required configuration is missing
 */
function validateConfig(config) {
  // Check which API method we're using
  if (config.wellnessLivingProxy.useProxy) {
    // Validate API Proxy configuration
    const environment = config.environment === 'production' ? 'production' : 'uat';
    const requiredProxyConfig = ['tokenUrl', 'baseUrl', 'clientId', 'clientSecret'];
    
    requiredProxyConfig.forEach(key => {
      if (!config.wellnessLivingProxy[environment][key]) {
        throw new Error(`Missing required WellnessLiving API Proxy configuration: ${environment}.${key}`);
      }
    });
    
    // Validate business configuration
    const requiredBusinessConfig = ['k_business', 'id_region'];
    requiredBusinessConfig.forEach(key => {
      if (!config.wellnessLivingProxy.business[key]) {
        throw new Error(`Missing required WellnessLiving business configuration: ${key}`);
      }
    });
  } else {
    // Validate legacy API configuration
    const requiredWLConfig = ['businessId', 'authorizationId', 'authorizationCode'];
    requiredWLConfig.forEach(key => {
      if (!config.wellnessLiving[key]) {
        throw new Error(`Missing required WellnessLiving configuration: ${key}`);
      }
    });
  }
  
  // Check GoHighLevel configuration
  const requiredGHLConfig = ['apiKey'];
  requiredGHLConfig.forEach(key => {
    if (!config.goHighLevel[key]) {
      throw new Error(`Missing required GoHighLevel configuration: ${key}`);
    }
  });
}

module.exports = getConfig();
