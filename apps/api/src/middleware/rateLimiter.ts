// ========================================
// MIDDLEWARE RATE LIMITING
// ========================================

import rateLimit from 'express-rate-limit';
import { Request, Response } from 'express';
import { ApiResponse } from '../types/express';
import { Logger } from '../utils/logger';

/**
 * Configuration générale pour le rate limiting
 */
const createRateLimiterConfig = (
  windowMs: number,
  max: number,
  message: string,
  skipSuccessfulRequests: boolean = false,
  skipFailedRequests: boolean = false
) => ({
  windowMs,
  max,
  message: {
    success: false,
    message,
    timestamp: new Date().toISOString()
  } as ApiResponse,
  standardHeaders: true,
  legacyHeaders: false,
  skipSuccessfulRequests,
  skipFailedRequests,
  keyGenerator: (req: Request): string => {
    // Générer une clé basée sur l'IP et l'utilisateur si connecté
    const ip = req.ip || req.connection.remoteAddress || 'unknown';
    const userId = req.user?.id;
    return userId ? `user:${userId}` : `ip:${ip}`;
  },
  handler: (req: Request, res: Response) => {
    Logger.warn('Rate limit atteint', {
      ip: req.ip,
      userId: req.user?.id,
      url: req.url,
      method: req.method,
      userAgent: req.get('user-agent'),
      requestId: req.requestId
    });
    
    res.status(429).json({
      success: false,
      message: 'Trop de requêtes, veuillez réessayer plus tard',
      timestamp: new Date().toISOString()
    });
  },
  skip: (req: Request): boolean => {
    // Ignorer les requêtes de health check
    return req.path === '/api/health';
  }
});

/**
 * Rate limiting général pour toutes les requêtes
 * Limite augmentée pour le développement local même si NODE_ENV=production
 */
export const generalRateLimit = rateLimit(createRateLimiterConfig(
  15 * 60 * 1000, // 15 minutes
  process.env.NODE_ENV === 'development' ? 5000 : 500, // Beaucoup plus permissif même en production pour développement local
  process.env.NODE_ENV === 'development' 
    ? 'Trop de requêtes, veuillez réessayer plus tard (limite: 5000 requêtes/15min)' 
    : 'Trop de requêtes, veuillez réessayer plus tard (limite: 500 requêtes/15min)'
));

/**
 * Rate limiting strict pour les opérations de modification
 * 30 modifications par 5 minutes
 */
export const strictRateLimit = rateLimit(createRateLimiterConfig(
  5 * 60 * 1000, // 5 minutes
  30,
  'Trop de modifications, veuillez ralentir (limite: 30 modifications/5min)',
  true, // Ignorer les requêtes réussies pour les lectures
  false
));

/**
 * Rate limiting pour les opérations de calcul intensives
 * 10 calculs par minute
 */
export const calculationRateLimit = rateLimit(createRateLimiterConfig(
  60 * 1000, // 1 minute
  10,
  'Trop de calculs demandés, veuillez patienter (limite: 10 calculs/min)'
));

/**
 * Rate limiting pour les opérations d'authentification
 * 5 tentatives par minute
 */
export const authRateLimit = rateLimit(createRateLimiterConfig(
  60 * 1000, // 1 minute
  5,
  'Trop de tentatives de connexion, veuillez patienter (limite: 5 tentatives/min)',
  true, // Ignorer les authentifications réussies
  false
));

/**
 * Rate limiting pour les opérations de bulk/import
 * 3 opérations par 10 minutes
 */
export const bulkOperationRateLimit = rateLimit(createRateLimiterConfig(
  10 * 60 * 1000, // 10 minutes
  3,
  'Trop d\'opérations en lot, veuillez patienter (limite: 3 opérations/10min)'
));

/**
 * Rate limiting pour les exports de données
 * 10 exports par heure
 */
export const exportRateLimit = rateLimit(createRateLimiterConfig(
  60 * 60 * 1000, // 1 heure
  10,
  'Trop d\'exports demandés, veuillez patienter (limite: 10 exports/heure)'
));

/**
 * Rate limiting pour les requêtes de recherche
 * 60 recherches par minute
 */
export const searchRateLimit = rateLimit(createRateLimiterConfig(
  60 * 1000, // 1 minute
  60,
  'Trop de recherches, veuillez ralentir (limite: 60 recherches/min)',
  true, // Ignorer les recherches réussies
  false
));

/**
 * Rate limiting pour les uploads de fichiers
 * 20 uploads par heure
 */
export const uploadRateLimit = rateLimit(createRateLimiterConfig(
  60 * 60 * 1000, // 1 heure
  20,
  'Trop d\'uploads, veuillez patienter (limite: 20 uploads/heure)'
));

/**
 * Rate limiting personnalisé basé sur la méthode HTTP
 */
