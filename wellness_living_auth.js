/**
 * WellnessLiving API Authentication Utility
 * 
 * This module implements the custom signature-based authentication required by the
 * WellnessLiving API as described in their documentation.
 */

const crypto = require('crypto');

/**
 * WellnessLiving API Authentication class
 */
class WellnessLivingAuth {
  /**
   * Create a new WellnessLiving authentication instance
   * @param {Object} config - Configuration options
   * @param {string} config.appId - Your application ID
   * @param {string} config.secretCode - Your application secret code
   * @param {string} config.host - API host (e.g., 'staging.wellnessliving.com')
   */
  constructor(config) {
    this.appId = config.appId;
    this.secretCode = config.secretCode;
    this.host = config.host;
    this.version = '20150518'; // Current version of authorization algorithm
  }

  /**
   * Format date in ISO 9075 format (YYYY-MM-DD HH:MM:SS) in GMT
   * @returns {string} Formatted date
   */
  getFormattedDate() {
    const now = new Date();
    const year = now.getUTCFullYear();
    const month = String(now.getUTCMonth() + 1).padStart(2, '0');
    const day = String(now.getUTCDate()).padStart(2, '0');
    const hours = String(now.getUTCHours()).padStart(2, '0');
    const minutes = String(now.getUTCMinutes()).padStart(2, '0');
    const seconds = String(now.getUTCSeconds()).padStart(2, '0');
    
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }

  /**
   * Generate the authorization header for a request
   * @param {Object} options - Request options
   * @param {string} options.method - HTTP method (GET, POST, PUT, DELETE)
   * @param {string} options.resource - Resource path (e.g., 'Wl/Business/BusinessList.json')
   * @param {Object} options.params - Request parameters
   * @param {Object} options.headers - Additional headers to include in signature
   * @param {string} options.persistentCookie - Persistent cookie value (optional)
   * @param {string} options.transientCookie - Transient cookie value (optional)
   * @returns {Object} Authorization header and date
   */
  generateAuthHeader(options) {
    // Default values
    const method = options.method || 'GET';
    const resource = options.resource || '';
    const params = options.params || {};
    const headers = { ...options.headers } || {};
    const persistentCookie = options.persistentCookie || '';
    const transientCookie = options.transientCookie || '';
    
    // Ensure date header is present and properly formatted
    const date = this.getFormattedDate();
    headers['date'] = date;
    
    // Generate signature
    const signature = this.computeSignature({
      date: date,
      method: method.toUpperCase(),
      resource: resource,
      params: params,
      headers: headers,
      persistentCookie: persistentCookie,
      transientCookie: transientCookie
    });
    
    // Get list of header names used in signature (only include date for now)
    const headerNames = 'date';
    
    // Format the authorization header
    return {
      authorization: `${this.version},${this.appId},${headerNames},${signature}`,
      date: date
    };
  }
  
  /**
   * Compute the signature for a request
   * @param {Object} data - Data for signature computation
   * @returns {string} Computed signature
   */
  computeSignature(data) {
    const signatureLines = [];
    
    // Add required signature components in specific order
    signatureLines.push('Core\\Request\\Api::20150518');
    signatureLines.push(data.date);
    signatureLines.push(this.secretCode);
    signatureLines.push(this.host);
    signatureLines.push(this.appId);
    signatureLines.push(data.method);
    signatureLines.push(data.resource);
    signatureLines.push(data.persistentCookie || '');
    signatureLines.push(data.transientCookie || '');
    
    // Add request parameters
    const params = {};
    
    // For GET requests, extract parameters from URL query string
    if (data.method === 'GET' && data.params) {
      Object.keys(data.params).forEach(key => {
        params[key.toLowerCase()] = data.params[key];
      });
    }
    // For other methods, use the request body
    else if (data.params) {
      Object.keys(data.params).forEach(key => {
        params[key.toLowerCase()] = data.params[key];
      });
    }
    
    // Sort parameters by key
    const paramKeys = Object.keys(params).sort();
    
    for (const key of paramKeys) {
      const value = params[key];
      signatureLines.push(`${key}=${value}`);
    }
    
    // Add date header to signature
    signatureLines.push(`date:${data.date}`);
    
    // Join all lines with newline character
    const stringToSign = signatureLines.join('\n');
    
    // For debugging
    // console.log('String to sign:', stringToSign);
    
    // Compute SHA-256 hash
    return crypto.createHash('sha256').update(stringToSign).digest('hex');
  }
  
