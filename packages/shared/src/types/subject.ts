// Types pour la gestion des matières

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
