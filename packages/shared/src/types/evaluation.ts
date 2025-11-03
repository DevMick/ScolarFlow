// ========================================
// INTERFACES PRINCIPALES - ÉVALUATIONS
// ========================================

export interface Evaluation {
  id: number;
  classId: number;
  title: string;
  subject: string;
  type: EvaluationType;
  maxScore: number;
  coefficient: number;
  evaluationDate: Date;
  description?: string;
  isFinalized: boolean;
  absentHandling: AbsentHandling;
  roundingMethod: RoundingMethod;
  showRanking: boolean;
  createdAt: Date;
  updatedAt: Date;
  
  // Statistiques calculées (optionnelles)
  studentCount?: number;
  completedCount?: number;
  averageScore?: number;
  minScore?: number;
  maxScoreAchieved?: number;
  medianScore?: number;
  standardDeviation?: number;
}

export interface EvaluationResult {
  id: number;
  evaluationId: number;
  studentId: number;
  score?: number;
  isAbsent: boolean;
  absentReason?: AbsentReason;
  notes?: string;
  rank?: number;
  percentile?: number;
  createdAt: Date;
  updatedAt: Date;
  lastModifiedBy?: number;
  
  // Relations optionnelles (pour les requêtes avec joins)
  student?: {
    id: number;
    firstName: string;
    lastName: string;
    studentNumber?: string;
  };
  evaluation?: {
    id: number;
    title: string;
    maxScore: number;
    coefficient: number;
  };
}

// ========================================
// TYPES DE CRÉATION/MODIFICATION
// ========================================

export interface CreateEvaluationData {
  title: string;
  subject: string;
  type: EvaluationType;
  maxScore: number;
  coefficient?: number;
  evaluationDate: Date;
  description?: string;
  absentHandling?: AbsentHandling;
  roundingMethod?: RoundingMethod;
  showRanking?: boolean;
}

export interface UpdateEvaluationData extends Partial<CreateEvaluationData> {
  isFinalized?: boolean;
}

export interface EvaluationResultInput {
  studentId: number;
  score?: number;
  isAbsent: boolean;
  absentReason?: AbsentReason;
  notes?: string;
}

export interface BulkEvaluationResultInput {
  evaluationId: number;
  results: EvaluationResultInput[];
  skipValidation?: boolean;
}

// ========================================
// ENUMS ET TYPES UNION
// ========================================

export type EvaluationType = 
  | 'Controle'      // Contrôle classique
  | 'Devoir'        // Devoir surveillé
  | 'Examen'        // Examen officiel
  | 'Oral'          // Évaluation orale
  | 'TP'            // Travaux pratiques
  | 'Projet'        // Projet long terme
  | 'Participation' // Note de participation
  | 'Quiz'          // Quiz rapide
  | 'Exercice';     // Exercice en classe

export type AbsentHandling = 
  | 'exclude_from_ranking'    // Exclure du classement
  | 'zero_score'              // Note 0 automatique
  | 'class_average'           // Moyenne de classe
  | 'manual_decision'         // Décision manuelle
  | 'proportional_bonus';     // Bonus proportionnel

export type AbsentReason = 
  | 'illness'                 // Maladie
  | 'family_reason'           // Raison familiale
  | 'school_activity'         // Activité scolaire
  | 'medical_appointment'     // Rendez-vous médical
  | 'unjustified'            // Non justifiée
  | 'exclusion'              // Exclusion disciplinaire
  | 'other';                 // Autre

export type RoundingMethod = 
  | 'none'                   // Pas d'arrondi
  | 'nearest_half'           // Au demi-point près (0.5)
  | 'nearest_quarter'        // Au quart de point (0.25)
  | 'nearest_integer'        // Nombre entier
  | 'one_decimal'            // Une décimale (0.1)
  | 'two_decimals'           // Deux décimales (0.01)
  | 'ceil'                   // Arrondi supérieur
  | 'floor';                 // Arrondi inférieur

// ========================================
// TYPES POUR STATISTIQUES ET ANALYSES
// ========================================

