import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LoadingPage } from '../common/Spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  children, 
  fallback 
}) => {
  const { isAuthenticated, isLoading, user, token } = useAuth();
  const location = useLocation();

  console.log('🛡️ PROTECTED ROUTE CHECK:', {
    path: location.pathname,
    isLoading,
    isAuthenticated,
    hasUser: !!user,
    hasToken: !!token
  });

  if (isLoading) {
    console.log('🛡️ PROTECTED ROUTE - Loading...');
    return <LoadingPage />;
  }

  if (!isAuthenticated) {
    console.log('❌ PROTECTED ROUTE - Not authenticated, redirecting to login');
    if (fallback) {
      return <>{fallback}</>;
    }
    
    // Rediriger vers login en sauvegardant la page demandée
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log('✅ PROTECTED ROUTE - Access granted');
  return <>{children}</>;
};

interface PublicRouteProps {
  children: React.ReactNode;
  restricted?: boolean; // Si true, redirige vers dashboard si déjà connecté
}

export const PublicRoute: React.FC<PublicRouteProps> = ({ 
  children, 
  restricted = false 
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();

  if (isLoading) {
    return <LoadingPage />;
  }

  if (restricted && isAuthenticated) {
    // Si c'est l'admin, rediriger vers la page admin au lieu du dashboard
    if (user?.email === 'mickael.andjui.21@gmail.com') {
      return <Navigate to="/admin/payments" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};
