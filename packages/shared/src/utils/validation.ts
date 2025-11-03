// ========================================
// UTILITAIRES DE VALIDATION RÉUTILISABLES
// ========================================

import { z } from 'zod';
import { VALIDATION_MESSAGES, getValidationMessage } from '../validation/messages';

// ========================================
// TYPES UTILITAIRES
// ========================================

export interface ValidationResult<T> {
  success: boolean;
  data?: T;
  errors?: string[];
  warnings?: string[];
}

export interface ValidationContext {
  maxScore?: number;
  validStudentIds?: number[];
  evaluationId?: number;
  evaluationType?: string;
  isFinalized?: boolean;
  userRole?: string;
}

export interface ValidationOptions {
  abortEarly?: boolean;
  includeWarnings?: boolean;
  customMessages?: Record<string, string>;
  context?: ValidationContext;
}

// ========================================
// FONCTIONS DE VALIDATION CONTEXTUELLE
// ========================================

/**
 * Valide un score selon le contexte de l'évaluation
 */
export const validateScoreInContext = (
  score: number | undefined | null, 
  maxScore: number, 
  isAbsent: boolean = false,
  evaluationType: string = 'Controle'
): void => {
  if (isAbsent && score !== undefined && score !== null) {
    throw new Error(VALIDATION_MESSAGES.ABSENT_WITH_SCORE);
  }
  
  if (!isAbsent && (score === undefined || score === null)) {
    throw new Error(VALIDATION_MESSAGES.PRESENT_WITHOUT_SCORE);
  }
  
  if (score !== undefined && score !== null) {
    if (score < 0) {
      throw new Error(VALIDATION_MESSAGES.SCORE_NEGATIVE);
    }
    
    if (score > maxScore) {
      throw new Error(
        getValidationMessage('SCORE_TOO_HIGH', { max: maxScore.toString() })
      );
    }
    
    // Vérifier précision décimale (maximum 2 décimales)
    if (Math.round(score * 100) !== score * 100) {
      throw new Error(VALIDATION_MESSAGES.SCORE_DECIMALS);
    }
    
    // Validation spécifique par type d'évaluation
    if (evaluationType === 'Participation' && score > 5) {
      console.warn('Score élevé pour une participation');
    }
    
    if (evaluationType === 'Examen' && score === 0) {
      console.warn('Score de 0 pour un examen - vérifiez si c\'est correct');
    }
  }
};

/**
 * Valide la cohérence d'une évaluation
 */
export const validateEvaluationConsistency = (evaluation: {
  type: string;
  coefficient: number;
  maxScore: number;
  evaluationDate: Date;
  title?: string;
}): string[] => {
  const warnings: string[] = [];
  
  // Vérifier cohérence type/coefficient
  if (evaluation.type === 'Participation' && evaluation.coefficient > 1) {
    warnings.push(VALIDATION_MESSAGES.PARTICIPATION_COEFFICIENT);
  }
  
  if (evaluation.type === 'Examen' && evaluation.coefficient < 2) {
    warnings.push(VALIDATION_MESSAGES.EXAM_COEFFICIENT);
  }
  
  if (evaluation.type === 'TP' && (evaluation.coefficient < 1 || evaluation.coefficient > 3)) {
    warnings.push(VALIDATION_MESSAGES.TP_COEFFICIENT);
  }
  
  if (evaluation.type === 'Projet' && evaluation.coefficient < 1.5) {
    warnings.push(VALIDATION_MESSAGES.PROJECT_COEFFICIENT);
  }
  
  // Vérifier cohérence type/maxScore
  if (evaluation.type === 'Participation' && evaluation.maxScore > 5) {
    warnings.push(VALIDATION_MESSAGES.PARTICIPATION_MAX_SCORE);
  }
  
  if (evaluation.type === 'Oral' && evaluation.maxScore > 20) {
    warnings.push(VALIDATION_MESSAGES.ORAL_MAX_SCORE);
  }
  
  if (evaluation.type === 'Examen' && evaluation.maxScore < 10) {
    warnings.push(VALIDATION_MESSAGES.EXAM_MIN_SCORE);
  }
  
  // Vérifier date cohérente
  const today = new Date();
  const daysDiff = Math.floor((today.getTime() - evaluation.evaluationDate.getTime()) / (1000 * 3600 * 24));
  
  if (daysDiff > 365) {
    warnings.push('L\'évaluation date de plus d\'un an');
  }
  
  // Vérifier cohérence titre/type
  if (evaluation.title) {
    const titleLower = evaluation.title.toLowerCase();
    if (evaluation.type === 'Controle' && titleLower.includes('examen')) {
      warnings.push('Le titre suggère un examen mais le type est "Contrôle"');
    }
    if (evaluation.type === 'Examen' && titleLower.includes('contrôle')) {
      warnings.push('Le titre suggère un contrôle mais le type est "Examen"');
    }
  }
  
  return warnings;
};

