/**
 * Auth Context - Secure Authentication with HttpOnly Cookies
 * 
 * Security Features:
 * - Access tokens stored in memory only (not localStorage)
 * - Refresh tokens stored in HttpOnly cookies (not accessible to JS)
 * - Automatic token refresh on 401 errors
 * - Token expiration handling
 */

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import axios from 'axios';
import { setAuthHandlers } from '../services/api';

const AuthContext = createContext(null);

// In-memory token storage (more secure than localStorage)
let accessToken = null;
let refreshPromise = null;

// Backend URL - same logic as config/api.js but inlined to avoid circular imports
const RAILWAY_BACKEND_URL = 'https://bill-easy-production-v4.up.railway.app';
const API_BASE_URL = (() => {
  const envUrl = import.meta.env?.VITE_BACKEND_URL;
  if (envUrl && !envUrl.includes('localhost')) return envUrl;
  return RAILWAY_BACKEND_URL;
})();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [subscription, setSubscription] = useState(null);
  const [maxBusinesses, setMaxBusinesses] = useState(1);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const refreshAttempts = useRef(0);
  const MAX_REFRESH_ATTEMPTS = 3;

  // Helper to check plan features
  const hasFeature = useCallback((featureName) => {
    const plan = subscription?.plan || subscription?.Plan;
    if (!plan) return false;
    
    const planName = plan.plan_name || '';
    
    // Feature matrix based on plan
    const featureMatrix = {
      'eway_bills': ['Premium', 'Enterprise'],
      'staff_payroll': ['Premium', 'Enterprise'],
      'multi_godowns': ['Premium', 'Enterprise'],
      'multi_business_ui': ['Enterprise'],
      'activity_tracker': ['Enterprise'],
      'priority_support': ['Enterprise'],
    };
    
    const allowedPlans = featureMatrix[featureName];
    if (!allowedPlans) return false;
    
    return allowedPlans.includes(planName);
  }, [subscription]);

  // Helper to populate all state from an API response
  const populateState = useCallback((data) => {
    if (data.user) setUser(data.user);
    if (data.company !== undefined) setCompany(data.company);
    if (data.companies !== undefined) setCompanies(data.companies || []);
    if (data.subscription !== undefined) setSubscription(data.subscription);
    if (data.maxBusinesses !== undefined) setMaxBusinesses(data.maxBusinesses);
  }, []);

  // Clear all auth state
  const clearState = useCallback(() => {
    accessToken = null;
    setUser(null);
    setCompany(null);
    setCompanies([]);
    setSubscription(null);
    setMaxBusinesses(1);
    setIsAuthenticated(false);
  }, []);

  // Register auth handlers with API service
  useEffect(() => {
    setAuthHandlers(
      () => accessToken,
      () => {
        clearState();
        window.location.href = '/login';
      }
    );
  }, [clearState]);

  // Validate token and get user info on mount
  useEffect(() => {
    const initAuth = async () => {
      try {
        // Try to get a new access token using the refresh token (HttpOnly cookie)
        const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {}, {
          withCredentials: true  // Important: sends cookies
        });
        
        accessToken = response.data.accessToken;
        refreshAttempts.current = 0;
        
        // Get user info — backend route is /api/auth/profile (not /me)
        const userRes = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        
        populateState(userRes.data);
        setIsAuthenticated(true);
      } catch (error) {
        // No valid refresh token - user needs to login
        console.log('Not authenticated');
        clearState();
      } finally {
        setLoading(false);
      }
    };
    
    initAuth();
  }, [populateState, clearState]);

  // Set up axios interceptors
  useEffect(() => {
    // Request interceptor - add access token to all requests
    const requestInterceptor = axios.interceptors.request.use(
      (config) => {
        if (accessToken) {
          config.headers.Authorization = `Bearer ${accessToken}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
    
    // Response interceptor - handle token refresh on 401
    const responseInterceptor = axios.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // Check if error is due to expired token and we haven't retried yet
        if (error.response?.status === 401 && 
            error.response?.data?.code === 'TOKEN_EXPIRED' &&
            !originalRequest._retry &&
            refreshAttempts.current < MAX_REFRESH_ATTEMPTS) {
          
          originalRequest._retry = true;
          
          // If a refresh is already in progress, wait for it
          if (refreshPromise) {
            try {
              await refreshPromise;
              originalRequest.headers.Authorization = `Bearer ${accessToken}`;
              return axios(originalRequest);
            } catch (refreshError) {
              return Promise.reject(refreshError);
            }
          }
          
          // Start new refresh
          refreshPromise = refreshAccessToken();
          refreshAttempts.current += 1;
          
          try {
            await refreshPromise;
            originalRequest.headers.Authorization = `Bearer ${accessToken}`;
            return axios(originalRequest);
          } catch (refreshError) {
            // Refresh failed - logout
            logout();
            return Promise.reject(refreshError);
          } finally {
            refreshPromise = null;
          }
        }
        
        return Promise.reject(error);
      }
    );
    
    return () => {
      axios.interceptors.request.eject(requestInterceptor);
      axios.interceptors.response.eject(responseInterceptor);
    };
  }, []);

  // Refresh access token using HttpOnly cookie
  const refreshAccessToken = async () => {
    try {
      const response = await axios.post(`${API_BASE_URL}/api/auth/refresh`, {}, {
        withCredentials: true
      });
      
      accessToken = response.data.accessToken;
      refreshAttempts.current = 0;
      return response.data;
    } catch (error) {
      clearState();
      throw error;
    }
  };

  // Login
  const login = useCallback(async (email, password) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/login`, {
      email,
      password
    }, {
      withCredentials: true  // Important: receives cookies
    });
    
    accessToken = response.data.accessToken;
    refreshAttempts.current = 0;
    
    // Populate all state from login response
    populateState(response.data);
    setIsAuthenticated(true);
    
    return response.data;
  }, [populateState]);

  // Register
  const register = useCallback(async (userData) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/register`, userData, {
      withCredentials: true
    });
    
    accessToken = response.data.accessToken;
    refreshAttempts.current = 0;
    
    // Populate all state from register response
    populateState(response.data);
    setIsAuthenticated(true);
    
    return response.data;
  }, [populateState]);

  // Logout
  const logout = useCallback(async () => {
    try {
      await axios.post(`${API_BASE_URL}/api/auth/logout`, {}, {
        withCredentials: true
      });
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearState();
    }
  }, [clearState]);

  // Logout from all sessions
  const logoutAll = useCallback(async () => {
    await axios.post(`${API_BASE_URL}/api/auth/logout-all`, {}, {
      withCredentials: true
    });
    
    clearState();
  }, [clearState]);

  // Change password
  const changePassword = useCallback(async (currentPassword, newPassword) => {
    await axios.post(`${API_BASE_URL}/api/auth/change-password`, {
      currentPassword,
      newPassword
    }, {
      withCredentials: true
    });
  }, []);

  // Switch company
  const switchCompany = useCallback(async (companyId) => {
    const response = await axios.post(`${API_BASE_URL}/api/auth/switch-company/${companyId}`, {}, {
      withCredentials: true
    });
    
    // Refresh user data after switching — use /profile (not /me)
    const userRes = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
      withCredentials: true
    });
    
    populateState(userRes.data);
    
    return response.data;
  }, [populateState]);

  // Get active sessions
  const getSessions = useCallback(async () => {
    const response = await axios.get(`${API_BASE_URL}/api/auth/sessions`, {
      withCredentials: true
    });
    return response.data.sessions;
  }, []);

  // Revoke a session
  const revokeSession = useCallback(async (sessionId) => {
    await axios.post(`${API_BASE_URL}/api/auth/sessions/${sessionId}/revoke`, {}, {
      withCredentials: true
    });
  }, []);

  // Update profile
  const updateProfile = useCallback(async (data) => {
    const response = await axios.put(`${API_BASE_URL}/api/auth/profile`, data, {
      withCredentials: true
    });
    setUser(prev => ({ ...prev, ...data }));
    return response.data;
  }, []);

  // Refresh profile - re-fetch all user/company/subscription data from backend
  const refreshProfile = useCallback(async () => {
    try {
      const userRes = await axios.get(`${API_BASE_URL}/api/auth/profile`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        withCredentials: true
      });
      populateState(userRes.data);
    } catch (error) {
      console.error('Failed to refresh profile:', error);
    }
  }, [populateState]);

  const value = {
    user,
    company,
    companies,
    subscription,
    maxBusinesses,
    hasFeature,
    loading,
    isAuthenticated,
    login,
    register,
    logout,
    logoutAll,
    changePassword,
    switchCompany,
    getSessions,
    revokeSession,
    updateProfile,
    refreshProfile,
    refreshAccessToken
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// For components that need the access token directly (e.g., for file downloads)
export const getAccessToken = () => accessToken;
