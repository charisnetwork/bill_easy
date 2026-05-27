// =========================================
// API Configuration — Cloudflare Pages + Railway
// =========================================

// Get backend URL from environment variable (set in Cloudflare Pages dashboard)
let envBackendUrl =
  import.meta.env?.VITE_BACKEND_URL ||
  import.meta.env?.REACT_APP_BACKEND_URL ||
  '';

// Sanitize: Remove trailing slash
if (envBackendUrl && envBackendUrl.endsWith('/')) {
  envBackendUrl = envBackendUrl.slice(0, -1);
}

// Ensure URL has protocol
if (envBackendUrl && !envBackendUrl.startsWith('http')) {
  envBackendUrl = 'https://' + envBackendUrl;
}

// Fallback to localhost only in local dev (never hardcode production URLs)
if (!envBackendUrl || envBackendUrl.includes('localhost:')) {
  envBackendUrl = 'http://localhost:8001';
}

export const BACKEND_URL = envBackendUrl;
export const API_BASE_URL = `${BACKEND_URL}/api`;

// API configuration complete

// Helper to construct full asset URLs (images, PDFs, etc.)
export const getAssetUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http')) return path;
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${BACKEND_URL}/uploads${cleanPath}`;
};

// Helper to normalize API errors to strings
export const getErrorMessage = (error, defaultMessage = 'An error occurred') => {

  // If it's already a string, return it
  if (typeof error === 'string') return error;

  // Handle network errors (backend not running)
  if (error?.code === 'ERR_NETWORK' || error?.message?.includes('Network Error')) {
    return 'Cannot connect to server. Please make sure the backend is running.';
  }

  // Handle 404 errors specifically
  if (error?.response?.status === 404) {
    const url = error.config?.url || 'unknown endpoint';
    return `API endpoint not found: ${url}. Please check the backend URL configuration.`;
  }

  // If it's an Axios error with response
  if (error?.response?.data) {
    const data = error.response.data;
    
    // Handle { error: 'message' }
    if (typeof data.error === 'string') return data.error;
    
    // Handle { error: { message: '...' } }
    if (typeof data.error?.message === 'string') return data.error.message;
    
    // Handle { message: '...' }
    if (typeof data.message === 'string') return data.message;

    // Handle { errors: [...] } from express-validator
    if (Array.isArray(data.errors) && data.errors.length > 0) {
      return data.errors[0].msg || data.errors[0].message || 'Validation error';
    }
    
    // Stringify the data object if it's an object but not a string
    if (typeof data === 'object' && data !== null) {
      // If it's { code, message }, return message or stringify
      if (data.message && typeof data.message === 'string') return data.message;
      // Return default message instead of JSON to avoid rendering objects
      return defaultMessage;
    }

    return String(data);
  }

  // If error has message property
  if (typeof error?.message === 'string') return error.message;
  
  // If error is an object, return default message
  if (typeof error === 'object' && error !== null) {
    return defaultMessage;
  }

  // Default fallback
  return defaultMessage;
};

export default {
  BACKEND_URL,
  API_BASE_URL,
  getAssetUrl,
  getErrorMessage
};
