// ========================================
// VALIDATION RÉSULTATS D'ÉVALUATIONS
// ========================================

import { z } from 'zod';
import { VALIDATION_MESSAGES, getValidationMessage } from './messages.js';
import { absentReasonSchema } from './evaluation.js';

// ========================================
// SCHÉMAS DE BASE POUR RÉSULTATS
// ========================================

// Validation ID élève
const studentIdSchema = z.number({
  required_error: VALIDATION_MESSAGES.STUDENT_ID_REQUIRED,
  invalid_type_error: VALIDATION_MESSAGES.STUDENT_ID_INVALID,
})
  .int(VALIDATION_MESSAGES.STUDENT_ID_INTEGER)
  .positive(VALIDATION_MESSAGES.STUDENT_ID_POSITIVE);

// Validation score de base (sans limite max dynamique)
const baseScoreSchema = z.number({
  invalid_type_error: VALIDATION_MESSAGES.SCORE_INVALID_TYPE,
})
  .min(0, VALIDATION_MESSAGES.SCORE_NEGATIVE)
  .multipleOf(0.01, VALIDATION_MESSAGES.SCORE_DECIMALS);

// Validation statut d'absence
const isAbsentSchema = z.boolean({
  required_error: VALIDATION_MESSAGES.ABSENT_REQUIRED,
  invalid_type_error: VALIDATION_MESSAGES.ABSENT_INVALID,
});

// Validation notes/remarques
const notesSchema = z.string()
  .max(500, VALIDATION_MESSAGES.NOTES_TOO_LONG)
  .regex(
    /^[a-zA-ZÀ-ÿ0-9\s\-_.,;:!?()\[\]\/+"'&@#]*$/,
    VALIDATION_MESSAGES.NOTES_INVALID_CHARS
  )
  .optional()
  .transform(notes => {
    if (!notes) return undefined;
    const trimmed = notes.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  });

// ========================================
// SCHÉMA RÉSULTAT ÉLÈVE DE BASE
// ========================================

export const evaluationResultSchema = z.object({
  studentId: studentIdSchema,
  score: baseScoreSchema.optional(),
  isAbsent: isAbsentSchema,
  absentReason: absentReasonSchema.optional(),
  notes: notesSchema,
}).strict().superRefine((data, ctx) => {
  
  // ========================================
  // VALIDATION CROISÉE - LOGIQUE MÉTIER
  // ========================================
  
  if (data.isAbsent) {
    // Si absent, ne devrait pas avoir de note
    if (data.score !== undefined && data.score !== null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.ABSENT_WITH_SCORE,
        path: ['score'],
      });
    }
    
    // Si absent, devrait avoir une raison
    if (!data.absentReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.ABSENT_WITHOUT_REASON,
        path: ['absentReason'],
      });
    }
  } else {
    // Si présent, doit avoir une note
    if (data.score === undefined || data.score === null) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.PRESENT_WITHOUT_SCORE,
        path: ['score'],
      });
    }
    
    // Si présent, pas de raison d'absence
    if (data.absentReason) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.PRESENT_WITH_REASON,
        path: ['absentReason'],
      });
    }
  }
  
  // Validation des remarques inappropriées
  if (data.notes) {
    const inappropriateWords = [
      'idiot', 'stupide', 'nul', 'débile', 'crétin', 'imbécile',
      'hate', 'déteste', 'horrible', 'affreux'
    ];
    
    const notesLower = data.notes.toLowerCase();
    const hasInappropriateContent = inappropriateWords.some(word => 
      notesLower.includes(word)
    );
    
    if (hasInappropriateContent) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.NOTES_INAPPROPRIATE,
        path: ['notes'],
      });
    }
  }
});

// ========================================
// SCHÉMA DYNAMIQUE AVEC SCORE MAXIMUM
// ========================================

