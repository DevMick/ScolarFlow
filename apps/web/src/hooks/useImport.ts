import { useState, useCallback } from 'react';
import { toast } from 'react-hot-toast';
import { studentService } from '../services/studentService';
import type { ImportJob, Student, CreateStudentData } from '@edustats/shared';

interface ImportResult {
  created: Student[];
  errors: Array<{ index: number; error: string; student: CreateStudentData }>;
}

export const useImport = (classId: number) => {
  const [uploading, setUploading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [importJob, setImportJob] = useState<ImportJob | null>(null);
  const [error, setError] = useState<string | null>(null);

  const uploadFile = useCallback(async (file: File): Promise<string | null> => {
    try {
      setUploading(true);
      setError(null);
      
      // Validation côté client
      if (!file) {
        throw new Error('Aucun fichier sélectionné');
      }
      
      if (file.type !== 'application/pdf') {
        throw new Error('Seuls les fichiers PDF sont acceptés');
      }
      
      if (file.size > 10 * 1024 * 1024) { // 10MB
        throw new Error('Le fichier ne peut pas dépasser 10MB');
      }

      const response = await studentService.importFromPDF(classId, file);
      const jobId = response.jobId;
      
      // Commencer le polling pour suivre le progrès
      startPolling(jobId);
      
      toast.success('Fichier uploadé avec succès. Traitement en cours...');
      return jobId;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de l\'upload';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setUploading(false);
    }
  }, [classId]);

  const startPolling = useCallback((jobId: string) => {
    setProcessing(true);
    
    const pollInterval = setInterval(async () => {
      try {
        const job = await studentService.getImportStatus(classId, jobId);
        setImportJob(job);
        
        if (job.status === 'completed') {
          clearInterval(pollInterval);
          setProcessing(false);
          toast.success('Analyse du PDF terminée !');
        } else if (job.status === 'failed') {
          clearInterval(pollInterval);
          setProcessing(false);
          setError('Échec de l\'analyse du PDF');
          toast.error('Échec de l\'analyse du PDF');
        }
      } catch (err) {
        clearInterval(pollInterval);
        setProcessing(false);
        const errorMessage = err instanceof Error ? err.message : 'Erreur lors du suivi du job';
        setError(errorMessage);
        toast.error(errorMessage);
      }
    }, 2000); // Poll toutes les 2 secondes

    // Timeout après 2 minutes
    setTimeout(() => {
      clearInterval(pollInterval);
      if (processing) {
        setProcessing(false);
        setError('Timeout - Le traitement prend trop de temps');
        toast.error('Le traitement prend trop de temps. Veuillez réessayer.');
      }
    }, 120000);
  }, [classId, processing]);

  const confirmImport = useCallback(async (): Promise<ImportResult | null> => {
    if (!importJob || importJob.status !== 'completed') {
      toast.error('Aucun import en attente de confirmation');
      return null;
    }

    try {
      setConfirming(true);
      setError(null);
      
      const result = await studentService.confirmImport(classId, importJob.id);
      
      toast.success(`Import confirmé : ${result.created.length} élèves créés`);
      
      if (result.errors.length > 0) {
        toast.warning(`${result.errors.length} erreurs lors de l'import`);
      }
      
      // Reset l'état après confirmation
      setImportJob(null);
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la confirmation';
      setError(errorMessage);
      toast.error(errorMessage);
      return null;
    } finally {
      setConfirming(false);
    }
  }, [classId, importJob]);

  const cancelImport = useCallback(() => {
    setImportJob(null);
    setProcessing(false);
    setError(null);
    toast.info('Import annulé');
  }, []);

  const resetImport = useCallback(() => {
    setImportJob(null);
    setProcessing(false);
    setUploading(false);
    setConfirming(false);
    setError(null);
  }, []);

  // Helpers pour la validation des résultats
  const getValidStudents = useCallback(() => {
    if (!importJob?.results) return [];
    return importJob.results.students.filter(student => student.confidence >= 0.7);
  }, [importJob]);

  const getInvalidStudents = useCallback(() => {
    if (!importJob?.results) return [];
    return importJob.results.students.filter(student => student.confidence < 0.7);
  }, [importJob]);

  const getDuplicates = useCallback(() => {
    if (!importJob?.results) return [];
    return importJob.results.duplicates || [];
  }, [importJob]);

  const getErrors = useCallback(() => {
    if (!importJob?.results) return [];
    return importJob.results.errors || [];
  }, [importJob]);

  return {
    // États
    uploading,
    processing,
    confirming,
    importJob,
    error,
    
    // Actions
    uploadFile,
    confirmImport,
    cancelImport,
    resetImport,
    
    // Helpers
    getValidStudents,
    getInvalidStudents,
    getDuplicates,
    getErrors,
    
    // Computed
    isReady: importJob?.status === 'completed',
    isProcessing: uploading || processing,
    hasResults: !!importJob?.results,
    hasErrors: (importJob?.results?.errors?.length || 0) > 0,
    hasDuplicates: (importJob?.results?.duplicates?.length || 0) > 0,
    successCount: importJob?.results?.successCount || 0,
    totalProcessed: importJob?.results?.totalProcessed || 0,
  };
};
