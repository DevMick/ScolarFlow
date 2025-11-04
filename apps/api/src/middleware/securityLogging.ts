// ========================================
// LOGGING DE SÉCURITÉ
// ========================================

import { Request, Response } from 'express';
import { Logger } from '../utils/logger';

/**
 * Événements de sécurité à surveiller
 */
export enum SecurityEventType {
  AUTH_SUCCESS = 'auth.success',
  AUTH_FAILURE = 'auth.failure',
  AUTH_BRUTE_FORCE = 'auth.brute_force',
  RATE_LIMIT_EXCEEDED = 'rate_limit.exceeded',
  CSRF_FAILURE = 'csrf.failure',
  VALIDATION_FAILURE = 'validation.failure',
  UNAUTHORIZED_ACCESS = 'unauthorized.access',
  SUSPICIOUS_ACTIVITY = 'suspicious.activity',
  FILE_UPLOAD = 'file.upload',
  FILE_UPLOAD_BLOCKED = 'file.upload.blocked',
  SQL_INJECTION_ATTEMPT = 'sql.injection_attempt',
  XSS_ATTEMPT = 'xss.attempt',
  PATH_TRAVERSAL_ATTEMPT = 'path_traversal.attempt'
}

/**
 * Interface pour les événements de sécurité
 */
export interface SecurityEvent {
  type: SecurityEventType;
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  metadata: {
    ip?: string;
    userId?: number;
    userAgent?: string;
    path?: string;
    method?: string;
    requestId?: string;
    [key: string]: any;
  };
  timestamp: Date;
}

/**
 * Log un événement de sécurité
 */
export function logSecurityEvent(
  type: SecurityEventType,
  severity: SecurityEvent['severity'],
  message: string,
  metadata: SecurityEvent['metadata']
): void {
  const event: SecurityEvent = {
    type,
    severity,
    message,
    metadata: {
      ...metadata,
      timestamp: new Date().toISOString()
    },
    timestamp: new Date()
  };
  
  // Log selon la sévérité
  switch (severity) {
    case 'critical':
    case 'high':
      Logger.error(`[SECURITY] ${message}`, event);
      break;
    case 'medium':
      Logger.warn(`[SECURITY] ${message}`, event);
      break;
    case 'low':
      Logger.info(`[SECURITY] ${message}`, event);
      break;
  }
  
  // TODO: En production, envoyer ces événements à un service de monitoring
  // (Sentry, DataDog, CloudWatch, etc.)
}

/**
 * Détecte les patterns d'attaques courants dans les entrées
 */
export function detectAttackPatterns(input: string): string[] {
  const patterns: { pattern: RegExp; name: string }[] = [
    // Injection SQL
    { pattern: /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|UNION)\b|('|;|--|#|\/\*|\*\/))/i, name: 'sql_injection' },
    // XSS
    { pattern: /<script|javascript:|onerror=|onload=|eval\(|document\.cookie/i, name: 'xss' },
    // Path traversal
    { pattern: /\.\.\/|\.\.\\|\.\.%2F|\.\.%5C/i, name: 'path_traversal' },
    // Command injection
    { pattern: /[;&|`$(){}[\]]|rm -rf|cat \/etc\/passwd|wget|curl|nc /i, name: 'command_injection' },
    // LDAP injection
    { pattern: /[()&|!]/i, name: 'ldap_injection' },
    // Null bytes
    { pattern: /\0/, name: 'null_byte' }
  ];
  
  const detected: string[] = [];
  
  for (const { pattern, name } of patterns) {
    if (pattern.test(input)) {
      detected.push(name);
    }
  }
  
  return detected;
}

/**
 * Extrait récursivement toutes les valeurs string d'un objet
 */
function extractStringValues(obj: any): string[] {
  const values: string[] = [];
  
  if (obj === null || obj === undefined) {
    return values;
  }
  
  if (typeof obj === 'string') {
    values.push(obj);
  } else if (Array.isArray(obj)) {
    obj.forEach(item => {
      values.push(...extractStringValues(item));
    });
  } else if (typeof obj === 'object') {
    Object.values(obj).forEach(value => {
      values.push(...extractStringValues(value));
    });
  }
  
  return values;
}

/**
 * Middleware pour détecter les tentatives d'injection dans les requêtes
 */
export const detectInjectionAttempts = (
  req: Request,
  res: Response,
  next: any
): void => {
  // Exclure certaines routes sensibles de la détection stricte (comme login/register)
  // Ces routes ont déjà leur propre validation
  const excludedPaths = ['/api/auth/login', '/api/auth/register'];
  if (excludedPaths.some(path => req.path.startsWith(path))) {
    return next();
  }
  
  const suspiciousPatterns: string[] = [];
  
  // Vérifier le body - extraire uniquement les valeurs string, pas la structure JSON
  if (req.body) {
    const stringValues = extractStringValues(req.body);
    for (const value of stringValues) {
      const patterns = detectAttackPatterns(value);
      suspiciousPatterns.push(...patterns);
    }
  }
  
  // Vérifier les query params
  if (req.query) {
    const stringValues = extractStringValues(req.query);
    for (const value of stringValues) {
      const patterns = detectAttackPatterns(value);
      suspiciousPatterns.push(...patterns);
    }
  }
  
  // Vérifier les params
  if (req.params) {
    const stringValues = extractStringValues(req.params);
    for (const value of stringValues) {
      const patterns = detectAttackPatterns(value);
      suspiciousPatterns.push(...patterns);
    }
  }
  
  // Vérifier l'URL
  const urlPatterns = detectAttackPatterns(req.url);
  suspiciousPatterns.push(...urlPatterns);
  
  // Si des patterns suspects sont détectés, logger et bloquer
  if (suspiciousPatterns.length > 0) {
    const uniquePatterns = [...new Set(suspiciousPatterns)];
    
    logSecurityEvent(
      SecurityEventType.SUSPICIOUS_ACTIVITY,
      'high',
      `Tentative d'injection détectée: ${uniquePatterns.join(', ')}`,
      {
        ip: req.ip,
        userId: req.user?.id,
        userAgent: req.get('user-agent'),
        path: req.path,
        method: req.method,
        patterns: uniquePatterns,
        requestId: req.requestId
      }
    );
    
    res.status(400).json({
      success: false,
      message: 'Requête invalide détectée',
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  next();
};

