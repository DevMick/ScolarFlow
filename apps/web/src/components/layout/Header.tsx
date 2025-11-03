import { Bars3Icon, ClockIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import { useCompteGratuit } from '../../hooks/useCompteGratuit';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const { user, logout, isPaid, subscriptionEndDate } = useAuth() as any;
  const { trialInfo, isLoading: trialLoading, daysRemaining, isExpired } = useCompteGratuit();
  
  // Vérifier si l'abonnement est expiré
  const isSubscriptionExpired = subscriptionEndDate 
    ? new Date(subscriptionEndDate) <= new Date() 
    : false;
  const hasActiveSubscription = isPaid && subscriptionEndDate && new Date(subscriptionEndDate) > new Date();
  const isAdmin = user?.email === 'mickael.andjui.21@gmail.com';

  const handleLogout = () => {
    logout();
    toast.success('Vous êtes déconnecté');
  };

  return (
    <div className="sticky top-0 z-40 flex h-16 shrink-0 items-center gap-x-4 border-b border-gray-200 bg-white px-4 shadow-sm sm:gap-x-6 sm:px-6 lg:px-8">
      {/* Bouton menu mobile */}
      <button
        type="button"
        className="-m-2.5 p-2.5 text-gray-700 lg:hidden"
        onClick={onMenuClick}
      >
        <span className="sr-only">Ouvrir le sidebar</span>
        <Bars3Icon className="h-6 w-6" aria-hidden="true" />
      </button>

      {/* Séparateur */}
      <div className="h-6 w-px bg-gray-200 lg:hidden" aria-hidden="true" />

      <div className="flex flex-1 gap-x-4 self-stretch lg:gap-x-6">
        {/* Espace flexible pour pousser le contenu à droite */}
        <div className="flex flex-1 items-center">
          {/* Message d'alerte si abonnement expiré (pour utilisateurs non-admin) */}
          {!isAdmin && isSubscriptionExpired && (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-50 border border-red-200 text-red-700">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">
                  Abonnement expiré - Veuillez renouveler pour continuer à utiliser toutes les fonctionnalités
                </span>
                <Link 
                  to="/payment" 
                  className="ml-2 text-sm font-semibold underline hover:text-red-800"
                >
                  Renouveler
                </Link>
              </div>
            </div>
          )}
          {/* Affichage du compte gratuit - Ne pas afficher si la date est expirée */}
          {!isAdmin && !isSubscriptionExpired && trialInfo && daysRemaining !== null && !isExpired && (
            <div className="flex flex-1 items-center justify-center">
              <div className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                daysRemaining <= 3 
                  ? 'bg-yellow-50 border border-yellow-200 text-yellow-700'
                  : 'bg-green-50 border border-green-200 text-green-700'
              }`}>
                <ClockIcon className="h-5 w-5" />
                <span className="text-sm font-medium">
                  {`Formule Démarrage - ${daysRemaining} jour${daysRemaining > 1 ? 's' : ''} restant${daysRemaining > 1 ? 's' : ''}`}
                </span>
              </div>
            </div>
          )}
          {/* Message si abonnement actif */}
          {!isAdmin && hasActiveSubscription && !trialInfo && (
            <div className="flex flex-1 items-center justify-center">
              <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-700">
                <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
                <span className="text-sm font-medium">
                  Abonnement actif jusqu'au {subscriptionEndDate ? new Date(subscriptionEndDate).toLocaleDateString('fr-FR') : ''}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Actions du header - Toujours alignées à droite */}
        <div className="flex items-center gap-x-4 lg:gap-x-6 ml-auto">

          {/* Menu utilisateur */}
          <div className="relative flex items-center gap-x-4">
            <div className="flex items-center gap-x-2">
              <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center">
                <span className="text-sm font-medium text-primary-600">
                  {user?.firstName?.charAt(0)?.toUpperCase() || 'U'}
                </span>
              </div>
              <span className="hidden lg:flex lg:items-center">
                <span className="text-sm font-semibold leading-6 text-gray-900" aria-hidden="true">
                  {user?.firstName || 'Utilisateur'}
                </span>
              </span>
            </div>
            
            {/* Bouton de déconnexion */}
            <button
              type="button"
              onClick={handleLogout}
              className="inline-flex items-center gap-x-2 rounded-md bg-red-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth="1.5"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75"
                />
              </svg>
              <span className="hidden sm:block">Déconnexion</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
