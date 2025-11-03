import { z } from 'zod';

// Niveaux scolaires autorisés
export const classLevels = ['CP1', 'CP2', 'CE1', 'CE2', 'CM1', 'CM2'] as const;

// Validation pour la création d'une classe
export const createClassSchema = z.object({
  name: z.string()
    .min(1, 'Le nom de la classe est requis')
    .max(100, 'Le nom de la classe ne peut pas dépasser 100 caractères')
    .trim()
});

// Validation pour la mise à jour d'une classe
export const updateClassSchema = z.object({
  name: z.string()
    .min(1, 'Le nom de la classe est requis')
    .max(100, 'Le nom de la classe ne peut pas dépasser 100 caractères')
    .trim()
    .optional(),
  isActive: z.boolean().optional()
});

// Validation pour les paramètres de requête (filtres, pagination)
export const classQuerySchema = z.object({
  isActive: z.boolean().optional(),
  userId: z.number().int().positive().optional(),
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(10),
  sortBy: z.enum(['name', 'studentCount', 'createdAt']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
});

// Validation pour l'ID de classe
export const classIdSchema = z.object({
  id: z.number().int().positive('L\'ID de la classe doit être un nombre positif')
});

// Validation pour l'import en masse de classes
export const bulkCreateClassesSchema = z.object({
  classes: z.array(createClassSchema)
    .min(1, 'Au moins une classe est requise')
    .max(20, 'Maximum 20 classes peuvent être créées en une fois')
});

// Validation pour l'archivage d'une classe
export const archiveClassSchema = z.object({
  reason: z.string()
    .min(1, 'La raison de l\'archivage est requise')
    .max(200, 'La raison ne peut pas dépasser 200 caractères')
    .optional()
});

// Types dérivés des schémas de validation
export type CreateClassValidationInput = z.infer<typeof createClassSchema>;
export type UpdateClassValidationInput = z.infer<typeof updateClassSchema>;
export type ClassQueryValidationInput = z.infer<typeof classQuerySchema>;
export type ClassIdValidationInput = z.infer<typeof classIdSchema>;
export type BulkCreateClassesValidationInput = z.infer<typeof bulkCreateClassesSchema>;
export type ArchiveClassValidationInput = z.infer<typeof archiveClassSchema>;

// Constantes utiles
export const CURRENT_ACADEMIC_YEAR = '2024-2025';
export const CLASS_NAME_PATTERN = /^[A-Z0-9]+(-[A-Z0-9]+)*$/i;
