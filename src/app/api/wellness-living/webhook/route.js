import { NextResponse } from 'next/server';

// POST handler for receiving webhooks
export async function POST(request) {
  try {
    // Parse the webhook payload
    const payload = await request.json();
    
    // Log the webhook event
    console.log('Received webhook:', JSON.stringify(payload));
    
    // Process the webhook based on event type
    const eventType = payload.event_type || 'unknown';
    
    switch (eventType) {
      case 'class.created':
      case 'class.updated':
        // Handle class events
        console.log(`Processing ${eventType} event for class ${payload.k_class_period}`);
        // In a real implementation, you would trigger a sync for this class
        break;
        
      case 'service.created':
      case 'service.updated':
        // Handle service events
        console.log(`Processing ${eventType} event for service ${payload.k_service}`);
        // In a real implementation, you would trigger a sync for this service
        break;
        
      case 'staff.created':
      case 'staff.updated':
        // Handle staff events
        console.log(`Processing ${eventType} event for staff ${payload.k_staff}`);
        // In a real implementation, you would trigger a sync for this staff member
        break;
        
      default:
        console.log(`Unhandled event type: ${eventType}`);
    }
    
    // Return success response
    return NextResponse.json({
      success: true,
      message: 'Webhook received and processed'
    });
  } catch (error) {
    console.error('Error processing webhook:', error);
    
    // Return error response
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to process webhook',
        error: error.message
      },
      { status: 500 }
    );
  }
}
