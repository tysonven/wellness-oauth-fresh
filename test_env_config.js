/**
 * Test script for environment configuration
 * 
 * This script validates that the environment configuration is working correctly
 * by loading the config and displaying the values.
 */

// Import the configuration
const config = require('./config');

console.log('Environment Configuration Test');
console.log('==============================');
console.log(`Current Environment: ${config.environment}`);
console.log('\nWellnessLiving Configuration:');
console.log(`- Business ID: ${config.wellnessLiving.businessId}`);
console.log(`- API Base URL: ${config.wellnessLiving.apiBaseUrl}`);
console.log(`- Authorization ID: ${config.wellnessLiving.authorizationId}`);
console.log(`- Authorization Code: ${config.wellnessLiving.authorizationCode ? '********' : 'Not set'}`);

console.log('\nGoHighLevel Configuration:');
console.log(`- API Key: ${config.goHighLevel.apiKey ? '********' : 'Not set'}`);
console.log(`- API Base URL: ${config.goHighLevel.apiBaseUrl}`);

console.log('\nSync Configuration:');
console.log(`- Retry Attempts: ${config.sync.retryAttempts}`);
console.log(`- Retry Delay: ${config.sync.retryDelay}ms`);
console.log(`- Batch Size: ${config.sync.batchSize}`);
console.log(`- Log Level: ${config.sync.logLevel}`);

// Test environment-specific settings
console.log('\nEnvironment-specific settings:');
if (config.environment === 'production') {
  console.log('- Production mode: Using production WellnessLiving API URL');
} else if (config.environment === 'test') {
  console.log('- Test mode: Using debug log level');
} else {
  console.log('- Development mode: Using debug log level');
}

// Validate configuration
try {
  // Try to access a required configuration value
  if (!config.wellnessLiving.businessId) {
    throw new Error('Missing required configuration: wellnessLiving.businessId');
  }
  
  console.log('\nConfiguration validation: PASSED');
} catch (error) {
  console.error('\nConfiguration validation: FAILED');
  console.error(`Error: ${error.message}`);
}
