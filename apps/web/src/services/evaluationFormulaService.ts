import { apiService } from './api';

export interface EvaluationFormula {
  id: number;
  userId: number;
  name: string;
  formula: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateEvaluationFormulaData {
  name: string;
  formula: string;
}

export interface UpdateEvaluationFormulaData {
  name?: string;
  formula?: string;
}

export const evaluationFormulaService = {
  // Récupérer toutes les formules de l'utilisateur
  async getFormulas(): Promise<EvaluationFormula[]> {
    const response = await apiService.get('/evaluation-formulas');
    return response.data.formulas;
  },

  // Récupérer une formule par ID
  async getFormulaById(id: number): Promise<EvaluationFormula> {
    const response = await apiService.get(`/evaluation-formulas/${id}`);
    return response.data;
  },

  // Créer une nouvelle formule
  async createFormula(data: CreateEvaluationFormulaData): Promise<EvaluationFormula> {
    const response = await apiService.post('/evaluation-formulas', data);
    return response.data;
  },

  // Mettre à jour une formule
  async updateFormula(id: number, data: UpdateEvaluationFormulaData): Promise<EvaluationFormula> {
    const response = await apiService.put(`/evaluation-formulas/${id}`, data);
    return response.data;
  },

  // Supprimer une formule
  async deleteFormula(id: number): Promise<void> {
    await apiService.delete(`/evaluation-formulas/${id}`);
  },
};
