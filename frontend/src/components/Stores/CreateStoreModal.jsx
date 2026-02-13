import { useState } from 'react';
import { X, Store, AlertCircle } from 'lucide-react';
import Button from '../UI/Button';
import { PLATFORMS } from '../../config/constants';

export default function CreateStoreModal({ isOpen, onClose, onCreate }) {
  const [storeName, setStoreName] = useState('');
  const [platform, setPlatform] = useState(PLATFORMS.WOOCOMMERCE);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const validateStoreName = (name) => {
    if (!name) {
      return 'Store name is required';
    }
    if (name.length > 20) {
      return 'Store name must be 20 characters or less';
    }
    if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(name)) {
      return 'Use lowercase letters, numbers, and hyphens only (no leading/trailing hyphens)';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const validationError = validateStoreName(storeName);
    if (validationError) {
      setError(validationError);
      return;
    }

    setLoading(true);
    setError('');

    try {
      await onCreate(storeName, platform);
      setStoreName('');
      onClose();
    } catch (err) {
      setError(err.message || 'Failed to create store');
    } finally {
      setLoading(false);
    }
  };

  const handleNameChange = (e) => {
    const value = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '');
    setStoreName(value);
    if (error) setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="flex min-h-full items-center justify-center p-4">
        <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full">
          {/* Header */}
          <div className="flex items-center justify-between p-5 border-b border-gray-100">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Store className="w-5 h-5 text-primary-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">Create New Store</h2>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="p-5">
            {/* Store Name */}
            <div className="mb-4">
              <label htmlFor="storeName" className="block text-sm font-medium text-gray-700 mb-1">
                Store Name
              </label>
              <input
                type="text"
                id="storeName"
                value={storeName}
                onChange={handleNameChange}
                placeholder="my-store"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                maxLength={20}
                disabled={loading}
              />
              <p className="mt-1 text-xs text-gray-500">
                Lowercase letters, numbers, and hyphens only. Max 20 characters.
              </p>
            </div>

            {/* Platform Selection */}
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Platform
              </label>
              <div className="space-y-2">
                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 has-[:checked]:border-primary-500 has-[:checked]:bg-primary-50">
                  <input
                    type="radio"
                    name="platform"
                    value={PLATFORMS.WOOCOMMERCE}
                    checked={platform === PLATFORMS.WOOCOMMERCE}
                    onChange={(e) => setPlatform(e.target.value)}
                    className="w-4 h-4 text-primary-600"
                    disabled={loading}
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">WooCommerce</span>
                    <p className="text-xs text-gray-500">WordPress-based e-commerce platform</p>
                  </div>
                </label>
                <label className="flex items-center p-3 border border-gray-200 rounded-lg cursor-not-allowed opacity-50">
                  <input
                    type="radio"
                    name="platform"
                    value={PLATFORMS.MEDUSAJS}
                    disabled
                    className="w-4 h-4 text-gray-400"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-500">MedusaJS</span>
                    <p className="text-xs text-gray-400">Coming soon</p>
                  </div>
                </label>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-danger-50 border border-danger-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-danger-500 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-danger-700">{error}</p>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100">
              <Button
                type="button"
                variant="secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="primary"
                loading={loading}
                disabled={!storeName}
              >
                Create Store
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
