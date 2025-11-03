import { z } from 'zod';

// Schéma pour créer une année scolaire
export const createSchoolYearSchema = z.object({
  startYear: z.number({
    required_error: 'L\'année de début est requise',
    invalid_type_error: 'L\'année de début doit être un nombre',
  }).int('L\'année de début doit être un entier')
    .min(1900, 'L\'année de début doit être supérieure à 1900')
    .max(2100, 'L\'année de début doit être inférieure à 2100'),
  endYear: z.number({
    required_error: 'L\'année de fin est requise',
    invalid_type_error: 'L\'année de fin doit être un nombre',
  }).int('L\'année de fin doit être un entier')
    .min(1900, 'L\'année de fin doit être supérieure à 1900')
    .max(2100, 'L\'année de fin doit être inférieure à 2100'),
}).refine((data) => data.endYear >= data.startYear, {
  message: 'L\'année de fin doit être supérieure ou égale à l\'année de début',
  path: ['endYear'],
});

// Schéma pour mettre à jour une année scolaire
export const updateSchoolYearSchema = z.object({
  startYear: z.number().int().min(1900).max(2100).optional(),
  endYear: z.number().int().min(1900).max(2100).optional(),
  isActive: z.boolean().optional(),
}).refine((data) => {
  if (data.startYear && data.endYear) {
    return data.endYear >= data.startYear;
  }
  return true;
}, {
  message: 'L\'année de fin doit être supérieure ou égale à l\'année de début',
  path: ['endYear'],
});

