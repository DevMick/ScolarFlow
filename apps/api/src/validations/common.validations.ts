// ========================================
// SCHÉMAS DE VALIDATION COMMUNS
// ========================================

import { z } from 'zod';

/**
 * Schéma de validation pour un ID numérique
 */
export const idSchema = z.object({
  id: z.coerce.number().int().positive('L\'ID doit être un nombre positif')
});

/**
 * Schéma de validation pour la pagination
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10)
}).optional();

/**
 * Schéma de validation pour les filtres de recherche
 */
export const searchSchema = z.object({
  search: z
    .string()
    .trim()
    .max(100, 'La recherche ne peut pas dépasser 100 caractères')
    .optional(),
  sortBy: z
    .string()
    .trim()
    .optional(),
  sortOrder: z
    .enum(['asc', 'desc'])
    .default('asc')
    .optional()
});

/**
 * Schéma de validation pour les dates
 */
export const dateSchema = z.object({
  date: z.coerce.date()
    .or(z.string().datetime())
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/))
    .transform((val) => {
      if (typeof val === 'string') {
        return new Date(val);
      }
      return val;
    })
});

/**
 * Schéma de validation pour une URL
 */
export const urlSchema = z.string().url('URL invalide');

/**
 * Schéma de validation pour un email
 */
export const emailSchema = z.string().email('Email invalide').toLowerCase().trim();

/**
 * Schéma de validation pour un nombre décimal (note, moyenne, etc.)
 */
export const decimalSchema = z.coerce.number()
  .min(0, 'Le nombre ne peut pas être négatif')
  .max(20, 'Le nombre ne peut pas dépasser 20')
  .refine((val) => !isNaN(val) && isFinite(val), {
    message: 'Le nombre doit être valide'
  });

/**
 * Schéma de validation pour un booléen
 */
export const booleanSchema = z.coerce.boolean()
  .or(z.enum(['true', 'false']).transform((val) => val === 'true'));

/**
 * Schéma de validation pour un UUID
 */
export const uuidSchema = z.string().uuid('UUID invalide');

/**
 * Schéma de validation pour les query params avec ID
 */
export const idQuerySchema = z.object({
  id: z.coerce.number().int().positive()
});

/**
 * Schéma de validation pour les query params avec pagination et recherche
 */
export const listQuerySchema = paginationSchema.merge(searchSchema);

