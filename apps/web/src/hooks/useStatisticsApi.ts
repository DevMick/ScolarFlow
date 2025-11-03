// ========================================
// USE STATISTICS API HOOK - HOOK POUR L'API STATISTIQUES
// ========================================

import { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import type { 
  StatisticConfiguration, 
  StatisticResult 
} from '@edustats/shared/types';

/**
 * Interface pour les templates de statistiques
 */
export interface StatisticsTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  configuration: Partial<StatisticConfiguration>;
  isTemplate: boolean;
  isPublic: boolean;
  tags: string[];
}

/**
 * Hook pour l'API des statistiques
 */
export const useStatisticsApi = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Créer une configuration statistique
  const createConfiguration = useCallback(async (config: Omit<StatisticConfiguration, 'id' | 'userId' | 'createdAt' | 'updatedAt'>): Promise<StatisticConfiguration> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.post<StatisticConfiguration>('/statistics/configurations', config);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de la configuration';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtenir les configurations
  const getConfigurations = useCallback(async (): Promise<StatisticConfiguration[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.get<StatisticConfiguration[]>('/statistics/configurations');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des configurations';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtenir une configuration par ID
  const getConfigurationById = useCallback(async (id: string): Promise<StatisticConfiguration> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.get<StatisticConfiguration>(`/statistics/configurations/${id}`);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement de la configuration';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mettre à jour une configuration
  const updateConfiguration = useCallback(async (id: string, config: Partial<StatisticConfiguration>): Promise<StatisticConfiguration> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.put<StatisticConfiguration>(`/statistics/configurations/${id}`, config);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la configuration';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Supprimer une configuration
  const deleteConfiguration = useCallback(async (id: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await apiService.delete(`/statistics/configurations/${id}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de la configuration';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Générer des statistiques
  const generateStatistics = useCallback(async (configId: string): Promise<StatisticResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.post<StatisticResult>(`/statistics/generate`, { configurationId: configId });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la génération des statistiques';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtenir un résultat de statistiques par ID
  const getStatisticsResult = useCallback(async (id: string): Promise<StatisticResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.get<StatisticResult>(`/statistics/results/${id}`);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement du résultat';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtenir les templates
  const getTemplates = useCallback(async (): Promise<StatisticsTemplate[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.get<StatisticsTemplate[]>('/statistics/templates');
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des templates';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Créer un template
  const createTemplate = useCallback(async (template: Omit<StatisticsTemplate, 'id'>): Promise<StatisticsTemplate> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.post<StatisticsTemplate>('/statistics/templates', template);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du template';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Utiliser un template
  const useTemplate = useCallback(async (templateId: string, customization?: Partial<StatisticConfiguration>): Promise<StatisticConfiguration> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.post<StatisticConfiguration>(`/statistics/templates/${templateId}/use`, customization);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'utilisation du template';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Exporter des statistiques
  const exportStatistics = useCallback(async (resultId: string, format: 'pdf' | 'csv' | 'excel' | 'png'): Promise<Blob> => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await apiService.get(`/statistics/results/${resultId}/export/${format}`, {
        responseType: 'blob'
      });
      
      return response as Blob;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'export';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    error,
    
    // Configurations
    createConfiguration,
    getConfigurations,
    getConfigurationById,
    updateConfiguration,
    deleteConfiguration,
    
    // Génération
    generateStatistics,
    getStatisticsResult,
    
    // Templates
    getTemplates,
    createTemplate,
    useTemplate,
    
    // Export
    exportStatistics,
    
    // Utilitaires
    clearError: () => setError(null)
  };
};

/**
 * Hook spécialisé pour les configurations
 */
export const useStatisticsConfigs = () => {
  const { 
    getConfigurations, 
    createConfiguration, 
    updateConfiguration, 
    deleteConfiguration,
    loading,
    error 
  } = useStatisticsApi();

  return {
    loading,
    error,
    fetchConfigs: getConfigurations,
    createConfig: createConfiguration,
    updateConfig: updateConfiguration,
    deleteConfig: deleteConfiguration
  };
};

/**
 * Hook spécialisé pour les templates
 */
export const useStatisticsTemplates = () => {
  const { 
    getTemplates, 
    createTemplate, 
    useTemplate,
    loading,
    error 
  } = useStatisticsApi();

  return {
    loading,
    error,
    fetchTemplates: getTemplates,
    createTemplate,
    useTemplate
  };
};

/**
 * Hook spécialisé pour la génération de statistiques
 */
export const useGenerateStatistics = () => {
  const { 
    generateStatistics, 
    getStatisticsResult,
    loading,
    error 
  } = useStatisticsApi();

  return {
    loading,
    error,
    generate: generateStatistics,
    getResult: getStatisticsResult
  };
};

/**
 * Hook spécialisé pour l'export
 */
export const useStatisticsExport = () => {
  const { 
    exportStatistics,
    loading,
    error 
  } = useStatisticsApi();

  return {
    loading,
    error,
    exportToFormat: exportStatistics
  };
};

export default useStatisticsApi;