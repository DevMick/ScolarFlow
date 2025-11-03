// ========================================
// SCHÉMAS DE VALIDATION POUR L'AUTHENTIFICATION
// ========================================

import { z } from 'zod';

/**
 * Schéma de validation pour l'inscription
 */
export const registerSchema = z.object({
  email: z
    .string()
    .email('Email invalide')
    .toLowerCase()
    .trim()
    .max(255, 'Email trop long'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
    .regex(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir au moins un caractère spécial')
    .max(128, 'Mot de passe trop long'),
  firstName: z
    .string()
    .trim()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Prénom trop long')
    .regex(/^[a-zA-ZÀ-ÿ\s-']+$/, 'Le prénom ne peut contenir que des lettres'),
  lastName: z
    .string()
    .trim()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Nom trop long')
    .regex(/^[a-zA-ZÀ-ÿ\s-']+$/, 'Le nom ne peut contenir que des lettres'),
  establishment: z
    .string()
    .trim()
    .max(100, 'Établissement trop long')
    .optional(),
  directionRegionale: z
    .string()
    .trim()
    .max(100, 'Direction régionale trop longue')
    .optional(),
  secteurPedagogique: z
    .string()
    .trim()
    .max(100, 'Secteur pédagogique trop long')
    .optional(),
  gender: z
    .enum(['M', 'F', 'Autre'], {
      errorMap: () => ({ message: 'Genre invalide' })
    })
    .optional()
});

/**
 * Schéma de validation pour la connexion
 */
export const loginSchema = z.object({
  email: z
    .string()
    .email('Email invalide')
    .toLowerCase()
    .trim(),
  password: z
    .string()
    .min(1, 'Le mot de passe est requis'),
  remember: z
    .boolean()
    .optional()
    .default(false)
});

/**
 * Schéma de validation pour le refresh token
 */
export const refreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'Le refresh token est requis')
});

/**
 * Schéma de validation pour le reset de mot de passe (demande)
 */
export const requestPasswordResetSchema = z.object({
  email: z
    .string()
    .email('Email invalide')
    .toLowerCase()
    .trim()
});

/**
 * Schéma de validation pour le reset de mot de passe (confirmation)
 */
export const resetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, 'Le token est requis'),
  password: z
    .string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le mot de passe doit contenir au moins un chiffre')
    .regex(/[^A-Za-z0-9]/, 'Le mot de passe doit contenir au moins un caractère spécial')
    .max(128, 'Mot de passe trop long')
});

/**
 * Schéma de validation pour le changement de mot de passe
 */
export const changePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Le mot de passe actuel est requis'),
  newPassword: z
    .string()
    .min(8, 'Le nouveau mot de passe doit contenir au moins 8 caractères')
    .regex(/[A-Z]/, 'Le nouveau mot de passe doit contenir au moins une majuscule')
    .regex(/[a-z]/, 'Le nouveau mot de passe doit contenir au moins une minuscule')
    .regex(/[0-9]/, 'Le nouveau mot de passe doit contenir au moins un chiffre')
    .regex(/[^A-Za-z0-9]/, 'Le nouveau mot de passe doit contenir au moins un caractère spécial')
    .max(128, 'Nouveau mot de passe trop long')
}).refine((data) => data.currentPassword !== data.newPassword, {
  message: 'Le nouveau mot de passe doit être différent de l\'actuel',
  path: ['newPassword']
});

/**
 * Schéma de validation pour la mise à jour du profil
 */
export const updateProfileSchema = z.object({
  firstName: z
    .string()
    .trim()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(50, 'Prénom trop long')
    .regex(/^[a-zA-ZÀ-ÿ\s-']+$/, 'Le prénom ne peut contenir que des lettres')
    .optional(),
  lastName: z
    .string()
    .trim()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(50, 'Nom trop long')
    .regex(/^[a-zA-ZÀ-ÿ\s-']+$/, 'Le nom ne peut contenir que des lettres')
    .optional(),
  establishment: z
    .string()
    .trim()
    .max(100, 'Établissement trop long')
    .optional(),
  directionRegionale: z
    .string()
    .trim()
    .max(100, 'Direction régionale trop longue')
    .optional(),
  secteurPedagogique: z
    .string()
    .trim()
    .max(100, 'Secteur pédagogique trop long')
    .optional(),
  gender: z
    .enum(['M', 'F', 'Autre'], {
      errorMap: () => ({ message: 'Genre invalide' })
    })
    .optional()
}).refine((data) => Object.keys(data).length > 0, {
  message: 'Au moins un champ doit être fourni pour la mise à jour'
});

