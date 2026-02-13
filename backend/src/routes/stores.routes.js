/**
 * Store Routes
 * REST API endpoints for store management
 */

const express = require('express');
const router = express.Router();
const storesController = require('../controllers/stores.controller');

/**
 * POST /api/stores
 * Create a new store
 * Body: { storeName: string, platform?: string }
 */
router.post('/', storesController.createStore);

/**
 * GET /api/stores
 * List all stores
 */
router.get('/', storesController.listStores);

/**
 * GET /api/stores/:namespace
 * Get a single store by namespace
 */
router.get('/:namespace', storesController.getStore);

/**
 * DELETE /api/stores/:namespace
 * Delete a store
 */
router.delete('/:namespace', storesController.deleteStore);

/**
 * GET /api/stores/:namespace/health
 * Get store health status
 */
router.get('/:namespace/health', storesController.getStoreHealth);

module.exports = router;
