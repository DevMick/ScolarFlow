// ========================================
// VALIDATION SYSTÈME D'ÉVALUATIONS
// ========================================

import { z } from 'zod';
import { VALIDATION_MESSAGES, getValidationMessage } from './messages.js';

// ========================================
// SCHÉMAS DE BASE - ÉNUMÉRATIONS
// ========================================

// Types d'évaluation autorisés
export const evaluationTypeSchema = z.enum([
  'Controle', 
  'Devoir', 
  'Examen', 
  'Oral', 
  'TP', 
  'Projet', 
  'Participation',
  'Quiz',
  'Exercice'
], {
  errorMap: () => ({ message: VALIDATION_MESSAGES.INVALID_EVALUATION_TYPE })
});

// Gestion des absents
export const absentHandlingSchema = z.enum([
  'exclude_from_ranking', 
  'zero_score', 
  'class_average', 
  'manual_decision',
  'proportional_bonus'
], {
  errorMap: () => ({ message: VALIDATION_MESSAGES.INVALID_ABSENT_HANDLING })
});

// Raisons d'absence
export const absentReasonSchema = z.enum([
  'illness', 
  'family_reason', 
  'school_activity',
  'medical_appointment',
  'unjustified', 
  'exclusion',
  'other'
], {
  errorMap: () => ({ message: VALIDATION_MESSAGES.INVALID_ABSENT_REASON })
});

// Méthodes d'arrondi
export const roundingMethodSchema = z.enum([
  'none', 
  'nearest_half', 
  'nearest_quarter', 
  'nearest_integer', 
  'one_decimal', 
  'two_decimals',
  'ceil',
  'floor'
], {
  errorMap: () => ({ message: VALIDATION_MESSAGES.INVALID_ROUNDING_METHOD })
});

// ========================================
// VALIDATION CHAMPS DE BASE
// ========================================

