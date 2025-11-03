export interface Note {
  id: number;
  studentId: number;
  subjectId: number;
  evaluationId: number;
  userId: number;
  value: number;
  isAbsent: boolean;
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
    classId: number;
    nom: string;
    date: string;
    class?: {
      id: number;
      name: string;
      academicYear: string;
    };
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
