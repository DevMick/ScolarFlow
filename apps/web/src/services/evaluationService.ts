import { apiService } from './api';
import { EvaluationSimple, CreateEvaluationSimpleData, UpdateEvaluationSimpleData } from '@edustats/shared';

export const evaluationService = {
  async getEvaluationsByClass(classId: number): Promise<EvaluationSimple[]> {
    try {
      const response = await apiService.get(`/evaluations/class/${classId}`);
      
      // Vérifier si la réponse a une structure data.evaluations ou juste data
      if (response && Array.isArray(response)) {
        return response;
      } else if (response && response.data && Array.isArray(response.data)) {
        return response.data;
      } else if (response && response.evaluations && Array.isArray(response.evaluations)) {
        return response.evaluations;
      } else {
        console.warn('Structure de réponse inattendue pour les évaluations:', response);
        return [];
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des évaluations:', error);
      return [];
    }
  },

  async createEvaluation(data: CreateEvaluationSimpleData): Promise<EvaluationSimple> {
    const response = await apiService.post('/evaluations', data);
    return response.data || response;
  },

  async updateEvaluation(id: number, data: UpdateEvaluationSimpleData): Promise<EvaluationSimple> {
    try {
      const response = await apiService.put(`/evaluations/${id}`, data);
      return response.data || response;
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'évaluation:', error);
      throw error;
    }
  },

  async deleteEvaluation(id: number): Promise<void> {
    await apiService.delete(`/evaluations/${id}`);
  },
};