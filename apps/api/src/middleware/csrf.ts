// ========================================
// MIDDLEWARE CSRF PROTECTION
// ========================================

import { Request, Response, NextFunction } from 'express';
import { Logger } from '../utils/logger';
import { ApiResponse } from '../types/express';
import { randomBytes, createHmac } from 'crypto';

/**
 * Méthodes HTTP qui modifient l'état (nécessitent CSRF)
 */
const STATE_CHANGING_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];

/**
 * Routes qui ne nécessitent pas de protection CSRF (ex: webhooks, callbacks)
 */
const CSRF_EXEMPT_ROUTES = [
  '/api/webhooks',
  '/api/callbacks',
  '/api/auth/login', // Login nécessite un token spécial
  '/api/auth/register'
];

/**
 * Génère un token CSRF
 */
export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Génère un hash CSRF basé sur le token et un secret
 */
export function generateCsrfHash(token: string, secret: string): string {
  return createHmac('sha256', secret)
    .update(token)
    .digest('hex');
}

/**
 * Vérifie un token CSRF
 */
export function verifyCsrfToken(token: string, hash: string, secret: string): boolean {
  const expectedHash = generateCsrfHash(token, secret);
  return hash === expectedHash;
}

/**
 * Middleware CSRF pour les routes qui modifient l'état
 * 
 * Stratégie :
 * - Génère un token CSRF pour les requêtes GET
 * - Vérifie le token pour les requêtes modifiant l'état
 * - Utilise un double submit cookie pattern
 */
export const csrfProtection = (req: Request, res: Response, next: NextFunction): void => {
  const csrfSecret = process.env.CSRF_SECRET || process.env.JWT_SECRET || 'csrf-secret';
  
  // Ignorer les méthodes qui ne modifient pas l'état
  if (!STATE_CHANGING_METHODS.includes(req.method)) {
    return next();
  }
  
  // Ignorer les routes exemptées
  if (CSRF_EXEMPT_ROUTES.some(route => req.path.startsWith(route))) {
    return next();
  }
  
  // Ignorer les requêtes OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    return next();
  }
  
  try {
    // Pour les requêtes GET, générer un nouveau token
    if (req.method === 'GET') {
      const token = generateCsrfToken();
      const hash = generateCsrfHash(token, csrfSecret);
      
      // Stocker le hash dans un cookie httpOnly
      res.cookie('csrf-token', hash, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 3600000 // 1 heure
      });
      
      // Envoyer le token dans le header pour le frontend
      res.setHeader('X-CSRF-Token', token);
      return next();
    }
    
    // Pour les autres méthodes, vérifier le token
    const token = req.headers['x-csrf-token'] as string;
    const cookieHash = req.cookies['csrf-token'];
    
    if (!token || !cookieHash) {
      Logger.warn('Token CSRF manquant', {
        path: req.path,
        method: req.method,
        hasToken: !!token,
        hasCookie: !!cookieHash,
        requestId: req.requestId
      });
      
      res.status(403).json({
        success: false,
        message: 'Token CSRF manquant ou invalide',
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    // Vérifier que le token correspond au cookie
    if (!verifyCsrfToken(token, cookieHash, csrfSecret)) {
      Logger.warn('Token CSRF invalide', {
        path: req.path,
        method: req.method,
        ip: req.ip,
        requestId: req.requestId
      });
      
      res.status(403).json({
        success: false,
        message: 'Token CSRF invalide',
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
      return;
    }
    
    next();
  } catch (error) {
    Logger.error('Erreur vérification CSRF', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Middleware CSRF simplifié pour les API REST avec JWT
 * Pour les API REST authentifiées avec JWT, on peut être moins strict
 * car le JWT lui-même protège contre CSRF si bien configuré
 */
export const csrfProtectionLite = (req: Request, res: Response, next: NextFunction): void => {
  // Si l'utilisateur est authentifié avec JWT, la protection CSRF est moins critique
  // mais on la maintient pour les routes sensibles
  const isAuthenticated = !!req.user;
  const isSensitiveRoute = req.path.includes('/admin') || req.path.includes('/payments');
  
  if (isAuthenticated && !isSensitiveRoute) {
    // Pour les routes authentifiées non sensibles, on vérifie juste l'Origin/Referer
    const origin = req.headers.origin;
    const referer = req.headers.referer;
    const expectedOrigin = process.env.CORS_ORIGIN || 'http://localhost:3000';
    
    if (origin && origin !== expectedOrigin) {
      Logger.warn('Origin invalide pour requête authentifiée', {
        origin,
        expectedOrigin,
        path: req.path,
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
    
    return next();
  }
  
  // Pour les routes sensibles ou non authentifiées, utiliser la protection CSRF complète
  return csrfProtection(req, res, next);
};

