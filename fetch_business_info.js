// Step 2: Using the token from the local proxy server to access a protected endpoint

import fetch from 'node-fetch';

const API_URL = 'https://uat-api.wellnessliving.io/v1/location/view';

const fetchToken = async () => {
  const response = await fetch('http://localhost:3000/token');
  const data = await response.json();
  return data.access_token;
};

const callProtectedAPI = async () => {
  const token = await fetchToken();

  const queryParams = new URLSearchParams({
    id_region: '1',
    k_business: '50312',
    k_location: '5000000296',
    i_logo_height: '100',
    i_logo_width: '220',
  });

  const response = await fetch(`${API_URL}?${queryParams}`, {
    method: 'GET',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const text = await response.text();
    console.error('❌ Error fetching business info:', text);
    throw new Error(`❌ Final Error: ${response.statusText}`);
  }

  const json = await response.json();
  console.log('✅ Business info:', json);
};

callProtectedAPI().catch(console.error);