// Titre de l'évaluation
const titleSchema = z.string({
  required_error: VALIDATION_MESSAGES.REQUIRED_FIELD,
  invalid_type_error: VALIDATION_MESSAGES.INVALID_TYPE,
})
  .min(3, VALIDATION_MESSAGES.TITLE_TOO_SHORT)
  .max(200, VALIDATION_MESSAGES.TITLE_TOO_LONG)
  .regex(
    /^[a-zA-ZÀ-ÿ0-9\s\-_.:()\/+&']+$/,
    VALIDATION_MESSAGES.TITLE_INVALID_CHARS
  )
  .refine(
    title => title.trim().length > 0,
    VALIDATION_MESSAGES.TITLE_EMPTY
  )
  .refine(
    title => title.trim().length >= 3,
    VALIDATION_MESSAGES.TITLE_ONLY_SPACES
  )
  .transform(title => title.trim());

// Matière
const subjectSchema = z.string({
  required_error: VALIDATION_MESSAGES.REQUIRED_FIELD,
  invalid_type_error: VALIDATION_MESSAGES.INVALID_TYPE,
})
  .min(2, VALIDATION_MESSAGES.SUBJECT_TOO_SHORT)
  .max(100, VALIDATION_MESSAGES.SUBJECT_TOO_LONG)
  .regex(
    /^[a-zA-ZÀ-ÿ\s\-&']+$/,
    VALIDATION_MESSAGES.SUBJECT_INVALID_CHARS
  )
  .refine(
    subject => subject.trim().length > 0,
    VALIDATION_MESSAGES.SUBJECT_EMPTY
  )
  .transform(subject => subject.trim());

// Note maximale
const maxScoreSchema = z.number({
  required_error: VALIDATION_MESSAGES.MAX_SCORE_REQUIRED,
  invalid_type_error: VALIDATION_MESSAGES.MAX_SCORE_INVALID_TYPE,
})
  .positive(VALIDATION_MESSAGES.MAX_SCORE_POSITIVE)
  .min(0.01, VALIDATION_MESSAGES.MAX_SCORE_TOO_LOW)
  .max(1000, VALIDATION_MESSAGES.MAX_SCORE_TOO_HIGH)
  .multipleOf(0.01, VALIDATION_MESSAGES.MAX_SCORE_DECIMALS)
  .refine(
    score => score > 0,
    VALIDATION_MESSAGES.MAX_SCORE_ZERO
  )
  .refine(
    score => score <= 100,
    VALIDATION_MESSAGES.MAX_SCORE_UNREALISTIC
  );

// Coefficient
const coefficientSchema = z.number({
  invalid_type_error: VALIDATION_MESSAGES.COEFFICIENT_INVALID_TYPE,
})
  .positive(VALIDATION_MESSAGES.COEFFICIENT_POSITIVE)
  .min(0.01, VALIDATION_MESSAGES.COEFFICIENT_TOO_LOW)
  .max(20, VALIDATION_MESSAGES.COEFFICIENT_TOO_HIGH)
  .multipleOf(0.01, VALIDATION_MESSAGES.COEFFICIENT_DECIMALS)
  .refine(
    coeff => coeff <= 10,
    VALIDATION_MESSAGES.COEFFICIENT_UNREALISTIC
  )
  .default(1);

// Date d'évaluation
const evaluationDateSchema = z.date({
  required_error: VALIDATION_MESSAGES.DATE_REQUIRED,
  invalid_type_error: VALIDATION_MESSAGES.DATE_INVALID,
})
  .refine(
    date => date <= new Date(),
    VALIDATION_MESSAGES.DATE_FUTURE
  )
  .refine(
    date => date >= new Date('2020-01-01'),
    VALIDATION_MESSAGES.DATE_TOO_OLD
  )
  .refine(
    date => {
      const dayOfWeek = date.getDay();
      return dayOfWeek >= 1 && dayOfWeek <= 5; // Lundi à vendredi
    },
    VALIDATION_MESSAGES.DATE_WEEKEND
  )
  .refine(
    date => {
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      yesterday.setHours(0, 0, 0, 0);
      return date >= yesterday;
    },
    VALIDATION_MESSAGES.DATE_TOO_RECENT
  );

// Description optionnelle
const descriptionSchema = z.string()
  .max(1000, VALIDATION_MESSAGES.DESCRIPTION_TOO_LONG)
  .regex(
    /^[a-zA-ZÀ-ÿ0-9\s\-_.,;:!?()\[\]\/+"'&@#]*$/,
    VALIDATION_MESSAGES.DESCRIPTION_INVALID_CHARS
  )
  .optional()
  .transform(desc => {
    if (!desc) return undefined;
    const trimmed = desc.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  });

// ========================================
// SCHÉMA CRÉATION ÉVALUATION
// ========================================

export const createEvaluationSchema = z.object({
  title: titleSchema,
  subject: subjectSchema,
  type: evaluationTypeSchema,
  maxScore: maxScoreSchema,
  coefficient: coefficientSchema,
  evaluationDate: evaluationDateSchema,
  description: descriptionSchema,
  absentHandling: absentHandlingSchema.default('exclude_from_ranking'),
  roundingMethod: roundingMethodSchema.default('two_decimals'),
  showRanking: z.boolean().default(true),
}).strict().superRefine((data, ctx) => {
  
  // ========================================
  // VALIDATION CROISÉE - RÈGLES MÉTIER
  // ========================================
  
  // Règles spécifiques par type d'évaluation
  if (data.type === 'Participation') {
    if (data.coefficient > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.PARTICIPATION_COEFFICIENT,
        path: ['coefficient'],
      });
    }
    
    if (data.maxScore > 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.PARTICIPATION_MAX_SCORE,
        path: ['maxScore'],
      });
    }
  }
  
  if (data.type === 'Examen') {
    if (data.coefficient < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.EXAM_COEFFICIENT,
        path: ['coefficient'],
      });
    }
    
    if (data.maxScore < 10) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.EXAM_MIN_SCORE,
        path: ['maxScore'],
      });
    }
  }
  
  if (data.type === 'Oral' && data.maxScore > 20) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: VALIDATION_MESSAGES.ORAL_MAX_SCORE,
      path: ['maxScore'],
    });
  }
  
  if (data.type === 'TP') {
    if (data.coefficient < 1 || data.coefficient > 3) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.TP_COEFFICIENT,
        path: ['coefficient'],
      });
    }
  }
  
  if (data.type === 'Projet' && data.coefficient < 1.5) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: VALIDATION_MESSAGES.PROJECT_COEFFICIENT,
      path: ['coefficient'],
    });
  }
  
  // Validation cohérence titre/matière
  const titleLower = data.title.toLowerCase();
  const subjectLower = data.subject.toLowerCase();
  
  // Suggestions basées sur le titre
  const mathKeywords = ['math', 'calcul', 'nombre', 'fraction', 'géométrie'];
  const frenchKeywords = ['français', 'dictée', 'grammaire', 'orthographe', 'conjugaison'];
  const historyKeywords = ['histoire', 'guerre', 'roi', 'révolution', 'siècle'];
  
  if (mathKeywords.some(keyword => titleLower.includes(keyword)) && 
      !subjectLower.includes('math')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Le titre suggère une évaluation de mathématiques mais la matière est différente',
      path: ['subject'],
    });
  }
  
  if (frenchKeywords.some(keyword => titleLower.includes(keyword)) && 
      !subjectLower.includes('français')) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Le titre suggère une évaluation de français mais la matière est différente',
      path: ['subject'],
    });
  }
  
  // Validation cohérence date/type
  const dayOfWeek = data.evaluationDate.getDay();
  if (data.type === 'Examen' && dayOfWeek === 5) { // Vendredi
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Il est déconseillé de programmer un examen le vendredi',
      path: ['evaluationDate'],
    });
  }
});

