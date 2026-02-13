/**
 * Stores Controller
 * Handles HTTP request/response logic for store operations
 */

const k8sService = require('../services/k8s.service');
const metadataService = require('../services/store-metadata.service');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Validates store name
 * @param {string} storeName - Store name to validate
 * @returns {Object} Validation result
 */
const validateStoreName = (storeName) => {
  if (!storeName) {
    return { valid: false, message: 'Store name is required' };
  }
  
  if (typeof storeName !== 'string') {
    return { valid: false, message: 'Store name must be a string' };
  }
  
  if (storeName.length > 20) {
    return { valid: false, message: 'Store name must be 20 characters or less' };
  }
  
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(storeName)) {
    return { valid: false, message: 'Store name must be lowercase alphanumeric with optional hyphens (no leading/trailing hyphens)' };
  }
  
  return { valid: true };
};

/**
 * Create a new store
 * POST /api/stores
 */
const createStore = async (req, res) => {
  try {
    const { storeName, platform = 'woocommerce' } = req.body;
    
    // Validate store name
    const validation = validateStoreName(storeName);
    if (!validation.valid) {
      return res.status(400).json({ error: validation.message });
    }
    
    // Validate platform
    if (platform !== 'woocommerce') {
      return res.status(400).json({ error: 'Only WooCommerce platform is currently supported' });
    }
    
    // Check if store already exists in metadata
    const existingStore = metadataService.getStoreRecord(`store-${storeName}`);
    if (existingStore) {
      return res.status(409).json({ error: `Store "${storeName}" already exists` });
    }
    
    logger.info('Creating new store', { storeName, platform });
    
    // Create store in Kubernetes
    const result = await k8sService.createStore(storeName, { platform });
    
    if (!result.success) {
      return res.status(500).json({ error: result.message });
    }
    
    // Create metadata record
    const storeRecord = metadataService.createStoreRecord({
      storeName,
      namespace: result.namespace,
      platform,
      ingressHost: result.ingressHost,
      status: 'Provisioning',
    });
    
    res.status(201).json({
      id: storeRecord.id,
      name: storeRecord.storeName,
      namespace: storeRecord.namespace,
      status: storeRecord.status,
      url: `http://${storeRecord.ingressHost}`,
      createdAt: storeRecord.createdAt,
    });
    
  } catch (error) {
    logger.error('Error in createStore controller', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * List all stores
 * GET /api/stores
 */
const listStores = async (req, res) => {
  try {
    // Get stores from metadata
    const metadataStores = metadataService.getAllStoreRecords();
    
    // Get current status from Kubernetes for each store
    const storesWithStatus = await Promise.all(
      metadataStores.map(async (store) => {
        const k8sStatus = await k8sService.getStoreStatus(store.namespace);
        
        // Update status in metadata if changed
        if (k8sStatus.status !== store.status && k8sStatus.status !== 'NotFound') {
          metadataService.updateStoreRecord(store.id, { status: k8sStatus.status });
        }
        
        return {
          id: store.id,
          name: store.storeName,
          namespace: store.namespace,
          status: k8sStatus.status === 'NotFound' ? 'Deleted' : k8sStatus.status,
          url: `http://${store.ingressHost}`,
          createdAt: store.createdAt,
        };
      })
    );
    
    // Filter out deleted stores
    const activeStores = storesWithStatus.filter(s => s.status !== 'Deleted');
    
    res.json(activeStores);
    
  } catch (error) {
    logger.error('Error in listStores controller', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get a single store by namespace
 * GET /api/stores/:namespace
 */
const getStore = async (req, res) => {
  try {
    const { namespace } = req.params;
    
    // Get store from metadata
    const store = metadataService.getStoreRecord(namespace);
    
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    // Get current status from Kubernetes
    const k8sStatus = await k8sService.getStoreStatus(namespace);
    
    if (k8sStatus.status === 'NotFound') {
      return res.status(404).json({ error: 'Store not found in cluster' });
    }
    
    // Update status in metadata if changed
    if (k8sStatus.status !== store.status) {
      metadataService.updateStoreRecord(store.id, { status: k8sStatus.status });
    }
    
    // Get health info
    const health = await k8sService.checkStoreHealth(namespace);
    
    res.json({
      id: store.id,
      name: store.storeName,
      namespace: store.namespace,
      status: k8sStatus.status,
      url: `http://${store.ingressHost}`,
      createdAt: store.createdAt,
      pods: k8sStatus.pods,
      services: k8sStatus.services,
      health,
    });
    
  } catch (error) {
    logger.error('Error in getStore controller', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Delete a store
 * DELETE /api/stores/:namespace
 */
const deleteStore = async (req, res) => {
  try {
    const { namespace } = req.params;
    
    // Get store from metadata
    const store = metadataService.getStoreRecord(namespace);
    
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    logger.info('Deleting store', { namespace, storeName: store.storeName });
    
    // Delete from Kubernetes
    const result = await k8sService.deleteStore(namespace);
    
    if (!result.success && result.message !== 'Store not found') {
      return res.status(500).json({ error: result.message });
    }
    
    // Delete from metadata
    metadataService.deleteStoreRecord(namespace);
    
    res.json({ message: 'Store deleted successfully' });
    
  } catch (error) {
    logger.error('Error in deleteStore controller', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
};

/**
 * Get store health
 * GET /api/stores/:namespace/health
 */
const getStoreHealth = async (req, res) => {
  try {
    const { namespace } = req.params;
    
    // Check if store exists in metadata
    const store = metadataService.getStoreRecord(namespace);
    
    if (!store) {
      return res.status(404).json({ error: 'Store not found' });
    }
    
    const health = await k8sService.checkStoreHealth(namespace);
    
    res.json(health);
    
  } catch (error) {
    logger.error('Error in getStoreHealth controller', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  createStore,
  listStores,
  getStore,
  deleteStore,
  getStoreHealth,
};