export const createEvaluationResultSchemaWithMax = (maxScore: number) => {
  return z.object({
    studentId: z.number()
      .int(VALIDATION_MESSAGES.STUDENT_ID_INTEGER)
      .positive(VALIDATION_MESSAGES.STUDENT_ID_POSITIVE),
    score: z.number({
      invalid_type_error: VALIDATION_MESSAGES.SCORE_INVALID_TYPE,
    })
      .min(0, VALIDATION_MESSAGES.SCORE_NEGATIVE)
      .max(maxScore, `La note ne peut pas dépasser ${maxScore}`)
      .multipleOf(0.01, VALIDATION_MESSAGES.SCORE_DECIMALS)
      .optional(),
    
    isAbsent: z.boolean({
      required_error: VALIDATION_MESSAGES.ABSENT_REQUIRED,
      invalid_type_error: VALIDATION_MESSAGES.ABSENT_INVALID,
    }),
    
    absentReason: z.enum([
      'illness', 
      'family_reason', 
      'school_activity',
      'medical_appointment',
      'unjustified', 
      'exclusion',
      'other'
    ], {
      errorMap: () => ({ message: VALIDATION_MESSAGES.INVALID_ABSENT_REASON })
    }).optional(),
    
    notes: z.string()
      .max(500, VALIDATION_MESSAGES.NOTES_TOO_LONG)
      .optional()
      .transform(notes => notes?.trim() || undefined),
      
  }).strict().superRefine((data, ctx) => {
    // Validation croisée
    if (data.isAbsent) {
      if (data.score !== undefined && data.score !== null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: VALIDATION_MESSAGES.ABSENT_WITH_SCORE,
          path: ['score'],
        });
      }
      
      if (!data.absentReason) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: VALIDATION_MESSAGES.ABSENT_WITHOUT_REASON,
          path: ['absentReason'],
        });
      }
    } else {
      if (data.score === undefined || data.score === null) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: VALIDATION_MESSAGES.PRESENT_WITHOUT_SCORE,
          path: ['score'],
        });
      }
      
      if (data.absentReason) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: VALIDATION_MESSAGES.PRESENT_WITH_REASON,
          path: ['absentReason'],
        });
      }
    }
  });
};

// ========================================
// SCHÉMA DYNAMIQUE AVEC CONTEXTE COMPLET
// ========================================

export const createEvaluationResultSchemaWithContext = (
  maxScore: number,
  validStudentIds: number[],
  evaluationId: number,
  evaluationType: string = 'Controle'
) => {
  return z.object({
    studentId: z.number()
      .int(VALIDATION_MESSAGES.STUDENT_ID_INTEGER)
      .positive(VALIDATION_MESSAGES.STUDENT_ID_POSITIVE),
    score: z.number({
      invalid_type_error: VALIDATION_MESSAGES.SCORE_INVALID_TYPE,
    })
      .min(0, VALIDATION_MESSAGES.SCORE_NEGATIVE)
      .max(maxScore, `La note ne peut pas dépasser ${maxScore}`)
      .multipleOf(0.01, VALIDATION_MESSAGES.SCORE_DECIMALS)
      .optional(),
    isAbsent: z.boolean({
      required_error: VALIDATION_MESSAGES.ABSENT_REQUIRED,
      invalid_type_error: VALIDATION_MESSAGES.ABSENT_INVALID,
    }),
    absentReason: z.enum([
      'illness', 'family_reason', 'school_activity',
      'medical_appointment', 'unjustified', 'exclusion', 'other'
    ]).optional(),
    notes: z.string().max(500, VALIDATION_MESSAGES.NOTES_TOO_LONG).optional(),
    evaluationId: z.number()
      .int('L\'ID de l\'évaluation doit être un entier')
      .positive('L\'ID de l\'évaluation doit être positif')
      .default(evaluationId),
  }).strict().superRefine((data: any, ctx: any) => {
    
    // Vérifier que l'élève appartient à la classe
    if (!validStudentIds.includes(data.studentId)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.STUDENT_NOT_IN_CLASS,
        path: ['studentId'],
      });
    }
    
    // Validation spécifique par type d'évaluation
    if (data.score !== undefined && !data.isAbsent) {
      if (evaluationType === 'Participation') {
        // Pour la participation, scores généralement entre 1 et maxScore
        if (data.score < 1 && data.score > 0) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Pour une note de participation, le score devrait être au moins 1',
            path: ['score'],
          });
        }
      }
      
      if (evaluationType === 'Examen') {
        // Pour un examen, un score de 0 devrait être justifié
        if (data.score === 0 && !data.notes) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: 'Un score de 0 à un examen devrait être accompagné d\'une remarque',
            path: ['notes'],
          });
        }
      }
    }
    
    // Validation cohérence raison d'absence
    if (data.isAbsent && data.absentReason) {
      if (data.absentReason === 'illness' && data.notes && 
          !data.notes.toLowerCase().includes('maladie') &&
          !data.notes.toLowerCase().includes('médical')) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Les remarques ne correspondent pas à la raison d\'absence (maladie)',
          path: ['notes'],
        });
      }
    }
  });
};

