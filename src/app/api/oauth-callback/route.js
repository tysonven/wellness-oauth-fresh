// wellness-oauth-fresh/src/app/api/oauth-callback/route.js
export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const code = searchParams.get('code');
    const location_id = searchParams.get('location_id'); // If GHL sends this as a query param
  
    console.log("[OAUTH CALLBACK MINIMAL TEST] App Router Function hit! Path: /api/oauth-callback");
    console.log("[OAUTH CALLBACK MINIMAL TEST] Request Query Code:", code);
    console.log("[OAUTH CALLBACK MINIMAL TEST] Request Query Location ID:", location_id);
  
    // For now, just send a success response. We'll add token exchange later.
    return new Response("Minimal test OK from /api/oauth-callback (App Router). Check Vercel logs.", {
      status: 200,
    });
  }
  