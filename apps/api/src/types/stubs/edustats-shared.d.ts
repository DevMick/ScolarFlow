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
  export type EvaluationSimple = any;
  export type EvaluationResultInput = any;
  export type BulkEvaluationResultInput = any;
  export type AbsentReason = any;
  export type AbsentHandling = any;
  export type RoundingMethod = any;
  export type EvaluationStatistics = any;
  export type EvaluationFilters = any;
  export type CreateEvaluationData = any;
  export type UpdateEvaluationData = any;
  export type EvaluationType = any;
  export type EvaluationResult = any;
  export type StudentBilanData = any;
  export type AuthResponse = any;
  export type TokenPayload = any;
  export type RefreshTokenPayload = any;
  export type CreateSubjectData = any;
  export type UpdateSubjectData = any;
  export type SubjectFilters = any;
  export type CreateSchoolYearData = any;
  export type UpdateSchoolYearData = any;
  export type ClassWithStats = any;
  export type ImportJob = any;
  export type ImportResult = any;
  export type ParsedStudent = any;
  export type ImportError = any;
  export type registerSchema = any;
  export type loginSchema = any;
  export type updateProfileSchema = any;
  export type createClassSchema = any;
  export type updateClassSchema = any;
  export type classQuerySchema = any;
  export type createEvaluationResultSchemaWithMax = any;
  export type createBulkResultsSchemaWithContext = any;
  export type validateScoreInContext = any;
  export type createStudentSchema = any;
  export type updateStudentSchema = any;
  export type createBulkStudentsSchema = any;
  export type studentFiltersSchema = any;
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
  export type CreateCustomTableData = any;
  export type UpdateCustomTableData = any;
  export type TableExportOptions = any;
  export type StatisticConfiguration = any;
  export type StatisticResult = any;
  export type Student = any;
  export type Evaluation = any;
  export type EvaluationResult = any;
  export type StudentProfile = any;
  export type StudentProfileType = any;
  export type StudentPerformanceData = any;
  export type StudentProgressionData = any;
  export type ClassInsight = any;
  export type InsightType = any;
  export type Priority = any;
  export type ProgressionTrend = any;
  export type AnalyticsConfig = any;
  export type AnalyticsResult = any;
  export type PedagogicalRecommendation = any;
  export type RecommendationCategory = any;
  export type RecommendationDifficulty = any;
  export type AnnualArchive = any;
  export type ReportExportResult = any;
  export const DEFAULT_REPORT_CONFIG: any;
}

declare module '@edustats/shared/validation' {
  export type ValidationService = any;
  export type ValidationError = any;
  export type ValidationResult = any;
  export type updateEvaluationResultSchema = any;
  export type bulkResultsSchema = any;
  export type createCustomTableSchema = any;
  export type updateCustomTableSchema = any;
  export type exportTableSchema = any;
  export type createTemplateSchema = any;
}

declare module '@edustats/shared/types/statistics' {
  export type StatisticConfiguration = any;
  export type StatisticResult = any;
  export type StatisticMetrics = any;
  export type GroupedStatisticMetrics = any;
  export type StatisticInsight = any;
  export type StatisticCategory = any;
  export type CalculationType = any;
  export type MetricType = any;
  export type GroupByOption = any;
  export type AggregationMethod = any;
  export type ChartType = any;
  export type LayoutType = any;
  export type ColorScheme = any;
}

declare module 'node-cache' {
  export class NodeCache {
    constructor(options?: any);
    set(key: string, value: any, ttl?: number): boolean;
    get<T>(key: string): T | undefined;
    del(key: string): number;
    flushAll(): void;
    keys(): string[];
    flushStats(): any;
  }
  export default NodeCache;
}

