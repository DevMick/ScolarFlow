// ========================================
// MIDDLEWARE DE VALIDATION ET SANITISATION
// ========================================

import { Request, Response, NextFunction } from 'express';
import { z, ZodError, ZodSchema } from 'zod';
import { Logger } from '../utils/logger';
import { ApiResponse } from '../types/express';

/**
 * Interface pour les erreurs de validation
 */
export interface ValidationError {
  field: string;
  message: string;
  code: string;
}

/**
 * Sanitise une chaîne de caractères pour éviter les injections
 */
export function sanitizeString(input: string): string {
  if (typeof input !== 'string') return '';
  
  return input
    // Supprime les caractères de contrôle
    .replace(/[\x00-\x1F\x7F]/g, '')
    // Échappe les caractères dangereux pour SQL (bien que Prisma le fasse déjà)
    .replace(/[';\\]/g, '')
    // Trim les espaces en début/fin
    .trim()
    // Limite la longueur
    .slice(0, 10000);
}

/**
 * Sanitise un objet récursivement
 */
export function sanitizeObject<T>(obj: T): T {
  if (obj === null || obj === undefined) return obj;
  
  if (typeof obj === 'string') {
    return sanitizeString(obj) as unknown as T;
  }
  
  if (Array.isArray(obj)) {
    return obj.map(item => sanitizeObject(item)) as unknown as T;
  }
  
  if (typeof obj === 'object') {
    const sanitized: any = {};
    for (const key in obj) {
      if (Object.prototype.hasOwnProperty.call(obj, key)) {
        sanitized[key] = sanitizeObject((obj as any)[key]);
      }
    }
    return sanitized as T;
  }
  
  return obj;
}

/**
 * Middleware de validation avec Zod
 * Valide le body, query ou params selon le contexte
 */
export function validate(schema: ZodSchema, location: 'body' | 'query' | 'params' = 'body') {
  return async (req: Request, res: Response<ApiResponse>, next: NextFunction): Promise<void> => {
    try {
      // Sanitisation basique avant validation
      if (location === 'body' && req.body) {
        req.body = sanitizeObject(req.body);
      } else if (location === 'query' && req.query) {
        req.query = sanitizeObject(req.query);
      } else if (location === 'params' && req.params) {
        req.params = sanitizeObject(req.params);
      }
      
      // Validation avec Zod
      const data = location === 'body' ? req.body : 
                   location === 'query' ? req.query : 
                   req.params;
      
      const validated = await schema.parseAsync(data);
      
      // Remplace les données par les données validées
      if (location === 'body') {
        req.body = validated;
      } else if (location === 'query') {
        req.query = validated;
      } else {
        req.params = validated;
      }
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const validationErrors: ValidationError[] = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code
        }));
        
        Logger.warn('Erreur de validation', {
          errors: validationErrors,
          location,
          path: req.path,
          requestId: req.requestId
        });
        
        res.status(400).json({
          success: false,
          message: 'Données invalides',
          errors: validationErrors,
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        });
        return;
      }
      
      Logger.error('Erreur lors de la validation', error);
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
    }
  };
}

/**
 * Valide et sanitise les paramètres d'URL
 */
export function validateParams(schema: ZodSchema) {
  return validate(schema, 'params');
}

/**
 * Valide et sanitise les query parameters
 */
export function validateQuery(schema: ZodSchema) {
  return validate(schema, 'query');
}

/**
 * Valide et sanitise le body de la requête
 */
export function validateBody(schema: ZodSchema) {
  return validate(schema, 'body');
}

/**
 * Sanitise toutes les entrées utilisateur (body, query, params)
 */
export function sanitizeInputs(req: Request, res: Response, next: NextFunction): void {
  if (req.body) {
    req.body = sanitizeObject(req.body);
  }
  if (req.query) {
    req.query = sanitizeObject(req.query);
  }
  if (req.params) {
    req.params = sanitizeObject(req.params);
  }
  next();
}

/**
 * Valide que les IDs sont des nombres positifs
 */
export const idSchema = z.object({
  id: z.coerce.number().int().positive()
});

/**
 * Valide que les query params de pagination sont valides
 */
export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10)
}).optional();