// ========================================
// SCHÉMA MODIFICATION ÉVALUATION
// ========================================

export const updateEvaluationSchema = z.object({
  title: titleSchema.optional(),
  subject: subjectSchema.optional(),
  type: evaluationTypeSchema.optional(),
  maxScore: maxScoreSchema.optional(),
  coefficient: coefficientSchema.optional(),
  evaluationDate: evaluationDateSchema.optional(),
  description: descriptionSchema,
  absentHandling: absentHandlingSchema.optional(),
  roundingMethod: roundingMethodSchema.optional(),
  showRanking: z.boolean().optional(),
  isFinalized: z.boolean().optional(),
}).strict().superRefine((data, ctx) => {
  
  // Règles spéciales pour évaluations finalisées
  if (data.isFinalized === true) {
    const allowedFields = ['description', 'showRanking', 'isFinalized'];
    const modifiedFields = Object.keys(data).filter(key => 
      data[key as keyof typeof data] !== undefined
    );
    
    const unauthorizedFields = modifiedFields.filter(field => 
      !allowedFields.includes(field)
    );
    
    if (unauthorizedFields.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.FINALIZED_MODIFICATION,
        path: unauthorizedFields,
      });
    }
  }
  
  // Validation cohérence type/coefficient pour modifications
  if (data.type && data.coefficient) {
    if (data.type === 'Participation' && data.coefficient > 1) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.PARTICIPATION_COEFFICIENT,
        path: ['coefficient'],
      });
    }
    
    if (data.type === 'Examen' && data.coefficient < 2) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.EXAM_COEFFICIENT,
        path: ['coefficient'],
      });
    }
  }
  
  // Validation cohérence type/maxScore pour modifications
  if (data.type && data.maxScore) {
    if (data.type === 'Participation' && data.maxScore > 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.PARTICIPATION_MAX_SCORE,
        path: ['maxScore'],
      });
    }
    
    if (data.type === 'Oral' && data.maxScore > 20) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.ORAL_MAX_SCORE,
        path: ['maxScore'],
      });
    }
  }
});

// ========================================
// SCHÉMAS POUR FILTRES ET RECHERCHE
// ========================================