/**
 * Valide un lot de résultats pour cohérence
 */
export const validateBulkResultsConsistency = (
  results: Array<{
    studentId: number;
    score?: number;
    isAbsent: boolean;
  }>,
  maxScore: number,
  evaluationType: string = 'Controle'
): string[] => {
  const warnings: string[] = [];
  
  if (results.length === 0) {
    return ['Aucun résultat à valider'];
  }
  
  // Calculer statistiques de base
  const presentResults = results.filter(r => !r.isAbsent && r.score !== undefined);
  const absentCount = results.filter(r => r.isAbsent).length;
  const absentRate = absentCount / results.length;
  
  // Taux d'absence anormal
  if (absentRate > 0.3) {
    warnings.push(`Taux d'absence élevé: ${Math.round(absentRate * 100)}%`);
  }
  
  if (presentResults.length > 0) {
    const scores = presentResults.map(r => r.score!);
    const average = scores.reduce((a, b) => a + b, 0) / scores.length;
    const minScore = Math.min(...scores);
    const maxScoreAchieved = Math.max(...scores);
    
    // Moyenne anormalement basse
    if (average < maxScore * 0.3) {
      warnings.push(`Moyenne de classe faible: ${average.toFixed(2)}/${maxScore}`);
    }
    
    // Moyenne anormalement haute
    if (average > maxScore * 0.9) {
      warnings.push(`Moyenne de classe très élevée: ${average.toFixed(2)}/${maxScore}`);
    }
    
    // Tous les élèves ont la même note
    const uniqueScores = new Set(scores);
    if (uniqueScores.size === 1 && presentResults.length > 3) {
      warnings.push('Tous les élèves présents ont la même note');
    }
    
    // Écart trop faible entre min et max
    if (presentResults.length > 5 && (maxScoreAchieved - minScore) < maxScore * 0.1) {
      warnings.push('Écart très faible entre les notes');
    }
    
    // Beaucoup de notes parfaites
    const perfectScores = scores.filter(s => s === maxScore).length;
    if (perfectScores > presentResults.length * 0.5 && presentResults.length > 5) {
      warnings.push('Beaucoup de notes parfaites');
    }
    
    // Beaucoup de notes nulles
    const zeroScores = scores.filter(s => s === 0).length;
    if (zeroScores > presentResults.length * 0.2 && evaluationType !== 'Participation') {
      warnings.push('Beaucoup de notes nulles');
    }
  }
  
  return warnings;
};

// ========================================
// HELPERS POUR ERREURS ZOD
// ========================================

/**
 * Formate les erreurs Zod en messages lisibles
 */
export const formatZodErrors = (error: z.ZodError, customMessages?: Record<string, string>): string[] => {
  return error.errors.map(err => {
    // Utiliser message personnalisé si disponible
    if (customMessages && err.path.length > 0) {
      const pathKey = err.path.join('.');
      if (customMessages[pathKey]) {
        return customMessages[pathKey];
      }
    }
    
    // Format standard
    if (err.path.length > 0) {
      const fieldName = err.path[err.path.length - 1];
      return `${fieldName}: ${err.message}`;
    }
    
    return err.message;
  });
};

/**
 * Extrait les warnings des issues Zod
 */
export const extractZodWarnings = (error: z.ZodError): string[] => {
  return error.errors
    .filter(err => err.code === z.ZodIssueCode.custom && err.message.includes('attention'))
    .map(err => err.message);
};

// ========================================
// VALIDATION AVEC RETRY ET RESILIENCE
// ========================================

/**
 * Validation avec retry automatique
 */
