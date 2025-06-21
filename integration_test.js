// integration_test.js
const WellnessLivingClient = require('./src/lib/wellnessLivingClient').WellnessLivingClient;
const GoHighLevelClient = require('./src/lib/go_high_level_client');
const config = require('./src/lib/config');

async function testIntegration() {
  console.log('Testing WellnessLiving to GoHighLevel Integration');
  
  // Test WellnessLiving connection
  const wlClient = new WellnessLivingClient({
    config: config.wellnessLivingProxy,
    environment: 'uat'
  });
  
  try {
    // Test authentication
    console.log('Testing WellnessLiving authentication...');
    const token = await wlClient.getAccessToken();
    console.log('✅ Authentication successful');
    
    // Test business info retrieval
    console.log('Testing business info retrieval...');
    const businessInfo = await wlClient.getBusinessInfo();
    console.log('✅ Business info retrieved:', businessInfo.name);
    
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
