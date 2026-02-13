/**
 * Kubernetes Service Layer
 * Handles all Kubernetes operations for store provisioning
 */

const k8s = require('@kubernetes/client-node');
const { exec } = require('child_process');
const { promisify } = require('util');
const path = require('path');
const config = require('../config');
const logger = require('../utils/logger');

const execAsync = promisify(exec);

// Initialize Kubernetes client
const kc = new k8s.KubeConfig();
kc.loadFromDefault();

const coreV1Api = kc.makeApiClient(k8s.CoreV1Api);
const appsV1Api = kc.makeApiClient(k8s.AppsV1Api);
const networkingV1Api = kc.makeApiClient(k8s.NetworkingV1Api);

/**
 * Creates a new store with its own namespace and resources
 * @param {string} storeName - Name of the store
 * @param {Object} storeConfig - Configuration options
 * @returns {Object} Result with success status and details
 */
const createStore = async (storeName, storeConfig = {}) => {
  const namespace = `store-${storeName}`;
  const ingressHost = `${storeName}.${config.defaultIngressDomain}`;
  
  logger.info('Creating store', { storeName, namespace, ingressHost });
  
  try {
    // Check if namespace already exists
    try {
      await coreV1Api.readNamespace(namespace);
      logger.warn('Namespace already exists', { namespace });
      return {
        success: false,
        message: `Store "${storeName}" already exists`,
        namespace,
        ingressHost,
      };
    } catch (err) {
      if (err.response?.statusCode !== 404) {
        throw err;
      }
      // Namespace doesn't exist, continue with creation
    }
    
    // Create namespace with labels
    const namespaceManifest = {
      apiVersion: 'v1',
      kind: 'Namespace',
      metadata: {
        name: namespace,
        labels: {
          'app': 'urumi-store',
          'store-name': storeName,
        },
      },
    };
    
    await coreV1Api.createNamespace(namespaceManifest);
    logger.info('Created namespace', { namespace });
    
    // Install Helm chart
    const helmChartPath = path.resolve(__dirname, '../../..', 'helm-charts/woocommerce-store');
    const valuesFile = path.join(helmChartPath, 'values-local.yaml');
    
    const helmCommand = `helm install ${storeName} ${helmChartPath} \
      -f ${valuesFile} \
      --namespace ${namespace} \
      --set storeName=${storeName} \
      --set ingress.host=${ingressHost}`;
    
    logger.info('Running Helm install', { command: helmCommand });
    
    try {
      const { stdout, stderr } = await execAsync(helmCommand);
      logger.info('Helm install completed', { stdout: stdout.substring(0, 200) });
      if (stderr) {
        logger.warn('Helm install stderr', { stderr: stderr.substring(0, 200) });
      }
    } catch (helmError) {
      logger.error('Helm install failed', { error: helmError.message });
      // Cleanup namespace on helm failure
      try {
        await coreV1Api.deleteNamespace(namespace);
      } catch (cleanupError) {
        logger.error('Failed to cleanup namespace after helm failure', { error: cleanupError.message });
      }
      return {
        success: false,
        message: `Failed to deploy store: ${helmError.message}`,
        namespace,
        ingressHost,
      };
    }
    
    return {
      success: true,
      message: 'Store created successfully',
      namespace,
      ingressHost,
    };
    
  } catch (error) {
    logger.error('Error creating store', { error: error.message, storeName });
    return {
      success: false,
      message: `Error creating store: ${error.message}`,
      namespace,
      ingressHost,
    };
  }
};

/**
 * Gets the status of a store
 * @param {string} namespace - Namespace of the store
 * @returns {Object} Store status with pod and service information
 */
const getStoreStatus = async (namespace) => {
  logger.debug('Getting store status', { namespace });
  
  try {
    // Check if namespace exists
    try {
      await coreV1Api.readNamespace(namespace);
    } catch (err) {
      if (err.response?.statusCode === 404) {
        return { status: 'NotFound', pods: [], services: [] };
      }
      throw err;
    }
    
    // Get pods
    const podsResponse = await coreV1Api.listNamespacedPod(namespace);
    const pods = podsResponse.body.items.map(pod => ({
      name: pod.metadata.name,
      status: pod.status.phase,
      ready: pod.status.conditions?.find(c => c.type === 'Ready')?.status === 'True',
      restarts: pod.status.containerStatuses?.[0]?.restartCount || 0,
    }));
    
    // Get services
    const servicesResponse = await coreV1Api.listNamespacedService(namespace);
    const services = servicesResponse.body.items.map(svc => ({
      name: svc.metadata.name,
      type: svc.spec.type,
      clusterIP: svc.spec.clusterIP,
      ports: svc.spec.ports?.map(p => ({ port: p.port, targetPort: p.targetPort })),
    }));
    
    // Determine overall status
    const allPodsRunning = pods.length > 0 && pods.every(p => p.status === 'Running' && p.ready);
    const anyPodFailed = pods.some(p => p.status === 'Failed');
    
    let status = 'Provisioning';
    if (allPodsRunning) {
      status = 'Ready';
    } else if (anyPodFailed) {
      status = 'Failed';
    }
    
    return { status, pods, services };
    
  } catch (error) {
    logger.error('Error getting store status', { error: error.message, namespace });
    return { status: 'Error', pods: [], services: [], error: error.message };
  }
};

