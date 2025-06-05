// wellness-oauth-fresh/src/app/api/oauth-callback/route.js
import axios from 'axios';

  const { 
    PaginationHandler, 
    RateLimiter, 
    BatchProcessor, 
    QueryCache 
} = require('@/lib/performance_optimization');

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get('code');
  // const location_id = searchParams.get('location_id'); // GHL might send this, or it might be in the token response

  console.log("[OAUTH CALLBACK] App Router Function hit! Path: /api/oauth-callback");
  console.log("[OAUTH CALLBACK] Request Query Code:", code);

  if (!code) {
    console.error("[OAUTH CALLBACK ERROR] Authorization code is missing");
    // Redirect to an error page on your site
    const errorUrl = new URL("/error.html", request.url);
    errorUrl.searchParams.set("error_message", "Authorization code is missing from GoHighLevel callback.");
    return Response.redirect(errorUrl);
  }

  try {
    const params = new URLSearchParams();
    params.append('client_id', process.env.CLIENT_ID); // Using your existing env var name
    params.append('client_secret', process.env.CLIENT_SECRET); // Using your existing env var name
    params.append('grant_type', 'authorization_code');
    params.append('code', code);
    params.append('redirect_uri', process.env.REDIRECT_URI); // Ensure REDIRECT_URI is also set in Vercel env vars
    params.append('user_type', 'Location'); // Or 'Company' if needed

    console.log("[OAUTH CALLBACK] Attempting to exchange code for token with params:", {
      client_id: process.env.CLIENT_ID ? 'CLIENT_ID_SET' : 'CLIENT_ID_MISSING',
      client_secret: process.env.CLIENT_SECRET ? 'CLIENT_SECRET_SET' : 'CLIENT_SECRET_MISSING',
      grant_type: 'authorization_code',
      code: code ? 'CODE_RECEIVED' : 'CODE_MISSING_IN_LOGIC',
      redirect_uri: process.env.REDIRECT_URI ? process.env.REDIRECT_URI : 'REDIRECT_URI_MISSING_FROM_ENV',
      user_type: 'Location'
    });

    const tokenResponse = await axios.post('https://services.leadconnectorhq.com/oauth/token',
      params, // URLSearchParams will be correctly sent as x-www-form-urlencoded
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
      }
    ) ;

    const { access_token, refresh_token, expires_in, locationId, companyId, userId } = tokenResponse.data;

    console.log("[OAUTH CALLBACK SUCCESS] Tokens received:");
    console.log("Access Token:", access_token ? 'ACCESS_TOKEN_RECEIVED' : 'NO_ACCESS_TOKEN');
    console.log("Refresh Token:", refresh_token ? 'REFRESH_TOKEN_RECEIVED' : 'NO_REFRESH_TOKEN');
    console.log("Expires In:", expires_in);
    console.log("Location ID from token response:", locationId);
    console.log("Company ID from token response:", companyId);
    console.log("User ID from token response:", userId);

    // TODO: Store the tokens securely (e.g., in a database associated with locationId or companyId)

    // Redirect user to a success page
    const successUrl = new URL("/connected.html", request.url);
    return Response.redirect(successUrl);

  } catch (error) {
    console.error('[OAUTH CALLBACK TOKEN EXCHANGE ERROR]', error.response ? error.response.data : error.message);
    if (error.response && error.response.data) {
      console.error("[OAUTH CALLBACK ERROR DETAILS] Status:", error.response.status);
      console.error("[OAUTH CALLBACK ERROR DETAILS] Headers:", JSON.stringify(error.response.headers, null, 2));
      console.error("[OAUTH CALLBACK ERROR DETAILS] Data:", JSON.stringify(error.response.data, null, 2));
    }
    // Redirect user to an error page
    const errorUrl = new URL("/error.html", request.url);
    errorUrl.searchParams.set("error_message", "Failed to exchange authorization code for token.");
    if (error.response && error.response.data && error.response.data.error_description) {
        errorUrl.searchParams.set("error_details", error.response.data.error_description);
    }
    return Response.redirect(errorUrl);
  }
}