export const validateWithRetry = async <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  retries: number = 3,
  options?: ValidationOptions
): Promise<ValidationResult<T>> => {
  let lastError: Error | null = null;
  
  for (let i = 0; i < retries; i++) {
    try {
      const result = await schema.parseAsync(data);
      return {
        success: true,
        data: result,
        warnings: options?.includeWarnings ? [] : undefined
      };
    } catch (error) {
      lastError = error as Error;
      
      if (error instanceof z.ZodError) {
        // Ne pas retry pour erreurs de validation
        break;
      }
      
      if (i < retries - 1) {
        // Attendre avant retry (backoff exponentiel)
        await new Promise(resolve => setTimeout(resolve, 100 * Math.pow(2, i)));
      }
    }
  }
  
  // Formater l'erreur finale
  if (lastError instanceof z.ZodError) {
    return {
      success: false,
      errors: formatZodErrors(lastError, options?.customMessages),
      warnings: options?.includeWarnings ? extractZodWarnings(lastError) : undefined
    };
  }
  
  return {
    success: false,
    errors: [lastError?.message || 'Erreur de validation inconnue']
  };
};

/**
 * Validation en mode "safe" sans exception
 */
export const validateSafe = <T>(
  schema: z.ZodSchema<T>,
  data: unknown,
  options?: ValidationOptions
): ValidationResult<T> => {
  try {
    const result = schema.parse(data);
    return {
      success: true,
      data: result,
      warnings: options?.includeWarnings ? [] : undefined
    };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: formatZodErrors(error, options?.customMessages),
        warnings: options?.includeWarnings ? extractZodWarnings(error) : undefined
      };
    }
    
    return {
      success: false,
      errors: [(error as Error)?.message || 'Erreur de validation inconnue']
    };
  }
};

// ========================================
// VALIDATOR TEMPS RÉEL
// ========================================

/**
 * Classe pour validation en temps réel avec debouncing
 */
export class RealTimeValidator<T> {
  private schema: z.ZodSchema<T>;
  private debounceMs: number;
  private timeoutId: NodeJS.Timeout | null = null;
  private lastValidationTime: number = 0;
  
  constructor(schema: z.ZodSchema<T>, debounceMs: number = 300) {
    this.schema = schema;
    this.debounceMs = debounceMs;
  }
  
  /**
   * Valide avec debouncing
   */
  validate(
    data: unknown,
    onSuccess: (result: T, warnings?: string[]) => void,
    onError: (errors: string[], warnings?: string[]) => void,
    options?: ValidationOptions
  ): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
    }
    
    this.timeoutId = setTimeout(() => {
      const startTime = Date.now();
      this.lastValidationTime = startTime;
      
      try {
        const result = this.schema.parse(data);
        
        // Vérifier si c'est toujours la validation la plus récente
        if (this.lastValidationTime === startTime) {
          const warnings = options?.includeWarnings ? 
            this.getValidationWarnings(data, result) : undefined;
          onSuccess(result, warnings);
        }
      } catch (error) {
        if (this.lastValidationTime === startTime) {
          if (error instanceof z.ZodError) {
            const errors = formatZodErrors(error, options?.customMessages);
            const warnings = options?.includeWarnings ? 
              extractZodWarnings(error) : undefined;
            onError(errors, warnings);
          } else {
            onError(['Erreur de validation inconnue']);
          }
        }
      }
    }, this.debounceMs);
  }
  
  /**
   * Valide immédiatement sans debouncing
   */
  validateSync(data: unknown, options?: ValidationOptions): ValidationResult<T> {
    return validateSafe(this.schema, data, options);
  }
  
  /**
   * Valide un champ spécifique
   */
  validateField(
    fieldPath: string[],
    value: unknown,
    onResult: (result: ValidationResult<unknown>) => void
  ): void {
    try {
      // Créer un schéma partiel pour le champ
      let currentSchema: any = this.schema;
      
      // Navigation dans le schéma (simplifié)
      for (const path of fieldPath) {
        if (currentSchema._def?.shape && currentSchema._def.shape[path]) {
          currentSchema = currentSchema._def.shape[path];
        }
      }
      
      const result = validateSafe(currentSchema, value);
      onResult(result);
    } catch (error) {
      onResult({
        success: false,
        errors: ['Erreur de validation du champ']
      });
    }
  }
  
  /**
   * Obtient les warnings de validation contextuelle
   */
  private getValidationWarnings(originalData: unknown, validatedData: T): string[] {
    const warnings: string[] = [];
    
    // Ajouter logique spécifique pour warnings contextuels
    // (peut être étendu selon les besoins spécifiques)
    
    return warnings;
  }
  
  /**
   * Met à jour le schéma de validation
   */
  updateSchema(newSchema: z.ZodSchema<T>): void {
    this.schema = newSchema;
  }
  
  /**
   * Nettoie les timers
   */
  cleanup(): void {
    if (this.timeoutId) {
      clearTimeout(this.timeoutId);
      this.timeoutId = null;
    }
  }
}

