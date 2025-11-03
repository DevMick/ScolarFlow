// ========================================
// USE ANNUAL REPORTS HOOK - HOOK BILANS ANNUELS
// ========================================

import { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import type { 
  AnnualReport,
  ReportGenerationOptions,
  ReportGenerationResult,
  ReportTemplate,
  ReportExportOptions,
  ReportExportResult,
  AnnualArchive
} from '@edustats/shared/types';

/**
 * Interface pour les options de requête des rapports
 */
interface ReportQueryOptions {
  classId?: number;
  academicYear?: string;
  status?: 'draft' | 'final' | 'archived';
  page?: number;
  limit?: number;
}

/**
 * Hook pour la gestion des bilans annuels
 */
export const useAnnualReports = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generationProgress, setGenerationProgress] = useState(0);

  // Générer un rapport
  const generateReport = useCallback(async (
    classId: number,
    academicYear: string,
    options: ReportGenerationOptions = {},
    onProgress?: (progress: number) => void
  ): Promise<AnnualReport> => {
    try {
      setLoading(true);
      setError(null);
      setGenerationProgress(0);
      
      // Simulation du progrès pour l'UX
      const progressInterval = setInterval(() => {
        setGenerationProgress(prev => {
          const newProgress = Math.min(prev + Math.random() * 15, 90);
          onProgress?.(newProgress);
          return newProgress;
        });
      }, 500);
      
      const result = await apiService.post<ReportGenerationResult>('/reports/generate', {
        classId,
        academicYear,
        ...options
      });
      
      clearInterval(progressInterval);
      setGenerationProgress(100);
      onProgress?.(100);
      
      if (!result.success || !result.report) {
        throw new Error(result.errors?.[0] || 'Erreur lors de la génération du rapport');
      }
      
      return result.report;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la génération du rapport';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
      setTimeout(() => setGenerationProgress(0), 1000);
    }
  }, []);

  // Obtenir les rapports
  const getReports = useCallback(async (options: ReportQueryOptions = {}): Promise<{
    reports: AnnualReport[];
    total: number;
    pagination: any;
  }> => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (options.classId) params.append('classId', options.classId.toString());
      if (options.academicYear) params.append('academicYear', options.academicYear);
      if (options.status) params.append('status', options.status);
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());

      const result = await apiService.get<{
        data: AnnualReport[];
        pagination: any;
      }>(`/reports?${params.toString()}`);
      
      return {
        reports: result.data,
        total: result.pagination.total,
        pagination: result.pagination
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération des rapports';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtenir un rapport par ID
  const getReportById = useCallback(async (reportId: string): Promise<AnnualReport> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.get<{ data: AnnualReport }>(`/reports/${reportId}`);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération du rapport';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Exporter un rapport
  const exportReport = useCallback(async (
    reportId: string, 
    options: ReportExportOptions
  ): Promise<ReportExportResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.post<{ data: ReportExportResult }>(
        `/reports/${reportId}/export`, 
        options
      );
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'export du rapport';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Supprimer un rapport
  const deleteReport = useCallback(async (reportId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await apiService.delete(`/reports/${reportId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du rapport';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Archiver un rapport
  const archiveReport = useCallback(async (reportId: string): Promise<AnnualArchive> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.post<{ data: AnnualArchive }>(`/reports/${reportId}/archive`);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'archivage du rapport';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    generationProgress,
    generateReport,
    getReports,
    getReportById,
    exportReport,
    deleteReport,
    archiveReport,
    clearError: () => setError(null)
  };
};

/**
 * Hook spécialisé pour les templates de rapports
 */
export const useReportTemplates = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtenir tous les templates
  const getTemplates = useCallback(async (options: {
    target?: string;
    isOfficial?: boolean;
    search?: string;
  } = {}): Promise<{
    templates: ReportTemplate[];
    total: number;
  }> => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (options.target) params.append('target', options.target);
      if (options.isOfficial !== undefined) params.append('isOfficial', options.isOfficial.toString());
      if (options.search) params.append('search', options.search);

      const result = await apiService.get<{
        data: ReportTemplate[];
        pagination: any;
      }>(`/reports/templates?${params.toString()}`);
      
      return {
        templates: result.data,
        total: result.pagination.total
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération des templates';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtenir un template par ID
  const getTemplateById = useCallback(async (templateId: string): Promise<ReportTemplate> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.get<{ data: ReportTemplate }>(`/reports/templates/${templateId}`);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération du template';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Créer un template personnalisé
  const createTemplate = useCallback(async (templateData: Partial<ReportTemplate>): Promise<ReportTemplate> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.post<{ data: ReportTemplate }>('/reports/templates', templateData);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du template';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getTemplates,
    getTemplateById,
    createTemplate,
    clearError: () => setError(null)
  };
};

/**
 * Hook pour les archives de rapports
 */
export const useReportArchives = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtenir les archives
  const getArchives = useCallback(async (options: {
    classId?: number;
    academicYear?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    archives: AnnualArchive[];
    total: number;
  }> => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (options.classId) params.append('classId', options.classId.toString());
      if (options.academicYear) params.append('academicYear', options.academicYear);
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());

      const result = await apiService.get<{
        data: AnnualArchive[];
        pagination: any;
      }>(`/reports/archives?${params.toString()}`);
      
      return {
        archives: result.data,
        total: result.pagination.total
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération des archives';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Restaurer une archive
  const restoreArchive = useCallback(async (archiveId: string): Promise<AnnualReport> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.post<{ data: AnnualReport }>(`/reports/archives/${archiveId}/restore`);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la restauration de l\'archive';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    getArchives,
    restoreArchive,
    clearError: () => setError(null)
  };
};

export default useAnnualReports;