// ========================================
// VALIDATION OPÉRATIONS EN LOT
// ========================================

export const bulkResultsSchema = z.object({
  results: z.array(evaluationResultSchema)
    .min(1, VALIDATION_MESSAGES.BULK_EMPTY)
    .max(100, VALIDATION_MESSAGES.BULK_TOO_LARGE),
    
  recalculate: z.boolean()
    .default(true),
    
  validateAll: z.boolean()
    .default(true),
    
  skipDuplicates: z.boolean()
    .default(false),
    
}).strict().superRefine((data, ctx) => {
  
  // Vérifier unicité des studentId dans le lot
  const studentIds = data.results.map(r => r.studentId);
  const uniqueIds = new Set(studentIds);
  
  if (uniqueIds.size !== studentIds.length) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: VALIDATION_MESSAGES.BULK_DUPLICATE_STUDENTS,
      path: ['results'],
    });
  }
  
  // Validation cohérence du lot
  const presentCount = data.results.filter(r => !r.isAbsent).length;
  const absentCount = data.results.filter(r => r.isAbsent).length;
  
  // Si plus de 50% d'absents, c'est suspect
  if (absentCount > presentCount && absentCount > 5) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Taux d\'absence anormalement élevé dans ce lot. Vérifiez les données.',
      path: ['results'],
    });
  }
  
  // Vérifier la cohérence des scores pour les présents
  const scoresPresent = data.results
    .filter(r => !r.isAbsent && r.score !== undefined)
    .map(r => r.score!);
    
  if (scoresPresent.length > 3) {
    const average = scoresPresent.reduce((a, b) => a + b, 0) / scoresPresent.length;
    const allSameScore = scoresPresent.every(score => score === scoresPresent[0]);
    
    // Tous les élèves ont la même note (suspect)
    if (allSameScore && scoresPresent.length > 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tous les élèves présents ont la même note. Vérifiez la saisie.',
        path: ['results'],
      });
    }
    
    // Moyenne trop élevée ou trop faible
    if (average < 2 && scoresPresent.length > 5) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Moyenne de classe anormalement faible. Vérifiez les résultats.',
        path: ['results'],
      });
    }
  }
});

// ========================================
// SCHÉMA BATCH AVEC CONTEXTE COMPLET
// ========================================

export const createBulkResultsSchemaWithContext = (
  maxScore: number,
  validStudentIds: number[],
  evaluationId: number,
  evaluationType: string = 'Controle'
) => {
  const resultSchemaWithMax = createEvaluationResultSchemaWithMax(maxScore);
  
  return z.object({
    results: z.array(resultSchemaWithMax)
      .min(1, VALIDATION_MESSAGES.BULK_EMPTY)
      .max(100, VALIDATION_MESSAGES.BULK_TOO_LARGE),
      
    recalculate: z.boolean().default(true),
    validateAll: z.boolean().default(true),
    skipDuplicates: z.boolean().default(false),
      
  }).strict().superRefine((data: any, ctx: any) => {
    
    // Vérifier que tous les élèves appartiennent à la classe
    const invalidStudents = data.results.filter((r: any) => 
      !validStudentIds.includes(r.studentId)
    );
    
    if (invalidStudents.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.BULK_INVALID_STUDENTS,
        path: ['results'],
      });
    }
    
    // Vérifier cohérence avec l'évaluation
    const inconsistentEvaluations = data.results.filter((r: any) => 
      r.evaluationId && r.evaluationId !== evaluationId
    );
    
    if (inconsistentEvaluations.length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.BULK_MIXED_EVALUATIONS,
        path: ['results'],
      });
    }
    
    // Validation spécifique pour certains types d'évaluation
    if (evaluationType === 'Examen' || evaluationType === 'Devoir') {
      const zeroScores = data.results.filter((r: any) => 
        !r.isAbsent && r.score === 0
      );
      
      // Trop de 0 en examen/devoir
      if (zeroScores.length > data.results.length * 0.3) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Taux de notes nulles anormalement élevé pour ce type d\'évaluation',
          path: ['results'],
        });
      }
    }
  });
};

