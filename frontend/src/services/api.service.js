import axios from 'axios';
import { API_URL } from '../config/constants';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for logging
api.interceptors.request.use(
  (config) => {
    console.log(`[API] ${config.method?.toUpperCase()} ${config.url}`);
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message = error.response?.data?.error || error.message || 'An error occurred';
    console.error('[API Error]', message);
    return Promise.reject(new Error(message));
  }
);

/**
 * Fetch all stores
 * @returns {Promise<Array>} Array of stores
 */
export const fetchStores = async () => {
  const response = await api.get('/api/stores');
  return response.data;
};

/**
 * Create a new store
 * @param {string} storeName - Name of the store
 * @param {string} platform - Platform type (default: woocommerce)
 * @returns {Promise<Object>} Created store data
 */
export const createStore = async (storeName, platform = 'woocommerce') => {
  const response = await api.post('/api/stores', { storeName, platform });
  return response.data;
};

/**
 * Get store details
 * @param {string} namespace - Store namespace
 * @returns {Promise<Object>} Store details
 */
export const getStoreDetails = async (namespace) => {
  const response = await api.get(`/api/stores/${namespace}`);
  return response.data;
};

/**
 * Delete a store
 * @param {string} namespace - Store namespace
 * @returns {Promise<Object>} Deletion result
 */
export const deleteStore = async (namespace) => {
  const response = await api.delete(`/api/stores/${namespace}`);
  return response.data;
};

/**
 * Get store health
 * @param {string} namespace - Store namespace
 * @returns {Promise<Object>} Health status
 */
export const getStoreHealth = async (namespace) => {
  const response = await api.get(`/api/stores/${namespace}/health`);
  return response.data;
};

export default api;
