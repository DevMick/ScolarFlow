import { apiService } from './api';

export interface Subject {
  id: number;
  classId: number;
  userId: number;
  name: string;
  createdAt: string;
  updatedAt: string;
  class?: {
    id: number;
    name: string;
    academicYear: string;
  };
}

export interface CreateSubjectData {
  classId: number;
  name: string;
}

export interface UpdateSubjectData {
  name?: string;
}

export interface SubjectFilters {
  classId?: number;
  search?: string;
}

export const subjectService = {
  // Récupérer toutes les matières de l'utilisateur
  async getSubjects(filters?: SubjectFilters): Promise<Subject[]> {
    const params = new URLSearchParams();
    if (filters?.classId) params.append('classId', filters.classId.toString());
    if (filters?.search) params.append('search', filters.search);
    
    const response = await apiService.get(`/subjects?${params.toString()}`);
    // L'API retourne {subjects: Subject[], total: number}
    const data = response.data as any;
    return data.subjects || data;
  },

  // Récupérer une matière par ID
  async getSubjectById(id: number): Promise<Subject> {
    const response = await apiService.get(`/subjects/${id}`);
    return response.data;
  },

  // Créer une nouvelle matière
  async createSubject(data: CreateSubjectData): Promise<Subject> {
    const response = await apiService.post('/subjects', data);
    return response.data;
  },

  // Mettre à jour une matière
  async updateSubject(id: number, data: UpdateSubjectData): Promise<Subject> {
    const response = await apiService.put(`/subjects/${id}`, data);
    return response.data;
  },

  // Supprimer une matière
  async deleteSubject(id: number): Promise<void> {
    await apiService.delete(`/subjects/${id}`);
  },
};
