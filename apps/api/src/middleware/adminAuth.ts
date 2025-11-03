// Middleware d'authentification pour les administrateurs
import { Request, Response, NextFunction } from 'express';
import AdminService from '../services/adminService';

export interface AdminRequest extends Request {
  admin?: {
    id: number;
    username: string;
    isActive: boolean;
    createdAt: Date;
  };
}

/**
 * Middleware pour vérifier l'authentification admin
 */
export const authenticateAdmin = async (req: AdminRequest, res: Response, next: NextFunction) => {
  try {
    // Skip authentication for login route
    if (req.path === '/login' || req.path === '/auth/login') {
      return next();
    }

    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token d\'authentification requis'
      });
    }

    const token = authHeader.substring(7); // Enlever "Bearer "
    
    const result = await AdminService.verifyAdminToken(token);
    
    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: result.message
      });
    }

    // Ajouter les informations admin à la requête
    req.admin = result.admin;
    next();

  } catch (error) {
    console.error('Erreur lors de l\'authentification admin:', error);
    return res.status(401).json({
      success: false,
      message: 'Token d\'authentification invalide'
    });
  }
};

/**
 * Middleware pour vérifier que l'utilisateur est un admin (alternative sans token)
 */
export const requireAdmin = (req: Request, res: Response, next: NextFunction) => {
  // Pour l'instant, on considère que tous les utilisateurs connectés sont des admins
  // TODO: Implémenter un système de rôles plus robuste
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Authentification requise'
    });
  }
  
  next();
};
