// ========================================
// MIDDLEWARE D'AUTHENTIFICATION JWT
// ========================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { ApiResponse } from '../types/express';
import { Logger } from '../utils/logger';
import { prisma } from '../lib/prisma';

export interface JwtPayload {
  userId: number;
  email: string;
  firstName?: string;
  lastName?: string;
  iat: number;
  exp: number;
  aud?: string;
  iss?: string;
}

/**
 * Middleware d'authentification obligatoire
 * Vérifie le token JWT et charge l'utilisateur
 */
export const authenticateToken = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  try {
    // 1. Extraire le token du header Authorization
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Token d\'authentification requis',
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 2. Vérifier et décoder le token
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;

    // 3. Récupérer l'utilisateur en base
    const user = await (prisma as any).users.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        email: true,
        first_name: true,
        last_name: true,
        is_active: true
      }
    });

    if (!user || !user.is_active) {
      res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé ou inactif',
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // 4. Ajouter l'utilisateur à la requête
    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name
    };

    Logger.info('Authentification réussie', {
      userId: user.id,
      email: user.email,
      requestId: req.requestId
    });

    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      Logger.warn('Token JWT invalide', {
        error: error.message,
        requestId: req.requestId
      });
      
      res.status(401).json({
        success: false,
        message: 'Token invalide',
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      Logger.warn('Token JWT expiré', {
        expiredAt: error.expiredAt,
        requestId: req.requestId
      });
      
      res.status(401).json({
        success: false,
        message: 'Token expiré',
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    Logger.error('Erreur authentification', {
      error: (error as Error).message,
      requestId: req.requestId
    });
    
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Middleware d'authentification optionnelle
 * Pour les routes qui peuvent fonctionner avec ou sans utilisateur connecté
 */
export const optionalAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(' ')[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
      const user = await (prisma as any).users.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          is_active: true
        }
      });

      if (user && user.is_active) {
        req.user = {
          id: user.id,
          email: user.email,
          firstName: user.first_name,
          lastName: user.last_name
        };

        Logger.info('Authentification optionnelle réussie', {
          userId: user.id,
          requestId: req.requestId
        });
      }
    } catch (error) {
      // Ignorer les erreurs pour auth optionnelle
      Logger.warn('Échec authentification optionnelle', {
        error: (error as Error).message,
        requestId: req.requestId
      });
    }
  }

  next();
};

/**
 * Middleware pour vérifier les permissions d'admin
 */
export const requireAdmin = async (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): Promise<void> => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentification requise',
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    });
    return;
  }

  try {
    // Vérifier si l'utilisateur a des permissions admin
    const user = await (prisma as any).users.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        email: true,
        // TODO: Ajouter un champ role ou isAdmin dans le modèle User
      }
    });

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Utilisateur non trouvé',
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    // Pour le moment, tous les utilisateurs ont accès
    // TODO: Implémenter la logique de rôles
    next();
  } catch (error) {
    Logger.error('Erreur vérification admin', {
      error: (error as Error).message,
      userId: req.user.id,
      requestId: req.requestId
    });

    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur',
      requestId: req.requestId,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * Middleware pour vérifier la propriété d'une classe
 */
export const requireClassOwnership = (classIdParam: string = 'classId') => {
  return async (
    req: Request,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentification requise',
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      const classId = parseInt(req.params[classIdParam]);
      
      if (isNaN(classId)) {
        res.status(400).json({
          success: false,
          message: 'ID de classe invalide',
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const classEntity = await (prisma as any).classes.findFirst({
        where: {
          id: classId,
          user_id: req.user.id
        }
      });

      if (!classEntity) {
        res.status(404).json({
          success: false,
          message: 'Classe non trouvée ou accès non autorisé',
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Ajouter les informations de la classe à la requête
      req.classEntity = classEntity;
      next();
    } catch (error) {
      Logger.error('Erreur vérification propriété classe', {
        error: (error as Error).message,
        userId: req.user.id,
        classId: req.params[classIdParam],
        requestId: req.requestId
      });

      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Middleware pour vérifier la propriété d'une évaluation
 */
export const requireEvaluationOwnership = (evaluationIdParam: string = 'id') => {
  return async (
    req: Request,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentification requise',
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
      return;
    }

    try {
      const evaluationId = parseInt(req.params[evaluationIdParam]);
      
      if (isNaN(evaluationId)) {
        res.status(400).json({
          success: false,
          message: 'ID d\'évaluation invalide',
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const evaluation = await (prisma as any).evaluations.findFirst({
        where: {
          id: evaluationId,
          classes: {
            user_id: req.user.id
          }
        },
        include: {
          classes: true
        }
      });

      if (!evaluation) {
        res.status(404).json({
          success: false,
          message: 'Évaluation non trouvée ou accès non autorisé',
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Ajouter les informations de l'évaluation à la requête
      req.evaluationEntity = evaluation;
      next();
    } catch (error) {
      Logger.error('Erreur vérification propriété évaluation', {
        error: (error as Error).message,
        userId: req.user.id,
        evaluationId: req.params[evaluationIdParam],
        requestId: req.requestId
      });

      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
    }
  };
};

/**
 * Utilitaire pour extraire le token sans validation
 */
export const extractTokenPayload = (token: string): JwtPayload | null => {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload;
  } catch {
    return null;
  }
};

/**
 * Utilitaire pour vérifier si un token est expiré
 */
export const isTokenExpired = (token: string): boolean => {
  try {
    jwt.verify(token, process.env.JWT_SECRET!);
    return false;
  } catch (error) {
    return error instanceof jwt.TokenExpiredError;
  }
};

// Étendre les types Express pour inclure nos propriétés personnalisées
declare global {
  namespace Express {
    interface Request {
      classEntity?: any;
      evaluationEntity?: any;
    }
  }
}