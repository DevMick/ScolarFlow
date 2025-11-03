import { apiService } from './api';

export interface Note {
  id: number;
  studentId: number;
  subjectId: number;
  evaluationId: number;
  userId: number;
  value: number;
  isAbsent?: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  student?: {
    id: number;
    name: string;
    gender: string;
    studentNumber?: string;
  };
  subject?: {
    id: number;
    name: string;
    class?: {
      id: number;
      name: string;
      academicYear: string;
    };
  };
  evaluation?: {
    id: number;
    nom: string;
    date: string;
  };
}

export interface CreateNoteData {
  studentId: number;
  subjectId: number;
  evaluationId: number;
  value: number;
  isAbsent?: boolean;
}

export interface UpdateNoteData {
  value?: number;
  isAbsent?: boolean;
}

export const noteService = {
  // Récupérer toutes les notes d'un élève pour une matière
  async getNotesByStudentAndSubject(studentId: number, subjectId: number): Promise<Note[]> {
    const response = await apiService.get(`/notes?studentId=${studentId}&subjectId=${subjectId}`);
    return response.data.notes;
  },

  // Récupérer toutes les notes d'une classe pour une matière
  async getNotesByClassAndSubject(classId: number, subjectId: number): Promise<Note[]> {
    const response = await apiService.get(`/notes?classId=${classId}&subjectId=${subjectId}`);
    return response.data.notes;
  },

  // Récupérer toutes les notes d'un élève
  async getNotesByStudent(studentId: number): Promise<Note[]> {
    const response = await apiService.get(`/notes?studentId=${studentId}`);
    return response.data.notes;
  },

  // Récupérer toutes les notes d'une matière
  async getNotesBySubject(subjectId: number): Promise<Note[]> {
    const response = await apiService.get(`/notes?subjectId=${subjectId}`);
    return response.data.notes;
  },

  // Récupérer toutes les notes d'une évaluation
  async getNotesByEvaluation(evaluationId: number): Promise<Note[]> {
    const response = await apiService.get(`/notes?evaluationId=${evaluationId}`);
    return response.data.notes;
  },

  // Récupérer toutes les notes d'une classe pour une évaluation
  async getNotesByClassAndEvaluation(classId: number, evaluationId: number): Promise<Note[]> {
    const response = await apiService.get(`/notes?classId=${classId}&evaluationId=${evaluationId}`);
    return response.data.notes;
  },

  // Créer une nouvelle note
  async createNote(data: CreateNoteData): Promise<Note> {
    const response = await apiService.post('/notes', data);
    return response.data;
  },

  // Mettre à jour une note
  async updateNote(id: number, data: UpdateNoteData): Promise<Note> {
    const response = await apiService.put(`/notes/${id}`, data);
    return response.data;
  },

  // Supprimer une note
  async deleteNote(id: number): Promise<void> {
    await apiService.delete(`/notes/${id}`);
  },

  // Créer ou mettre à jour une note (upsert)
  async upsertNote(data: CreateNoteData): Promise<Note> {
    const response = await apiService.post('/notes/upsert', data);
    return response.data;
  }
};