/**
 * Lists all stores (namespaces with urumi-store label)
 * @returns {Array} Array of store information
 */
const listStores = async () => {
  logger.debug('Listing all stores');
  
  try {
    const response = await coreV1Api.listNamespace(
      undefined,
      undefined,
      undefined,
      undefined,
      'app=urumi-store'
    );
    
    const stores = await Promise.all(
      response.body.items.map(async (ns) => {
        const namespace = ns.metadata.name;
        const storeName = ns.metadata.labels['store-name'];
        const statusInfo = await getStoreStatus(namespace);
        
        return {
          namespace,
          storeName,
          status: statusInfo.status,
          createdAt: ns.metadata.creationTimestamp,
          pods: statusInfo.pods,
        };
      })
    );
    
    return stores;
    
  } catch (error) {
    logger.error('Error listing stores', { error: error.message });
    return [];
  }
};

/**
 * Deletes a store and all its resources
 * @param {string} namespace - Namespace of the store to delete
 * @returns {Object} Result with success status
 */
const deleteStore = async (namespace) => {
  logger.info('Deleting store', { namespace });
  
  try {
    // Check if namespace exists
    try {
      await coreV1Api.readNamespace(namespace);
    } catch (err) {
      if (err.response?.statusCode === 404) {
        return { success: false, message: 'Store not found' };
      }
      throw err;
    }
    
    // Get store name from namespace
    const storeName = namespace.replace('store-', '');
    
    // Uninstall Helm release
    try {
      const helmCommand = `helm uninstall ${storeName} --namespace ${namespace}`;
      logger.info('Running Helm uninstall', { command: helmCommand });
      await execAsync(helmCommand);
      logger.info('Helm uninstall completed');
    } catch (helmError) {
      logger.warn('Helm uninstall failed (may not exist)', { error: helmError.message });
    }
    
    // Delete namespace (cascades to all resources)
    await coreV1Api.deleteNamespace(namespace);
    logger.info('Namespace deletion initiated', { namespace });
    
    // Don't wait for deletion to complete - it can take 30-60 seconds
    // The frontend will poll and detect when the namespace is gone
    return { success: true, message: 'Store deletion initiated' };
    
  } catch (error) {
    logger.error('Error deleting store', { error: error.message, namespace });
    return { success: false, message: `Error deleting store: ${error.message}` };
  }
};

/**
 * Checks the health of a store
 * @param {string} namespace - Namespace of the store
 * @returns {Object} Health status
 */
const checkStoreHealth = async (namespace) => {
  logger.debug('Checking store health', { namespace });
  
  try {
    const statusInfo = await getStoreStatus(namespace);
    
    if (statusInfo.status === 'NotFound') {
      return { healthy: false, reason: 'Store not found' };
    }
    
    // Check WordPress pod
    const wordpressPod = statusInfo.pods.find(p => p.name.includes('wordpress'));
    const mysqlPod = statusInfo.pods.find(p => p.name.includes('mysql'));
    
    // Check PVCs
    const pvcsResponse = await coreV1Api.listNamespacedPersistentVolumeClaim(namespace);
    const pvcs = pvcsResponse.body.items.map(pvc => ({
      name: pvc.metadata.name,
      status: pvc.status.phase,
      capacity: pvc.status.capacity?.storage,
    }));
    
    const allPvcsBound = pvcs.every(pvc => pvc.status === 'Bound');
    
    const health = {
      healthy: statusInfo.status === 'Ready' && allPvcsBound,
      status: statusInfo.status,
      wordpress: {
        running: wordpressPod?.status === 'Running',
        ready: wordpressPod?.ready || false,
      },
      mysql: {
        running: mysqlPod?.status === 'Running',
        ready: mysqlPod?.ready || false,
      },
      storage: {
        allBound: allPvcsBound,
        pvcs,
      },
    };
    
    return health;
    
  } catch (error) {
    logger.error('Error checking store health', { error: error.message, namespace });
    return { healthy: false, reason: error.message };
  }
};

module.exports = {
  createStore,
  getStoreStatus,
  listStores,
  deleteStore,
  checkStoreHealth,
};
