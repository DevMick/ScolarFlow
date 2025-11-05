// Export des types
export * from './types/index.js';

// Export des utilitaires
export * from './utils/index.js';

// Export sélectif de la validation pour éviter les conflits
export {
  // Schémas d'authentification
  registerSchema,
  loginSchema,
  updateProfileSchema,
  
  // Schémas de classes
  createClassSchema,
  updateClassSchema,
  
  // Schémas d'années scolaires
  createSchoolYearSchema,
  updateSchoolYearSchema,
  
  // Schémas d'étudiants
  createStudentSchema,
  updateStudentSchema,
  bulkStudentSchema,
  createBulkStudentsSchema,
  studentFiltersSchema,
  exportOptionsSchema,
  importPDFSchema,
  
  // Schémas d'évaluations
  createEvaluationSchema,
  updateEvaluationSchema,
  evaluationResultSchema,
  createEvaluationResultSchemaWithMax,
  bulkResultsSchema,
  createBulkResultsSchemaWithContext,
  
  // Messages de validation
  VALIDATION_MESSAGES,
  
  // Utilitaires de validation
  validateScoreInContext,
  validateEvaluationConsistency,
  formatZodErrors,
  validateWithRetry,
  RealTimeValidator
} from './validation/index.js';
