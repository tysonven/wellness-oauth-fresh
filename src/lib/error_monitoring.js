/**
 * Enhanced error monitoring and logging system for WellnessLiving to GoHighLevel integration
 * 
 * This module provides comprehensive error tracking, logging, and alerting capabilities
 * for production environments. It includes:
 * - Multi-level logging (debug, info, warn, error)
 * - Error categorization and classification
 * - Structured error objects with context
 * - Alert notifications for critical errors
 * - Log rotation and persistence
 */

const fs = require('fs');
const path = require('path');
const config = require('../../config');

// Define log levels and their numeric values for comparison
const LOG_LEVELS = {
  DEBUG: 0,
  INFO: 1,
  WARN: 2,
  ERROR: 3,
  NONE: 4
};

// Convert string log level from config to numeric value
const getNumericLogLevel = (levelString) => {
  const level = levelString.toUpperCase();
  return LOG_LEVELS[level] !== undefined ? LOG_LEVELS[level] : LOG_LEVELS.INFO;
};

// Current log level from config
const currentLogLevel = getNumericLogLevel(config.sync.logLevel);

// Error categories for better classification
const ERROR_CATEGORIES = {
  AUTHENTICATION: 'authentication',
  NETWORK: 'network',
  API: 'api',
  DATA: 'data',
  VALIDATION: 'validation',
  SYNC: 'sync',
  CONFIGURATION: 'configuration',
  UNKNOWN: 'unknown'
};

// Create logs directory if it doesn't exist
const logsDir = path.join(process.cwd(), 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Log file paths
const logFilePath = path.join(logsDir, 'sync.log');
const errorLogFilePath = path.join(logsDir, 'error.log');

/**
 * Enhanced Error class with additional context and metadata
 */
class SyncError extends Error {
  constructor(message, options = {}) {
    super(message);
    this.name = 'SyncError';
    this.category = options.category || ERROR_CATEGORIES.UNKNOWN;
    this.code = options.code || 'ERR_UNKNOWN';
    this.context = options.context || {};
    this.timestamp = new Date().toISOString();
    this.retryable = options.retryable !== undefined ? options.retryable : true;
    this.severity = options.severity || 'error';
    this.source = options.source || 'sync';
    
    // Capture stack trace
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, SyncError);
    }
  }

  // Convert to JSON for logging
  toJSON() {
    return {
      name: this.name,
      message: this.message,
      category: this.category,
      code: this.code,
      context: this.context,
      timestamp: this.timestamp,
      retryable: this.retryable,
      severity: this.severity,
      source: this.source,
      stack: this.stack
    };
  }
}

/**
 * Logger class for handling all logging operations
 */
class Logger {
  constructor() {
    this.alertHandlers = [];
  }

  /**
   * Add an alert handler for critical errors
   * @param {Function} handler Function to call when critical errors occur
   */
  addAlertHandler(handler) {
    if (typeof handler === 'function') {
      this.alertHandlers.push(handler);
    }
  }

  /**
   * Log a message at the specified level
   * @param {string} level Log level (debug, info, warn, error)
   * @param {string} message Log message
   * @param {Object} data Additional data to log
   */
  log(level, message, data = {}) {
    const levelUpper = level.toUpperCase();
    const numericLevel = LOG_LEVELS[levelUpper] || LOG_LEVELS.INFO;
    
    // Only log if the message's level is >= the configured level
    if (numericLevel >= currentLogLevel) {
      const timestamp = new Date().toISOString();
      const logEntry = {
        timestamp,
        level: levelUpper,
        message,
        ...data
      };
      
      // Format log entry
      const logString = `[${timestamp}] [${levelUpper}] ${message} ${
        Object.keys(data).length ? JSON.stringify(data) : ''
      }`;
      
      // Console output
      switch (levelUpper) {
        case 'DEBUG':
          console.debug(logString);
          break;
        case 'INFO':
          console.info(logString);
          break;
        case 'WARN':
          console.warn(logString);
          break;
        case 'ERROR':
          console.error(logString);
          break;
        default:
          console.log(logString);
      }
      
      // Write to log file
      try {
        fs.appendFileSync(logFilePath, logString + '\n');
        
        // Also write errors to the error log
        if (levelUpper === 'ERROR') {
          fs.appendFileSync(errorLogFilePath, logString + '\n');
          
          // Trigger alerts for errors if handlers exist
          this.triggerAlerts(message, data);
        }
      } catch (err) {
        console.error('Failed to write to log file:', err);
      }
    }
  }
  
  /**
   * Trigger alert handlers for critical errors
   * @param {string} message Error message
   * @param {Object} data Error data
   */
  triggerAlerts(message, data) {
    // Only trigger alerts in production environment
    if (config.environment === 'production' && this.alertHandlers.length > 0) {
      this.alertHandlers.forEach(handler => {
        try {
          handler(message, data);
        } catch (err) {
          console.error('Error in alert handler:', err);
        }
      });
    }
  }
  
