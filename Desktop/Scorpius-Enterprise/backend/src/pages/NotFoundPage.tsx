import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export default function NotFoundPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-center">
      <h1 className="text-9xl font-bold text-primary">404</h1>
      <p className="text-2xl font-semibold text-foreground mt-4">Page Not Found</p>
      <p className="text-muted-foreground mt-2 mb-6">
        Sorry, the page you are looking for does not exist or has been moved.
      </p>
      <Button asChild>
        <Link to="/">Go to Dashboard</Link>
      </Button>
    </div>
  );
}