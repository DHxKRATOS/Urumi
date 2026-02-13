import { useState } from 'react';
import { ExternalLink, Trash2, Clock, Globe } from 'lucide-react';
import Button from '../UI/Button';
import StatusBadge from '../UI/StatusBadge';
import { STORE_STATUS } from '../../config/constants';

export default function StoreCard({ store, onDelete }) {
  const [showConfirm, setShowConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await onDelete(store.namespace);
    } finally {
      setDeleting(false);
      setShowConfirm(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isReady = store.status === STORE_STATUS.READY;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow duration-200">
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">{store.name}</h3>
            <p className="text-sm text-gray-500">{store.namespace}</p>
          </div>
          <StatusBadge status={store.status} />
        </div>

        {/* Info */}
        <div className="space-y-2 mb-4">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Globe className="w-4 h-4" />
            {isReady ? (
              <a
                href={store.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:text-primary-700 hover:underline flex items-center gap-1"
              >
                {store.url}
                <ExternalLink className="w-3 h-3" />
              </a>
            ) : (
              <span className="text-gray-400">{store.url}</span>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-500">
            <Clock className="w-4 h-4" />
            <span>Created {formatDate(store.createdAt)}</span>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-100">
          {isReady && (
            <a
              href={store.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              Open Store
              <ExternalLink className="w-4 h-4" />
            </a>
          )}
          {!isReady && <div />}

          {showConfirm ? (
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowConfirm(false)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleDelete}
                loading={deleting}
              >
                Confirm
              </Button>
            </div>
          ) : (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowConfirm(true)}
              className="text-danger-600 hover:text-danger-700 hover:bg-danger-50"
            >
              <Trash2 className="w-4 h-4 mr-1" />
              Delete
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
