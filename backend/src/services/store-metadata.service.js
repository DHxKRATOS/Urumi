/**
 * Store Metadata Service
 * Manages store metadata persistence using a JSON file
 */

const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const logger = require('../utils/logger');

const DATA_DIR = path.join(__dirname, '../../data');
const STORES_FILE = path.join(DATA_DIR, 'stores.json');

/**
 * Ensures the data directory and stores file exist
 */
const ensureDataFile = () => {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    logger.info('Created data directory', { path: DATA_DIR });
  }
  
  if (!fs.existsSync(STORES_FILE)) {
    fs.writeFileSync(STORES_FILE, JSON.stringify({ stores: [] }, null, 2));
    logger.info('Created stores data file', { path: STORES_FILE });
  }
};

/**
 * Reads all stores from the data file
 * @returns {Array} Array of store records
 */
const readStores = () => {
  ensureDataFile();
  try {
    const data = fs.readFileSync(STORES_FILE, 'utf8');
    return JSON.parse(data).stores || [];
  } catch (error) {
    logger.error('Error reading stores file', { error: error.message });
    return [];
  }
};

/**
 * Writes stores to the data file
 * @param {Array} stores - Array of store records
 */
const writeStores = (stores) => {
  ensureDataFile();
  try {
    fs.writeFileSync(STORES_FILE, JSON.stringify({ stores }, null, 2));
  } catch (error) {
    logger.error('Error writing stores file', { error: error.message });
    throw error;
  }
};

/**
 * Creates a new store record
 * @param {Object} data - Store data
 * @returns {Object} Created store record
 */
const createStoreRecord = (data) => {
  const stores = readStores();
  
  const newStore = {
    id: uuidv4(),
    storeName: data.storeName,
    namespace: data.namespace,
    platform: data.platform || 'woocommerce',
    ingressHost: data.ingressHost,
    status: data.status || 'Provisioning',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
  
  stores.push(newStore);
  writeStores(stores);
  
  logger.info('Created store record', { storeId: newStore.id, storeName: newStore.storeName });
  return newStore;
};

/**
 * Updates an existing store record
 * @param {string} identifier - Store ID or namespace
 * @param {Object} updates - Fields to update
 * @returns {Object|null} Updated store record or null if not found
 */
const updateStoreRecord = (identifier, updates) => {
  const stores = readStores();
  const index = stores.findIndex(s => s.id === identifier || s.namespace === identifier);
  
  if (index === -1) {
    logger.warn('Store not found for update', { identifier });
    return null;
  }
  
  stores[index] = {
    ...stores[index],
    ...updates,
    updatedAt: new Date().toISOString(),
  };
  
  writeStores(stores);
  logger.info('Updated store record', { storeId: stores[index].id, updates: Object.keys(updates) });
  return stores[index];
};

/**
 * Gets a store record by ID or namespace
 * @param {string} identifier - Store ID or namespace
 * @returns {Object|null} Store record or null if not found
 */
const getStoreRecord = (identifier) => {
  const stores = readStores();
  return stores.find(s => s.id === identifier || s.namespace === identifier) || null;
};

/**
 * Gets all store records
 * @returns {Array} Array of all store records
 */
const getAllStoreRecords = () => {
  return readStores();
};

/**
 * Deletes a store record
 * @param {string} identifier - Store ID or namespace
 * @returns {boolean} True if deleted, false if not found
 */
const deleteStoreRecord = (identifier) => {
  const stores = readStores();
  const index = stores.findIndex(s => s.id === identifier || s.namespace === identifier);
  
  if (index === -1) {
    logger.warn('Store not found for deletion', { identifier });
    return false;
  }
  
  const deleted = stores.splice(index, 1)[0];
  writeStores(stores);
  
  logger.info('Deleted store record', { storeId: deleted.id, storeName: deleted.storeName });
  return true;
};

module.exports = {
  createStoreRecord,
  updateStoreRecord,
  getStoreRecord,
  getAllStoreRecords,
  deleteStoreRecord,
};
