// Student Types
export interface Student {
  id: number;
  classId: number;
  schoolYearId: number; // Année scolaire de l'étudiant
  name: string;
  gender?: 'M' | 'F';
  studentNumber?: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateStudentData {
  name: string;
  schoolYearId: number; // Année scolaire requise
  gender?: 'M' | 'F';
  studentNumber?: string;
}

export interface UpdateStudentData extends Partial<CreateStudentData> {
  isActive?: boolean;
}

export interface BulkStudentOperation {
  students: CreateStudentData[];
  operation: 'create' | 'update' | 'delete';
}

export interface StudentFilters {
  isActive?: boolean;
  gender?: 'M' | 'F';
  search?: string;
  schoolYearId?: number; // Filtrer par année scolaire
}

export interface StudentStats {
  total: number;
  active: number;
  inactive: number;
  byGender: {
    male: number;
    female: number;
    unknown: number;
  };
}

// PDF Import types
export interface ImportJob {
  id: string;
  classId: number;
  fileName: string;
  status: 'processing' | 'completed' | 'failed' | 'pending_review';
  progress: number;
  results?: ImportResult;
  createdAt: Date;
  completedAt?: Date;
}

export interface ImportResult {
  totalProcessed: number;
  successCount: number;
  errorCount: number;
  duplicateCount: number;
  students: ParsedStudent[];
  errors: ImportError[];
  duplicates: DuplicateStudent[];
}

export interface ParsedStudent {
  name: string;
  confidence: number; // 0-1 score de confiance du parsing
  originalText: string;
  suggestions?: string[];
  lineNumber?: number;
}

export interface ImportError {
  row: number;
  originalText: string;
  error: string;
  suggestion?: string;
}

export interface DuplicateStudent {
  parsed: ParsedStudent;
  existing: Student;
  similarity: number;
  action?: 'skip' | 'update' | 'create_anyway';
}

// Export types
export interface StudentExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  includeInactive: boolean;
  includePhotos: boolean;
  customFields: string[];
  template?: 'standard' | 'administrative' | 'parent_contact';
  sortBy?: 'name' | 'studentNumber';
  sortOrder?: 'asc' | 'desc';
}

export interface ExportResult {
  fileUrl: string;
  fileName: string;
  size: number;
  expiresAt: Date;
  downloadCount?: number;
}

// Bilan Annuel types
export interface StudentBilanData {
  student: Student;
  moyCompo1: number | null;
  moyCompo2: number | null;
  moyCompo3: number | null;
  moyAnnuelle: number | null;
  moyCompoPassage: number | null;
  mga: number | null;
  decision: string;
}