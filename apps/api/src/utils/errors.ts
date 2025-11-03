// ========================================
// SYSTÈME DE GESTION D'ERREURS PERSONNALISÉES
// ========================================

/**
 * Classe de base pour toutes les erreurs du service EduStats
 */
export class ServiceError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;
  public readonly timestamp: Date;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: any
  ) {
    super(message);
    this.name = this.constructor.name;
    this.statusCode = statusCode;
    this.code = code || this.constructor.name.toUpperCase();
    this.details = details;
    this.timestamp = new Date();

    // Maintenir la stack trace (Node.js)
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * Convertit l'erreur en objet JSON pour l'API
   */
  toJSON() {
    return {
      success: false,
      error: {
        name: this.name,
        message: this.message,
        code: this.code,
        statusCode: this.statusCode,
        details: this.details,
        timestamp: this.timestamp.toISOString(),
      }
    };
  }

  /**
   * Retourne un message d'erreur formaté pour les logs
   */
  getLogMessage(): string {
    return `[${this.code}] ${this.message}` + 
           (this.details ? ` - Details: ${JSON.stringify(this.details)}` : '');
  }
}

// ========================================
// ERREURS SPÉCIFIQUES
// ========================================

/**
 * Erreur de validation des données
 */
export class ValidationError extends ServiceError {
  constructor(message: string, validationErrors?: any[]) {
    super(message, 400, 'VALIDATION_ERROR', validationErrors);
  }

  /**
   * Crée une ValidationError à partir d'erreurs Zod
   */
  static fromZodErrors(zodErrors: any[]): ValidationError {
    const formattedErrors = zodErrors.map(err => ({
      field: err.path?.join('.') || 'unknown',
      message: err.message,
      code: err.code,
    }));

    return new ValidationError(
      'Erreurs de validation détectées',
      formattedErrors
    );
  }
}

/**
 * Ressource non trouvée
 */
export class NotFoundError extends ServiceError {
  constructor(resource: string = 'Ressource', id?: string | number) {
    const message = id 
      ? `${resource} avec l'ID ${id} non trouvée`
      : `${resource} non trouvée`;
    
    super(message, 404, 'NOT_FOUND', { resource, id });
  }
}

/**
 * Accès non autorisé
 */
export class ForbiddenError extends ServiceError {
  constructor(message: string = 'Accès interdit', action?: string) {
    super(message, 403, 'FORBIDDEN', { action });
  }
}

/**
 * Authentification requise
 */
