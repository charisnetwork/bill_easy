import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import axios from 'axios';

const API_URL = (import.meta.env.VITE_BACKEND_URL || import.meta.env.REACT_APP_BACKEND_URL || '') + '/api';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [company, setCompany] = useState(null);
  const [companies, setCompanies] = useState([]);
  const [maxBusinesses, setMaxBusinesses] = useState(1);
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(() => localStorage.getItem('token'));

  // Create API instance with interceptors to always use current token
  const api = useMemo(() => {
    const instance = axios.create({
      baseURL: API_URL
    });

    instance.interceptors.request.use((config) => {
      const currentToken = localStorage.getItem('token');
      if (currentToken) {
        config.headers.Authorization = `Bearer ${currentToken}`;
      }
      return config;
    });

    instance.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error.response?.status === 401) {
          localStorage.removeItem('token');
          setToken(null);
          setUser(null);
          setCompany(null);
          setSubscription(null);
        }
        return Promise.reject(error);
      }
    );

    return instance;
  }, []);

  const fetchProfile = useCallback(async () => {
    const currentToken = localStorage.getItem('token');
    if (!currentToken) {
      setLoading(false);
      return;
    }
    try {
      const response = await api.get('/auth/profile');
      setUser(response.data.user);
      setCompany(response.data.company);
      setCompanies(response.data.companies || []);
      setMaxBusinesses(response.data.maxBusinesses || 1);
      setSubscription(response.data.subscription);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
      // Only logout if it's a 401 error
      if (error.response?.status === 401) {
        localStorage.removeItem('token');
        setToken(null);
        setUser(null);
        setCompany(null);
        setSubscription(null);
      }
    } finally {
      setLoading(false);
    }
  }, [api]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token: newToken, user: userData, maxBusinesses: maxB, company: companyData, companies: companiesData, subscription: subData } = response.data;
    
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    setMaxBusinesses(maxB || 1);
    setCompany(companyData);
    setCompanies(companiesData || []);
    setSubscription(subData);
    
    return response.data;
  };

  const register = async (data) => {
    const response = await api.post('/auth/register', data);
    const { token: newToken, user: userData, company: companyData } = response.data;
    
    localStorage.setItem('token', newToken);
    setToken(newToken);
    setUser(userData);
    setCompany(companyData);
    
    return response.data;
  };

  const switchCompany = async (companyId) => {
    try {
      await api.post(`/auth/switch-company/${companyId}`);
      await fetchProfile();
      window.location.href = '/dashboard'; // Force refresh to clear state
    } catch (error) {
      console.error('Failed to switch company:', error);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setCompany(null);
    setCompanies([]);
    setSubscription(null);
  };

  const hasFeature = useCallback((featureKey) => {
    if (!subscription) return false;
    const plan = subscription.Plan || subscription.plan;
    if (!plan || !plan.plan_name) return false;
    
    const normalizedPlanName = plan.plan_name.charAt(0).toUpperCase() + plan.plan_name.slice(1).toLowerCase();

    // Explicit override for Enterprise plan to fix missing Godown button issue
    if (normalizedPlanName === 'Enterprise') {
      if (featureKey === 'multi_godowns') return true;
    }

    const features = plan.features || {};
    return !!features[featureKey];
  }, [subscription]);

  const value = {
    user,
    company,
    companies,
    maxBusinesses,
    subscription,
    loading,
    isAuthenticated: !!token && !!user,
    login,
    register,
    logout,
    hasFeature,
    switchCompany,
    refreshProfile: fetchProfile,
    api
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
