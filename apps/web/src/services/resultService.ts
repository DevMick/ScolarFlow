// ========================================
// SERVICE DES RÉSULTATS - GESTION NOTES ET CALCULS
// ========================================

import { apiService } from './api';
import type {
  EvaluationResult,
  EvaluationResultInput,
  BulkEvaluationResultInput,
  AbsentReason,
  ResultFilters
} from '../types';

/**
 * Options pour les requêtes de résultats
 */
interface ResultQueryOptions {
  orderBy?: 'studentLastName' | 'score' | 'rank';
  order?: 'asc' | 'desc';
  includeInactiveStudents?: boolean;
  filters?: ResultFilters;
}

/**
 * Options pour les mises à jour en lot
 */
interface BulkUpdateOptions {
  validateAll?: boolean;
  skipValidation?: boolean;
  optimistic?: boolean;
}

/**
 * Historique des modifications d'un résultat
 */
interface ResultHistory {
  id: number;
  field: string;
  oldValue: any;
  newValue: any;
  modifiedBy: {
    id: number;
    firstName: string;
    lastName: string;
  };
  modifiedAt: string;
  reason?: string;
  ipAddress?: string;
}

/**
 * Service spécialisé pour la gestion des résultats d'évaluations
 */
export class ResultService {
  private readonly baseEndpoint = '/evaluations';
  private readonly resultsEndpoint = '/results';

  // ========================================
  // OPÉRATIONS CRUD DE BASE
  // ========================================

  /**
   * Récupère tous les résultats d'une évaluation
   */
  async getEvaluationResults(
    evaluationId: number,
    options: ResultQueryOptions = {}
  ): Promise<EvaluationResult[]> {
    const params = this.buildQueryParams(options);
    
    return apiService.get(
      `${this.baseEndpoint}/${evaluationId}/results`,
      params,
      {
        enableCache: true,
        cacheTime: 1 * 60 * 1000 // 1 minute pour les résultats
      }
    );
  }

