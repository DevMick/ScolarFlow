import React from 'react';
import { useAuth } from '../../context/AuthContext';

interface TrialRestrictionWrapperProps {
  children: React.ReactNode;
}

export const TrialRestrictionWrapper: React.FC<TrialRestrictionWrapperProps> = ({ children }) => {
  const { user, isPaid } = useAuth() as any; // Extension du type AuthContextType

  // L'admin a toujours accès à tous les menus
  const isAdmin = user?.email === 'mickael.andjui.21@gmail.com';
  // Si le paiement est validé OU si c'est l'admin, ne pas bloquer
  const hasPaidAccess = isAdmin || isPaid;

  // Si le paiement est validé ou si c'est l'admin, permettre l'accès complet
  // Sinon, afficher le contenu normalement sans restrictions d'expiration
  return <>{children}</>;
};
