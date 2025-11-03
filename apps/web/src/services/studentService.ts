// ========================================
// SERVICE POUR LES ÉLÈVES
// ========================================

import { apiService } from './api';

export interface Student {
  id: number;
  classId: number;
  schoolYearId: number;
  name: string;
  gender?: 'M' | 'F';
  studentNumber?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateStudentData {
  name: string;
  schoolYearId: number;
  gender?: 'M' | 'F';
  studentNumber?: string;
}

export interface UpdateStudentData {
  name?: string;
  schoolYearId?: number;
  gender?: 'M' | 'F';
  studentNumber?: string;
  isActive?: boolean;
}

export interface StudentFilters {
  isActive?: boolean;
  gender?: 'M' | 'F';
  search?: string;
  schoolYearId?: number; // Filtre par année scolaire
}

export interface StudentsResponse {
  success: boolean;
  data: Student[];
  message: string;
}

export class StudentService {
  /**
   * Récupère tous les élèves d'une classe
   */
  static async getStudentsByClass(classId: number, filters?: StudentFilters): Promise<StudentsResponse> {
    const params = new URLSearchParams();
    params.append('classId', classId.toString());
    
    if (filters?.isActive !== undefined) {
      params.append('isActive', filters.isActive.toString());
    }
    
    if (filters?.gender) {
      params.append('gender', filters.gender);
    }
    
    if (filters?.search) {
      params.append('search', filters.search);
    }
    
    if (filters?.schoolYearId) {
      params.append('schoolYearId', filters.schoolYearId.toString());
    }

    const queryString = params.toString();
    const url = `/students?${queryString}`;
    
    console.log('📡 StudentService.getStudentsByClass - URL:', url, 'Filters:', filters);
    const response = await apiService.get(url);
    console.log('📥 StudentService.getStudentsByClass - Response:', response);
    return response;
  }

  /**
   * Récupère un élève par son ID
   */
  static async getStudentById(id: number): Promise<{ success: boolean; data: Student; message: string }> {
    const response = await apiService.get(`/students/${id}`);
    return response;
  }

  /**
   * Crée un nouvel élève
   */
  static async createStudent(classId: number, data: CreateStudentData): Promise<{ success: boolean; data: Student; message: string }> {
    const response = await apiService.post('/students', { ...data, classId });
    return response;
  }

  /**
   * Met à jour un élève
   */
  static async updateStudent(id: number, data: UpdateStudentData): Promise<{ success: boolean; data: Student; message: string }> {
    const response = await apiService.put(`/students/${id}`, data);
    return response;
  }

  /**
   * Supprime un élève
   */
  static async deleteStudent(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiService.delete(`/students/${id}`);
    return response;
  }

  /**
   * Crée plusieurs élèves en lot
   */
  static async createBulkStudents(classId: number, students: CreateStudentData[]): Promise<{ success: boolean; data: Student[]; message: string }> {
    const response = await apiService.post('/students/bulk', { classId, students });
    return response;
  }
}