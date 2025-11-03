import { z } from 'zod';

// Validation pour la création d'un élève
export const createStudentSchema = z.object({
  name: z.string()
    .min(2, 'Le nom de l\'élève doit contenir au moins 2 caractères')
    .max(100, 'Le nom de l\'élève ne peut pas dépasser 100 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s\-']+$/, 'Le nom de l\'élève contient des caractères invalides')
    .transform(val => val.trim()),
  schoolYearId: z.number()
    .int('L\'ID de l\'année scolaire doit être un entier')
    .positive('L\'ID de l\'année scolaire doit être positif'),
  gender: z.enum(['M', 'F'], {
    errorMap: () => ({ message: 'Le genre doit être M (Masculin) ou F (Féminin)' })
  }).optional(),
  studentNumber: z.string()
    .max(20, 'Le numéro d\'élève ne peut pas dépasser 20 caractères')
    .regex(/^[a-zA-Z0-9\-_]*$/, 'Le numéro d\'élève contient des caractères invalides')
    .optional()
    .or(z.literal(''))
});

// Validation pour la mise à jour d'un élève
export const updateStudentSchema = createStudentSchema.partial().extend({
  isActive: z.boolean().optional()
});

// Validation pour les opérations en bulk
export const bulkStudentSchema = z.object({
  students: z.array(createStudentSchema)
    .min(1, 'Au moins un élève est requis')
    .max(100, 'Maximum 100 élèves par opération'),
  operation: z.enum(['create', 'update', 'delete'])
});

// Validation pour la création en lot d'étudiants
export const createBulkStudentsSchema = z.object({
  classId: z.number().int().positive('ID de classe invalide'),
  students: z.array(createStudentSchema)
    .min(1, 'Au moins un élève est requis')
    .max(100, 'Maximum 100 élèves par opération')
});

// Validation pour les filtres de recherche
export const studentFiltersSchema = z.object({
  isActive: z.boolean().optional(),
  gender: z.enum(['M', 'F']).optional(),
  search: z.string().max(100).optional(),
  sortBy: z.enum(['name', 'createdAt', 'studentNumber']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20)
});

// Validation pour les options d'export
export const exportOptionsSchema = z.object({
  format: z.enum(['pdf', 'excel', 'csv']),
  includeInactive: z.boolean().default(false),
  includePhotos: z.boolean().default(false),
  customFields: z.array(z.string()).default([]),
  template: z.enum(['standard', 'administrative']).default('standard'),
  sortBy: z.enum(['name', 'studentNumber']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});

// Validation pour l'import PDF
export const importPDFSchema = z.object({
  duplicateAction: z.enum(['skip', 'update', 'create_anyway']).default('skip'),
  confidenceThreshold: z.number().min(0).max(1).default(0.7)
});

// Validation pour l'ID d'un élève
export const studentIdSchema = z.object({
  id: z.string().transform((val) => {
    const num = parseInt(val);
    if (isNaN(num) || num <= 0) {
      throw new Error('ID élève invalide');
    }
    return num;
  })
});

export type CreateStudentValidationInput = z.infer<typeof createStudentSchema>;
export type UpdateStudentValidationInput = z.infer<typeof updateStudentSchema>;
export type BulkStudentValidationInput = z.infer<typeof bulkStudentSchema>;
export type CreateBulkStudentsValidationInput = z.infer<typeof createBulkStudentsSchema>;
export type StudentFiltersValidationInput = z.infer<typeof studentFiltersSchema>;
export type StudentExportOptionsValidationInput = z.infer<typeof exportOptionsSchema>;
export type ImportPDFValidationInput = z.infer<typeof importPDFSchema>;
export type StudentIdValidationInput = z.infer<typeof studentIdSchema>;
