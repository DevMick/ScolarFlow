// ========================================
// CONFIGURATION HELMET - EN-TÊTES DE SÉCURITÉ HTTP
// ========================================

import { Request, Response, NextFunction } from 'express';

/**
 * Configuration CSP (Content Security Policy) stricte
 * Adaptée pour une API REST avec frontend séparé
 */
export const cspConfig = {
  directives: {
    // Interdire les scripts inline et eval
    defaultSrc: ["'self'"],
    scriptSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'"], // Nécessaire pour certains frameworks
    imgSrc: ["'self'", "data:", "https:"],
    connectSrc: ["'self'", process.env.CORS_ORIGIN || "http://localhost:3000"].filter(Boolean),
    fontSrc: ["'self'", "data:"],
    objectSrc: ["'none'"],
    mediaSrc: ["'self'"],
    frameSrc: ["'none'"],
    // Pas de forms-action nécessaire pour une API
    upgradeInsecureRequests: process.env.NODE_ENV === 'production' ? [] : null,
  },
  // En développement, on peut être plus permissif
  ...(process.env.NODE_ENV === 'development' && {
    reportOnly: false,
    loose: true
  })
};

/**
 * Configuration Helmet complète pour la sécurité HTTP
 */
export const helmetConfig = {
  // Content Security Policy
  contentSecurityPolicy: process.env.NODE_ENV === 'production' ? cspConfig : false,
  
  // Cross-Origin Embedder Policy (peut casser certaines intégrations)
  crossOriginEmbedderPolicy: false,
  
  // Cross-Origin Opener Policy
  crossOriginOpenerPolicy: { policy: 'same-origin' as const },
  
  // Cross-Origin Resource Policy
  crossOriginResourcePolicy: { policy: 'same-origin' },
  
  // X-DNS-Prefetch-Control
  dnsPrefetchControl: true,
  
  // X-Frame-Options (déjà géré par frameguard mais on le spécifie)
  frameguard: { action: 'deny' },
  
  // X-Content-Type-Options
  noSniff: true,
  
  // X-Download-Options
  ieNoOpen: true,
  
  // X-Permitted-Cross-Domain-Policies
  permittedCrossDomainPolicies: false,
  
  // Referrer-Policy
  referrerPolicy: { policy: 'no-referrer' },
  
  // Strict-Transport-Security (HSTS)
  hsts: {
    maxAge: 31536000, // 1 an
    includeSubDomains: true,
    preload: process.env.NODE_ENV === 'production'
  },
  
  // Permissions-Policy (anciennement Feature-Policy)
  permissionsPolicy: {
    camera: [],
    microphone: [],
    geolocation: [],
    payment: [],
    usb: [],
    magnetometer: [],
    gyroscope: [],
    speaker: [],
    vibrate: [],
    fullscreen: [],
    pictureInPicture: []
  },
  
  // X-XSS-Protection (obsolète mais encore utilisé par certains navigateurs)
  xssFilter: true,
  
  // Origin-Agent-Cluster
  originAgentCluster: true
};

/**
 * Headers de sécurité supplémentaires non couverts par Helmet
 */
export const additionalSecurityHeaders = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // X-Powered-By: Supprimé par Helmet par défaut mais on le confirme
  res.removeHeader('X-Powered-By');
  
  // X-Request-ID: Identifiant unique pour le traçage
  if (!req.requestId) {
    req.requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  res.setHeader('X-Request-ID', req.requestId);
  
  // X-Content-Type-Options (redondant avec Helmet mais on le confirme)
  res.setHeader('X-Content-Type-Options', 'nosniff');
  
  // X-Frame-Options (redondant avec Helmet mais on le confirme)
  res.setHeader('X-Frame-Options', 'DENY');
  
  // Cache-Control pour les réponses sensibles
  if (req.path.startsWith('/api/auth') || req.path.startsWith('/api/admin')) {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
  }
  
  next();
};