export class UnauthorizedError extends ServiceError {
  constructor(message: string = 'Authentification requise') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

/**
 * Conflit de données (ex: doublon)
 */
export class ConflictError extends ServiceError {
  constructor(message: string, conflictingData?: any) {
    super(message, 409, 'CONFLICT', conflictingData);
  }
}

/**
 * Erreur de règle métier
 */
export class BusinessRuleError extends ServiceError {
  constructor(message: string, ruleName?: string, context?: any) {
    super(message, 422, 'BUSINESS_RULE_VIOLATION', { ruleName, context });
  }
}

/**
 * Erreur de base de données
 */
export class DatabaseError extends ServiceError {
  constructor(message: string, originalError?: any) {
    super(
      `Erreur de base de données: ${message}`,
      500,
      'DATABASE_ERROR',
      { originalError: originalError?.message }
    );
  }
}

/**
 * Erreur de calcul mathématique
 */
export class CalculationError extends ServiceError {
  constructor(message: string, calculationType?: string, data?: any) {
    super(
      `Erreur de calcul: ${message}`,
      500,
      'CALCULATION_ERROR',
      { calculationType, data }
    );
  }
}

/**
 * Erreur de performance/timeout
 */
export class PerformanceError extends ServiceError {
  constructor(message: string, operation?: string, duration?: number) {
    super(
      `Problème de performance: ${message}`,
      503,
      'PERFORMANCE_ERROR',
      { operation, duration }
    );
  }
}

/**
 * Erreur de limite de taux
 */
export class RateLimitError extends ServiceError {
  constructor(message: string = 'Trop de requêtes', retryAfter?: number) {
    super(message, 429, 'RATE_LIMIT_EXCEEDED', { retryAfter });
  }
}

// ========================================
// ERREURS SPÉCIFIQUES AUX ÉVALUATIONS
// ========================================

/**
 * Erreur d'évaluation finalisée
 */
export class EvaluationFinalizedError extends BusinessRuleError {
  constructor(evaluationId: number, attemptedAction: string) {
    super(
      `Impossible de ${attemptedAction} sur une évaluation finalisée`,
      'EVALUATION_FINALIZED',
      { evaluationId, attemptedAction }
    );
  }
}

/**
 * Erreur de note invalide
 */
export class InvalidScoreError extends ValidationError {
  constructor(score: number, maxScore: number, studentId?: number) {
    super(
      `Note invalide: ${score} dépasse la note maximale de ${maxScore}`,
      [{
        field: 'score',
        message: `La note ${score} dépasse le maximum autorisé (${maxScore})`,
        code: 'SCORE_TOO_HIGH',
        context: { score, maxScore, studentId }
      }]
    );
  }
}

/**
 * Erreur de classement
 */
export class RankingError extends CalculationError {
  constructor(message: string, evaluationId: number, context?: any) {
    super(
      message,
      'RANKING_CALCULATION',
      { evaluationId, ...context }
    );
  }
}

/**
 * Erreur de propriété de classe
 */
export class ClassOwnershipError extends ForbiddenError {
  constructor(classId: number, userId: number) {
    super(
      'Vous n\'avez pas les droits sur cette classe',
      'ACCESS_CLASS'
    );
    this.details = { classId, userId };
  }
}

/**
 * Erreur d'élève non trouvé dans la classe
 */
export class StudentNotInClassError extends ValidationError {
  constructor(studentId: number, classId: number) {
    super(
      'Cet élève n\'appartient pas à cette classe',
      [{
        field: 'studentId',
        message: `L'élève ${studentId} n'est pas dans la classe ${classId}`,
        code: 'STUDENT_NOT_IN_CLASS',
        context: { studentId, classId }
      }]
    );
  }
}

// ========================================
// UTILITAIRES DE GESTION D'ERREURS
// ========================================

/**
 * Type guard pour vérifier si une erreur est une ServiceError
 */
export function isServiceError(error: any): error is ServiceError {
  return error instanceof ServiceError;
}

/**
 * Convertit une erreur générique en ServiceError
 */
export function toServiceError(error: any): ServiceError {
  if (isServiceError(error)) {
    return error;
  }

  // Erreurs Prisma
  if (error?.code && typeof error.code === 'string') {
    return handlePrismaError(error);
  }

  // Erreurs Zod
  if (error?.issues && Array.isArray(error.issues)) {
    return ValidationError.fromZodErrors(error.issues);
  }

  // Erreur générique
  return new ServiceError(
    error?.message || 'Erreur inconnue',
    500,
    'UNKNOWN_ERROR',
    error
  );
}

/**
 * Gère les erreurs spécifiques de Prisma
 */
function handlePrismaError(error: any): ServiceError {
  switch (error.code) {
    case 'P2002':
      // Violation de contrainte unique
      const target = error.meta?.target || 'données';
      return new ConflictError(
        `Données en conflit: ${target} existe déjà`,
        error.meta
      );

    case 'P2025':
      // Enregistrement non trouvé
      return new NotFoundError(
        'Enregistrement',
        error.meta?.cause || 'inconnu'
      );

    case 'P2003':
      // Violation de clé étrangère
      return new ValidationError(
        'Référence invalide vers un enregistrement inexistant',
        [{ field: error.meta?.field_name, message: error.message }]
      );

    case 'P2021':
      // Table non trouvée
      return new DatabaseError(
        `Table non trouvée: ${error.meta?.table}`,
        error
      );

    case 'P1008':
      // Timeout de connexion
      return new PerformanceError(
        'Timeout de connexion à la base de données',
        'DATABASE_CONNECTION',
        error.meta?.connection_timeout
      );

    default:
      return new DatabaseError(
        error.message || 'Erreur de base de données',
        error
      );
  }
}

/**
 * Middleware de gestion d'erreurs pour Express
 */
export function errorHandler(
  error: any,
  req: any,
  res: any,
  next: any
) {
  const serviceError = toServiceError(error);
  
  // Logger l'erreur (ici on utilise console, dans un vrai projet : Winston, etc.)
  console.error(`[ERROR] ${serviceError.getLogMessage()}`, {
    url: req.url,
    method: req.method,
    userAgent: req.get('user-agent'),
    ip: req.ip,
    stack: serviceError.stack,
  });

  // Répondre avec l'erreur formatée
  res.status(serviceError.statusCode).json(serviceError.toJSON());
}

/**
 * Helper pour wrapper des fonctions async et capturer les erreurs
 */
export function asyncHandler<T extends any[], R>(
  fn: (...args: T) => Promise<R>
) {
  return (...args: T): Promise<R> => {
    return Promise.resolve(fn(...args)).catch((error) => {
      throw toServiceError(error);
    });
  };
}

/**
 * Helper pour valider et convertir les erreurs dans les services
 */
export function validateAndHandle<T>(
  validationFn: () => T,
  errorMessage: string = 'Erreur de validation'
): T {
  try {
    return validationFn();
  } catch (error) {
    throw new ValidationError(errorMessage, error);
  }
}

/**
 * Helper pour les opérations de base de données avec gestion d'erreurs
 */
export async function handleDatabaseOperation<T>(
  operation: () => Promise<T>,
  operationName: string = 'opération de base de données'
): Promise<T> {
  try {
    return await operation();
  } catch (error) {
    throw toServiceError(error);
  }
}

// ========================================
// CONSTANTES D'ERREURS
// ========================================

export const ERROR_CODES = {
  // Génériques
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  NOT_FOUND: 'NOT_FOUND',
  FORBIDDEN: 'FORBIDDEN',
  UNAUTHORIZED: 'UNAUTHORIZED',
  CONFLICT: 'CONFLICT',
  
  // Métier
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  EVALUATION_FINALIZED: 'EVALUATION_FINALIZED',
  CLASS_OWNERSHIP: 'CLASS_OWNERSHIP',
  
  // Technique
  DATABASE_ERROR: 'DATABASE_ERROR',
  CALCULATION_ERROR: 'CALCULATION_ERROR',
  PERFORMANCE_ERROR: 'PERFORMANCE_ERROR',
  
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];
