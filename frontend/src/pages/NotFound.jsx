import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';
import Layout from '../components/Layout/Layout';
import Button from '../components/UI/Button';

export default function NotFound() {
  return (
    <Layout>
      <div className="text-center py-16">
        <h1 className="text-6xl font-bold text-gray-200 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-900 mb-2">Page Not Found</h2>
        <p className="text-gray-500 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button variant="primary">
            <Home className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </Link>
      </div>
    </Layout>
  );
}
