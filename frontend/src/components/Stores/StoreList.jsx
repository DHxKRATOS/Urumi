import { Store } from 'lucide-react';
import StoreCard from './StoreCard';

export default function StoreList({ stores, onDelete }) {
  if (stores.length === 0) {
    return (
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <Store className="w-8 h-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No stores yet</h3>
        <p className="text-gray-500 max-w-sm mx-auto">
          Create your first WooCommerce store to get started. Each store runs in its own
          isolated Kubernetes namespace.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {stores.map((store) => (
        <StoreCard key={store.id} store={store} onDelete={onDelete} />
      ))}
    </div>
  );
}
