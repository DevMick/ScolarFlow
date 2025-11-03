// ========================================
// TYPES BILANS ANNUELS - PHASE 7
// ========================================

import type { Student } from './student';
import type { Evaluation, EvaluationResult } from './evaluation';
import type { Class } from './class';

/**
 * Types de profils d'élèves détectés automatiquement
 */
export enum StudentProfileType {
  HighAchiever = 'high_achiever',
  ConsistentPerformer = 'consistent_performer',
  ImprovingStudent = 'improving_student',
  StrugglingStudent = 'struggling_student',
  InconsistentPerformer = 'inconsistent_performer',
  ExceptionalCase = 'exceptional_case'
}

/**
 * Types d'insights de classe
 */
export enum InsightType {
  ClassTrend = 'class_trend',
  SubjectInsight = 'subject_insight',
  PedagogicalAlert = 'pedagogical_alert',
  SuccessFactor = 'success_factor'
}

/**
 * Niveaux de priorité
 */
export enum Priority {
  High = 'high',
  Medium = 'medium',
  Low = 'low'
}

/**
 * Tendances de progression
 */
export enum ProgressionTrend {
  StrongImprovement = 'strong_improvement',
  ModerateImprovement = 'moderate_improvement',
  Stable = 'stable',
  SlightDecline = 'slight_decline',
  SignificantDecline = 'significant_decline'
}

/**
 * Cibles des rapports
 */
export enum ReportTarget {
  Administration = 'administration',
  Parents = 'parents',
  NextTeacher = 'next_teacher',
  Archive = 'archive'
}

/**
 * Types de sections de rapport
 */
export enum ReportSectionType {
  Summary = 'summary',
  Charts = 'charts',
  StudentList = 'student_list',
  Recommendations = 'recommendations',
  Statistics = 'statistics',
  Insights = 'insights',
  Metadata = 'metadata',
  RawData = 'raw_data',
  Analysis = 'analysis',
  Activities = 'activities',
  Planning = 'planning'
}

/**
 * Layouts de rapport
 */
export enum ReportLayout {
  Compact = 'compact',
  Detailed = 'detailed',
  Executive = 'executive'
}

/**
 * Niveaux de difficulté des recommandations
 */
export enum RecommendationDifficulty {
  Easy = 'easy',
  Medium = 'medium',
  Challenging = 'challenging'
}

/**
 * Catégories de recommandations pédagogiques
 */
export enum RecommendationCategory {
  TeachingMethod = 'teaching_method',
  CurriculumFocus = 'curriculum_focus',
  IndividualSupport = 'individual_support',
  ClassManagement = 'class_management',
  AssessmentStrategy = 'assessment_strategy',
  NextYearPlanning = 'next_year_planning'
}

/**
 * Profil détaillé d'un élève
 */
export interface StudentProfile {
  id: string;
  studentId: number;
  classId: number;
  academicYear: string;
  type: StudentProfileType;
  confidence: number;
  characteristics: string[];
  strengths: string[];
  challenges: string[];
  performanceData: StudentPerformanceData;
  progressionData: StudentProgressionData;
  detectedAt: Date;
  lastUpdated: Date;
}

/**
 * Données de performance d'un élève
 */
export interface StudentPerformanceData {
  overallAverage: number;
  subjectAverages: Record<string, number>;
  bestSubjects: string[];
  strugglingSubjects: string[];
  classRank: number;
  percentile: number;
  consistencyScore: number;
  participationRate: number;
  absenteeismRate: number;
}

/**
 * Données de progression d'un élève
 */
export interface StudentProgressionData {
  overallTrend: ProgressionTrend;
  progressionRate: number;
  milestones: Array<{
    date: Date;
    achievement: string;
    impact: number;
  }>;
  criticalPeriods: Array<{
    period: string;
    issue: string;
    impact: string;
  }>;
  monthlyProgression: Array<{
    month: string;
    average: number;
    trend: number;
  }>;
}

/**
 * Analyse complète d'un élève
 */
export interface StudentAnalysis {
  student: Student;
  profile: StudentProfile;
  performance: StudentPerformanceData;
  progression: StudentProgressionData;
  recommendations: string[];
  nextYearPredictions: {
    expectedLevel: string;
    riskFactors: string[];
    supportNeeds: string[];
  };
}

/**
 * Insight de classe détecté automatiquement
 */
export interface ClassInsight {
  id: string;
  classId: number;
  academicYear: string;
  type: InsightType;
  title: string;
  description: string;
  data: Record<string, any>;
  actionable: boolean;
  priority: Priority;
  confidence: number;
  detectedAt: Date;
  acknowledgedAt?: Date;
  acknowledgedBy?: number;
}