export const methodBasedRateLimit = rateLimit({
  ...createRateLimiterConfig(
    15 * 60 * 1000, // 15 minutes
    100,
    'Limite de requêtes atteinte'
  ),
  max: (req: Request): number => {
    // Limites différentes selon la méthode HTTP
    switch (req.method) {
      case 'GET':
        return 200; // Plus de requêtes GET autorisées
      case 'POST':
      case 'PUT':
      case 'PATCH':
        return 50; // Moins de modifications
      case 'DELETE':
        return 20; // Très peu de suppressions
      default:
        return 100;
    }
  }
});

/**
 * Rate limiting adaptatif basé sur l'utilisateur
 */
export const adaptiveRateLimit = rateLimit({
  ...createRateLimiterConfig(
    15 * 60 * 1000, // 15 minutes
    100,
    'Limite adaptative atteinte'
  ),
  max: async (req: Request): Promise<number> => {
    // Limite plus élevée pour les utilisateurs authentifiés
    if (req.user) {
      // TODO: Implémenter une logique basée sur le rôle utilisateur
      // ou l'historique d'utilisation
      return 200; // Utilisateur connecté
    }
    return 50; // Utilisateur anonyme
  }
});

/**
 * Middleware pour bypasser le rate limiting en développement
 */
export const developmentRateLimitBypass = (req: Request, res: Response, next: any) => {
  if (process.env.NODE_ENV === 'development') {
    // Ajouter des headers pour indiquer que le rate limiting est désactivé
    res.set({
      'X-RateLimit-Bypassed': 'true',
      'X-RateLimit-Reason': 'development-mode'
    });
    next();
    return;
  }
  
  // En production, utiliser le rate limiting normal
  generalRateLimit(req, res, next);
};

/**
 * Middleware pour créer un rate limiting dynamique
 */
export const createDynamicRateLimit = (
  getConfig: (req: Request) => { windowMs: number; max: number; message: string }
) => {
  return (req: Request, res: Response, next: any) => {
    const config = getConfig(req);
    const dynamicLimiter = rateLimit(createRateLimiterConfig(
      config.windowMs,
      config.max,
      config.message
    ));
    
    dynamicLimiter(req, res, next);
  };
};

/**
 * Middleware pour rate limiting basé sur la taille de la payload
 */
export const payloadSizeRateLimit = rateLimit({
  ...createRateLimiterConfig(
    60 * 1000, // 1 minute
    10,
    'Trop de requêtes avec payload importante'
  ),
  skip: (req: Request): boolean => {
    // Appliquer seulement aux requêtes avec payload > 1MB
    const contentLength = parseInt(req.get('content-length') || '0');
    return contentLength < 1024 * 1024; // 1MB
  }
});

/**
 * Configuration des headers de rate limiting
 */
export const addRateLimitHeaders = (req: Request, res: Response, next: any) => {
  // Ajouter des headers informatifs sur les limites
  res.set({
    'X-RateLimit-Policy': 'EduStats API Rate Limiting',
    'X-RateLimit-General': '100 req/15min',
    'X-RateLimit-Strict': '30 req/5min',
    'X-RateLimit-Calculation': '10 req/min',
    'X-RateLimit-Auth': '5 req/min'
  });
  
  next();
};

/**
 * Middleware pour logger les violations de rate limit
 */
export const logRateLimitViolations = (req: Request, res: Response, next: any) => {
  const originalSend = res.send;
  
  res.send = function(data) {
    if (res.statusCode === 429) {
      Logger.warn('Violation rate limit détectée', {
        ip: req.ip,
        userId: req.user?.id,
        url: req.url,
        method: req.method,
        userAgent: req.get('user-agent'),
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
    }
    
    return originalSend.call(this, data);
  };
  
  next();
};

/**
 * Utilitaire pour obtenir les statistiques de rate limiting
 */
export const getRateLimitStats = () => {
  // TODO: Implémenter un système de collecte de statistiques
  return {
    generalLimit: {
      windowMs: 15 * 60 * 1000,
      max: 100,
      current: 0 // À implémenter avec Redis ou un store en mémoire
    },
    strictLimit: {
      windowMs: 5 * 60 * 1000,
      max: 30,
      current: 0
    },
    calculationLimit: {
      windowMs: 60 * 1000,
      max: 10,
      current: 0
    }
  };
};

/**
 * Middleware pour reset le rate limiting pour un utilisateur spécifique
 */
export const resetUserRateLimit = (userId: number) => {
  // TODO: Implémenter avec Redis pour reset les compteurs
  Logger.info('Reset rate limit pour utilisateur', { userId });
};

// Exporter toutes les configurations pour usage dans les routes
export const rateLimiters = {
  general: generalRateLimit,
  strict: strictRateLimit,
  calculation: calculationRateLimit,
  auth: authRateLimit,
  bulk: bulkOperationRateLimit,
  export: exportRateLimit,
  search: searchRateLimit,
  upload: uploadRateLimit,
  methodBased: methodBasedRateLimit,
  adaptive: adaptiveRateLimit,
  development: developmentRateLimitBypass,
  payloadSize: payloadSizeRateLimit
};

// Export par défaut pour compatibilité avec l'ancien usage
export default rateLimit;
