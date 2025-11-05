// ========================================
// MIDDLEWARE DE GESTION D'ERREURS AVANCÉ
// ========================================

/// <reference path="../types/express.d.ts" />

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { 
  ServiceError, 
  ValidationError, 
  NotFoundError, 
  ForbiddenError, 
  ConflictError,
  BusinessRuleError,
  EvaluationFinalizedError,
  ClassOwnershipError,
  CalculationError,
  DatabaseError,
  UnauthorizedError
} from '../utils/errors';
import { ApiResponse } from '../types/express';
import { Logger } from '../utils/logger';

/**
 * Middleware principal de gestion d'erreurs
 */
export const errorHandler = (
  error: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Calculer la durée de la requête
  const duration = req.startTime ? Date.now() - req.startTime : undefined;

  // Logger l'erreur avec contexte complet
  Logger.error('Erreur API détectée', {
    error: {
      name: error.name,
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    },
    request: {
      method: req.method,
      url: req.url,
      params: req.params,
      query: req.query,
      userAgent: req.get('user-agent'),
      ip: req.ip,
      userId: req.user?.id,
      requestId: req.requestId
    },
    context: {
      timestamp: new Date().toISOString(),
      duration,
      environment: process.env.NODE_ENV
    }
  });

  // Gestion des erreurs personnalisées de l'application
  if (error instanceof ValidationError) {
    res.status(400).json({
      success: false,
      message: error.message,
      errors: error.details,
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      duration
    });
    return;
  }

  if (error instanceof NotFoundError) {
    res.status(404).json({
      success: false,
      message: error.message,
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      duration
    });
    return;
  }

  if (error instanceof UnauthorizedError) {
    res.status(401).json({
      success: false,
      message: error.message,
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      duration
    });
    return;
  }

  if (error instanceof ForbiddenError || error instanceof ClassOwnershipError) {
    res.status(403).json({
      success: false,
      message: error.message,
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      duration
    });
    return;
  }

  if (error instanceof ConflictError) {
    res.status(409).json({
      success: false,
      message: error.message,
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      duration
    });
    return;
  }

  if (error instanceof BusinessRuleError || error instanceof EvaluationFinalizedError) {
    res.status(422).json({
      success: false,
      message: error.message,
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      duration
    });
    return;
  }

  if (error instanceof CalculationError) {
    res.status(500).json({
      success: false,
      message: 'Erreur lors des calculs',
      errors: [error.message],
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      duration
    });
    return;
  }

  if (error instanceof DatabaseError) {
    res.status(500).json({
      success: false,
      message: 'Erreur de base de données',
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      duration
    });
    return;
  }

  if (error instanceof ServiceError) {
    res.status(error.statusCode).json({
      success: false,
      message: error.message,
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      duration
    });
    return;
  }

  // Gestion des erreurs Prisma
  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    handlePrismaError(error, req, res, duration);
    return;
  }

  if (error instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      success: false,
      message: 'Données invalides pour la base de données',
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      duration
    });
    return;
  }

  if (error instanceof Prisma.PrismaClientInitializationError) {
    res.status(503).json({
      success: false,
      message: 'Service temporairement indisponible',
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      duration
    });
    return;
  }

  // Gestion des erreurs JWT (si pas gérées par le middleware auth)
  if (error.name === 'JsonWebTokenError') {
    res.status(401).json({
      success: false,
      message: 'Token d\'authentification invalide',
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      duration
    });
    return;
  }

  if (error.name === 'TokenExpiredError') {
    res.status(401).json({
      success: false,
      message: 'Token d\'authentification expiré',
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      duration
    });
    return;
  }

  // Gestion des erreurs de syntaxe JSON
  if (error instanceof SyntaxError && 'body' in error) {
    res.status(400).json({
      success: false,
      message: 'Format JSON invalide',
      requestId: req.requestId,
      timestamp: new Date().toISOString(),
      duration
    });
    return;
  }

  // Erreur générique - ajuster le message selon l'environnement
  const isDevelopment = process.env.NODE_ENV === 'development';
  res.status(500).json({
    success: false,
    message: isDevelopment 
      ? `Erreur serveur: ${error.message}` 
      : 'Une erreur inattendue s\'est produite',
    ...(isDevelopment && { stack: error.stack }),
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
    duration
  });
};

