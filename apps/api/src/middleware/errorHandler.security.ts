// ========================================
// GESTION D'ERREURS SÉCURISÉE
// ========================================

import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';
import { ApiResponse } from '../types/express';

/**
 * Liste des propriétés à masquer dans les erreurs en production
 */
const SENSITIVE_ERROR_PROPERTIES = [
  'password',
  'passwordHash',
  'secret',
  'token',
  'apiKey',
  'privateKey',
  'stack',
  'sql',
  'query',
  'parameters'
];

/**
 * Masque les informations sensibles dans un objet d'erreur
 */
function sanitizeError(error: any): any {
  if (!error || typeof error !== 'object') {
    return process.env.NODE_ENV === 'production' 
      ? 'Erreur interne du serveur'
      : error;
  }
  
  const sanitized: any = {};
  
  for (const key in error) {
    if (Object.prototype.hasOwnProperty.call(error, key)) {
      const isSensitive = SENSITIVE_ERROR_PROPERTIES.some(prop => 
        key.toLowerCase().includes(prop.toLowerCase())
      );
      
      if (isSensitive && process.env.NODE_ENV === 'production') {
        sanitized[key] = '[REDACTED]';
      } else if (typeof error[key] === 'object' && error[key] !== null) {
        sanitized[key] = sanitizeError(error[key]);
      } else {
        sanitized[key] = error[key];
      }
    }
  }
  
  return sanitized;
}

/**
 * Middleware de gestion d'erreurs sécurisée
 * Ne révèle jamais de détails techniques en production
 */
export const secureErrorHandler = (
  error: Error | any,
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  // Log l'erreur complète côté serveur
  Logger.error('Erreur serveur', {
    error: error instanceof Error ? {
      name: error.name,
      message: error.message,
      stack: error.stack
    } : error,
    path: req.path,
    method: req.method,
    ip: req.ip,
    userId: req.user?.id,
    requestId: req.requestId
  });
  
  // Déterminer le code de statut HTTP
  let statusCode = 500;
  let message = 'Erreur interne du serveur';
  let details: any = undefined;
  
  // Gestion des types d'erreurs spécifiques
  if (error.name === 'ValidationError' || error.name === 'ZodError') {
    statusCode = 400;
    message = 'Données invalides';
    if (process.env.NODE_ENV === 'development') {
      details = error.errors || error.issues;
    }
  } else if (error.name === 'UnauthorizedError' || error.status === 401) {
    statusCode = 401;
    message = 'Non autorisé';
  } else if (error.name === 'ForbiddenError' || error.status === 403) {
    statusCode = 403;
    message = 'Accès interdit';
  } else if (error.name === 'NotFoundError' || error.status === 404) {
    statusCode = 404;
    message = 'Ressource non trouvée';
  } else if (error.status && typeof error.status === 'number') {
    statusCode = error.status;
    message = error.message || message;
  }
  
  // En développement, on peut montrer plus de détails
  if (process.env.NODE_ENV === 'development') {
    details = sanitizeError(error);
  }
  
  // Réponse sécurisée
  const response: ApiResponse = {
    success: false,
    message,
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  };
  
  // Ajouter les détails seulement en développement
  if (details && process.env.NODE_ENV === 'development') {
    (response as any).details = details;
  }
  
  res.status(statusCode).json(response);
};

/**
 * Middleware pour capturer les erreurs non gérées
 */
export const errorCatcher = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      await fn(req, res, next);
    } catch (error) {
      next(error);
    }
  };
};

/**
 * Valide que les headers de sécurité sont présents
 */
export const validateSecurityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Vérifier l'Origin pour les requêtes sensibles
  if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
    const origin = req.headers.origin;
    const expectedOrigin = process.env.CORS_ORIGIN;
    
    if (expectedOrigin && origin && origin !== expectedOrigin) {
      Logger.warn('Origin invalide détecté', {
        origin,
        expectedOrigin,
        path: req.path,
        ip: req.ip,
        requestId: req.requestId
      });
      
      res.status(403).json({
        success: false,
        message: 'Origin non autorisé',
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
      return;
    }
  }
  
  next();
};

