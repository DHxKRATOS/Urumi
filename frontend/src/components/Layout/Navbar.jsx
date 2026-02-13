import { Store } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Store className="w-6 h-6 text-primary-600" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Urumi</h1>
                <p className="text-xs text-gray-500">Store Manager</p>
              </div>
            </div>
          </div>
          <div className="flex items-center">
            <span className="text-sm text-gray-500">
              Kubernetes Store Provisioning
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
