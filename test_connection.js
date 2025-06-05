// Import required modules
const config = require('./config');
const WellnessLivingClient = require('./wellness_living_client');

// Create a client instance using the proxy configuration
const client = new WellnessLivingClient({
  // Pass the entire wellnessLivingProxy object as the config
  config: config.wellnessLivingProxy,
  // Determine environment based on NODE_ENV
  environment: config.environment === 'production' ? 'production' : 'uat'
});

// Test function to verify connection
async function testConnection() {
  try {
    console.log('Testing connection to WellnessLiving API Proxy...');
    
    // Attempt to get an access token
    const token = await client.getAccessToken();
    console.log('✅ Successfully authenticated with WellnessLiving API Proxy');
    
    // Try to get business information
    const businessInfo = await client.getBusinessInfo();
    console.log('✅ Successfully retrieved business info:');
    console.log(JSON.stringify(businessInfo, null, 2));
    
    return true;
  } catch (error) {
    console.error('❌ Error connecting to WellnessLiving API Proxy:', 
      error.response ? error.response.data : error.message);
    return false;
  }
}

// Run the test
testConnection()
  .then(success => {
    if (success) {
      console.log('Connection test completed successfully!');
    } else {
      console.log('Connection test failed. Please check your configuration and credentials.');
    }
  })
  .catch(error => {
    console.error('Unexpected error during test:', error);
  });
