import { z } from 'zod';

// Validation pour l'enregistrement d'un utilisateur
export const registerSchema = z.object({
  email: z.string()
    .email('Format email invalide')
    .min(1, 'L\'email est requis')
    .max(255, 'L\'email ne peut pas dépasser 255 caractères')
    .toLowerCase()
    .trim(),
  password: z.string()
    .min(8, 'Le mot de passe doit contenir au moins 8 caractères')
    .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'Le mot de passe doit contenir au moins une minuscule, une majuscule et un chiffre'),
  firstName: z.string()
    .min(2, 'Le prénom doit contenir au moins 2 caractères')
    .max(100, 'Le prénom ne peut pas dépasser 100 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s-]+$/, 'Le prénom ne peut contenir que des lettres, espaces et tirets')
    .trim(),
  lastName: z.string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .regex(/^[a-zA-ZÀ-ÿ\s-]+$/, 'Le nom ne peut contenir que des lettres, espaces et tirets')
    .trim(),
  gender: z.enum(['M', 'F'], {
    errorMap: () => ({ message: 'Le genre est requis. Veuillez sélectionner M (Masculin) ou F (Féminin)' })
  }),
  establishment: z.string()
    .min(2, 'Le nom de l\'établissement doit contenir au moins 2 caractères')
    .max(200, 'Le nom de l\'établissement ne peut pas dépasser 200 caractères')
    .trim()
    .optional()
    .or(z.literal('')),
  directionRegionale: z.string()
    .min(2, 'La direction régionale doit contenir au moins 2 caractères')
    .max(100, 'La direction régionale ne peut pas dépasser 100 caractères')
    .trim(),
  secteurPedagogique: z.string()
    .min(2, 'Le secteur pédagogique doit contenir au moins 2 caractères')
    .max(100, 'Le secteur pédagogique ne peut pas dépasser 100 caractères')
    .trim()
});

// Validation pour la connexion
export const loginSchema = z.object({
  email: z.string().email('Format email invalide'),
  password: z.string().min(1, 'Le mot de passe est requis')
});

// Validation pour la mise à jour du profil
export const updateProfileSchema = z.object({
  firstName: z.string()
    .min(1, 'Le prénom est requis')
    .max(100, 'Le prénom ne peut pas dépasser 100 caractères')
    .trim()
    .optional(),
  lastName: z.string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères')
    .trim()
    .optional(),
  gender: z.enum(['M', 'F'], {
    errorMap: () => ({ message: 'Le genre doit être M (Masculin) ou F (Féminin)' })
  }).optional(),
  establishment: z.string()
    .max(200, 'Le nom de l\'établissement ne peut pas dépasser 200 caractères')
    .optional(),
  directionRegionale: z.string()
    .max(100, 'La direction régionale ne peut pas dépasser 100 caractères')
    .trim()
    .optional(),
  secteurPedagogique: z.string()
    .max(100, 'Le secteur pédagogique ne peut pas dépasser 100 caractères')
    .trim()
    .optional()
});

// Validation pour le changement de mot de passe
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Le mot de passe actuel est requis'),
  newPassword: z.string()
    .min(6, 'Le nouveau mot de passe doit contenir au moins 6 caractères')
    .max(100, 'Le nouveau mot de passe ne peut pas dépasser 100 caractères'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword']
});

// Validation pour la réinitialisation de mot de passe
export const resetPasswordSchema = z.object({
  email: z.string().email('Format email invalide')
});

export const confirmResetPasswordSchema = z.object({
  token: z.string().min(1, 'Le token est requis'),
  newPassword: z.string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
    .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères'),
  confirmPassword: z.string()
}).refine(data => data.newPassword === data.confirmPassword, {
  message: 'Les mots de passe ne correspondent pas',
  path: ['confirmPassword']
});

// Types dérivés des schémas de validation
export type RegisterValidationInput = z.infer<typeof registerSchema>;
export type LoginValidationInput = z.infer<typeof loginSchema>;
export type UpdateProfileValidationInput = z.infer<typeof updateProfileSchema>;
export type ChangePasswordValidationInput = z.infer<typeof changePasswordSchema>;
export type ResetPasswordValidationInput = z.infer<typeof resetPasswordSchema>;
export type ConfirmResetPasswordValidationInput = z.infer<typeof confirmResetPasswordSchema>;
