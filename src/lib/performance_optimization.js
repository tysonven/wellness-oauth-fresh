/**
 * Performance Optimization Module for WellnessLiving to GoHighLevel Integration
 * 
 * This module provides performance optimization features for handling large volumes of data
 * efficiently, including pagination, rate limiting, batch processing, and query caching.
 */

/**
 * PaginationHandler - Efficiently processes large datasets from API endpoints
 * 
 * Features:
 * - Automatically handles paginated API responses
 * - Supports both sequential and concurrent page fetching
 * - Provides a unified interface for accessing all data
 * - Includes detailed logging and error handling
 */
class PaginationHandler {
    /**
     * Create a new pagination handler
     * @param {Function} fetchFunction - Function that fetches a page of data
     * @param {Object} options - Configuration options
     * @param {number} options.pageSize - Number of items per page
     * @param {number} options.concurrency - Number of concurrent requests (default: 1)
     * @param {number} options.maxPages - Maximum number of pages to fetch (default: Infinity)
     * @param {Function} options.logger - Logging function (default: console.log)
     */
    constructor(fetchFunction, options = {}) {
      this.fetchFunction = fetchFunction;
      this.pageSize = options.pageSize || 50;
      this.concurrency = options.concurrency || 1;
      this.maxPages = options.maxPages || Infinity;
      this.logger = options.logger || console.log;
      this.totalItems = 0;
      this.totalPages = 0;
      this.currentPage = 0;
      this.allData = [];
      this.hasMorePages = true;
      this.errors = [];
    }
  
    /**
     * Fetch a single page of data
     * @param {number} page - Page number to fetch (0-based)
     * @param {Object} additionalParams - Additional parameters to pass to the fetch function
     * @returns {Promise<Object>} Page data
     */
    async fetchPage(page, additionalParams = {}) {
      try {
        const params = {
          page_size: this.pageSize,
          page: page,
          ...additionalParams
        };
  
        this.logger(`Fetching page ${page + 1} with page size ${this.pageSize}`);
        const response = await this.fetchFunction(params);
        
        // Handle different API response formats
        let items = [];
        let hasMore = false;
        
        if (Array.isArray(response)) {
          // Simple array response
          items = response;
          hasMore = items.length === this.pageSize;
        } else if (response.data && Array.isArray(response.data)) {
          // { data: [...] } format
          items = response.data;
          hasMore = items.length === this.pageSize;
          
          // Check if the API provides pagination info
          if (response.has_more !== undefined) {
            hasMore = response.has_more;
          } else if (response.pagination && response.pagination.has_more !== undefined) {
            hasMore = response.pagination.has_more;
          }
        } else if (response.items && Array.isArray(response.items)) {
          // { items: [...] } format
          items = response.items;
          hasMore = items.length === this.pageSize;
          
          // Check if the API provides pagination info
          if (response.has_more !== undefined) {
            hasMore = response.has_more;
          } else if (response.pagination && response.pagination.has_more !== undefined) {
            hasMore = response.pagination.has_more;
          }
        }
        
        return {
          items,
          hasMore,
          page,
          pageSize: this.pageSize,
          totalItems: items.length
        };
      } catch (error) {
        this.logger(`Error fetching page ${page + 1}: ${error.message}`);
        this.errors.push({
          page,
          error: error.message,
          timestamp: new Date().toISOString()
        });
        
        return {
          items: [],
          hasMore: false,
          page,
          pageSize: this.pageSize,
          totalItems: 0,
          error: error.message
        };
      }
    }
  
