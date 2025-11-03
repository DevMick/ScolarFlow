// ========================================
// SERVICE POUR LES CLASSES
// ========================================

import { apiService } from './api';

export interface Class {
  id: number;
  userId: number;
  name: string;
  academicYear: string;
  studentCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  evaluationCount?: number;
  averageScore?: number;
  lastEvaluationDate?: string;
}

export interface ClassFilters {
  academicYear?: string;
  search?: string;
}

export interface ClassesResponse {
  success: boolean;
  data: {
    classes: Class[];
    total: number;
  };
  message: string;
}

export interface CreateClassData {
  name: string;
  academicYear: string;
  studentCount?: number;
}

export interface UpdateClassData {
  name?: string;
  academicYear?: string;
  studentCount?: number;
}

export class ClassService {
  /**
   * Récupère toutes les classes de l'utilisateur
   */
  static async getClasses(filters?: ClassFilters): Promise<ClassesResponse> {
    const params = new URLSearchParams();
    
    if (filters?.academicYear) {
      params.append('academicYear', filters.academicYear);
    }
    
    if (filters?.search) {
      params.append('search', filters.search);
    }

    const queryString = params.toString();
    const url = queryString ? `/classes?${queryString}` : '/classes';
    
    const response = await apiService.get(url);
    return response;
  }

  /**
   * Récupère une classe par son ID
   */
  static async getClassById(id: number): Promise<{ success: boolean; data: Class; message: string }> {
    const response = await apiService.get(`/classes/${id}`);
    return response;
  }

  /**
   * Crée une nouvelle classe
   */
  static async createClass(data: CreateClassData): Promise<{ success: boolean; data: Class; message: string }> {
    const response = await apiService.post('/classes', data);
    return response;
  }

  /**
   * Met à jour une classe
   */
  static async updateClass(id: number, data: UpdateClassData): Promise<{ success: boolean; data: Class; message: string }> {
    const response = await apiService.put(`/classes/${id}`, data);
    return response;
  }

  /**
   * Supprime une classe
   */
  static async deleteClass(id: number): Promise<{ success: boolean; message: string }> {
    const response = await apiService.delete(`/classes/${id}`);
    return response;
  }

  /**
   * Récupère les années académiques disponibles
   */
  static async getAcademicYears(): Promise<{ success: boolean; data: string[]; message: string }> {
    const response = await apiService.get('/classes/academic-years');
    return response;
  }
}