import { useNavigate } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { AlertCircle, ArrowLeft } from 'lucide-react';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center p-4">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <AlertCircle className="h-16 w-16 text-calm-500" />
        </div>
        <h1 className="text-4xl font-bold text-gray-900 mb-2">Page Not Found</h1>
        <p className="text-gray-600 mb-8">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Go Back
        </Button>
      </div>
    </div>
  );
}