    /**
     * Fetch all pages sequentially
     * @param {Object} additionalParams - Additional parameters to pass to the fetch function
     * @returns {Promise<Array>} All items from all pages
     */
    async fetchAllPages(additionalParams = {}) {
      this.allData = [];
      this.currentPage = 0;
      this.totalPages = 0;
      this.totalItems = 0;
      this.errors = [];
      this.hasMorePages = true;
      
      const startTime = Date.now();
      this.logger(`Starting pagination with page size ${this.pageSize}`);
      
      while (this.hasMorePages && this.currentPage < this.maxPages) {
        const pageData = await this.fetchPage(this.currentPage, additionalParams);
        
        if (pageData.items.length > 0) {
          this.allData = this.allData.concat(pageData.items);
          this.totalItems += pageData.items.length;
        }
        
        this.hasMorePages = pageData.hasMore;
        this.currentPage++;
        this.totalPages++;
        
        if (!this.hasMorePages) {
          this.logger(`No more pages available after page ${this.currentPage}`);
          break;
        }
        
        if (this.currentPage >= this.maxPages) {
          this.logger(`Reached maximum page limit of ${this.maxPages}`);
          break;
        }
      }
      
      const duration = (Date.now() - startTime) / 1000;
      this.logger(`Pagination complete. Fetched ${this.totalItems} items from ${this.totalPages} pages in ${duration.toFixed(2)} seconds`);
      
      if (this.errors.length > 0) {
        this.logger(`Encountered ${this.errors.length} errors during pagination`);
      }
      
      return this.allData;
    }
  
    /**
     * Fetch all pages concurrently (with limited concurrency)
     * @param {Object} additionalParams - Additional parameters to pass to the fetch function
     * @returns {Promise<Array>} All items from all pages
     */
    async fetchAllPagesConcurrently(additionalParams = {}) {
      // First, fetch the first page to determine total pages
      const firstPageData = await this.fetchPage(0, additionalParams);
      
      this.allData = firstPageData.items;
      this.totalItems = firstPageData.items.length;
      this.hasMorePages = firstPageData.hasMore;
      
      if (!this.hasMorePages) {
        this.logger('Only one page of data available');
        return this.allData;
      }
      
      // Determine how many more pages to fetch
      const pagesToFetch = [];
      let currentPage = 1;
      
      while (this.hasMorePages && currentPage < this.maxPages) {
        pagesToFetch.push(currentPage);
        currentPage++;
        
        // If we've reached the maximum pages, stop
        if (currentPage >= this.maxPages) {
          break;
        }
        
        // If the API told us exactly how many pages there are, use that
        if (firstPageData.totalPages && currentPage >= firstPageData.totalPages) {
          break;
        }
      }
      
      this.logger(`Fetching ${pagesToFetch.length} additional pages concurrently with concurrency ${this.concurrency}`);
      
      // Process pages in batches based on concurrency
      for (let i = 0; i < pagesToFetch.length; i += this.concurrency) {
        const batch = pagesToFetch.slice(i, i + this.concurrency);
        const pagePromises = batch.map(page => this.fetchPage(page, additionalParams));
        
        const results = await Promise.all(pagePromises);
        
        for (const pageData of results) {
          if (pageData.items.length > 0) {
            this.allData = this.allData.concat(pageData.items);
            this.totalItems += pageData.items.length;
          }
          
          this.hasMorePages = pageData.hasMore;
          this.totalPages++;
          
          if (!this.hasMorePages) {
            break;
          }
        }
        
        if (!this.hasMorePages) {
          break;
        }
      }
      
      this.logger(`Concurrent pagination complete. Fetched ${this.totalItems} items from ${this.totalPages} pages`);
      
      if (this.errors.length > 0) {
        this.logger(`Encountered ${this.errors.length} errors during pagination`);
      }
      
      return this.allData;
    }
  
