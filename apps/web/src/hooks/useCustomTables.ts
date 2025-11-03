// ========================================
// USE CUSTOM TABLES HOOK - HOOK TABLEAUX PERSONNALISÉS
// ========================================

import { useState, useCallback } from 'react';
import { apiService } from '../services/api';
import type { 
  CustomTable, 
  CreateCustomTableData, 
  UpdateCustomTableData,
  TableData,
  TableExportOptions,
  TableExportResult,
  TableCategory
} from '@edustats/shared/types';

/**
 * Interface pour les options de requête
 */
interface TableQueryOptions {
  category?: TableCategory;
  classId?: number;
  isTemplate?: boolean;
  search?: string;
  page?: number;
  limit?: number;
}

/**
 * Hook pour la gestion des tableaux personnalisés
 */
export const useCustomTables = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Créer un tableau
  const createTable = useCallback(async (data: CreateCustomTableData): Promise<CustomTable> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.post<{ data: CustomTable }>('/tables', data);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création du tableau';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtenir les tableaux
  const getTables = useCallback(async (options: TableQueryOptions = {}): Promise<{
    tables: CustomTable[];
    total: number;
    pagination: any;
  }> => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (options.category) params.append('category', options.category);
      if (options.classId) params.append('classId', options.classId.toString());
      if (options.isTemplate !== undefined) params.append('isTemplate', options.isTemplate.toString());
      if (options.search) params.append('search', options.search);
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());

      const result = await apiService.get<{
        data: CustomTable[];
        pagination: any;
      }>(`/tables?${params.toString()}`);
      
      return {
        tables: result.data,
        total: result.pagination.total,
        pagination: result.pagination
      };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération des tableaux';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtenir un tableau par ID
  const getTableById = useCallback(async (tableId: string): Promise<CustomTable> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.get<{ data: CustomTable }>(`/tables/${tableId}`);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération du tableau';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Mettre à jour un tableau
  const updateTable = useCallback(async (tableId: string, data: UpdateCustomTableData): Promise<CustomTable> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.put<{ data: CustomTable }>(`/tables/${tableId}`, data);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour du tableau';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Supprimer un tableau
  const deleteTable = useCallback(async (tableId: string): Promise<void> => {
    try {
      setLoading(true);
      setError(null);
      
      await apiService.delete(`/tables/${tableId}`);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression du tableau';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Générer les données d'un tableau
  const generateTableData = useCallback(async (tableId: string): Promise<TableData> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.get<{ data: TableData }>(`/tables/${tableId}/data`);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la génération des données';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Dupliquer un tableau
  const duplicateTable = useCallback(async (tableId: string, newName?: string): Promise<CustomTable> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.post<{ data: CustomTable }>(`/tables/${tableId}/duplicate`, {
        newName
      });
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la duplication du tableau';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Exporter un tableau
  const exportTable = useCallback(async (tableId: string, options: TableExportOptions): Promise<TableExportResult> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.post<{ data: TableExportResult }>(`/tables/${tableId}/export`, options);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'export du tableau';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Créer un template à partir d'un tableau
  const createTemplateFromTable = useCallback(async (
    tableId: string, 
    templateData: {
      name: string;
      description?: string;
      category: TableCategory;
      tags?: string[];
    }
  ): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.post(`/tables/${tableId}/template`, templateData);
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
    createTable,
    getTables,
    getTableById,
    updateTable,
    deleteTable,
    generateTableData,
    duplicateTable,
    exportTable,
    createTemplateFromTable,
    clearError: () => setError(null)
  };
};

/**
 * Hook spécialisé pour les templates
 */
export const useTableTemplates = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Obtenir tous les templates
  const getTemplates = useCallback(async (options: {
    category?: TableCategory;
    isOfficial?: boolean;
    search?: string;
    page?: number;
    limit?: number;
  } = {}): Promise<{
    templates: any[];
    total: number;
    pagination: any;
  }> => {
    try {
      setLoading(true);
      setError(null);
      
      const params = new URLSearchParams();
      if (options.category) params.append('category', options.category);
      if (options.isOfficial !== undefined) params.append('isOfficial', options.isOfficial.toString());
      if (options.search) params.append('search', options.search);
      if (options.page) params.append('page', options.page.toString());
      if (options.limit) params.append('limit', options.limit.toString());

      const result = await apiService.get<{
        data: any[];
        pagination: any;
      }>(`/tables/templates?${params.toString()}`);
      
      return {
        templates: result.data,
        total: result.pagination.total,
        pagination: result.pagination
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
  const getTemplateById = useCallback(async (templateId: string): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.get<{ data: any }>(`/tables/templates/${templateId}`);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération du template';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Utiliser un template
  const useTemplate = useCallback(async (templateId: string, customizations?: any): Promise<any> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.post<{ data: any }>(`/tables/templates/${templateId}/use`, {
        customizations
      });
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'utilisation du template';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtenir les templates populaires
  const getPopularTemplates = useCallback(async (limit = 10): Promise<any[]> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.get<{ data: any[] }>(`/tables/templates/popular?limit=${limit}`);
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération des templates populaires';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  // Obtenir les templates par catégorie
  const getTemplatesByCategory = useCallback(async (): Promise<Record<string, any[]>> => {
    try {
      setLoading(true);
      setError(null);
      
      const result = await apiService.get<{ data: Record<string, any[]> }>('/tables/templates/categories');
      return result.data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la récupération des templates par catégorie';
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
    useTemplate,
    getPopularTemplates,
    getTemplatesByCategory,
    clearError: () => setError(null)
  };
};

export default useCustomTables;
