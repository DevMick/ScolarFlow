import { apiService } from './api';

export interface CompteGratuitInfo {
  id: number;
  dateDebut: string;
  dateFin: string;
  isActive: boolean;
  daysRemaining: number;
  isExpired: boolean;
  createdAt: string;
}

export interface CompteGratuitStatus {
  isActive: boolean;
}

export const compteGratuitService = {
  /**
   * Récupère les informations du compte gratuit de l'utilisateur connecté
   */
  async getTrialInfo(): Promise<CompteGratuitInfo> {
    try {
      console.log('🔍 Récupération des informations du compte gratuit...');
      const response = await apiService.get<{ success: boolean; data: CompteGratuitInfo; message: string }>('/compte-gratuit/info');
      console.log('✅ Réponse reçue:', response);
      
      // Extraire les données de la réponse API
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération des informations');
      }
    } catch (error) {
      console.error('❌ Erreur lors de la récupération des informations du compte gratuit:', error);
      throw error;
    }
  },

  /**
   * Vérifie si le compte gratuit est encore actif
   */
  async checkTrialStatus(): Promise<CompteGratuitStatus> {
    try {
      const response = await apiService.get<{ success: boolean; data: CompteGratuitStatus; message: string }>('/compte-gratuit/status');
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Erreur lors de la vérification du statut');
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du statut du compte gratuit:', error);
      throw error;
    }
  }
};
