export interface StudentNoteData {
  student: {
    id: number;
    name: string;
    firstName?: string;
    lastName?: string;
    gender: string;
  };
  notes: Record<number, number>; // subjectId -> note
  total: number;
  moyenne: number;
  rang: number;
}

export interface SubjectData {
  id: number;
  name: string;
  coefficient?: number;
}

export interface EvaluationPDFData {
  evaluationData: {
    id: number;
    nom: string;
    date: Date | string;
  };
  classData: {
    id: number;
    name: string;
    user: {
      firstName: string;
      lastName: string;
      establishment?: string;
    };
  };
  subjects: SubjectData[];
  studentsData: StudentNoteData[];
  statistics?: {
    moyenneClasse: number;
    totalMax: number;
    moyenneMax: number;
    totalMin: number;
    moyenneMin: number;
    nombreAdmis: number;
    nombreNonAdmis: number;
  };
}

export interface PDFExportResult {
  filename: string;
  filepath: string;
  fileSize: number;
  format: string;
  downloadUrl: string;
}
