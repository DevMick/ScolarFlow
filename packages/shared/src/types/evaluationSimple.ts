// Types pour les évaluations simples (correspondant au schéma Prisma)

export interface EvaluationSimple {
  id: number;
  classId: number;
  schoolYearId: number;
  nom: string;
  date: string;
  createdAt: string;
  updatedAt: string;
  class?: {
    id: number;
    name: string;
    academicYear: string;
  };
  schoolYear?: {
    id: number;
    startYear: number;
    endYear: number;
    name?: string;
  };
}

export interface CreateEvaluationSimpleData {
  classId: number;
  schoolYearId: number;
  nom: string;
  date: string;
}

export interface UpdateEvaluationSimpleData {
  nom?: string;
  date?: string;
  schoolYearId?: number;
}