  /**
   * Make an authenticated request to the WellnessLiving API
   * @param {Object} options - Request options
   * @param {string} options.method - HTTP method (GET, POST, PUT, DELETE)
   * @param {string} options.resource - Resource path (e.g., 'Wl/Business/BusinessList.json')
   * @param {Object} options.params - Request parameters
   * @param {Object} options.headers - Additional headers
   * @param {string} options.persistentCookie - Persistent cookie value (optional)
   * @param {string} options.transientCookie - Transient cookie value (optional)
   * @returns {Promise<Object>} API response
   */
  async request(options) {
    // Generate authorization header and date
    const { authorization, date } = this.generateAuthHeader(options);
    
    // Prepare URL
    const url = new URL(`https://${this.host}/api/${options.resource}`);
    
    // Add query parameters for GET requests
    if (options.method === 'GET' && options.params) {
      Object.keys(options.params).forEach(key => {
        url.searchParams.append(key, options.params[key]);
      });
    }
    
    // Prepare headers
    const headers = {
      'Authorization': authorization,
      'Content-Type': 'application/json',
      'User-Agent': 'WellnessLiving-JS-Client',
      'Date': date,
      ...options.headers
    };
    
    // Add cookies if provided
    const cookies = [];
    if (options.persistentCookie) {
      // Use the appropriate cookie name based on the environment
      // For staging: 'sp', for production: 'p'
      cookies.push(`sp=${options.persistentCookie}`);
    }
    if (options.transientCookie) {
      // Use the appropriate cookie name based on the environment
      // For staging: 'st', for production: 't'
      cookies.push(`st=${options.transientCookie}`);
    }
    if (cookies.length > 0) {
      headers['Cookie'] = cookies.join('; ');
    }
    
    // Prepare request options
    const requestOptions = {
      method: options.method,
      headers: headers
    };
    
    // Add body for non-GET requests
    if (options.method !== 'GET' && options.params) {
      requestOptions.body = JSON.stringify(options.params);
    }
    
    try {
      // Make the request
      const response = await fetch(url.toString(), requestOptions);
      
      // Check if response is ok
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Extract cookies from response
      const setCookieHeader = response.headers.get('set-cookie');
      let cookies = {};
      if (setCookieHeader) {
        // Parse cookies
        setCookieHeader.split(',').forEach(cookie => {
          const parts = cookie.split(';')[0].trim().split('=');
          if (parts.length === 2) {
            cookies[parts[0]] = parts[1];
          }
        });
      }
      
      // Parse response with error handling
      let data;
      try {
        data = await response.json();
      } catch (jsonError) {
        throw new Error(`Invalid JSON response: ${jsonError.message}`);
      }
      
      // Return response with cookies
      return {
        data,
        cookies,
        status: response.status,
        headers: Object.fromEntries(response.headers.entries())
      };
    } catch (error) {
      throw new Error(`WellnessLiving API request failed: ${error.message}`);
    }
  }
  
  /**
   * Helper method to make a GET request
   * @param {string} resource - Resource path
   * @param {Object} params - Query parameters
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} API response
   */
  async get(resource, params = {}, options = {}) {
    return this.request({
      method: 'GET',
      resource,
      params,
      ...options
    });
  }
  
  /**
   * Helper method to make a POST request
   * @param {string} resource - Resource path
   * @param {Object} params - Request body
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} API response
   */
  async post(resource, params = {}, options = {}) {
    return this.request({
      method: 'POST',
      resource,
      params,
      ...options
    });
  }
  
  /**
   * Helper method to make a PUT request
   * @param {string} resource - Resource path
   * @param {Object} params - Request body
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} API response
   */
  async put(resource, params = {}, options = {}) {
    return this.request({
      method: 'PUT',
      resource,
      params,
      ...options
    });
  }
  
  /**
   * Helper method to make a DELETE request
   * @param {string} resource - Resource path
   * @param {Object} params - Request body
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} API response
   */
  async delete(resource, params = {}, options = {}) {
    return this.request({
      method: 'DELETE',
      resource,
      params,
      ...options
    });
  }
  
  /**
   * Sign in to WellnessLiving and get session cookies
   * @param {string} username - WellnessLiving username
   * @param {string} password - WellnessLiving password
   * @returns {Promise<Object>} Session information including cookies
   */
  async signIn(username, password) {
    try {
      // First, get a notepad for the sign-in process
      const notepadResponse = await this.get('Core/Passport/NotepadModel.json');
      
      if (!notepadResponse.data || !notepadResponse.data.s_notepad) {
        throw new Error('Failed to get notepad for authentication');
      }
      
      const notepad = notepadResponse.data.s_notepad;
      
      // Hash the password with the notepad
      const hashedPassword = this.hashPassword(password, notepad);
      
      // Sign in with the username and hashed password
      const signInResponse = await this.post('Core/Passport/EnterModel.json', {
        s_login: username,
        s_password: hashedPassword,
        s_notepad: notepad
      }, {
        persistentCookie: notepadResponse.cookies.sp || notepadResponse.cookies.p,
        transientCookie: notepadResponse.cookies.st || notepadResponse.cookies.t
      });
      
      // Return session information
      return {
        success: true,
        user: signInResponse.data,
        cookies: signInResponse.cookies
      };
    } catch (error) {
      throw new Error(`WellnessLiving sign-in failed: ${error.message}`);
    }
  }
  
  /**
   * Hash a password with a notepad for authentication
   * @param {string} password - Plain text password
   * @param {string} notepad - Notepad string from the API
   * @returns {string} Hashed password
   */
  hashPassword(password, notepad) {
    // This is a simplified implementation based on the PHP example
    // The actual implementation may need to be adjusted based on how WellnessLiving expects the password to be hashed
    const hash = crypto.createHash('md5').update(password).digest('hex');
    return crypto.createHash('md5').update(hash + notepad).digest('hex');
  }
}

module.exports = WellnessLivingAuth;
