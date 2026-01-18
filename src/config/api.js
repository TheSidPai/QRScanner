/**
 * API Configuration
 * 
 * Centralized API configuration for Parsec frontend
 * Handles base URL switching between development and production
 */

// ========== API LOGGER ==========
/**
 * Logs all API calls with detailed information
 * @param {string} endpoint - The API endpoint
 * @param {object} options - Fetch options
 * @param {number} startTime - Request start time
 * @param {Response} response - Fetch response
 * @param {any} data - Response data
 * @param {Error} error - Error if request failed
 */
const logApiCall = (endpoint, options, startTime, response = null, data = null, error = null) => {
  // const duration = Date.now() - startTime;
  const method = options.method || 'GET';
  const timestamp = new Date().toLocaleTimeString();
  
  // Styling for console
  const styles = {
    success: 'background: #28a745; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
    error: 'background: #dc3545; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
    info: 'background: #007bff; color: white; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
    warning: 'background: #ffc107; color: black; padding: 2px 6px; border-radius: 3px; font-weight: bold;',
  };

  // Helper to safely log request body
  // const getRequestBodyLog = (body) => {
  //   if (!body) return 'No body';
  //   if (body instanceof FormData) return 'FormData (multipart/form-data)';
  //   try {
  //     return JSON.parse(body);
  //   } catch {
  //     return body;
  //   } 
  // };

  if (error) {
    // Error case
    // console.group(`%c❌ API ERROR %c${method} ${endpoint}`, styles.error, '');
    // console.log(`⏰ Time: ${timestamp}`);
    // console.log(`⏱️ Duration: ${duration}ms`);
    // console.log(`📝 Request:`, getRequestBodyLog(options.body));
    // console.error(`💥 Error:`, error.message);
    // console.groupEnd();
  } else if (response) {
    // Success case
    // const statusStyle = response.ok ? styles.success : styles.error;
    // const emoji = response.ok ? '✅' : '❌';
    
    // console.group(`%c${emoji} API ${response.status} %c${method} ${endpoint}`, statusStyle, '');
    // console.log(`⏰ Time: ${timestamp}`);
    // console.log(`⏱️ Duration: ${duration}ms`);
    // console.log(`📤 Request URL: ${response.url}`);
    // console.log(`📝 Request Body:`, getRequestBodyLog(options.body));
    // console.log(`📥 Response:`, data);
    // console.log(`🔑 Token Used:`, options.headers?.Authorization ? 'Yes (Bearer)' : 'No');
    // console.groupEnd();
  } else {
    // Starting request
    console.log(`%c🚀 API REQUEST %c${method} ${endpoint}`, styles.info, '', `(${timestamp})`);
  }
};

// Determine the base URL based on environment
const getBaseURL = () => {
  // Check if we have an environment variable set
  if (process.env.REACT_APP_API_URL) {
    return process.env.REACT_APP_API_URL;
  }

  // Always use production URL (no proxy needed)
  // The backend is already hosted and CORS is enabled
  return 'https://parsec.iitdh.ac.in/api/parsec/v1';
};

export const API_BASE_URL = getBaseURL();

/**
 * API Endpoints
 * All endpoints relative to API_BASE_URL
 */
