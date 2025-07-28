// At the top of your webhook route file
import { NextResponse } from 'next/server';
import { logger } from '@/lib/error_monitoring';

// Create a webhook-specific logger
const webhookLogger = logger.child({ source: 'webhook' });
const { 
  PaginationHandler, 
  RateLimiter, 
  BatchProcessor, 
  QueryCache 
} = require('@/lib/performance_optimization');

// Use in your route handler
export async function POST(request) {
  try {
    webhookLogger.info('Webhook received');
    // Rest of your code...
    
    // Example processing
    const data = await request.json();
    webhookLogger.info('Processing webhook data', { eventType: data.event_type });
    
    // Return success response
    return NextResponse.json({ success: true });
  } catch (error) {
    webhookLogger.error(error, { 
      url: request.url,
      method: request.method
    });
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