// ========================================
// SCHÉMAS POUR MODIFICATION DE RÉSULTATS
// ========================================

export const updateResultSchema = z.object({
  resultId: z.number()
    .int('L\'ID du résultat doit être un entier')
    .positive('L\'ID du résultat doit être positif'),
    
  score: baseScoreSchema.optional(),
  isAbsent: isAbsentSchema.optional(),
  absentReason: absentReasonSchema.optional(),
  notes: notesSchema,
  
}).strict().superRefine((data, ctx) => {
  
  // Validation croisée pour les modifications
  if (data.isAbsent !== undefined) {
    if (data.isAbsent && data.score !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.ABSENT_WITH_SCORE,
        path: ['score'],
      });
    }
    
    if (!data.isAbsent && data.absentReason !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: VALIDATION_MESSAGES.PRESENT_WITH_REASON,
        path: ['absentReason'],
      });
    }
  }
});

// ========================================
// SCHÉMAS POUR SUPPRESSION DE RÉSULTATS
// ========================================

export const deleteResultSchema = z.object({
  resultId: z.number()
    .int('L\'ID du résultat doit être un entier')
    .positive('L\'ID du résultat doit être positif'),
    
  confirmDeletion: z.boolean()
    .refine(val => val === true, 'La suppression doit être confirmée'),
    
  reason: z.string()
    .min(10, 'La raison de suppression doit contenir au moins 10 caractères')
    .max(200, 'La raison de suppression ne peut pas dépasser 200 caractères'),
    
}).strict();

// ========================================
// SCHÉMAS POUR IMPORT DE RÉSULTATS
// ========================================

export const importResultsSchema = z.object({
  source: z.enum(['csv', 'excel', 'manual']),
  
  data: z.array(z.object({
    studentIdentifier: z.string()
      .min(1, 'L\'identifiant élève est requis'),
    score: z.string().optional(),
    absentReason: z.string().optional(),
    notes: z.string().optional(),
  }))
    .min(1, 'Au moins un résultat est requis')
    .max(200, 'Maximum 200 résultats par import'),
    
  mapping: z.object({
    studentField: z.string().default('nom_prenom'),
    scoreField: z.string().default('note'),
    absentField: z.string().optional(),
    notesField: z.string().optional(),
  }),
  
  options: z.object({
    skipEmptyScores: z.boolean().default(true),
    autoMatchStudents: z.boolean().default(true),
    validateScores: z.boolean().default(true),
    overwriteExisting: z.boolean().default(false),
  }),
  
}).strict();

// ========================================
// TYPES D'EXPORT POUR TYPESCRIPT
// ========================================

export type EvaluationResultValidationInput = z.infer<typeof evaluationResultSchema>;
export type BulkResultsValidationInput = z.infer<typeof bulkResultsSchema>;
export type UpdateResultValidationInput = z.infer<typeof updateResultSchema>;
export type DeleteResultValidationInput = z.infer<typeof deleteResultSchema>;
export type ImportResultsValidationInput = z.infer<typeof importResultsSchema>;

// Types pour schémas dynamiques
export type EvaluationResultWithMaxValidationInput = ReturnType<typeof createEvaluationResultSchemaWithMax>['_input'];
export type EvaluationResultWithContextValidationInput = ReturnType<typeof createEvaluationResultSchemaWithContext>['_input'];
export type BulkResultsWithContextValidationInput = ReturnType<typeof createBulkResultsSchemaWithContext>['_input'];