/**
 * Recommandation pédagogique
 */
export interface PedagogicalRecommendation {
  id: string;
  classId: number;
  academicYear: string;
  category: RecommendationCategory;
  recommendation: string;
  rationale: string;
  expectedImpact?: string;
  difficulty: RecommendationDifficulty;
  priority: number; // 1-10
  evidence: Record<string, any>;
  generatedAt: Date;
  implementedAt?: Date;
  feedback?: string;
}

/**
 * Synthèse globale de classe
 */
export interface ClassSummary {
  averagePerformance: number;
  progressionTrend: ProgressionTrend;
  subjectPerformances: Array<{
    subject: string;
    average: number;
    progression: number;
    rank: number;
    studentCount: number;
  }>;
  keyMetrics: {
    successRate: number;
    absenteeismRate: number;
    participationRate: number;
    improvementRate: number;
    consistencyIndex: number;
  };
  distributionAnalysis: {
    excellentStudents: number; // >= 16/20
    goodStudents: number; // 14-16/20
    averageStudents: number; // 10-14/20
    strugglingStudents: number; // < 10/20
  };
  temporalAnalysis: {
    bestPeriod: string;
    worstPeriod: string;
    mostImprovement: string;
    seasonalPatterns: Array<{
      period: string;
      performance: number;
      factors: string[];
    }>;
  };
}

/**
 * Section de rapport
 */
export interface ReportSection {
  id: string;
  title: string;
  type: ReportSectionType;
  required: boolean;
  customizable: boolean;
  config: Record<string, any>;
  content?: any;
  order: number;
}

/**
 * Configuration de formatage de rapport
 */
export interface ReportFormatting {
  layout: ReportLayout;
  includeCharts: boolean;
  includeRawData: boolean;
  pageBreaks: string[];
  branding: boolean;
  colorScheme?: string;
  fontSize?: number;
  margins?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
}

/**
 * Template de rapport
 */
export interface ReportTemplate {
  id: string;
  name: string;
  description: string;
  target: ReportTarget;
  config: Record<string, any>;
  sections: ReportSection[];
  formatting: ReportFormatting;
  isOfficial: boolean;
  createdBy?: number;
  usageCount: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Métadonnées de rapport
 */
export interface ReportMetadata {
  className: string;
  level: string;
  teacher: string;
  totalStudents: number;
  totalEvaluations: number;
  dateRange: [Date, Date];
  generationTime: number;
  templateUsed?: string;
  customizations?: string[];
}

/**
 * Recommandations pédagogiques groupées
 */
export interface GroupedRecommendations {
  strengths: string[];
  areasForImprovement: string[];
  suggestedActions: Array<{
    action: string;
    rationale: string;
    expectedImpact: string;
    difficulty: RecommendationDifficulty;
    priority: number;
    category: RecommendationCategory;
  }>;
  nextYearFocus: string[];
  individualSupport: Array<{
    studentId: number;
    studentName: string;
    recommendations: string[];
    priority: Priority;
  }>;
}

/**
 * Bilan annuel complet
 */
export interface AnnualReport {
  id: string;
  classId: number;
  academicYear: string;
  generatedAt: Date;
  status: 'draft' | 'final' | 'archived';
  
  // Métadonnées
  metadata: ReportMetadata;
  
  // Synthèse globale
  classSummary: ClassSummary;
  
  // Analyses par élève
  studentAnalyses: StudentAnalysis[];
  
  // Insights et patterns
  insights: ClassInsight[];
  
  // Recommandations pédagogiques
  pedagogicalRecommendations: GroupedRecommendations;
  
  // Configuration et template
  template?: ReportTemplate;
  customSections?: ReportSection[];
  
  // Données brutes pour archivage
  rawData: {
    evaluations: Evaluation[];
    results: EvaluationResult[];
    statistics: Record<string, any>;
    classInfo: Class;
  };
  
