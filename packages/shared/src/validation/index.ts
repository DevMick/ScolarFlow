// ========================================
// EXPORTS PRINCIPAUX - VALIDATION ZOD EDUSTATS
// ========================================

// ========================================
// VALIDATION EXISTANTE (PHASES PRÉCÉDENTES)
// ========================================
export * from './auth';
export * from './schoolYear';
export * from './class';
export * from './student';

// ========================================
// NOUVELLE VALIDATION ÉVALUATIONS (PHASE 4)
// ========================================

// Schémas d'évaluations
export {
  // Énumérations
  evaluationTypeSchema,
  absentHandlingSchema,
  absentReasonSchema,
  roundingMethodSchema,
  
  // Schémas principaux
  createEvaluationSchema,
  updateEvaluationSchema,
  evaluationFiltersSchema,
  finalizeEvaluationSchema,
  duplicateEvaluationSchema,
  
  // Types TypeScript
  type CreateEvaluationValidationInput,
  type UpdateEvaluationValidationInput,
  type EvaluationFiltersValidationInput,
  type FinalizeEvaluationValidationInput,
  type DuplicateEvaluationValidationInput,
} from './evaluation';

// Schémas de résultats
export {
  // Schémas de base
  evaluationResultSchema,
  bulkResultsSchema,
  updateResultSchema,
  deleteResultSchema,
  importResultsSchema,
  
  // Fonctions de schémas dynamiques
  createEvaluationResultSchemaWithMax,
  createEvaluationResultSchemaWithContext,
  createBulkResultsSchemaWithContext,
  
  // Types TypeScript
  type EvaluationResultValidationInput,
  type BulkResultsValidationInput,
  type UpdateResultValidationInput,
  type DeleteResultValidationInput,
  type ImportResultsValidationInput,
  type EvaluationResultWithMaxValidationInput,
  type EvaluationResultWithContextValidationInput,
  type BulkResultsWithContextValidationInput,
} from './result';

// Messages d'erreur
export {
  VALIDATION_MESSAGES,
  VALIDATION_CATEGORIES,
  getValidationMessage,
  getMessagesByCategory,
  type ValidationMessage,
} from './messages';

// ========================================
// UTILITAIRES DE VALIDATION
// ========================================
export {
  // Types utilitaires
  type ValidationResult,
  type ValidationContext,
  type ValidationOptions,
  
  // Fonctions de validation contextuelle
  validateScoreInContext,
  validateEvaluationConsistency,
  validateBulkResultsConsistency,
  
  // Helpers Zod
  formatZodErrors,
  extractZodWarnings,
  
  // Validation avec resilience
  validateWithRetry,
  validateSafe,
  
  // Validation temps réel
  RealTimeValidator,
  
  // Validation en lot
  validateBatch,
  
  // Helpers métier
  validateUserPermissions,
  validateTemporalConsistency,
} from '../utils/validation';

// ========================================
// SCHÉMAS GÉNÉRIQUES RÉUTILISABLES
// ========================================

import { z } from 'zod';
import { VALIDATION_MESSAGES } from './messages';

// Pagination standard
export const paginationSchema = z.object({
  page: z.number()
    .int(VALIDATION_MESSAGES.PAGE_INVALID)
    .min(1, VALIDATION_MESSAGES.PAGE_INVALID)
    .max(1000, VALIDATION_MESSAGES.PAGE_TOO_HIGH)
    .default(1),
  limit: z.number()
    .int(VALIDATION_MESSAGES.LIMIT_INVALID)
    .min(1, VALIDATION_MESSAGES.LIMIT_INVALID)
    .max(100, VALIDATION_MESSAGES.LIMIT_TOO_HIGH)
    .default(20),
});

// Tri standard
export const sortSchema = z.object({
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc'], {
    errorMap: () => ({ message: 'L\'ordre de tri doit être "asc" ou "desc"' })
  }).default('asc')
});

// Validation ID générique
export const idSchema = z.object({
  id: z.number()
    .int('L\'ID doit être un nombre entier')
    .positive('L\'ID doit être positif')
});

// Plage de dates
export const dateRangeSchema = z.object({
  startDate: z.date({
    invalid_type_error: VALIDATION_MESSAGES.DATE_INVALID,
  }).optional(),
  endDate: z.date({
    invalid_type_error: VALIDATION_MESSAGES.DATE_INVALID,
  }).optional()
}).refine(data => {
  if (data.startDate && data.endDate) {
    return data.startDate <= data.endDate;
  }
  return true;
}, {
  message: VALIDATION_MESSAGES.DATE_RANGE_START_AFTER_END,
  path: ['endDate']
}).refine(data => {
  if (data.startDate && data.endDate) {
    const diffTime = Math.abs(data.endDate.getTime() - data.startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 730; // 2 ans maximum
  }
  return true;
}, {
  message: VALIDATION_MESSAGES.DATE_RANGE_TOO_LARGE,
  path: ['endDate']
});

// Recherche textuelle
export const searchSchema = z.object({
  q: z.string()
    .min(2, VALIDATION_MESSAGES.SEARCH_TOO_SHORT)
    .max(100, VALIDATION_MESSAGES.SEARCH_TOO_LONG)
    .regex(
      /^[a-zA-ZÀ-ÿ0-9\s\-_.:()\/+&']*$/,
      VALIDATION_MESSAGES.SEARCH_INVALID_CHARS
    )
    .transform(q => q.trim())
});

// Upload de fichier
export const fileUploadSchema = z.object({
  filename: z.string()
    .min(1, VALIDATION_MESSAGES.FILE_REQUIRED)
    .max(255, 'Le nom de fichier ne peut pas dépasser 255 caractères')
    .regex(
      /^[a-zA-Z0-9\s\-_.\(\)]+$/,
      'Le nom de fichier contient des caractères non autorisés'
    ),
  mimetype: z.string()
    .min(1, 'Le type MIME est requis'),
  size: z.number()
    .int('La taille doit être un entier')
    .min(1, 'La taille du fichier doit être positive')
    .max(10 * 1024 * 1024, 'Le fichier ne peut pas dépasser 10MB')
});

// Réponse API standard
export const apiResponseSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  data: z.any().optional(),
  errors: z.array(z.string()).optional(),
  timestamp: z.date().optional(),
  requestId: z.string().optional(),
});

