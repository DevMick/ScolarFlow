// Types de classes pour EduStats

export interface Class {
  id: number;
  userId: number;
  name: string; // Nom de la classe
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClassData {
  name: string; // Nom de la classe
}

export interface UpdateClassData {
  name?: string; // Nom de la classe
}

export interface ClassWithStats extends Class {
  studentCount?: number; // Calculé depuis les students
  evaluationCount: number;
  averageScore?: number;
  lastEvaluationDate?: Date;
}

export interface ClassFilters {
  search?: string;
}

export interface ClassFormData {
  name: string; // Nom de la classe
}
