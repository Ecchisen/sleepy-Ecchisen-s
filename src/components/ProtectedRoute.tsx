import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useSession } from '@/context/SessionContext';
import { Loader2 } from 'lucide-react';

const ProtectedRoute: React.FC = () => {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!session) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;