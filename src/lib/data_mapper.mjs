/**
 * Data Mapper for WellnessLiving to GoHighLevel Integration
 * 
 * This module provides functions to map data between WellnessLiving and GoHighLevel formats.
 */

/**
 * Map a WellnessLiving location to GoHighLevel location format
 * @param {Object} wlLocation - WellnessLiving location data
 * @returns {Object} GoHighLevel location data
 */
function mapLocation(wlLocation) {
  return {
    name: wlLocation.text_title || wlLocation.s_title,
    address1: wlLocation.text_address1 || '',
    address2: wlLocation.text_address2 || '',
    city: wlLocation.text_city || '',
    state: wlLocation.text_region || '',
    postalCode: wlLocation.text_postal || '',
    country: wlLocation.text_country || '',
    phone: wlLocation.text_phone || '',
    email: wlLocation.text_email || '',
    website: wlLocation.text_url || '',
    timezone: wlLocation.text_timezone || 'America/New_York',
  };
}

/**
 * Map a WellnessLiving service to GoHighLevel service format
 * @param {Object} wlService - WellnessLiving service data
 * @param {Object} config - Configuration object
 * @returns {Object} GoHighLevel service data
 */
function mapService(wlService, config) {
  // Get category mapping or use default
  const categoryId = config.integration.mapping.serviceCategories[wlService.k_service_category] || 
                    config.integration.mapping.serviceCategories.default;
  
  return {
    name: wlService.text_title || wlService.s_title,
    description: wlService.text_description || '',
    duration: wlService.i_duration || 60, // Duration in minutes
    price: parseFloat(wlService.m_price) || 0,
    categoryId: categoryId,
    color: wlService.text_color || '#3498db',
    // Add any additional fields needed for GoHighLevel
  };
}

/**
 * Map a WellnessLiving staff member to GoHighLevel user format
 * @param {Object} wlStaff - WellnessLiving staff data
 * @param {Object} config - Configuration object
 * @returns {Object} GoHighLevel user data
 */
function mapStaff(wlStaff, config) {
  // Get role mapping or use default
  const roleId = config.integration.mapping.staffRoles[wlStaff.k_staff_role] || 
                config.integration.mapping.staffRoles.default;
  
  return {
    firstName: wlStaff.text_first_name || '',
    lastName: wlStaff.text_last_name || '',
    email: wlStaff.text_email || '',
    phone: wlStaff.text_phone || '',
    role: roleId,
    // Add any additional fields needed for GoHighLevel
  };
}

/**
 * Map a WellnessLiving class to GoHighLevel calendar event format
 * @param {Object} wlClass - WellnessLiving class data
 * @returns {Object} GoHighLevel calendar event data
 */
function mapClass(wlClass) {
  // Calculate end time based on start time and duration
  const startTime = new Date(wlClass.dt_date_local || wlClass.dt_start);
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + (wlClass.i_duration || 60));
  
  return {
    title: wlClass.text_title || wlClass.s_title,
    description: wlClass.text_description || '',
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    allDay: false,
    // Add any additional fields needed for GoHighLevel
  };
}

/**
 * Map a WellnessLiving client to GoHighLevel contact format
 * @param {Object} wlClient - WellnessLiving client data
 * @returns {Object} GoHighLevel contact data
 */
function mapClient(wlClient) {
  return {
    firstName: wlClient.text_first_name || '',
    lastName: wlClient.text_last_name || '',
    email: wlClient.text_email || '',
    phone: wlClient.text_phone || '',
    address1: wlClient.text_address1 || '',
    address2: wlClient.text_address2 || '',
    city: wlClient.text_city || '',
    state: wlClient.text_region || '',
    postalCode: wlClient.text_postal || '',
    country: wlClient.text_country || '',
    dateOfBirth: wlClient.dt_birth || null,
    // Add any additional fields needed for GoHighLevel
  };
}

/**
 * Map a WellnessLiving appointment to GoHighLevel appointment format
 * @param {Object} wlAppointment - WellnessLiving appointment data
 * @param {string} contactId - GoHighLevel contact ID
 * @param {string} serviceId - GoHighLevel service ID
 * @param {string} staffId - GoHighLevel staff ID
 * @returns {Object} GoHighLevel appointment data
 */
function mapAppointment(wlAppointment, contactId, serviceId, staffId) {
  // Calculate end time based on start time and duration
  const startTime = new Date(wlAppointment.dt_date_local || wlAppointment.dt_start);
  const endTime = new Date(startTime);
  endTime.setMinutes(endTime.getMinutes() + (wlAppointment.i_duration || 60));
  
  return {
    title: wlAppointment.text_title || 'Appointment',
    description: wlAppointment.text_note || '',
    startTime: startTime.toISOString(),
    endTime: endTime.toISOString(),
    contactId: contactId,
    serviceId: serviceId,
    assignedTo: staffId,
    status: mapAppointmentStatus(wlAppointment.id_appointment_status),
    // Add any additional fields needed for GoHighLevel
  };
}

/**
 * Map WellnessLiving appointment status to GoHighLevel appointment status
 * @param {string} wlStatus - WellnessLiving appointment status
 * @returns {string} GoHighLevel appointment status
 */
function mapAppointmentStatus(wlStatus) {
  // Map WellnessLiving status to GoHighLevel status
  const statusMap = {
    'a_confirm': 'confirmed',
    'a_show': 'completed',
    'a_cancel': 'cancelled',
    'a_wait': 'scheduled',
    // Add more status mappings as needed
  };
  
  return statusMap[wlStatus] || 'scheduled';
}

module.exports = {
  mapLocation,
  mapService,
  mapStaff,
  mapClass,
  mapClient,
  mapAppointment,
  mapAppointmentStatus
};
