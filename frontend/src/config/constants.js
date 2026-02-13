export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const POLLING_INTERVAL = 10000; // 10 seconds

export const STORE_STATUS = {
  PROVISIONING: 'Provisioning',
  READY: 'Ready',
  FAILED: 'Failed',
  DELETED: 'Deleted',
};

export const PLATFORMS = {
  WOOCOMMERCE: 'woocommerce',
  MEDUSAJS: 'medusajs', // Future support
};