  /**
   * Récupère le résultat d'un élève spécifique
   */
  async getSingleResult(
    evaluationId: number,
    studentId: number
  ): Promise<EvaluationResult | null> {
    try {
      return await apiService.get(
        `${this.baseEndpoint}/${evaluationId}/results/${studentId}`,
        undefined,
        {
          enableCache: true,
          cacheTime: 2 * 60 * 1000 // 2 minutes pour un résultat individuel
        }
      );
    } catch (error: any) {
      // Si le résultat n'existe pas, retourner null au lieu de lancer une erreur
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  /**
   * Met à jour le résultat d'un élève
   */
  async updateSingleResult(
    evaluationId: number,
    studentId: number,
    data: Partial<EvaluationResultInput>
  ): Promise<EvaluationResult> {
    // Validation côté client
    this.validateResultData(data);

    const result = await apiService.put<EvaluationResult>(
      `${this.baseEndpoint}/${evaluationId}/results/${studentId}`,
      data
    );

    // Invalider les caches liés
    apiService.invalidateCache([
      `*${this.baseEndpoint}/${evaluationId}/results*`,
      `*statistics*${evaluationId}*`,
      `*ranking*${evaluationId}*`
    ]);

    return result;
  }

  /**
   * Met à jour plusieurs résultats en une fois
   */
  async updateBulkResults(
    evaluationId: number,
    bulkData: BulkEvaluationResultInput,
    options: BulkUpdateOptions = {}
  ): Promise<{
    summary: { success: number; errors: number };
    results: EvaluationResult[];
    errors?: Array<{ studentId: number; error: string }>;
  }> {
    // Validation côté client pour chaque résultat
    if (!options.skipValidation) {
      bulkData.results.forEach((result, index) => {
        try {
          this.validateResultData(result);
        } catch (error) {
          throw new Error(`Erreur au résultat ${index + 1}: ${(error as Error).message}`);
        }
      });
    }

    const requestData = {
      ...bulkData,
      options
    };

    const result = await apiService.patch<{
      summary: { success: number; errors: number };
      results: EvaluationResult[];
      errors?: Array<{ studentId: number; error: string }>;
    }>(`${this.baseEndpoint}/${evaluationId}/results/bulk`, requestData);

    // Invalider les caches liés
    apiService.invalidateCache([
      `*${this.baseEndpoint}/${evaluationId}/results*`,
      `*statistics*${evaluationId}*`,
      `*ranking*${evaluationId}*`
    ]);

    return result;
  }

  // ========================================
  // GESTION DES ABSENCES
  // ========================================

  /**
   * Marque un élève comme absent
   */
  async markAsAbsent(
    evaluationId: number,
    studentId: number,
    reason: AbsentReason,
    notes?: string
  ): Promise<EvaluationResult> {
    return this.updateSingleResult(evaluationId, studentId, {
      isAbsent: true,
      absentReason: reason,
      score: undefined,
      notes
    });
  }

  /**
   * Marque un élève comme présent
   */
  async markAsPresent(
    evaluationId: number,
    studentId: number,
    score?: number,
    notes?: string
  ): Promise<EvaluationResult> {
    return this.updateSingleResult(evaluationId, studentId, {
      isAbsent: false,
      absentReason: undefined,
      score,
      notes
    });
  }

  /**
   * Récupère les raisons d'absence disponibles
   */
  async getAbsentReasons(): Promise<Array<{ value: AbsentReason; label: string }>> {
    return apiService.get(
      `${this.resultsEndpoint}/absent-reasons`,
      undefined,
      {
        enableCache: true,
        cacheTime: 30 * 60 * 1000 // 30 minutes pour les métadonnées
      }
    );
  }

  // ========================================
  // HISTORIQUE ET SUIVI
  // ========================================

  /**
   * Récupère l'historique des modifications d'un résultat
   */
  async getResultHistory(
    evaluationId: number,
    studentId: number
  ): Promise<ResultHistory[]> {
    return apiService.get(
      `${this.baseEndpoint}/${evaluationId}/results/${studentId}/history`,
      undefined,
      {
        enableCache: true,
        cacheTime: 5 * 60 * 1000 // 5 minutes pour l'historique
      }
    );
  }

  /**
   * Récupère l'historique complet d'une évaluation
   */
  async getEvaluationHistory(evaluationId: number): Promise<ResultHistory[]> {
    return apiService.get(
      `${this.baseEndpoint}/${evaluationId}/history`,
      undefined,
      {
        enableCache: true,
        cacheTime: 5 * 60 * 1000 // 5 minutes
      }
    );
  }

  // ========================================
  // OPÉRATIONS AVANCÉES
  // ========================================

  /**
   * Saisie rapide de notes pour toute une évaluation
   */
  async quickScoreEntry(
    evaluationId: number,
    scores: Array<{
      studentId: number;
      score?: number;
      isAbsent?: boolean;
      absentReason?: AbsentReason;
    }>
  ): Promise<{
    summary: { success: number; errors: number };
    results: EvaluationResult[];
  }> {
    const bulkData: BulkEvaluationResultInput = {
      results: scores.map(item => ({
        studentId: item.studentId,
        score: item.score,
        isAbsent: item.isAbsent || false,
        absentReason: item.absentReason
      }))
    };

    return this.updateBulkResults(evaluationId, bulkData, {
      optimistic: true,
      validateAll: true
    });
  }

  /**
   * Copie les résultats d'une évaluation vers une autre
   */
  async copyResultsToEvaluation(
    sourceEvaluationId: number,
    targetEvaluationId: number,
    options: {
      onlyScores?: boolean;
      includeAbsences?: boolean;
      applyCoefficient?: boolean;
    } = {}
  ): Promise<{
    copied: number;
    skipped: number;
    errors: Array<{ studentId: number; error: string }>;
  }> {
    return apiService.post(
      `${this.baseEndpoint}/${sourceEvaluationId}/copy-results`,
      {
        targetEvaluationId,
        ...options
      }
    );
  }

  /**
   * Import de résultats depuis un fichier
   */
  async importResults(
    evaluationId: number,
    file: File,
    options: {
      format?: 'csv' | 'excel';
      mappings?: Record<string, string>;
      overwrite?: boolean;
      validateOnly?: boolean;
    } = {},
    onProgress?: (progress: number) => void
  ): Promise<{
    imported: number;
    updated: number;
    errors: Array<{ row: number; message: string; data?: any }>;
    warnings: Array<{ row: number; message: string; data?: any }>;
  }> {
    return apiService.uploadFile(
      `${this.baseEndpoint}/${evaluationId}/results/import`,
      file,
      onProgress
    );
  }

  /**
   * Export des résultats
   */
  async exportResults(
    evaluationId: number,
    format: 'pdf' | 'excel' | 'csv' = 'excel',
    options: {
      includeStatistics?: boolean;
      includeRanking?: boolean;
      includeComments?: boolean;
      studentsOnly?: number[];
    } = {}
  ): Promise<Blob> {
    const params = { format, ...options };
    
    const response = await apiService.getAxiosInstance().get(
      `${this.baseEndpoint}/${evaluationId}/results/export`,
      {
        params,
        responseType: 'blob'
      }
    );

    return response.data;
  }

  // ========================================
  // VALIDATION ET CONTRÔLES
  // ========================================

  /**
   * Valide tous les résultats d'une évaluation
   */
  async validateAllResults(evaluationId: number): Promise<{
    isValid: boolean;
    errors: Array<{
      studentId: number;
      studentName: string;
      issues: string[];
    }>;
    warnings: Array<{
      studentId: number;
      studentName: string;
      warnings: string[];
    }>;
    statistics: {
      totalStudents: number;
      completedResults: number;
      absentStudents: number;
      missingResults: number;
    };
  }> {
    return apiService.get(
      `${this.baseEndpoint}/${evaluationId}/results/validate`,
      undefined,
      {
        enableCache: false // Toujours récupérer les données fraîches pour la validation
      }
    );
  }

  /**
   * Détecte les anomalies dans les résultats
   */
  async detectAnomalies(
    evaluationId: number,
    options: {
      sensitivityLevel?: 'low' | 'medium' | 'high';
      includeOutliers?: boolean;
      includePatterns?: boolean;
    } = {}
  ): Promise<{
    outliers: Array<{
      studentId: number;
      studentName: string;
      score: number;
      deviation: number;
      severity: 'low' | 'medium' | 'high';
    }>;
    patterns: Array<{
      type: 'consecutive_identical' | 'too_perfect' | 'suspicious_trend';
      description: string;
      affectedStudents: number[];
      confidence: number;
    }>;
    recommendations: string[];
  }> {
    return apiService.get(
      `${this.baseEndpoint}/${evaluationId}/results/anomalies`,
      options
    );
  }

  // ========================================
  // MÉTHODES UTILITAIRES PRIVÉES
  // ========================================

  /**
   * Construit les paramètres de requête
   */
  private buildQueryParams(options: ResultQueryOptions): Record<string, any> {
    const params: Record<string, any> = {};

    if (options.orderBy) {
      params.orderBy = options.orderBy;
    }

    if (options.order) {
      params.order = options.order;
    }

    if (options.includeInactiveStudents !== undefined) {
      params.includeInactiveStudents = options.includeInactiveStudents;
    }

    // Ajouter les filtres
    if (options.filters) {
      Object.assign(params, this.buildFilterParams(options.filters));
    }

    return params;
  }

  /**
   * Construit les paramètres de filtres
   */
  private buildFilterParams(filters: ResultFilters): Record<string, any> {
    const params: Record<string, any> = {};

    if (filters.studentName) {
      params.studentName = filters.studentName;
    }

    if (filters.hasScore !== undefined) {
      params.hasScore = filters.hasScore;
    }

    if (filters.isAbsent !== undefined) {
      params.isAbsent = filters.isAbsent;
    }

    if (filters.minScore !== undefined) {
      params.minScore = filters.minScore;
    }

    if (filters.maxScore !== undefined) {
      params.maxScore = filters.maxScore;
    }

    return params;
  }

  /**
   * Valide les données d'un résultat côté client
   */
  private validateResultData(data: Partial<EvaluationResultInput>): void {
    const errors: string[] = [];

    // Validation des scores
    if (data.score !== undefined && data.score !== null) {
      if (data.score < 0) {
        errors.push('Le score ne peut pas être négatif');
      }

      // On ne peut pas valider la note maximale ici car on ne l'a pas
      // Cette validation sera faite côté serveur
    }

    // Validation des absences
    if (data.isAbsent === true) {
      if (data.score !== undefined && data.score !== null) {
        errors.push('Un élève absent ne peut pas avoir de note');
      }

      if (!data.absentReason) {
        errors.push('Une raison d\'absence est obligatoire pour un élève absent');
      }
    } else if (data.isAbsent === false) {
      if (data.absentReason) {
        errors.push('Un élève présent ne peut pas avoir de raison d\'absence');
      }
    }

    // Validation des notes (longueur)
    if (data.notes && data.notes.length > 500) {
      errors.push('Les commentaires ne peuvent pas dépasser 500 caractères');
    }

    if (errors.length > 0) {
      throw new Error(`Erreurs de validation : ${errors.join(', ')}`);
    }
  }

  /**
   * Valide les données de mise à jour en lot
   */
  private validateBulkData(bulkData: BulkEvaluationResultInput): void {
    if (!bulkData.results || bulkData.results.length === 0) {
      throw new Error('Aucun résultat à traiter');
    }

    if (bulkData.results.length > 100) {
      throw new Error('Trop de résultats à traiter en une fois (maximum 100)');
    }

    // Vérifier les doublons
    const studentIds = bulkData.results.map(r => r.studentId);
    const uniqueStudentIds = new Set(studentIds);
    
    if (studentIds.length !== uniqueStudentIds.size) {
      throw new Error('Des élèves sont présents plusieurs fois dans les données');
    }

    // Valider chaque résultat
    bulkData.results.forEach((result, index) => {
      try {
        this.validateResultData(result);
      } catch (error) {
        throw new Error(`Erreur au résultat ${index + 1} (élève ${result.studentId}): ${(error as Error).message}`);
      }
    });
  }

  /**
   * Optimise l'ordre des mises à jour pour minimiser les recalculs
   */
  private optimizeBulkUpdates(results: EvaluationResultInput[]): EvaluationResultInput[] {
    // Trier pour traiter d'abord les absents, puis les présents par ordre de score
    return results.sort((a, b) => {
      if (a.isAbsent !== b.isAbsent) {
        return a.isAbsent ? -1 : 1; // Absents d'abord
      }

      if (!a.isAbsent && !b.isAbsent && a.score !== undefined && b.score !== undefined) {
        return b.score - a.score; // Scores décroissants
      }

      return a.studentId - b.studentId; // Par ID d'élève
    });
  }
}

// ========================================
// INSTANCE SINGLETON
// ========================================

/**
 * Instance singleton du service de résultats
 */
export const resultService = new ResultService();

/**
 * Export par défaut
 */
export default resultService;
