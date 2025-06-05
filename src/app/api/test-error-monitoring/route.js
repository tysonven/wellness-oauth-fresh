import { NextResponse } from 'next/server';
import { logger, SyncError, ERROR_CATEGORIES } from '@/lib/error_monitoring';

  const { 
    PaginationHandler, 
    RateLimiter, 
    BatchProcessor, 
    QueryCache 
} = require('@/lib/performance_optimization');

export async function GET(request) {
  try {
    // Log different levels
    logger.debug('This is a debug message');
    logger.info('This is an info message');
    logger.warn('This is a warning message');
    
    // Test context-specific logging
    const userLogger = logger.child({ userId: '123', action: 'test' });
    userLogger.info('User-specific log message');
    
    // Test error logging
    try {
      throw new SyncError('Test error', {
        category: ERROR_CATEGORIES.API,
        code: 'ERR_TEST',
        context: { test: true },
        retryable: false
      });
    } catch (error) {
      logger.error(error, { testCase: 'error-monitoring' });
    }
    
    return NextResponse.json({
      success: true,
      message: 'Error monitoring test complete. Check logs directory.'
    });
  } catch (error) {
    logger.error(error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
