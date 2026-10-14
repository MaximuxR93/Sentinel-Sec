import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Skeleton } from '../ui/Skeleton';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-12 space-y-4">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded-full" />
          <Skeleton className="h-6 w-48" />
        </div>
        <Skeleton className="h-10 w-72" />
        <Skeleton className="h-72 w-full rounded-[20px]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    // Preserve intended destination path so user is routed there post-login
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};
