/**
 * Test file for WellnessLiving API Authentication
 * 
 * This script tests the custom authentication implementation by making
 * a simple API call to the WellnessLiving API.
 */

const WellnessLivingAuth = require('./wellness_living_auth');

// Your WellnessLiving API credentials
// Replace these with your actual credentials
const config = {
  appId: 'uR8Zk908zCuEsjJc', // Your application ID
  secretCode: 'vEmOvZvGu1XSqD4RMqbq2tS1mdF8DPCxvxltMeEbUK5V', // Your application secret code
  host: 'staging.wellnessliving.com' // API host (staging or production)
};

// Create an instance of the WellnessLiving authentication utility
const wlAuth = new WellnessLivingAuth(config);

/**
 * Test the authentication by making a simple API call
 */
async function testAuthentication() {
  console.log('Testing WellnessLiving API Authentication...');
  
  try {
    // Test a simple API call that doesn't require user authentication
    // We'll use the Business List endpoint as it's one of the simpler ones
    console.log('Making API call to Business List endpoint...');
    
    const response = await wlAuth.get('Wl/Business/BusinessList.json');
    
    console.log('API Response Status:', response.status);
    console.log('API Response Headers:', JSON.stringify(response.headers, null, 2));
    
    if (response.status === 200) {
      console.log('Authentication successful!');
      console.log('Response Data:', JSON.stringify(response.data, null, 2));
    } else {
      console.error('Authentication failed with status:', response.status);
      console.error('Error Details:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error('Error testing authentication:', error.message);
  }
}

/**
 * Test user sign-in
 */
async function testSignIn() {
  console.log('\nTesting WellnessLiving User Sign-In...');
  
  try {
    // Replace with your actual WellnessLiving username and password
    const username = 'morninglighttest@test.com';
    const password = 'Morninglighttest123@test.com';
    
    console.log('Signing in with username:', username);
    
    const signInResult = await wlAuth.signIn(username, password);
    
    if (signInResult.success) {
      console.log('Sign-in successful!');
      console.log('User Info:', JSON.stringify(signInResult.user, null, 2));
      console.log('Session Cookies:', JSON.stringify(signInResult.cookies, null, 2));
      
      // Test an authenticated API call
      console.log('\nMaking authenticated API call to Business Account endpoint...');
      
      const response = await wlAuth.get('Wl/Business/Account/BusinessAccountModel.json', {
        is_prospects: 'false'
      }, {
        persistentCookie: signInResult.cookies.dp || signInResult.cookies.p,
        transientCookie: signInResult.cookies.dt || signInResult.cookies.t
      });
      
      console.log('API Response Status:', response.status);
      
      if (response.status === 200) {
        console.log('Authenticated API call successful!');
        console.log('Response Data:', JSON.stringify(response.data, null, 2));
      } else {
        console.error('Authenticated API call failed with status:', response.status);
        console.error('Error Details:', JSON.stringify(response.data, null, 2));
      }
    } else {
      console.error('Sign-in failed!');
      console.error('Error Details:', JSON.stringify(signInResult, null, 2));
    }
  } catch (error) {
    console.error('Error testing sign-in:', error.message);
  }
}

/**
 * Test the Business Information endpoint with a specific business ID
 */
async function testBusinessInfo() {
  console.log('\nTesting Business Information endpoint...');
  
  try {
    // Replace with your actual business ID
    const businessId = '50312';
    
    console.log('Getting information for business ID:', businessId);
    
    const response = await wlAuth.get('Wl/Business/Information/BusinessInformationModel.json', {
      k_business: businessId
    });
    
    console.log('API Response Status:', response.status);
    
    if (response.status === 200) {
      console.log('Business Information API call successful!');
      console.log('Response Data:', JSON.stringify(response.data, null, 2));
    } else {
      console.error('Business Information API call failed with status:', response.status);
      console.error('Error Details:', JSON.stringify(response.data, null, 2));
    }
  } catch (error) {
    console.error('Error testing Business Information endpoint:', error.message);
  }
}

// Run the tests
async function runTests() {
  // Test basic authentication
  await testAuthentication();
  
  // Test user sign-in
  await testSignIn();
  
  // Test business information endpoint
  await testBusinessInfo();
}

// Execute the tests
runTests().catch(console.error);
