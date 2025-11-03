// ========================================
// HOOK POUR LA GESTION DES SEUILS DE CLASSE
// ========================================

import { useState, useEffect, useCallback } from 'react';
import { apiService } from '../services/api';
import { ClassService, Class } from '../services/classService';
import toast from 'react-hot-toast';

export interface ClassThreshold {
  id?: number;
  classId: number;
  userId?: number;
  moyenneAdmission: number;
  moyenneRedoublement: number;
  maxNote: number;
  class?: {
    id: number;
    name: string;
  };
  user?: {
    id: number;
    email: string;
    firstName: string;
    lastName: string;
  };
}

export interface CreateThresholdData {
  classId: number;
  moyenneAdmission: number;
  moyenneRedoublement: number;
  maxNote: number;
}

export interface UseClassThresholdsReturn {
  classes: Class[];
  thresholds: ClassThreshold[];
  loading: boolean;
  error: string | null;
  refreshData: () => Promise<void>;
  createThreshold: (data: CreateThresholdData) => Promise<boolean>;
  updateThreshold: (classId: number, data: CreateThresholdData) => Promise<boolean>;
  deleteThreshold: (classId: number) => Promise<boolean>;
  getThresholdByClass: (classId: number) => ClassThreshold | undefined;
}

export const useClassThresholds = (): UseClassThresholdsReturn => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [thresholds, setThresholds] = useState<ClassThreshold[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [classesResponse, thresholdsResponse] = await Promise.all([
        ClassService.getClasses(),
        apiService.get('/class-thresholds')
      ]);
      
      if (classesResponse.success) {
        setClasses(classesResponse.data.classes || []);
      }
      
      if (thresholdsResponse.success) {
        setThresholds(thresholdsResponse.data || []);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors du chargement des données';
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const refreshData = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  const updateThreshold = useCallback(async (classId: number, data: CreateThresholdData): Promise<boolean> => {
    try {
      const response = await apiService.put(`/class-thresholds/${classId}`, data);
      
      if (response.success) {
        toast.success('Seuils mis à jour avec succès');
        await refreshData();
        return true;
      } else {
        throw new Error(response.message || 'Erreur lors de la mise à jour des seuils');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de la mise à jour des seuils';
      toast.error(errorMessage);
      return false;
    }
  }, [refreshData]);

  const createThreshold = useCallback(async (data: CreateThresholdData): Promise<boolean> => {
    try {
      const response = await apiService.post('/class-thresholds', data);
      
      if (response.success) {
        toast.success('Seuils créés avec succès');
        await refreshData();
        return true;
      } else {
        throw new Error(response.message || 'Erreur lors de la création des seuils');
      }
    } catch (err: any) {
      // Si conflit (409), essayer de mettre à jour
      if (err.response?.status === 409) {
        return await updateThreshold(data.classId, data);
      }
      
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de la création des seuils';
      toast.error(errorMessage);
      return false;
    }
  }, [refreshData, updateThreshold]);

  const deleteThreshold = useCallback(async (classId: number): Promise<boolean> => {
    try {
      const response = await apiService.delete(`/class-thresholds/${classId}`);
      
      if (response.success) {
        toast.success('Seuils supprimés avec succès');
        await refreshData();
        return true;
      } else {
        throw new Error(response.message || 'Erreur lors de la suppression des seuils');
      }
    } catch (err: any) {
      const errorMessage = err.response?.data?.message || err.message || 'Erreur lors de la suppression des seuils';
      toast.error(errorMessage);
      return false;
    }
  }, [refreshData]);

  const getThresholdByClass = useCallback((classId: number): ClassThreshold | undefined => {
    return thresholds.find(t => t.classId === classId);
  }, [thresholds]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    classes,
    thresholds,
    loading,
    error,
    refreshData,
    createThreshold,
    updateThreshold,
    deleteThreshold,
    getThresholdByClass,
  };
};

