// ========================================
// USE EVALUATIONS HOOK - HOOK POUR GESTION DES ÉVALUATIONS
// ========================================

import { useState, useEffect } from 'react';
import { apiService } from '../services/api';

/**
 * Interface pour une évaluation
 */
export interface Evaluation {
  id: number;
  title: string;
  subject: string;
  date: Date;
  classId: number;
  teacherId: number;
  maxScore: number;
  type?: string;
  description?: string;
  isFinalized?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}

/**
 * Interface pour les données de création d'une évaluation
 */
export interface CreateEvaluationData {
  title: string;
  subject: string;
  date: Date;
  classId: number;
  maxScore: number;
  type?: string;
  description?: string;
}

/**
 * Interface pour les données de mise à jour d'une évaluation
 */
export interface UpdateEvaluationData {
  title?: string;
  subject?: string;
  date?: Date;
  maxScore?: number;
  type?: string;
  description?: string;
}

/**
 * Hook pour la gestion des évaluations
 */
export const useEvaluations = (classId?: number) => {
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Charger les évaluations
  const fetchEvaluations = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const endpoint = classId ? `/classes/${classId}/evaluations` : '/evaluations';
      const response = await apiService.get<Evaluation[]>(endpoint);
      
      // Convertir les dates string en objets Date
      const evaluationsWithDates = response.map(evaluation => ({
        ...evaluation,
        date: new Date(evaluation.date),
        createdAt: evaluation.createdAt ? new Date(evaluation.createdAt) : undefined,
        updatedAt: evaluation.updatedAt ? new Date(evaluation.updatedAt) : undefined
      }));
      
      setEvaluations(evaluationsWithDates);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du chargement des évaluations');
    } finally {
      setLoading(false);
    }
  };

  // Créer une évaluation
  const createEvaluation = async (data: CreateEvaluationData): Promise<Evaluation> => {
    try {
      const newEvaluation = await apiService.post<Evaluation>('/evaluations', data);
      const evaluationWithDate = {
        ...newEvaluation,
        date: new Date(newEvaluation.date),
        createdAt: newEvaluation.createdAt ? new Date(newEvaluation.createdAt) : undefined,
        updatedAt: newEvaluation.updatedAt ? new Date(newEvaluation.updatedAt) : undefined
      };
      
      setEvaluations(prev => [...prev, evaluationWithDate]);
      return evaluationWithDate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de l\'évaluation';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Mettre à jour une évaluation
  const updateEvaluation = async (id: number, data: UpdateEvaluationData): Promise<Evaluation> => {
    try {
      const updatedEvaluation = await apiService.put<Evaluation>(`/evaluations/${id}`, data);
      const evaluationWithDate = {
        ...updatedEvaluation,
        date: new Date(updatedEvaluation.date),
        createdAt: updatedEvaluation.createdAt ? new Date(updatedEvaluation.createdAt) : undefined,
        updatedAt: updatedEvaluation.updatedAt ? new Date(updatedEvaluation.updatedAt) : undefined
      };
      
      setEvaluations(prev => prev.map(eval => eval.id === id ? evaluationWithDate : eval));
      return evaluationWithDate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de l\'évaluation';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Supprimer une évaluation
  const deleteEvaluation = async (id: number): Promise<void> => {
    try {
      await apiService.delete(`/evaluations/${id}`);
      setEvaluations(prev => prev.filter(eval => eval.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de l\'évaluation';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Finaliser une évaluation
  const finalizeEvaluation = async (id: number): Promise<Evaluation> => {
    try {
      const finalizedEvaluation = await apiService.post<Evaluation>(`/evaluations/${id}/finalize`);
      const evaluationWithDate = {
        ...finalizedEvaluation,
        date: new Date(finalizedEvaluation.date),
        createdAt: finalizedEvaluation.createdAt ? new Date(finalizedEvaluation.createdAt) : undefined,
        updatedAt: finalizedEvaluation.updatedAt ? new Date(finalizedEvaluation.updatedAt) : undefined
      };
      
      setEvaluations(prev => prev.map(eval => eval.id === id ? evaluationWithDate : eval));
      return evaluationWithDate;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la finalisation de l\'évaluation';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  // Obtenir une évaluation par ID
  const getEvaluationById = (id: number): Evaluation | undefined => {
    return evaluations.find(eval => eval.id === id);
  };

  // Filtrer les évaluations par matière
  const getEvaluationsBySubject = (subject: string): Evaluation[] => {
    return evaluations.filter(eval => eval.subject === subject);
  };

  // Obtenir les matières uniques
  const getUniqueSubjects = (): string[] => {
    return [...new Set(evaluations.map(eval => eval.subject))];
  };

  // Charger les évaluations au montage ou quand classId change
  useEffect(() => {
    fetchEvaluations();
  }, [classId]);

  return {
    evaluations,
    loading,
    error,
    fetchEvaluations,
    createEvaluation,
    updateEvaluation,
    deleteEvaluation,
    finalizeEvaluation,
    getEvaluationById,
    getEvaluationsBySubject,
    getUniqueSubjects,
    refetch: fetchEvaluations
  };
};

export default useEvaluations;