export interface EvaluationStatistics {
  evaluationId: number;
  studentCount: number;
  completedCount: number;
  absentCount: number;
  averageScore: number;
  minScore: number;
  maxScore: number;
  medianScore: number;
  standardDeviation: number;
  passingRate: number; // Pourcentage de réussite (>= 10/20)
  scoreDistribution: ScoreDistribution[];
  quartiles: {
    q1: number;
    q2: number; // Médiane
    q3: number;
  };
}

export interface ScoreDistribution {
  range: string; // "0-5", "5-10", etc.
  count: number;
  percentage: number;
}

export interface StudentPerformance {
  studentId: number;
  evaluationCount: number;
  averageScore: number;
  bestScore: number;
  worstScore: number;
  improvementTrend: 'improving' | 'declining' | 'stable';
  absentCount: number;
  rankAverage: number;
}

// ========================================
// TYPES POUR FILTRES ET RECHERCHE
// ========================================

export interface EvaluationFilters {
  search?: string;
  subject?: string;
  type?: EvaluationType[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  isFinalized?: boolean;
  hasResults?: boolean;
  sortBy?: EvaluationSortField;
  sortOrder?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

export type EvaluationSortField = 
  | 'title'
  | 'subject'
  | 'evaluationDate'
  | 'createdAt'
  | 'averageScore'
  | 'completedCount';

export interface ResultFilters {
  studentIds?: number[];
  scoreRange?: {
    min?: number;
    max?: number;
  };
  includeAbsent?: boolean;
  absentReasons?: AbsentReason[];
  sortBy?: ResultSortField;
  sortOrder?: 'asc' | 'desc';
}

export type ResultSortField = 
  | 'score'
  | 'rank'
  | 'studentName'
  | 'createdAt';

// ========================================
// TYPES POUR EXPORT ET RAPPORT
// ========================================

export interface EvaluationExportOptions {
  format: 'pdf' | 'excel' | 'csv';
  includeStatistics: boolean;
  includeAbsent: boolean;
  includeNotes: boolean;
  showRanking: boolean;
  groupBySubject: boolean;
  customFields?: string[];
}

export interface EvaluationReport {
  evaluation: Evaluation;
  results: EvaluationResult[];
  statistics: EvaluationStatistics;
  generatedAt: Date;
  generatedBy: number;
}

// ========================================
// TYPES UTILITAIRES
// ========================================

export interface EvaluationWithResults extends Evaluation {
  results: EvaluationResult[];
  statistics: EvaluationStatistics;
}

export interface EvaluationSummary {
  id: number;
  title: string;
  subject: string;
  type: EvaluationType;
  evaluationDate: Date;
  isFinalized: boolean;
  studentCount: number;
  completedCount: number;
  averageScore?: number;
}

// Constantes utiles
export const EVALUATION_TYPES: Record<EvaluationType, string> = {
  'Controle': 'Contrôle',
  'Devoir': 'Devoir surveillé',
  'Examen': 'Examen',
  'Oral': 'Évaluation orale',
  'TP': 'Travaux pratiques',
  'Projet': 'Projet',
  'Participation': 'Participation',
  'Quiz': 'Quiz',
  'Exercice': 'Exercice',
};

export const ABSENT_HANDLING_LABELS: Record<AbsentHandling, string> = {
  'exclude_from_ranking': 'Exclure du classement',
  'zero_score': 'Note 0 automatique',
  'class_average': 'Moyenne de classe',
  'manual_decision': 'Décision manuelle',
  'proportional_bonus': 'Bonus proportionnel',
};

export const ABSENT_REASON_LABELS: Record<AbsentReason, string> = {
  'illness': 'Maladie',
  'family_reason': 'Raison familiale',
  'school_activity': 'Activité scolaire',
  'medical_appointment': 'Rendez-vous médical',
  'unjustified': 'Non justifiée',
  'exclusion': 'Exclusion disciplinaire',
  'other': 'Autre',
};

export const ROUNDING_METHOD_LABELS: Record<RoundingMethod, string> = {
  'none': 'Aucun arrondi',
  'nearest_half': 'Au demi-point près',
  'nearest_quarter': 'Au quart de point',
  'nearest_integer': 'Nombre entier',
  'one_decimal': 'Une décimale',
  'two_decimals': 'Deux décimales',
  'ceil': 'Arrondi supérieur',
  'floor': 'Arrondi inférieur',
};