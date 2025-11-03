import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ExclamationTriangleIcon, XMarkIcon } from '@heroicons/react/24/outline';
import { useCompteGratuit } from '../../hooks/useCompteGratuit';

export const TrialWarningBanner: React.FC = () => {
  const { daysRemaining, isExpired, trialInfo } = useCompteGratuit();
  const [isDismissed, setIsDismissed] = React.useState(false);
  const navigate = useNavigate();

  // Ne pas afficher si expiré, déjà fermé, plus de 3 jours restants, ou si daysRemaining est null
  if (isExpired || isDismissed || !trialInfo || daysRemaining === null || daysRemaining > 3) {
    return null;
  }

  const getWarningMessage = () => {
    if (daysRemaining === 1) {
      return 'Votre Formule Démarrage expire demain !';
    } else if (daysRemaining === 2) {
      return 'Votre Formule Démarrage expire dans 2 jours !';
    } else if (daysRemaining === 3) {
      return 'Votre Formule Démarrage expire dans 3 jours !';
    }
    return 'Votre Formule Démarrage expire bientôt !';
  };

  const getWarningColor = () => {
    if (daysRemaining === 1) {
      return 'bg-red-50 border-red-200 text-red-800';
    } else if (daysRemaining === 2) {
      return 'bg-orange-50 border-orange-200 text-orange-800';
    }
    return 'bg-yellow-50 border-yellow-200 text-yellow-800';
  };

  return (
    <div className={`relative ${getWarningColor()} border-l-4 border-l-current`}>
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center">
          <ExclamationTriangleIcon className="h-5 w-5 mr-3" />
          <div>
            <h3 className="text-sm font-medium">
              {getWarningMessage()}
            </h3>
            <p className="text-sm mt-1">
              Passez à la Formule Pro pour continuer à utiliser toutes les fonctionnalités de ScolarFlow.
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              // Rediriger directement vers la page de paiement
              navigate('/payment');
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            Passer à la Formule Pro
          </button>
          
          <button
            onClick={() => setIsDismissed(true)}
            className="text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 rounded-md"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