// ========================================
// VALIDATION EN LOT OPTIMISÉE
// ========================================

/**
 * Valide un lot de données avec optimisations
 */
export const validateBatch = async <T>(
  schema: z.ZodSchema<T>,
  dataArray: unknown[],
  options?: ValidationOptions & {
    parallel?: boolean;
    batchSize?: number;
    stopOnFirstError?: boolean;
  }
): Promise<{
  successful: T[];
  failed: Array<{ index: number; data: unknown; errors: string[] }>;
  warnings: string[];
}> => {
  const successful: T[] = [];
  const failed: Array<{ index: number; data: unknown; errors: string[] }> = [];
  const warnings: string[] = [];
  
  const batchSize = options?.batchSize || 100;
  const parallel = options?.parallel !== false;
  const stopOnFirstError = options?.stopOnFirstError || false;
  
  // Traitement par batch pour optimiser la performance
  for (let i = 0; i < dataArray.length; i += batchSize) {
    const batch = dataArray.slice(i, i + batchSize);
    
    if (parallel) {
      // Traitement parallèle
      const results = await Promise.allSettled(
        batch.map(async (item, index) => {
          const result = validateSafe(schema, item, options);
          return {
            ...result,
            index: i + index,
            data: item
          };
        })
      );
      
      for (const result of results) {
        if (result.status === 'fulfilled') {
          const validation = result.value;
          if (validation.success && validation.data) {
            successful.push(validation.data as T);
          } else {
            failed.push({
              index: validation.index,
              data: validation.data,
              errors: validation.errors || ['Erreur inconnue']
            });
            
            if (stopOnFirstError) {
              return { successful, failed, warnings };
            }
          }
          
          if (validation.warnings) {
            warnings.push(...validation.warnings);
          }
        }
      }
    } else {
      // Traitement séquentiel
      for (let j = 0; j < batch.length; j++) {
        const item = batch[j];
        const validation = validateSafe(schema, item, options);
        
        if (validation.success && validation.data) {
          successful.push(validation.data);
        } else {
          failed.push({
            index: i + j,
            data: item,
            errors: validation.errors || ['Erreur inconnue']
          });
          
          if (stopOnFirstError) {
            return { successful, failed, warnings };
          }
        }
        
        if (validation.warnings) {
          warnings.push(...validation.warnings);
        }
      }
    }
  }
  
  return { successful, failed, warnings };
};

// ========================================
// HELPERS POUR RÈGLES MÉTIER
// ========================================

/**
 * Valide les permissions utilisateur
 */
export const validateUserPermissions = (
  action: string,
  resource: string,
  userRole: string,
  context?: ValidationContext
): boolean => {
  // Logique de permissions simplifiée
  const permissions = {
    teacher: ['create', 'read', 'update', 'delete'],
    admin: ['create', 'read', 'update', 'delete', 'manage'],
    viewer: ['read']
  };
  
  const allowedActions = permissions[userRole as keyof typeof permissions] || [];
  return allowedActions.includes(action);
};

/**
 * Valide la cohérence temporelle
 */
export const validateTemporalConsistency = (
  createdAt: Date,
  updatedAt: Date,
  evaluationDate?: Date
): string[] => {
  const warnings: string[] = [];
  
  if (updatedAt < createdAt) {
    warnings.push('Date de modification antérieure à la date de création');
  }
  
  if (evaluationDate && createdAt < evaluationDate) {
    const daysDiff = Math.floor((evaluationDate.getTime() - createdAt.getTime()) / (1000 * 3600 * 24));
    if (daysDiff > 90) {
      warnings.push('Évaluation créée très longtemps avant la date d\'évaluation');
    }
  }
  
  return warnings;
};