    /**
     * Get statistics about the pagination process
     * @returns {Object} Pagination statistics
     */
    getStats() {
      return {
        totalItems: this.totalItems,
        totalPages: this.totalPages,
        pageSize: this.pageSize,
        hasMorePages: this.hasMorePages,
        errors: this.errors.length,
        errorDetails: this.errors
      };
    }
  }
  
  /**
   * RateLimiter - Prevents API throttling by controlling request rates
   * 
   * Features:
   * - Implements token bucket algorithm for request throttling
   * - Automatically delays requests when approaching limits
   * - Detects and handles rate limit errors with exponential backoff
   * - Tracks API usage across multiple endpoints
   */
  class RateLimiter {
    /**
     * Create a new rate limiter
     * @param {Object} options - Configuration options
     * @param {number} options.maxRequests - Maximum number of requests allowed in the time window
     * @param {number} options.timeWindowMs - Time window in milliseconds
     * @param {number} options.minDelayMs - Minimum delay between requests in milliseconds (default: 0)
     * @param {Function} options.logger - Logging function (default: console.log)
     */
    constructor(options = {}) {
      this.maxRequests = options.maxRequests || 60; // Default: 60 requests
      this.timeWindowMs = options.timeWindowMs || 60000; // Default: 1 minute
      this.minDelayMs = options.minDelayMs || 0; // Default: no minimum delay
      this.logger = options.logger || console.log;
      
      // Token bucket implementation
      this.tokens = this.maxRequests;
      this.lastRefillTime = Date.now();
      
      // Request tracking
      this.requestHistory = [];
      this.rateLimitErrors = 0;
      this.currentBackoffMs = 1000; // Start with 1 second backoff
    }
  
    /**
     * Refill tokens based on elapsed time
     * @private
     */
    _refillTokens() {
      const now = Date.now();
      const elapsedMs = now - this.lastRefillTime;
      
      if (elapsedMs > 0) {
        // Calculate how many tokens to add based on elapsed time
        const tokensToAdd = (elapsedMs / this.timeWindowMs) * this.maxRequests;
        
        this.tokens = Math.min(this.maxRequests, this.tokens + tokensToAdd);
        this.lastRefillTime = now;
      }
    }
  
    /**
     * Wait for a token to become available
     * @returns {Promise<void>}
     * @private
     */
    async _waitForToken() {
      // Refill tokens based on elapsed time
      this._refillTokens();
      
      if (this.tokens >= 1) {
        // If we have tokens available, consume one and continue
        this.tokens -= 1;
        
        // Apply minimum delay if specified
        if (this.minDelayMs > 0) {
          await new Promise(resolve => setTimeout(resolve, this.minDelayMs));
        }
        
        return;
      }
      
      // Calculate how long to wait for a token to become available
      const tokensNeeded = 1 - this.tokens;
      const timeToWaitMs = (tokensNeeded / this.maxRequests) * this.timeWindowMs;
      
      this.logger(`Rate limit approaching. Waiting ${timeToWaitMs.toFixed(0)}ms before next request`);
      
      // Wait for the calculated time
      await new Promise(resolve => setTimeout(resolve, timeToWaitMs));
      
      // Refill tokens and consume one
      this._refillTokens();
      this.tokens -= 1;
    }
  
    /**
     * Execute a function with rate limiting
     * @param {Function} fn - Function to execute
     * @param {Object} options - Additional options
     * @param {boolean} options.priority - Whether this is a high-priority request (default: false)
     * @param {number} options.retries - Number of retries for rate limit errors (default: 3)
     * @returns {Promise<any>} Result of the function
     */
    async execute(fn, options = {}) {
      const priority = options.priority || false;
      const maxRetries = options.retries !== undefined ? options.retries : 3;
      let retries = 0;
      
      // High-priority requests can bypass the token bucket when tokens are low
      if (!priority) {
        await this._waitForToken();
      } else if (this.tokens < this.maxRequests * 0.25) {
        // For high-priority requests, only wait if we're below 25% of max tokens
        this.logger('Processing high-priority request with limited rate limiting');
        await new Promise(resolve => setTimeout(resolve, this.minDelayMs));
      }
      
      // Track this request
      const requestStartTime = Date.now();
      this.requestHistory.push(requestStartTime);
      
      // Clean up old request history
      const cutoffTime = requestStartTime - this.timeWindowMs;
      this.requestHistory = this.requestHistory.filter(time => time >= cutoffTime);
      
      try {
        // Execute the function
        const result = await fn();
        
        // Reset backoff on success
        this.currentBackoffMs = 1000;
        
        return result;
      } catch (error) {
        // Check if this is a rate limit error
        const isRateLimitError = 
          error.message.includes('rate limit') || 
          error.message.includes('too many requests') ||
          error.status === 429 ||
          error.statusCode === 429;
        
        if (isRateLimitError && retries < maxRetries) {
          this.rateLimitErrors++;
          
          // Apply exponential backoff
          const backoffMs = this.currentBackoffMs;
          this.currentBackoffMs *= 2; // Double the backoff time for next error
          
          this.logger(`Rate limit exceeded. Backing off for ${backoffMs}ms before retry ${retries + 1}/${maxRetries}`);
          
          // Wait for the backoff period
          await new Promise(resolve => setTimeout(resolve, backoffMs));
          
          // Retry the request
          retries++;
          return this.execute(fn, { ...options, retries: maxRetries - retries });
        }
        
        // If it's not a rate limit error or we've exceeded retries, rethrow
        throw error;
      }
    }
  
    /**
     * Get the current rate limit status
     * @returns {Object} Rate limit status
     */
    getStatus() {
      this._refillTokens();
      
      return {
        availableTokens: this.tokens,
        maxTokens: this.maxRequests,
        requestsInWindow: this.requestHistory.length,
        rateLimitErrors: this.rateLimitErrors,
        currentBackoffMs: this.currentBackoffMs,
        timeWindowMs: this.timeWindowMs
      };
    }
  
    /**
     * Reset the rate limiter
     */
    reset() {
      this.tokens = this.maxRequests;
      this.lastRefillTime = Date.now();
      this.requestHistory = [];
      this.rateLimitErrors = 0;
      this.currentBackoffMs = 1000;
    }
  }
  
  /**
   * BatchProcessor - Enables efficient data synchronization
   * 
   * Features:
   * - Processes records in configurable batch sizes
   * - Supports parallel processing with adjustable concurrency
   * - Handles partial batch failures gracefully
   * - Provides detailed processing statistics
   */
  class BatchProcessor {
    /**
     * Create a new batch processor
     * @param {Object} options - Configuration options
     * @param {number} options.batchSize - Number of items per batch
     * @param {number} options.concurrency - Number of concurrent batches (default: 1)
     * @param {boolean} options.continueOnError - Whether to continue processing after errors (default: true)
     * @param {Function} options.logger - Logging function (default: console.log)
     */
    constructor(options = {}) {
      this.batchSize = options.batchSize || 50;
      this.concurrency = options.concurrency || 1;
      this.continueOnError = options.continueOnError !== false;
      this.logger = options.logger || console.log;
      
      // Processing statistics
      this.stats = {
        totalItems: 0,
        processedItems: 0,
        failedItems: 0,
        totalBatches: 0,
        successfulBatches: 0,
        failedBatches: 0,
        startTime: null,
        endTime: null,
        errors: []
      };
    }
  
    /**
     * Process a single batch of items
     * @param {Array} batch - Batch of items to process
     * @param {Function} processFn - Function to process each item
     * @param {number} batchIndex - Index of the batch
     * @returns {Promise<Object>} Batch processing results
     * @private
     */
    async _processBatch(batch, processFn, batchIndex) {
      const batchResults = {
        batchIndex,
        totalItems: batch.length,
        successfulItems: 0,
        failedItems: 0,
        errors: []
      };
      
      this.logger(`Processing batch ${batchIndex + 1} with ${batch.length} items`);
      
      for (let i = 0; i < batch.length; i++) {
        const item = batch[i];
        const itemIndex = batchIndex * this.batchSize + i;
        
        try {
          await processFn(item, itemIndex);
          batchResults.successfulItems++;
        } catch (error) {
          batchResults.failedItems++;
          batchResults.errors.push({
            item,
            itemIndex,
            error: error.message,
            timestamp: new Date().toISOString()
          });
          
          this.logger(`Error processing item ${itemIndex}: ${error.message}`);
          
          // If we're not continuing on error, stop processing this batch
          if (!this.continueOnError) {
            this.logger(`Stopping batch ${batchIndex + 1} due to error`);
            break;
          }
        }
      }
      
      return batchResults;
    }
  
    /**
     * Process all items in batches
     * @param {Array} items - Items to process
     * @param {Function} processFn - Function to process each item
     * @returns {Promise<Object>} Processing results
     */
    async processAll(items, processFn) {
      // Reset statistics
      this.stats = {
        totalItems: items.length,
        processedItems: 0,
        failedItems: 0,
        totalBatches: 0,
        successfulBatches: 0,
        failedBatches: 0,
        startTime: Date.now(),
        endTime: null,
        errors: []
      };
      
      this.logger(`Starting batch processing of ${items.length} items with batch size ${this.batchSize} and concurrency ${this.concurrency}`);
      
      // Create batches
      const batches = [];
      for (let i = 0; i < items.length; i += this.batchSize) {
        batches.push(items.slice(i, i + this.batchSize));
      }
      
      this.stats.totalBatches = batches.length;
      
      // Process batches with limited concurrency
      for (let i = 0; i < batches.length; i += this.concurrency) {
        const batchGroup = batches.slice(i, i + this.concurrency);
        const batchPromises = batchGroup.map((batch, index) => 
          this._processBatch(batch, processFn, i + index)
        );
        
        const batchResults = await Promise.all(batchPromises);
        
        // Update statistics
        for (const result of batchResults) {
          this.stats.processedItems += result.successfulItems;
          this.stats.failedItems += result.failedItems;
          
          if (result.failedItems === 0) {
            this.stats.successfulBatches++;
          } else {
            this.stats.failedBatches++;
            this.stats.errors = this.stats.errors.concat(result.errors);
          }
        }
      }
      
      this.stats.endTime = Date.now();
      const duration = (this.stats.endTime - this.stats.startTime) / 1000;
      
      this.logger(`Batch processing complete. Processed ${this.stats.processedItems} items successfully and ${this.stats.failedItems} items failed in ${duration.toFixed(2)} seconds`);
      
      return this.getStats();
    }
  
    /**
     * Get statistics about the batch processing
     * @returns {Object} Batch processing statistics
     */
    getStats() {
      const duration = this.stats.endTime 
        ? (this.stats.endTime - this.stats.startTime) / 1000 
        : (Date.now() - this.stats.startTime) / 1000;
      
      return {
        ...this.stats,
        duration,
        itemsPerSecond: this.stats.processedItems / duration,
        successRate: this.stats.totalItems > 0 
          ? (this.stats.processedItems / this.stats.totalItems) * 100 
          : 0,
        batchSuccessRate: this.stats.totalBatches > 0 
          ? (this.stats.successfulBatches / this.stats.totalBatches) * 100 
          : 0
      };
    }
  }
  
  /**
   * QueryCache - Improves performance by caching API responses
   * 
   * Features:
   * - Implements efficient caching for frequently accessed data
   * - Automatically manages cache expiration
   * - Provides cache statistics for monitoring
   * - Supports complex query parameter caching
   */
  class QueryCache {
    /**
     * Create a new query cache
     * @param {Object} options - Configuration options
     * @param {number} options.ttlMs - Time-to-live in milliseconds (default: 5 minutes)
     * @param {number} options.maxSize - Maximum number of cached items (default: 1000)
     * @param {Function} options.logger - Logging function (default: console.log)
     */
    constructor(options = {}) {
      this.ttlMs = options.ttlMs || 5 * 60 * 1000; // Default: 5 minutes
      this.maxSize = options.maxSize || 1000;
      this.logger = options.logger || console.log;
      
      this.cache = new Map();
      this.stats = {
        hits: 0,
        misses: 0,
        expirations: 0,
        evictions: 0,
        size: 0
      };
    }
  
    /**
     * Generate a cache key from a resource and parameters
     * @param {string} resource - Resource identifier
     * @param {Object} params - Query parameters
     * @returns {string} Cache key
     * @private
     */
    _generateKey(resource, params = {}) {
      // Sort parameters to ensure consistent key generation
      const sortedParams = {};
      Object.keys(params).sort().forEach(key => {
        sortedParams[key] = params[key];
      });
      
      return `${resource}:${JSON.stringify(sortedParams)}`;
    }
  
    /**
     * Clean up expired cache entries
     * @private
     */
    _cleanupExpired() {
      const now = Date.now();
      let expiredCount = 0;
      
      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
          expiredCount++;
        }
      }
      
      if (expiredCount > 0) {
        this.stats.expirations += expiredCount;
        this.stats.size = this.cache.size;
        this.logger(`Cleaned up ${expiredCount} expired cache entries`);
      }
    }
  
    /**
     * Evict least recently used entries if cache is full
     * @private
     */
    _evictIfNeeded() {
      if (this.cache.size <= this.maxSize) {
        return;
      }
      
      // Sort entries by last accessed time
      const entries = Array.from(this.cache.entries())
        .sort((a, b) => a[1].lastAccessed - b[1].lastAccessed);
      
      // Evict oldest 10% of entries
      const evictCount = Math.ceil(this.maxSize * 0.1);
      for (let i = 0; i < evictCount && i < entries.length; i++) {
        this.cache.delete(entries[i][0]);
      }
      
      this.stats.evictions += evictCount;
      this.stats.size = this.cache.size;
      this.logger(`Evicted ${evictCount} least recently used cache entries`);
    }
  
    /**
     * Get a value from the cache
     * @param {string} resource - Resource identifier
     * @param {Object} params - Query parameters
     * @returns {any|null} Cached value or null if not found
     */
    get(resource, params = {}) {
      const key = this._generateKey(resource, params);
      const entry = this.cache.get(key);
      
      if (!entry) {
        this.stats.misses++;
        return null;
      }
      
      const now = Date.now();
      
      // Check if the entry has expired
      if (now > entry.expiresAt) {
        this.cache.delete(key);
        this.stats.expirations++;
        this.stats.misses++;
        this.stats.size = this.cache.size;
        return null;
      }
      
      // Update last accessed time
      entry.lastAccessed = now;
      this.stats.hits++;
      
      return entry.value;
    }
  
    /**
     * Set a value in the cache
     * @param {string} resource - Resource identifier
     * @param {Object} params - Query parameters
     * @param {any} value - Value to cache
     * @param {number} ttlMs - Custom TTL in milliseconds (optional)
     */
    set(resource, params = {}, value, ttlMs) {
      // Clean up expired entries
      this._cleanupExpired();
      
      // Evict entries if needed
      this._evictIfNeeded();
      
      const key = this._generateKey(resource, params);
      const now = Date.now();
      
      this.cache.set(key, {
        value,
        createdAt: now,
        lastAccessed: now,
        expiresAt: now + (ttlMs || this.ttlMs)
      });
      
      this.stats.size = this.cache.size;
    }
  
    /**
     * Execute a function with caching
     * @param {string} resource - Resource identifier
     * @param {Object} params - Query parameters
     * @param {Function} fn - Function to execute if cache miss
     * @param {number} ttlMs - Custom TTL in milliseconds (optional)
     * @returns {Promise<any>} Result (either from cache or function execution)
     */
    async executeWithCache(resource, params = {}, fn, ttlMs) {
      // Try to get from cache first
      const cachedValue = this.get(resource, params);
      
      if (cachedValue !== null) {
        return cachedValue;
      }
      
      // If not in cache, execute the function
      const result = await fn();
      
      // Cache the result
      this.set(resource, params, result, ttlMs);
      
      return result;
    }
  
    /**
     * Clear the entire cache
     */
    clear() {
      const size = this.cache.size;
      this.cache.clear();
      this.stats.size = 0;
      this.logger(`Cleared cache (${size} entries removed)`);
    }
  
    /**
     * Clear specific entries from the cache
     * @param {string} resourcePrefix - Resource prefix to clear (optional)
     */
    clearByPrefix(resourcePrefix) {
      if (!resourcePrefix) {
        this.clear();
        return;
      }
      
      let count = 0;
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${resourcePrefix}:`)) {
          this.cache.delete(key);
          count++;
        }
      }
      
      this.stats.size = this.cache.size;
      this.logger(`Cleared ${count} cache entries with prefix "${resourcePrefix}"`);
    }
  
    /**
     * Get cache statistics
     * @returns {Object} Cache statistics
     */
    getStats() {
      return {
        ...this.stats,
        hitRate: (this.stats.hits + this.stats.misses) > 0 
          ? (this.stats.hits / (this.stats.hits + this.stats.misses)) * 100 
          : 0,
        utilizationRate: (this.stats.size / this.maxSize) * 100
      };
    }
  }
  
  module.exports = {
    PaginationHandler,
    RateLimiter,
    BatchProcessor,
    QueryCache
  };
  