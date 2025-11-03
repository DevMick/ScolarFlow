// ========================================
// HOOK POUR LA GESTION DES CLASSES
// ========================================

import { useState, useEffect, useCallback } from 'react';
import { ClassService, Class, ClassFilters } from '../services/classService';
import toast from 'react-hot-toast';

export interface UseClassesReturn {
  classes: Class[];
  loading: boolean;
  error: string | null;
  total: number;
  filters: ClassFilters;
  setFilters: (filters: ClassFilters) => void;
  refreshClasses: () => Promise<void>;
  createClass: (data: { name: string; academicYear: string; studentCount?: number }) => Promise<boolean>;
  updateClass: (id: number, data: { name?: string; academicYear?: string; studentCount?: number }) => Promise<boolean>;
  deleteClass: (id: number) => Promise<boolean>;
}

export const useClasses = (): UseClassesReturn => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<ClassFilters>({});

  const fetchClasses = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await ClassService.getClasses(filters);
      
      if (response.success) {
        setClasses(response.data.classes);
        setTotal(response.data.total);
      } else {
        throw new Error(response.message || 'Erreur lors de la récupération des classes');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const refreshClasses = useCallback(async () => {
    await fetchClasses();
  }, [fetchClasses]);

  const createClass = useCallback(async (data: { name: string; academicYear: string; studentCount?: number }): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await ClassService.createClass(data);
      
      if (response.success) {
        toast.success(response.message || 'Classe créée avec succès');
        await refreshClasses();
        return true;
      } else {
        throw new Error(response.message || 'Erreur lors de la création de la classe');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de la classe';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [refreshClasses]);

  const updateClass = useCallback(async (id: number, data: { name?: string; academicYear?: string; studentCount?: number }): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await ClassService.updateClass(id, data);
      
      if (response.success) {
        toast.success(response.message || 'Classe mise à jour avec succès');
        await refreshClasses();
        return true;
      } else {
        throw new Error(response.message || 'Erreur lors de la mise à jour de la classe');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de la classe';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [refreshClasses]);

  const deleteClass = useCallback(async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await ClassService.deleteClass(id);
      
      if (response.success) {
        toast.success(response.message || 'Classe supprimée avec succès');
        await refreshClasses();
        return true;
      } else {
        throw new Error(response.message || 'Erreur lors de la suppression de la classe');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de la classe';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [refreshClasses]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  return {
    classes,
    loading,
    error,
    total,
    filters,
    setFilters,
    refreshClasses,
    createClass,
    updateClass,
    deleteClass,
  };
};