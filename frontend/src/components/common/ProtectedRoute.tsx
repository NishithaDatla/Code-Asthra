import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Array<'FARMER' | 'STAFF' | 'CENTRE_STAFF' | 'SYSTEM_ADMIN' | 'CENTRE_ADMIN'>;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-forest-800 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-500 font-mono">Verifying authentication...</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return <Navigate to="/auth/login" state={{ from: location }} replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    // Role mismatch redirect to authorized portal
    if (user.role === 'FARMER') {
      return <Navigate to="/farmer/dashboard" replace />;
    }
    if (user.role === 'STAFF' || user.role === 'CENTRE_STAFF') {
      return <Navigate to="/staff/dashboard" replace />;
    }
    if (user.role === 'SYSTEM_ADMIN' || user.role === 'CENTRE_ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    return <Navigate to="/auth/login" replace />;
  }

  return <>{children}</>;
};

export const PublicOnlyRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-forest-800 border-t-transparent rounded-full animate-spin"></div>
          <span className="text-xs font-semibold text-slate-500 font-mono">Loading...</span>
        </div>
      </div>
    );
  }

  if (isAuthenticated && user) {
    if (user.role === 'FARMER') {
      return <Navigate to="/farmer/dashboard" replace />;
    }
    if (user.role === 'STAFF' || user.role === 'CENTRE_STAFF') {
      return <Navigate to="/staff/dashboard" replace />;
    }
    if (user.role === 'SYSTEM_ADMIN' || user.role === 'CENTRE_ADMIN') {
      return <Navigate to="/admin/dashboard" replace />;
    }
  }

  return <>{children}</>;
};
