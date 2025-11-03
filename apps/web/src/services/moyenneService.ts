// ========================================
// SERVICE POUR LES MOYENNES
// ========================================

import { apiService } from './api';

export interface Moyenne {
  id: number;
  studentId: number;
  evaluationId: number;
  userId: number;
  moyenne: number;
  date: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateMoyenneData {
  studentId: number;
  evaluationId: number;
  moyenne: number;
  date: string;
}

export interface MoyenneWithDetails extends Moyenne {
  student?: {
    id: number;
    name: string;
    gender: string;
    studentNumber?: string;
  };
  evaluation?: {
    id: number;
    nom: string;
    date: string;
  };
}

export const moyenneService = {
  // Récupérer les moyennes par évaluation
  async getMoyennesByEvaluation(evaluationId: number): Promise<MoyenneWithDetails[]> {
    const response = await apiService.get(`/moyennes/evaluation/${evaluationId}`);
    return response.data;
  },

  // Récupérer les moyennes par classe
  async getMoyennesByClass(classId: number): Promise<MoyenneWithDetails[]> {
    const response = await apiService.get(`/moyennes/class/${classId}`);
    return response.data;
  },

  // Créer ou mettre à jour une moyenne
  async upsertMoyenne(data: CreateMoyenneData): Promise<Moyenne> {
    const response = await apiService.post('/moyennes', data);
    return response.data;
  },

  // Créer plusieurs moyennes en une fois
  async upsertMoyennes(moyennes: CreateMoyenneData[]): Promise<Moyenne[]> {
    const response = await apiService.post('/moyennes/bulk', moyennes);
    return response.data;
  },

  // Supprimer une moyenne
  async deleteMoyenne(id: number): Promise<void> {
    await apiService.delete(`/moyennes/${id}`);
  },

  // Calculer les moyennes pour une évaluation
  async calculateMoyennes(evaluationId: number, formulaId: number): Promise<MoyenneWithDetails[]> {
    const response = await apiService.post('/moyennes/calculate', {
      evaluationId,
      formulaId
    });
    return response.data;
  }
};

