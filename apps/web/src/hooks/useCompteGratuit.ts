import { useState, useEffect } from 'react';
import { compteGratuitService, CompteGratuitInfo } from '../services/compteGratuitService';
import { useAuth } from '../context/AuthContext';

export const useCompteGratuit = () => {
  const [trialInfo, setTrialInfo] = useState<CompteGratuitInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  const fetchTrialInfo = async () => {
    if (!isAuthenticated) {
      console.log('🔐 Utilisateur non authentifié, pas de récupération des infos du compte gratuit');
      setIsLoading(false);
      return;
    }

    try {
      console.log('🔄 Récupération des informations du compte gratuit...');
      setIsLoading(true);
      setError(null);
      const info = await compteGratuitService.getTrialInfo();
      console.log('📊 Informations du compte gratuit reçues:', info);
      console.log('🔍 Debug daysRemaining:', {
        value: info?.daysRemaining,
        type: typeof info?.daysRemaining,
        isNumber: typeof info?.daysRemaining === 'number'
      });
      setTrialInfo(info);
    } catch (err: any) {
      console.error('❌ Erreur lors de la récupération des informations du compte gratuit:', err);
      setError(err.message || 'Erreur lors de la récupération des informations du compte gratuit');
      
      // En cas d'erreur d'authentification, ne pas définir trialInfo à null
      // pour éviter d'afficher 0 jours par défaut
      if (err.status === 401 || err.response?.status === 401) {
        console.log('🔐 Erreur d\'authentification, ne pas réinitialiser trialInfo');
        return;
      }
      
      // Pour les autres erreurs, réinitialiser trialInfo
      setTrialInfo(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTrialInfo();
  }, [isAuthenticated]);

  const refreshTrialInfo = () => {
    fetchTrialInfo();
  };

  return {
    trialInfo,
    isLoading,
    error,
    refreshTrialInfo,
    isExpired: trialInfo?.isExpired || false,
    // Gérer le cas où daysRemaining est undefined
    daysRemaining: trialInfo && typeof trialInfo.daysRemaining === 'number' ? trialInfo.daysRemaining : null,
    isTrialActive: trialInfo?.isActive || false
  };
};
