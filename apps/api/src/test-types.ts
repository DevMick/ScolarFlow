// Test d'import des nouveaux types d'évaluations
import type { 
  Evaluation, 
  EvaluationResult,
  CreateEvaluationData,
  EvaluationType,
  AbsentHandling,
  AbsentReason,
  RoundingMethod,
  EvaluationStatistics,
  EvaluationFilters,
  ApiResponse,
  PaginatedResponse
} from '@edustats/shared';

// Test que les types fonctionnent correctement
const testEvaluation: CreateEvaluationData = {
  title: "Test Math",
  subject: "Mathématiques", 
  type: "Controle",
  maxScore: 20,
  evaluationDate: new Date(),
  coefficient: 1,
  description: "Évaluation de mathématiques sur les fractions",
  absentHandling: "exclude_from_ranking",
  roundingMethod: "nearest_half",
  showRanking: true
};

const testResult: EvaluationResult = {
  id: 1,
  evaluationId: 1,
  studentId: 1,
  score: 15.5,
  isAbsent: false,
  rank: 3,
  percentile: 75,
  createdAt: new Date(),
  updatedAt: new Date()
};

const testResponse: ApiResponse<Evaluation[]> = {
  success: true,
  data: [],
  message: "Évaluations récupérées avec succès"
};

const testPaginatedResponse: PaginatedResponse<Evaluation> = {
  success: true,
  data: [],
  message: "Évaluations paginées",
  pagination: {
    total: 50,
    page: 1,
    limit: 20,
    totalPages: 3,
    // hasNext removed from pagination type
    // hasPrev removed from pagination type
    // startIndex and endIndex removed from pagination type
  }
};

// Test des enums
const evaluationTypes: EvaluationType[] = [
  'Controle',
  'Devoir',
  'Examen',
  'Oral',
  'TP',
  'Projet',
  'Participation',
  'Quiz',
  'Exercice'
];

const absentHandlingOptions: AbsentHandling[] = [
  'exclude_from_ranking',
  'zero_score',
  'class_average',
  'manual_decision',
  'proportional_bonus'
];

const absentReasons: AbsentReason[] = [
  'illness',
  'family_reason',
  'school_activity',
  'medical_appointment',
  'unjustified',
  'exclusion',
  'other'
];

const roundingMethods: RoundingMethod[] = [
  'none',
  'nearest_half',
  'nearest_quarter',
  'nearest_integer',
  'one_decimal',
  'two_decimals',
  'ceil',
  'floor'
];

console.log('✅ Tous les types d\'évaluations sont correctement importés et fonctionnels !');
console.log('📊 Types testés:', {
  evaluation: testEvaluation.title,
  result: testResult.score,
  typesCount: evaluationTypes.length,
  handlingOptions: absentHandlingOptions.length,
  reasons: absentReasons.length,
  roundingMethods: roundingMethods.length
});

export { testEvaluation, testResult, testResponse, testPaginatedResponse };