// Réponse d'erreur
export const errorResponseSchema = z.object({
  success: z.literal(false),
  message: z.string(),
  errors: z.array(z.string()).optional(),
  code: z.string().optional(),
  statusCode: z.number().optional(),
  timestamp: z.date().default(() => new Date()),
});

// Réponse paginée
export const paginatedResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) =>
  apiResponseSchema.extend({
    data: z.array(dataSchema),
    pagination: z.object({
      total: z.number().int().min(0),
      page: z.number().int().min(1),
      limit: z.number().int().min(1),
      totalPages: z.number().int().min(0),
      hasNext: z.boolean(),
      hasPrev: z.boolean(),
      startIndex: z.number().int().min(0),
      endIndex: z.number().int().min(0),
    }),
  });

// ========================================
// TYPES DÉRIVÉS POUR TYPESCRIPT
// ========================================

export type PaginationValidationInput = z.infer<typeof paginationSchema>;
export type SortValidationInput = z.infer<typeof sortSchema>;
export type IdValidationInput = z.infer<typeof idSchema>;
export type DateRangeValidationInput = z.infer<typeof dateRangeSchema>;
export type SearchValidationInput = z.infer<typeof searchSchema>;
export type FileUploadValidationInput = z.infer<typeof fileUploadSchema>;
export type ApiValidationResponse = z.infer<typeof apiResponseSchema>;
export type ErrorValidationResponse = z.infer<typeof errorResponseSchema>;

// ========================================
// HELPERS DE CONSTRUCTION DE SCHÉMAS SIMPLIFIÉS
// ========================================

/**
 * Exemple de schéma avec pagination et tri
 */
export const exampleListQuerySchema = z.object({
  // Pagination
  page: z.number()
    .int(VALIDATION_MESSAGES.PAGE_INVALID)
    .min(1, VALIDATION_MESSAGES.PAGE_INVALID)
    .default(1),
  limit: z.number()
    .int(VALIDATION_MESSAGES.LIMIT_INVALID)
    .min(1, VALIDATION_MESSAGES.LIMIT_INVALID)
    .max(100, VALIDATION_MESSAGES.LIMIT_TOO_HIGH)
    .default(20),
  
  // Tri
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  
  // Recherche
  search: z.string()
    .min(2, VALIDATION_MESSAGES.SEARCH_TOO_SHORT)
    .max(100, VALIDATION_MESSAGES.SEARCH_TOO_LONG)
    .optional(),
});

/**
 * Helper pour créer un schéma de liste basique
 */
export const createBasicListQuerySchema = (allowedSortFields?: string[]) => {
  return z.object({
    page: paginationSchema.shape.page,
    limit: paginationSchema.shape.limit,
    sortBy: allowedSortFields 
      ? z.enum(allowedSortFields as [string, ...string[]]).optional()
      : z.string().optional(),
    sortOrder: sortSchema.shape.sortOrder,
    search: z.string()
      .min(2, VALIDATION_MESSAGES.SEARCH_TOO_SHORT)
      .max(100, VALIDATION_MESSAGES.SEARCH_TOO_LONG)
      .optional(),
  });
};

// ========================================
// CONSTANTES DE VALIDATION
// ========================================

export const VALIDATION_CONSTANTS = {
  // Limites de base
  MAX_STRING_LENGTH: 1000,
  MAX_TEXT_LENGTH: 5000,
  MAX_FILENAME_LENGTH: 255,
  MAX_SEARCH_LENGTH: 100,
  
  // Limites numériques
  MAX_PAGE_NUMBER: 1000,
  MAX_ITEMS_PER_PAGE: 100,
  MIN_ITEMS_PER_PAGE: 1,
  DEFAULT_ITEMS_PER_PAGE: 20,
  
  // Limites de fichiers
  MAX_FILE_SIZE: 10 * 1024 * 1024, // 10MB
  MAX_UPLOAD_FILES: 10,
  
  // Formats autorisés
  ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
  ALLOWED_DOCUMENT_TYPES: ['application/pdf', 'text/plain', 'application/msword'],
  
  // Expressions régulières communes
  REGEX: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_FR: /^(?:\+33|0)[1-9](?:[0-9]{8})$/,
    ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
    SAFE_STRING: /^[a-zA-ZÀ-ÿ0-9\s\-_.,;:!?()\[\]\/+"'&@#]*$/,
    FILENAME: /^[a-zA-Z0-9\s\-_.\(\)]+$/,
  },
} as const;

// ========================================
// VALIDATION TABLEAUX PERSONNALISÉS (PHASE 6)
// ========================================

export {
  // Schémas de tableaux
  createCustomTableSchema,
  updateCustomTableSchema,
  createTemplateSchema,
  exportTableSchema,
  duplicateTableSchema,
  useTemplateSchema,
  
  // Schémas de formules
  validateFormulaSchema,
  createCustomFormulaSchema,
  
  // Schémas de configuration
  customTableConfigSchema,
  tableColumnSchema,
  formulaSchema,
  
  // Messages de validation
  TABLE_VALIDATION_MESSAGES
} from './tables';