export const evaluationFiltersSchema = z.object({
  search: z.string()
    .min(2, VALIDATION_MESSAGES.SEARCH_TOO_SHORT)
    .max(100, VALIDATION_MESSAGES.SEARCH_TOO_LONG)
    .regex(
      /^[a-zA-ZÀ-ÿ0-9\s\-_.:()\/+&']*$/,
      VALIDATION_MESSAGES.SEARCH_INVALID_CHARS
    )
    .optional(),
    
  subject: z.string()
    .max(100, VALIDATION_MESSAGES.SUBJECT_TOO_LONG)
    .optional(),
    
  type: z.array(evaluationTypeSchema)
    .max(10, 'Trop de types d\'évaluation sélectionnés')
    .optional(),
    
  dateRange: z.object({
    start: z.date({
      invalid_type_error: VALIDATION_MESSAGES.DATE_INVALID,
    }),
    end: z.date({
      invalid_type_error: VALIDATION_MESSAGES.DATE_INVALID,
    }),
  })
    .refine(
      ({ start, end }) => start <= end,
      VALIDATION_MESSAGES.DATE_RANGE_START_AFTER_END
    )
    .refine(
      ({ start, end }) => {
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 730; // 2 ans maximum
      },
      VALIDATION_MESSAGES.DATE_RANGE_TOO_LARGE
    )
    .optional(),
    
  isFinalized: z.boolean().optional(),
  hasResults: z.boolean().optional(),
  
  sortBy: z.enum([
    'title',
    'subject', 
    'evaluationDate',
    'createdAt',
    'averageScore',
    'completedCount'
  ]).default('evaluationDate'),
  
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  
  page: z.number()
    .int(VALIDATION_MESSAGES.PAGE_INVALID)
    .positive(VALIDATION_MESSAGES.PAGE_INVALID)
    .max(1000, VALIDATION_MESSAGES.PAGE_TOO_HIGH)
    .default(1),
    
  limit: z.number()
    .int(VALIDATION_MESSAGES.LIMIT_INVALID)
    .min(1, VALIDATION_MESSAGES.LIMIT_INVALID)
    .max(100, VALIDATION_MESSAGES.LIMIT_TOO_HIGH)
    .default(20),
    
}).strict();

// ========================================
// SCHÉMAS POUR FINALISATION
// ========================================

export const finalizeEvaluationSchema = z.object({
  evaluationId: z.number()
    .int('L\'ID de l\'évaluation doit être un entier')
    .positive('L\'ID de l\'évaluation doit être positif'),
    
  confirmFinalization: z.boolean()
    .refine(val => val === true, 'La finalisation doit être confirmée'),
    
  recalculateRanking: z.boolean().default(true),
  
  notifyStudents: z.boolean().default(false),
  
}).strict();

// ========================================
// SCHÉMAS POUR DUPLICATION
// ========================================

export const duplicateEvaluationSchema = z.object({
  sourceEvaluationId: z.number()
    .int('L\'ID de l\'évaluation source doit être un entier')
    .positive('L\'ID de l\'évaluation source doit être positif'),
    
  newTitle: titleSchema,
  newDate: evaluationDateSchema,
  newDescription: descriptionSchema,
  
  copyResults: z.boolean().default(false),
  copyStudentList: z.boolean().default(true),
  
}).strict().superRefine((data, ctx) => {
  // S'assurer que le nouveau titre est différent
  if (data.newTitle && data.newTitle.length < 5) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Le nouveau titre doit être suffisamment descriptif',
      path: ['newTitle'],
    });
  }
});

// ========================================
// TYPES D'EXPORT POUR TYPESCRIPT
// ========================================

export type CreateEvaluationValidationInput = z.infer<typeof createEvaluationSchema>;
export type UpdateEvaluationValidationInput = z.infer<typeof updateEvaluationSchema>;
export type EvaluationFiltersValidationInput = z.infer<typeof evaluationFiltersSchema>;
export type FinalizeEvaluationValidationInput = z.infer<typeof finalizeEvaluationSchema>;
export type DuplicateEvaluationValidationInput = z.infer<typeof duplicateEvaluationSchema>;