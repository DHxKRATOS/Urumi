import { useState, useEffect, useCallback } from 'react';
import { Plus, RefreshCw } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import StoreList from '../components/Stores/StoreList';
import CreateStoreModal from '../components/Stores/CreateStoreModal';
import Button from '../components/UI/Button';
import LoadingSpinner from '../components/UI/LoadingSpinner';
import { fetchStores, createStore, deleteStore } from '../services/api.service';
import { POLLING_INTERVAL } from '../config/constants';

export default function Dashboard() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadStores = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    try {
      const data = await fetchStores();
      setStores(data);
      setError(null);
    } catch (err) {
      setError(err.message || 'Failed to load stores');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    loadStores();
  }, [loadStores]);

  // Polling for status updates
  useEffect(() => {
    const interval = setInterval(() => {
      loadStores();
    }, POLLING_INTERVAL);

    return () => clearInterval(interval);
  }, [loadStores]);

  const handleCreateStore = async (storeName, platform) => {
    const newStore = await createStore(storeName, platform);
    setStores((prev) => [newStore, ...prev]);
  };

  const handleDeleteStore = async (namespace) => {
    await deleteStore(namespace);
    setStores((prev) => prev.filter((s) => s.namespace !== namespace));
  };

  const handleRefresh = () => {
    loadStores(true);
  };

  return (
    <Layout>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Store Dashboard</h1>
          <p className="text-gray-500 mt-1">
            Manage your WooCommerce stores running on Kubernetes
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Button
            variant="secondary"
            onClick={handleRefresh}
            disabled={refreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button variant="primary" onClick={() => setIsModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Create Store
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Total Stores</p>
          <p className="text-2xl font-bold text-gray-900">{stores.length}</p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Ready</p>
          <p className="text-2xl font-bold text-success-600">
            {stores.filter((s) => s.status === 'Ready').length}
          </p>
        </div>
        <div className="bg-white rounded-xl p-5 border border-gray-100 shadow-sm">
          <p className="text-sm text-gray-500 mb-1">Provisioning</p>
          <p className="text-2xl font-bold text-warning-600">
            {stores.filter((s) => s.status === 'Provisioning').length}
          </p>
        </div>
      </div>

      {/* Content */}
      {loading ? (
        <div className="py-16">
          <LoadingSpinner size="lg" />
          <p className="text-center text-gray-500 mt-4">Loading stores...</p>
        </div>
      ) : error ? (
        <div className="text-center py-16">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-danger-100 rounded-full mb-4">
            <span className="text-2xl">!</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Error loading stores</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button variant="primary" onClick={() => loadStores()}>
            Try Again
          </Button>
        </div>
      ) : (
        <StoreList stores={stores} onDelete={handleDeleteStore} />
      )}

      {/* Create Store Modal */}
      <CreateStoreModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onCreate={handleCreateStore}
      />
    </Layout>
  );
}