export const API_ENDPOINTS = {
  // Authentication
  AUTH_GOOGLE: '/auth/google',
  AUTH_GOOGLE_CALLBACK: '/auth/google/callback',
  AUTH_ME: '/auth/me',
  AUTH_LOGOUT: '/auth/logout',

  // Onboarding
  ONBOARDING: '/onboarding/submit',

  // Sorting Hat
  SORTING_HAT_STATS: '/sorting-hat/stats',
  SORTING_HAT_MY_HOUSE: '/sorting-hat/my-house',
  SORTING_HAT_SORT: '/sorting-hat/sort',

  // Payments
  PAYMENTS: '/payments',
  PAYMENTS_MY: '/payments/me',

  // Points
  POINTS_ME: '/points/me',
  POINTS_LEADERBOARD: '/points/leaderboard',

  // Merchandise
  MERCH_GET_ALL: '/merch',
  MERCH_GET_BY_ID: '/merch/:id', // Replace :id with actual merch ID
  MERCH_ADD: '/paneermoms/merch', // Admin only
  MERCH_UPDATE: '/paneermoms/merch/:id', // Admin only - Full item update
  MERCH_UPDATE_STOCK: '/paneermoms/merch/:id/stock', // Admin only
  MERCH_DELETE: '/paneermoms/merch/:id', // Admin only

  // Orders (Merchandise)
  ORDERS_CREATE: '/orders',
  ORDERS_MY: '/orders/me',

  // Payments
  PAYMENTS_SUBMIT: '/payments',

  // Accommodation
  ACCOMMODATION_CREATE: '/accommodation',
  ACCOMMODATION_MY_BOOKINGS: '/accommodation', // GET user's accommodation bookings

  // Admin - All admin routes prefixed with /paneermoms
  ADMIN_LOGIN: '/paneermoms/login',
  ADMIN_PAYMENTS_GET: '/paneermoms/payments',
  ADMIN_PAYMENTS_VERIFY: '/paneermoms/payments/:id/verify', // Replace :id with actual payment ID
  ADMIN_PAYMENTS_REJECT: '/paneermoms/payments/:id/reject', // Replace :id with actual payment ID
  ADMIN_PAYMENTS_STATS: '/paneermoms/payments/stats',
  ADMIN_QR_GET: '/paneermoms/qr/get',
  ADMIN_QR_VERIFY: '/paneermoms/qr/verify',
  ADMIN_POINTS_ADD: '/paneermoms/points/add',
  ADMIN_POINTS_SUBTRACT: '/paneermoms/points/subtract',
};

/**
 * Helper function to build full API URL
 * @param {string} endpoint - Endpoint from API_ENDPOINTS
 * @returns {string} - Full API URL
 */
export const buildApiUrl = (endpoint) => {
  return `${API_BASE_URL}${endpoint}`;
};

/**
 * Helper function to make authenticated API calls
 * @param {string} endpoint - Endpoint from API_ENDPOINTS
 * @param {object} options - Fetch options (method, body, etc.)
 * @param {string} token - JWT token (optional if using cookies)
 * @returns {Promise} - Fetch promise
 */
export const authenticatedFetch = async (endpoint, options = {}, token = null) => {
  const startTime = Date.now();
  const url = buildApiUrl(endpoint);
  
  const headers = {
    ...options.headers,
  };

  // Only add Content-Type for non-FormData requests
  // FormData sets its own Content-Type with boundary
  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  // Add Authorization header if token is provided
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
    credentials: 'include', // Include cookies for httpOnly JWT
  };

  // Log the API request start
  logApiCall(endpoint, config, startTime);

  try {
    const response = await fetch(url, config);
    // Try to parse JSON safely (some endpoints may return empty body)
    let data = null;
    try {
      data = await response.clone().json();
    } catch (err) {
      // Non-JSON or empty response — leave data as null
      data = null;
    }

    // Log the API response
    logApiCall(endpoint, config, startTime, response, data);

    // Return both response and parsed data to avoid consumers re-reading the body
    return { response, data };
  } catch (error) {
    // Log the API error
    logApiCall(endpoint, config, startTime, null, null, error);
    throw error;
  }
};

/**
 * Helper function to get JWT token from localStorage
 * @returns {string|null} - JWT token or null if not found
 */
export const getAuthToken = () => {
  return localStorage.getItem('jwt_token'); // Matches the key used in Auth.jsx
};

const apiConfig = {
  API_BASE_URL,
  API_ENDPOINTS,
  buildApiUrl,
  authenticatedFetch,
  getAuthToken,
};

export default apiConfig;
