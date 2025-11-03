// ========================================
// HOOK POUR LA GESTION DES ÉLÈVES
// ========================================

import { useState, useEffect, useCallback } from 'react';
import { StudentService, Student, CreateStudentData, StudentFilters } from '../services/studentService';
import toast from 'react-hot-toast';

export interface UseStudentsReturn {
  students: Student[];
  loading: boolean;
  error: string | null;
  total: number;
  filters: StudentFilters;
  setFilters: (filters: StudentFilters) => void;
  refreshStudents: () => Promise<void>;
  createStudent: (data: CreateStudentData) => Promise<boolean>;
  createBulkStudents: (students: CreateStudentData[]) => Promise<boolean>;
  updateStudent: (id: number, data: Partial<CreateStudentData>) => Promise<boolean>;
  deleteStudent: (id: number) => Promise<boolean>;
}

export const useStudents = (classId: number): UseStudentsReturn => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState<StudentFilters>({});

  const fetchStudents = useCallback(async () => {
    if (!classId) return;
    
    console.log('🔄 FETCH STUDENTS - Filters:', filters);
    
    try {
      setLoading(true);
      setError(null);
      
      console.log('📡 Calling API with classId:', classId, 'filters:', filters);
      const response = await StudentService.getStudentsByClass(classId, filters);
      console.log('📥 API Response:', response);
      
        if (response.success) {
          // L'API retourne directement un tableau d'élèves dans data
          console.log('✅ Students fetched:', response.data.length, 'students');
          setStudents(response.data);
          setTotal(response.data.length);
        } else {
          throw new Error(response.message || 'Erreur lors de la récupération des élèves');
        }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur inconnue';
      console.error('❌ Error fetching students:', err);
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [classId, filters]);

  const refreshStudents = useCallback(async () => {
    await fetchStudents();
  }, [fetchStudents]);

  const createStudent = useCallback(async (data: CreateStudentData): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await StudentService.createStudent(classId, data);
      
      if (response.success) {
        toast.success(response.message || 'Élève créé avec succès');
        await refreshStudents();
        return true;
      } else {
        throw new Error(response.message || 'Erreur lors de la création de l\'élève');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création de l\'élève';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [classId, refreshStudents]);

  const createBulkStudents = useCallback(async (studentsData: CreateStudentData[]): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await StudentService.createBulkStudents(classId, studentsData);
      
      if (response.success) {
        toast.success(response.message || 'Élèves créés avec succès');
        await refreshStudents();
        return true;
      } else {
        throw new Error(response.message || 'Erreur lors de la création des élèves');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la création des élèves';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [classId, refreshStudents]);

  const updateStudent = useCallback(async (id: number, data: Partial<CreateStudentData>): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await StudentService.updateStudent(id, data);
      
      if (response.success) {
        toast.success(response.message || 'Élève mis à jour avec succès');
        await refreshStudents();
        return true;
      } else {
        throw new Error(response.message || 'Erreur lors de la mise à jour de l\'élève');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la mise à jour de l\'élève';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [refreshStudents]);

  const deleteStudent = useCallback(async (id: number): Promise<boolean> => {
    try {
      setLoading(true);
      const response = await StudentService.deleteStudent(id);
      
      if (response.success) {
        toast.success(response.message || 'Élève supprimé avec succès');
        await refreshStudents();
        return true;
      } else {
        throw new Error(response.message || 'Erreur lors de la suppression de l\'élève');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erreur lors de la suppression de l\'élève';
      toast.error(errorMessage);
      return false;
    } finally {
      setLoading(false);
    }
  }, [refreshStudents]);

  useEffect(() => {
    fetchStudents();
  }, [fetchStudents]);

  return {
    students,
    loading,
    error,
    total,
    filters,
    setFilters,
    refreshStudents,
    createStudent,
    createBulkStudents,
    updateStudent,
    deleteStudent,
  };
};