// Stub types pour @edustats/shared
// TODO: Créer le vrai package @edustats/shared

declare module '@edustats/shared' {
  export type Student = any;
  export type User = any;
  export type Class = any;
  export type Evaluation = any;
  export type Subject = any;
  export type Note = any;
  export type Moyenne = any;
  export type SchoolYear = any;
  export type EvaluationFormula = any;
  export type Result = any;
  export type Calculation = any;
  export type Report = any;
  export type Statistics = any;
  export type ValidationRule = any;
  export type RegisterData = any;
  export type LoginCredentials = any;
  export type UpdateProfileData = any;
  export type CreateClassData = any;
  export type UpdateClassData = any;
  export type ClassFilters = any;
  export type CreateEvaluationSimpleData = any;
  export type UpdateEvaluationSimpleData = any;
  export type CreateEvaluationFormulaData = any;
  export type UpdateEvaluationFormulaData = any;
  export type CreateNoteData = any;
  export type UpdateNoteData = any;
  export type ApiResponse<T = any> = {
    success: boolean;
    data?: T;
    message: string;
    errors?: string[];
  };
  export type PaginatedResponse<T> = ApiResponse<T[]> & {
    pagination: {
      total: number;
      page: number;
      limit: number;
      totalPages: number;
    };
  };
}

declare module '@edustats/shared/types' {
  export type AnnualReport = any;
  export type ReportGenerationOptions = any;
  export type ReportGenerationResult = any;
  export type AnalysisContext = any;
  export type ReportTemplate = any;
  export type ClassSummary = any;
  export type StudentAnalysis = any;
  export type ReportMetadata = any;
  export type GroupedRecommendations = any;
  export type ReportExportOptions = any;
  export type CustomTable = any;
  export type CustomTableConfig = any;
  export type CustomTableTemplate = any;
  export type StatisticConfiguration = any;
  export type StatisticResult = any;
  export const DEFAULT_REPORT_CONFIG: any;
}

declare module '@edustats/shared/validation' {
  export type ValidationService = any;
  export type ValidationError = any;
  export type ValidationResult = any;
}

declare module '@edustats/shared/types/statistics' {
  export type StatisticConfiguration = any;
  export type StatisticResult = any;
  export type StatisticMetrics = any;
  export type GroupedStatisticMetrics = any;
  export type StatisticInsight = any;
}

declare module 'node-cache' {
  export class NodeCache {
    constructor(options?: any);
    set(key: string, value: any, ttl?: number): boolean;
    get<T>(key: string): T | undefined;
    del(key: string): number;
    flushAll(): void;
  }
  export default NodeCache;
}

