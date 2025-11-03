// ========================================
// HOOK USE RESULTS - GESTION DES RÉSULTATS
// ========================================

import { useState, useCallback } from 'react';
import type { EvaluationResult, BulkEvaluationResultInput } from '../types';

export function useResults() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getEvaluationResults = useCallback(async (evaluationId: number): Promise<EvaluationResult[]> => {
    setLoading(true);
    setError(null);
    
    try {
      // TODO: Implémenter l'appel API réel
      const response = await fetch(`/api/evaluations/${evaluationId}/results`);
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des résultats');
      }
      const data = await response.json();
      return data.data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateSingleResult = useCallback(async (
    evaluationId: number, 
    studentId: number, 
    data: Partial<EvaluationResult>
  ): Promise<EvaluationResult> => {
    setLoading(true);
    setError(null);
    
    try {
      // TODO: Implémenter l'appel API réel
      const response = await fetch(`/api/evaluations/${evaluationId}/results/${studentId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour du résultat');
      }
      
      const result = await response.json();
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateBulkResults = useCallback(async (
    evaluationId: number, 
    bulkData: BulkEvaluationResultInput
  ): Promise<EvaluationResult[]> => {
    setLoading(true);
    setError(null);
    
    try {
      // TODO: Implémenter l'appel API réel
      const response = await fetch(`/api/evaluations/${evaluationId}/results/bulk`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bulkData),
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors de la mise à jour en lot');
      }
      
      const result = await response.json();
      return result.data || [];
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    getEvaluationResults,
    updateSingleResult,
    updateBulkResults,
    loading,
    error
  };
}

export default useResults;
