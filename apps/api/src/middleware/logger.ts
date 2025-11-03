// ========================================
// MIDDLEWARE DE LOGGING
// ========================================

import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { Logger } from '../utils/logger';
import { AuthenticatedRequest } from '../types/express';

/**
 * Middleware pour logger les requêtes HTTP
 */
export function requestLogger(req: Request, res: Response, next: NextFunction): void {
  // Générer un ID unique pour la requête
  const requestId = uuidv4();
  const startTime = Date.now();

  // Ajouter l'ID et le timestamp à la requête
  (req as any).requestId = requestId;
  (req as any).startTime = startTime;

  // Extraire les informations de la requête
  const method = req.method;
  const url = req.originalUrl || req.url;
  const userAgent = req.get('User-Agent') || 'Unknown';
  const ip = req.ip || req.connection.remoteAddress || 'Unknown';
  const contentLength = req.get('Content-Length') || '0';

  // Logger l'entrée de la requête
  Logger.info('Requête HTTP entrante', {
    requestId,
    method,
    url,
    ip,
    userAgent,
    contentLength,
    timestamp: new Date().toISOString()
  });

  // Logger les informations sensibles en mode debug seulement
  if (process.env.NODE_ENV === 'development') {
    Logger.info('Détails requête (dev)', {
      requestId,
      headers: req.headers,
      query: req.query,
      params: req.params,
      // Ne pas logger le body pour des raisons de sécurité, même en dev
    });
  }

  // Intercepter la fin de la réponse
  const originalSend = res.send;
  let responseBody: any;

  res.send = function(body: any) {
    responseBody = body;
    return originalSend.call(this, body);
  };

  // Logger à la fin de la requête
  res.on('finish', () => {
    const duration = Date.now() - startTime;
    const statusCode = res.statusCode;
    const contentLength = res.get('Content-Length') || '0';

    // Déterminer le niveau de log selon le statut
    let logLevel: 'info' | 'warn' | 'error' = 'info';
    if (statusCode >= 400 && statusCode < 500) {
      logLevel = 'warn';
    } else if (statusCode >= 500) {
      logLevel = 'error';
    }

    Logger[logLevel]('Requête HTTP terminée', {
      requestId,
      method,
      url,
      statusCode,
      duration: `${duration}ms`,
      contentLength,
      ip,
      timestamp: new Date().toISOString()
    });

    // Logger la réponse d'erreur en mode debug
    if (process.env.NODE_ENV === 'development' && statusCode >= 400) {
      try {
        const parsedBody = typeof responseBody === 'string' ? JSON.parse(responseBody) : responseBody;
        Logger.error('Détails erreur (dev)', {
          requestId,
          statusCode,
          error: parsedBody?.error || parsedBody?.message,
          stack: parsedBody?.stack
        });
      } catch (e) {
        // Ignore parsing errors
      }
    }
    
    // Toujours logger la réponse en mode debug pour éviter l'avertissement de variable non utilisée
    if (process.env.NODE_ENV === 'development' && responseBody !== undefined) {
      Logger.info('Réponse HTTP (dev)', {
        requestId,
        statusCode,
        responseSize: typeof responseBody === 'string' ? responseBody.length : JSON.stringify(responseBody).length
      });
    }
  });

  // Logger les erreurs de requête
  res.on('error', (error: Error) => {
    Logger.error('Erreur lors de la requête', {
      requestId,
      method,
      url,
      error: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString()
    });
  });

  next();
}

/**
 * Middleware pour logger les informations d'authentification
 */
export function authLogger(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (req.user) {
    Logger.info('Requête authentifiée', {
      requestId: (req as any).requestId,
      userId: req.user.id,
      userEmail: req.user.email,
      userRole: req.user.role || 'teacher',
      method: req.method,
      url: req.originalUrl || req.url,
      timestamp: new Date().toISOString()
    });
  }

  next();
}

/**
 * Middleware pour logger les opérations sensibles
 */
export function auditLogger(
  operation: string,
  resourceType: string
) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction): void => {
    const requestId = (req as any).requestId;
    const resourceId = req.params.id || req.params.classId || req.params.studentId;

    Logger.info('Opération audit', {
      requestId,
      operation,
      resourceType,
      resourceId,
      userId: req.user?.id,
      userEmail: req.user?.email,
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      timestamp: new Date().toISOString()
    });

    // Intercepter la réponse pour logger le résultat
    const originalJson = res.json;
    res.json = function(body: any) {
      const success = body?.success !== false && res.statusCode < 400;
      
      Logger.info('Résultat opération audit', {
        requestId,
        operation,
        resourceType,
        resourceId,
        success,
        statusCode: res.statusCode,
        userId: req.user?.id,
        timestamp: new Date().toISOString()
      });

      return originalJson.call(this, body);
    };

    next();
  };
}

/**
 * Middleware pour logger les erreurs de validation
 */
export function validationErrorLogger(error: any, req: Request, res: Response, next: NextFunction): void {
  if (error.name === 'ZodError' || error.type === 'validation') {
    Logger.warn('Erreur de validation', {
      requestId: (req as any).requestId,
      method: req.method,
      url: req.originalUrl || req.url,
      validationErrors: error.errors || error.details,
      userId: (req as any).user?.id,
      timestamp: new Date().toISOString()
    });
  }

  next(error);
}

/**
 * Middleware pour logger les tentatives d'accès non autorisé
 */
export function unauthorizedAccessLogger(req: Request, res: Response, next: NextFunction): void {
  const authHeader = req.get('Authorization');
  const hasToken = authHeader && authHeader.startsWith('Bearer ');

  Logger.warn('Tentative d\'accès non autorisé', {
    requestId: (req as any).requestId,
    method: req.method,
    url: req.originalUrl || req.url,
    hasAuthHeader: !!authHeader,
    hasValidTokenFormat: hasToken,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  next();
}
