import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface AdminUserRouteProps {
  children: ReactNode;
}

export function AdminUserRoute({ children }: AdminUserRouteProps) {
  const { user, isAuthenticated } = useAuth();
  
  console.log('🔐 ADMIN ROUTE - User:', user);
  console.log('🔐 ADMIN ROUTE - IsAuthenticated:', isAuthenticated);
  
  // Utiliser uniquement sessionStorage pour vérifier l'authentification
  const adminUser = sessionStorage.getItem('user_data');
  const adminToken = sessionStorage.getItem('auth_token');
  const isAdminInStorage = adminUser && adminToken;
  
  console.log('🔐 ADMIN ROUTE - Admin in sessionStorage:', isAdminInStorage);
  
  // Vérifier si c'est l'utilisateur admin via sessionStorage
  if (isAdminInStorage) {
    try {
      const userData = JSON.parse(adminUser);
      if (userData.email === 'mickael.andjui.21@gmail.com') {
        console.log('🔐 ADMIN ROUTE - Admin user found in sessionStorage, allowing access');
        return <>{children}</>;
      }
    } catch (error) {
      console.error('Error parsing user data:', error);
    }
  }
  
  if (!isAuthenticated) {
    console.log('🔐 ADMIN ROUTE - Not authenticated, redirecting to login');
    return <Navigate to="/login" replace />;
  }
  
  // Vérifier si c'est l'utilisateur admin spécifique
  const isAdminUser = user?.email === 'mickael.andjui.21@gmail.com';
  
  if (isAdminUser) {
    return <>{children}</>;
  }
  
  // Sinon, rediriger vers le dashboard
  return <Navigate to="/dashboard" replace />;
}
