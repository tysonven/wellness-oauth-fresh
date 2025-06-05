/**
 * WellnessLiving API Client
 * 
 * This module provides a client for interacting with the WellnessLiving API Proxy.
 * It handles authentication, token management, and provides methods for making
 * API requests.
 */

const axios = require('axios');
const { URLSearchParams } = require('url');

class WellnessLivingClient {
  /**
   * Create a new WellnessLiving API client
   * @param {Object} config - Configuration object
   * @param {string} environment - 'uat' or 'production'
   */
  constructor(options) {
    if (options.config) {
      // New structure with config object passed in
      this.environment = options.environment || 'uat';
      this.config = options.config;
      this.envConfig = this.config[this.environment];
      this.businessConfig = this.config.business;
    } else {
      // Original structure for backward compatibility
      this.environment = options.environment || 'uat';
      this.config = options;
      this.envConfig = options[this.environment];
      this.businessConfig = options.business;
    }
    this.token = null;
    this.tokenExpiry = null;
  }  

  /**
   * Get an access token, refreshing if necessary
   * @returns {Promise<string>} Access token
   */
  async getAccessToken() {
    // Check if token exists and is not expired
    const now = Date.now();
    if (this.token && this.tokenExpiry && now < this.tokenExpiry) {
      return this.token;
    }
    
    // Request new token
    try {
      console.log(`Requesting new access token from ${this.envConfig.tokenUrl}`);
      
      const params = new URLSearchParams();
      params.append('grant_type', 'client_credentials');
      params.append('client_id', this.envConfig.clientId);
      params.append('client_secret', this.envConfig.clientSecret);
      
      const response = await axios({
        method: 'POST',
        url: this.envConfig.tokenUrl,
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        data: params
      });
      
      // Store token and calculate expiry time (subtract 60 seconds as buffer)
      this.token = response.data.access_token;
      this.tokenExpiry = now + ((response.data.expires_in - 60) * 1000);
      
      console.log(`Successfully obtained access token, valid until ${new Date(this.tokenExpiry).toISOString()}`);
      
      return this.token;
    } catch (error) {
      console.error('Error obtaining access token:', error.response ? error.response.data : error.message);
      throw error;
    }
  }
  
  /**
   * Make an authenticated API request
   * @param {string} endpoint - API endpoint path
   * @param {Object} options - Request options
   * @returns {Promise<Object>} API response
   */
  async request(endpoint, options = {}) {
    // Default options
    const defaultOptions = {
      method: 'GET',
      params: {},
      data: null,
    };
    
    // Merge options
    const requestOptions = { ...defaultOptions, ...options };
    
    try {
      // Get access token
      const token = await this.getAccessToken();
      
      // Build URL
      let url = `${this.envConfig.baseUrl}/${endpoint}`;
      
      // Add business and region parameters if not already included
      if (!requestOptions.params.k_business) {
        requestOptions.params.k_business = this.businessConfig.k_business;
      }
      if (!requestOptions.params.id_region) {
        requestOptions.params.id_region = this.businessConfig.id_region;
      }
      
      console.log(`Making ${requestOptions.method} request to ${url}`);
      
      // Make request with axios
      const response = await axios({
        method: requestOptions.method,
        url: url,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
          ...requestOptions.headers,
        },
        params: requestOptions.params,
        data: requestOptions.data
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error making request to ${endpoint}:`, 
        error.response ? error.response.data : error.message);
      throw error;
    }
  }
  
  /**
   * Helper method for GET requests
   * @param {string} endpoint - API endpoint path
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} API response
   */
  async get(endpoint, params = {}) {
    return this.request(endpoint, { method: 'GET', params });
  }
  
  /**
   * Helper method for POST requests
   * @param {string} endpoint - API endpoint path
   * @param {Object} data - Request body
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} API response
   */
  async post(endpoint, data = {}, params = {}) {
    return this.request(endpoint, { method: 'POST', data, params });
  }
  
  /**
   * Helper method for PUT requests
   * @param {string} endpoint - API endpoint path
   * @param {Object} data - Request body
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} API response
   */
  async put(endpoint, data = {}, params = {}) {
    return this.request(endpoint, { method: 'PUT', data, params });
  }
  
  /**
   * Helper method for DELETE requests
   * @param {string} endpoint - API endpoint path
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} API response
   */
  async delete(endpoint, params = {}) {
    return this.request(endpoint, { method: 'DELETE', params });
  }
  
  /**
   * Get business information
   * @returns {Promise<Object>} Business information
   */
  async getBusinessInfo() {
    return this.get('business');
  }
  
  /**
   * Get location list
   * @returns {Promise<Object>} Location list
   */
  async getLocations() {
    return this.get('location/list');
  }
  
  /**
   * Get location details
   * @param {string} k_location - Location ID
   * @returns {Promise<Object>} Location details
   */
  async getLocationDetails(k_location) {
    return this.get('location/view', { k_location });
  }
  
  /**
   * Get class list
   * @param {string} k_location - Location ID
   * @returns {Promise<Object>} Class list
   */
  async getClasses(k_location) {
    return this.get('classes/list', { k_location });
  }
  
  /**
   * Get appointment service list
   * @param {string} k_location - Location ID
   * @returns {Promise<Object>} Appointment service list
   */
  async getAppointmentServices(k_location) {
    return this.get('appointment/book/service/list', { k_location });
  }
  
  /**
   * Get staff list for a service
   * @param {string} k_location - Location ID
   * @param {string} k_service - Service ID
   * @returns {Promise<Object>} Staff list
   */
  async getStaffForService(k_location, k_service) {
    return this.get('appointment/book/staff/list', { k_location, k_service });
  }
  
  /**
   * Get event list
   * @returns {Promise<Object>} Event list
   */
  async getEvents() {
    return this.get('event/list');
  }
}

module.exports = WellnessLivingClient;
