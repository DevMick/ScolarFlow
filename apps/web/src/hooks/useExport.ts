import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { studentService } from '../services/studentService';
import type { ExportOptions, ExportResult } from '@edustats/shared';

export const useExport = () => {
  const [exporting, setExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastExport, setLastExport] = useState<ExportResult | null>(null);

  const exportStudents = useCallback(async (
    classId: number, 
    options: ExportOptions
  ): Promise<ExportResult | null> => {
    try {
      setExporting(true);
      setError(null);
      
      // Validation des options
      if (!options.format) {
        throw new Error('Format d\'export requis');
      }

      toast.loading('Génération de l\'export...', { id: 'export-loading' });
      
      const result = await studentService.exportStudents(classId, options);
      
      toast.dismiss('export-loading');
      setLastExport(result);
      
      // Démarrer automatiquement le téléchargement
      await downloadExport(result);
      
      toast.success(`Export ${options.format.toUpperCase()} généré avec succès`);
      return result;
    } catch (err) {
      toast.dismiss('export-loading');
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'export';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setExporting(false);
    }
  }, []);

  const downloadExport = useCallback(async (exportResult: ExportResult): Promise<void> => {
    try {
      await studentService.downloadExport(exportResult.fileUrl, exportResult.fileName);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du téléchargement';
      toast.error(errorMessage);
      throw err;
    }
  }, []);

  const exportToPDF = useCallback(async (
    classId: number, 
    options: Omit<ExportOptions, 'format'> = {}
  ) => {
    return exportStudents(classId, { ...options, format: 'pdf' });
  }, [exportStudents]);

  const exportToExcel = useCallback(async (
    classId: number, 
    options: Omit<ExportOptions, 'format'> = {}
  ) => {
    return exportStudents(classId, { ...options, format: 'excel' });
  }, [exportStudents]);

  const exportToCSV = useCallback(async (
    classId: number, 
    options: Omit<ExportOptions, 'format'> = {}
  ) => {
    return exportStudents(classId, { ...options, format: 'csv' });
  }, [exportStudents]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const formatFileSize = useCallback((bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }, []);

  const getExportDescription = useCallback((options: ExportOptions): string => {
    const parts = [];
    
    parts.push(`Format: ${options.format.toUpperCase()}`);
    
    if (options.template) {
      const templateNames = {
        standard: 'Standard',
        administrative: 'Administratif',
        parent_contact: 'Contact parents'
      };
      parts.push(`Template: ${templateNames[options.template] || options.template}`);
    }
    
    if (options.includeInactive) {
      parts.push('Inclut les élèves inactifs');
    }
    
    if (options.customFields?.length) {
      parts.push(`Champs personnalisés: ${options.customFields.length}`);
    }
    
    return parts.join(' • ');
  }, []);

  const validateExportOptions = useCallback((options: ExportOptions): { valid: boolean; errors: string[] } => {
    const errors: string[] = [];
    
    if (!options.format) {
      errors.push('Format d\'export requis');
    } else if (!['pdf', 'excel', 'csv'].includes(options.format)) {
      errors.push('Format d\'export invalide');
    }
    
    if (options.template && !['standard', 'administrative', 'parent_contact'].includes(options.template)) {
      errors.push('Template invalide');
    }
    
    if (options.sortBy && !['firstName', 'lastName', 'studentNumber'].includes(options.sortBy)) {
      errors.push('Critère de tri invalide');
    }
    
    if (options.sortOrder && !['asc', 'desc'].includes(options.sortOrder)) {
      errors.push('Ordre de tri invalide');
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }, []);

  return {
    // États
    exporting,
    error,
    lastExport,
    
    // Actions principales
    exportStudents,
    downloadExport,
    
    // Actions raccourcies
    exportToPDF,
    exportToExcel,
    exportToCSV,
    
    // Utilitaires
    clearError,
    formatFileSize,
    getExportDescription,
    validateExportOptions,
    
    // Computed
    isExporting: exporting,
    hasError: !!error,
    hasLastExport: !!lastExport,
  };
};