  // Métriques de génération
  generationMetrics: {
    processingTime: number;
    dataPoints: number;
    algorithmsUsed: string[];
    confidenceScore: number;
  };
}

/**
 * Options de génération de rapport
 */
export interface ReportGenerationOptions {
  templateId?: string;
  customSections?: ReportSection[];
  includeRawData?: boolean;
  includeCharts?: boolean;
  focusAreas?: string[];
  excludeStudents?: number[];
  dateRange?: [Date, Date];
  language?: 'fr' | 'en';
  confidentialityLevel?: 'public' | 'internal' | 'confidential';
}

/**
 * Résultat de génération de rapport
 */
export interface ReportGenerationResult {
  success: boolean;
  report?: AnnualReport;
  errors?: string[];
  warnings?: string[];
  processingTime: number;
  cacheUsed: boolean;
}

/**
 * Archive de bilan annuel
 */
export interface AnnualArchive {
  id: string;
  classId: number;
  academicYear: string;
  summaryData: {
    studentCount: number;
    averagePerformance: number;
    keyInsights: string[];
    mainRecommendations: string[];
  };
  fullReportPath?: string;
  fileSize?: number;
  checksum?: string;
  metadata: Record<string, any>;
  createdAt: Date;
  archivedAt: Date;
}

/**
 * Options d'export de rapport
 */
export interface ReportExportOptions {
  format: 'pdf' | 'docx' | 'html' | 'json' | 'csv';
  includeCharts: boolean;
  includeRawData: boolean;
  watermark?: string;
  password?: string;
  compression?: boolean;
  quality?: 'draft' | 'standard' | 'high';
}

/**
 * Résultat d'export de rapport
 */
export interface ReportExportResult {
  success: boolean;
  filename: string;
  filePath?: string;
  downloadUrl?: string;
  fileSize: number;
  format: string;
  generatedAt: Date;
  expiresAt?: Date;
}

/**
 * Contexte d'analyse pour le moteur d'analytics
 */
export interface AnalysisContext {
  classInfo: Class;
  academicYear: string;
  evaluations: Evaluation[];
  results: EvaluationResult[];
  students: Student[];
  historicalData?: {
    previousYears: string[];
    comparativeData: Record<string, any>;
  };
  schoolContext?: {
    averagePerformance: number;
    standardDeviation: number;
    benchmarks: Record<string, number>;
  };
}

/**
 * Configuration du moteur d'analytics
 */
export interface AnalyticsConfig {
  enablePredictions: boolean;
  confidenceThreshold: number;
  includeComparisons: boolean;
  detectionSensitivity: 'low' | 'medium' | 'high';
  customAlgorithms?: string[];
  excludePatterns?: string[];
}

/**
 * Résultat d'analyse du moteur d'analytics
 */
export interface AnalyticsResult {
  profiles: StudentProfile[];
  insights: ClassInsight[];
  recommendations: PedagogicalRecommendation[];
  patterns: Array<{
    type: string;
    description: string;
    confidence: number;
    data: any;
  }>;
  predictions: Array<{
    type: string;
    prediction: string;
    confidence: number;
    timeframe: string;
  }>;
  processingMetrics: {
    algorithmsUsed: string[];
    processingTime: number;
    dataQuality: number;
    confidenceScore: number;
  };
}

/**
 * Messages de validation pour les bilans annuels
 */
export const REPORT_VALIDATION_MESSAGES = {
  REQUIRED_CLASS: 'Une classe doit être sélectionnée',
  REQUIRED_ACADEMIC_YEAR: 'L\'année scolaire est requise',
  INVALID_DATE_RANGE: 'La période sélectionnée est invalide',
  NO_EVALUATIONS: 'Aucune évaluation trouvée pour cette période',
  INSUFFICIENT_DATA: 'Données insuffisantes pour générer un rapport fiable',
  TEMPLATE_NOT_FOUND: 'Template de rapport introuvable',
  GENERATION_FAILED: 'Échec de la génération du rapport',
  EXPORT_FAILED: 'Échec de l\'export du rapport',
  INVALID_FORMAT: 'Format d\'export non supporté',
  ACCESS_DENIED: 'Accès non autorisé à cette classe',
  REPORT_TOO_LARGE: 'Le rapport généré est trop volumineux',
  CACHE_ERROR: 'Erreur de cache lors de la génération'
} as const;

/**
 * Configuration par défaut pour les rapports
 */
export const DEFAULT_REPORT_CONFIG = {
  includeCharts: true,
  includeRawData: false,
  confidenceThreshold: 0.7,
  maxProcessingTime: 30000, // 30 secondes
  cacheEnabled: true,
  cacheDuration: 3600000, // 1 heure
  language: 'fr',
  confidentialityLevel: 'internal'
} as const;

/**
 * Templates par défaut
 */
export const DEFAULT_REPORT_TEMPLATES = {
  ADMIN_COMPLETE: 'admin_complete',
  TRANSITION_SUMMARY: 'transition_summary',
  PARENT_REPORT: 'parent_report',
  ARCHIVE_COMPLETE: 'archive_complete'
} as const;