  /**
   * Log a debug message
   * @param {string} message Debug message
   * @param {Object} data Additional data
   */
  debug(message, data = {}) {
    this.log('debug', message, data);
  }
  
  /**
   * Log an info message
   * @param {string} message Info message
   * @param {Object} data Additional data
   */
  info(message, data = {}) {
    this.log('info', message, data);
  }
  
  /**
   * Log a warning message
   * @param {string} message Warning message
   * @param {Object} data Additional data
   */
  warn(message, data = {}) {
    this.log('warn', message, data);
  }
  
  /**
   * Log an error message
   * @param {string|Error} error Error object or message
   * @param {Object} data Additional data
   */
  error(error, data = {}) {
    let errorMessage;
    let errorData = { ...data };
    
    if (error instanceof Error) {
      errorMessage = error.message;
      
      // If it's our custom SyncError, include its data
      if (error instanceof SyncError) {
        errorData = {
          ...errorData,
          category: error.category,
          code: error.code,
          context: error.context,
          retryable: error.retryable,
          severity: error.severity,
          source: error.source
        };
      }
      
      // Include stack trace
      errorData.stack = error.stack;
    } else {
      errorMessage = error;
    }
    
    this.log('error', errorMessage, errorData);
  }
  
  /**
   * Create a child logger with predefined context
   * @param {Object} context Context to include with all logs
   * @returns {Object} Child logger instance
   */
  child(context) {
    const parentLogger = this;
    
    return {
      debug: (message, data = {}) => parentLogger.debug(message, { ...context, ...data }),
      info: (message, data = {}) => parentLogger.info(message, { ...context, ...data }),
      warn: (message, data = {}) => parentLogger.warn(message, { ...context, ...data }),
      error: (error, data = {}) => parentLogger.error(error, { ...context, ...data })
    };
  }
  
  /**
   * Rotate log files if they exceed the size limit
   * @param {number} maxSizeBytes Maximum file size in bytes
   */
  rotateLogs(maxSizeBytes = 10 * 1024 * 1024) { // Default 10MB
    [logFilePath, errorLogFilePath].forEach(filePath => {
      try {
        if (fs.existsSync(filePath)) {
          const stats = fs.statSync(filePath);
          
          if (stats.size > maxSizeBytes) {
            const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
            const rotatedFilePath = `${filePath}.${timestamp}`;
            
            fs.renameSync(filePath, rotatedFilePath);
            fs.writeFileSync(filePath, ''); // Create new empty log file
            
            console.log(`Rotated log file: ${filePath} -> ${rotatedFilePath}`);
          }
        }
      } catch (err) {
        console.error(`Failed to rotate log file ${filePath}:`, err);
      }
    });
  }
}

// Create singleton logger instance
const logger = new Logger();

/**
 * Email alert handler example
 * @param {string} message Error message
 * @param {Object} data Error data
 */
const emailAlertHandler = (message, data) => {
  // In a real implementation, this would send an email
  // For now, we'll just log that an alert would be sent
  console.log(`[ALERT] Would send email alert: ${message}`);
  
  // Example of how you would integrate with an email service:
  /*
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: 'smtp.example.com',
    port: 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD
    }
  });
  
  transporter.sendMail({
    from: '"WL-GHL Integration" <integration@example.com>',
    to: "admin@example.com",
    subject: `[ERROR] WL-GHL Integration: ${message}`,
    text: `Error in WL-GHL Integration:\n\n${message}\n\nDetails:\n${JSON.stringify(data, null, 2)}`,
    html: `<h1>Error in WL-GHL Integration</h1><p>${message}</p><pre>${JSON.stringify(data, null, 2)}</pre>`
  });
  */
};

/**
 * Slack alert handler example
 * @param {string} message Error message
 * @param {Object} data Error data
 */
const slackAlertHandler = (message, data) => {
  // In a real implementation, this would send a Slack message
  // For now, we'll just log that an alert would be sent
  console.log(`[ALERT] Would send Slack alert: ${message}`);
  
  // Example of how you would integrate with Slack:
  /*
  const axios = require('axios');
  
  axios.post(process.env.SLACK_WEBHOOK_URL, {
    text: `*ERROR in WL-GHL Integration*\n${message}`,
    attachments: [
      {
        color: 'danger',
        title: 'Error Details',
        text: JSON.stringify(data, null, 2),
        footer: `Environment: ${config.environment}`
      }
    ]
  });
  */
};

// Add alert handlers if in production
if (config.environment === 'production') {
  logger.addAlertHandler(emailAlertHandler);
  logger.addAlertHandler(slackAlertHandler);
}

// Set up log rotation - check every hour
setInterval(() => {
  logger.rotateLogs();
}, 60 * 60 * 1000);

// Export the logger, error class, and categories
module.exports = {
  logger,
  SyncError,
  ERROR_CATEGORIES
};
