import React from 'react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Open Access Route Wrapper
 * Authentication and session login barriers have been completely removed.
 * All console pages and operational views are directly accessible.
 */
export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  return <>{children}</>;
};
