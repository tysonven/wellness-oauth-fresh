/**
 * GoHighLevel API Client
 * 
 * This module provides a client for interacting with the GoHighLevel API.
 * It handles authentication and provides methods for making API requests.
 */

const axios = require('axios');

class GoHighLevelClient {
  /**
   * Create a new GoHighLevel API client
   * @param {Object} config - Configuration object
   */
  constructor(config) {
    this.config = config;
    this.apiKey = config.goHighLevel.apiKey;
    this.baseUrl = config.goHighLevel.baseUrl;
    this.locationId = config.goHighLevel.locationId;
  }

  /**
   * Make an API request to GoHighLevel
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
      // Build URL
      let url = `${this.baseUrl}/${endpoint}`;
      
      // Add location ID to the URL if it's not already in the endpoint
      if (!endpoint.includes('/locations/') && this.locationId) {
        url = `${this.baseUrl}/locations/${this.locationId}/${endpoint}`;
      }
      
      console.log(`Making ${requestOptions.method} request to GoHighLevel: ${url}`);
      
      // Make request with axios
      const response = await axios({
        method: requestOptions.method,
        url: url,
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          ...requestOptions.headers,
        },
        params: requestOptions.params,
        data: requestOptions.data
      });
      
      return response.data;
    } catch (error) {
      console.error(`Error making request to GoHighLevel ${endpoint}:`, 
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
   * Get contacts
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Contacts
   */
  async getContacts(params = {}) {
    return this.get('contacts', params);
  }
  
  /**
   * Create or update a contact
   * @param {Object} contactData - Contact data
   * @returns {Promise<Object>} Created or updated contact
   */
  async createOrUpdateContact(contactData) {
    return this.post('contacts', contactData);
  }
  
  /**
   * Get calendar
   * @param {Object} params - Query parameters
   * @returns {Promise<Object>} Calendar
   */
  async getCalendar(params = {}) {
    return this.get('calendars', params);
  }
  
  /**
   * Create a calendar appointment
   * @param {Object} appointmentData - Appointment data
   * @returns {Promise<Object>} Created appointment
   */
  async createAppointment(appointmentData) {
    return this.post('appointments', appointmentData);
  }
  
  /**
   * Get services
   * @returns {Promise<Object>} Services
   */
  async getServices() {
    return this.get('services');
  }
  
  /**
   * Create or update a service
   * @param {Object} serviceData - Service data
   * @returns {Promise<Object>} Created or updated service
   */
  async createOrUpdateService(serviceData) {
    return this.post('services', serviceData);
  }
  
  /**
   * Get users/staff
   * @returns {Promise<Object>} Users/staff
   */
  async getUsers() {
    return this.get('users');
  }
}

module.exports = GoHighLevelClient;
