import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface SpecialUserRouteProps {
  children: ReactNode;
}

export function SpecialUserRoute({ children }: SpecialUserRouteProps) {
  const { user, isAuthenticated } = useAuth();
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  
  // Si c'est l'utilisateur spécial, il peut accéder à la page
  if (user?.email === 'mickael.andjui.21@gmail.com') {
    return <>{children}</>;
  }
  
  // Sinon, rediriger vers le dashboard
  return <Navigate to="/dashboard" replace />;
}