/**
 * Gestionnaire spécialisé pour les erreurs Prisma
 */
const handlePrismaError = (
  error: Prisma.PrismaClientKnownRequestError,
  req: Request,
  res: Response,
  duration?: number
): void => {
  const baseResponse = {
    success: false as const,
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
    duration
  };

  switch (error.code) {
    case 'P2002':
      // Contrainte unique violée
      const target = error.meta?.target as string[] | undefined;
      const field = target?.[0] || 'champ';
      res.status(409).json({
        ...baseResponse,
        message: `Cette valeur pour ${field} existe déjà`,
        errors: [`Conflit sur le champ: ${field}`]
      });
      break;
      
    case 'P2025':
      // Enregistrement non trouvé
      res.status(404).json({
        ...baseResponse,
        message: 'Ressource non trouvée'
      });
      break;
      
    case 'P2003':
      // Contrainte de clé étrangère violée
      res.status(400).json({
        ...baseResponse,
        message: 'Opération impossible : référence vers un élément inexistant',
        errors: ['Contrainte de référence violée']
      });
      break;

    case 'P2021':
      // Table non trouvée
      res.status(500).json({
        ...baseResponse,
        message: 'Erreur de configuration de la base de données'
      });
      break;

    case 'P1008':
      // Timeout d'opération
      res.status(504).json({
        ...baseResponse,
        message: 'Opération trop lente, veuillez réessayer'
      });
      break;

    case 'P2024':
      // Timeout de connexion
      res.status(503).json({
        ...baseResponse,
        message: 'Service temporairement indisponible'
      });
      break;
      
    default:
      Logger.warn('Code d\'erreur Prisma non géré', {
        code: error.code,
        message: error.message,
        requestId: req.requestId
      });
      
      res.status(500).json({
        ...baseResponse,
        message: 'Erreur de base de données',
        ...(process.env.NODE_ENV === 'development' && { 
          errors: [`Code Prisma: ${error.code}`] 
        })
      });
  }
};

/**
 * Middleware pour les routes non trouvées (404)
 */
export const notFoundHandler = (
  req: Request,
  res: Response
): void => {
  const duration = req.startTime ? Date.now() - req.startTime : undefined;
  
  Logger.warn('Route non trouvée', {
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('user-agent'),
    ip: req.ip,
    userId: req.user?.id,
    requestId: req.requestId
  });
  
  res.status(404).json({
    success: false,
    message: `Route non trouvée: ${req.method} ${req.originalUrl}`,
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
    duration
  });
};

/**
 * Middleware pour capturer les erreurs asynchrones non gérées
 */
export const asyncErrorHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware pour gérer les timeouts de requête
 */
export const timeoutHandler = (timeoutMs: number = 30000) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const timeout = setTimeout(() => {
      if (!res.headersSent) {
        const duration = req.startTime ? Date.now() - req.startTime : undefined;
        
        Logger.warn('Timeout de requête', {
          method: req.method,
          url: req.url,
          timeout: timeoutMs,
          duration,
          requestId: req.requestId
        });

        res.status(504).json({
          success: false,
          message: 'Délai d\'attente dépassé',
          requestId: req.requestId,
          timestamp: new Date().toISOString(),
          duration
        } as ApiResponse);
      }
    }, timeoutMs);

    res.on('finish', () => {
      clearTimeout(timeout);
    });

    next();
  };
};

/**
 * Middleware pour valider que la réponse a été envoyée
 */
export const responseValidator = (req: Request, res: Response, next: NextFunction) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    if (res.headersSent) {
      Logger.warn('Tentative d\'envoi de réponse multiple', {
        method: req.method,
        url: req.url,
        requestId: req.requestId
      });
      return this;
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};
