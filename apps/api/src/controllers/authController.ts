import { Request, Response } from 'express';
import { AuthService } from '../services/authService';
import { ApiResponseHelper } from '../utils/response';
import { Logger } from '../utils/logger';
import { prisma } from '../server';
import type { RegisterData, LoginCredentials, UpdateProfileData } from '@edustats/shared';

export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService(prisma);
  }

  register = async (req: Request, res: Response): Promise<void> => {
    try {
      const registerData: RegisterData = req.body;
      
      Logger.info('Registration attempt', { email: registerData.email });
      
      const authResponse = await this.authService.register(registerData);
      
      // Définir le refresh token comme cookie httpOnly
      res.cookie('refreshToken', authResponse.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      });

      // Retourner directement la structure attendue par le frontend
      res.status(201).json({
        success: true,
        token: authResponse.token,
        user: authResponse.user,
        expiresIn: authResponse.expiresIn,
        message: 'Inscription réussie'
      });
    } catch (error) {
      Logger.error('Registration failed', error);
      
      if (error instanceof Error) {
        ApiResponseHelper.error(res, error.message, 400);
      } else {
        ApiResponseHelper.serverError(res, 'Erreur lors de l\'inscription');
      }
    }
  };

  login = async (req: Request, res: Response): Promise<void> => {
    try {
      const credentials: LoginCredentials = req.body;
      
      Logger.info('Login attempt', { email: credentials.email });
      
      const authResponse = await this.authService.login(credentials);
      
      // Définir le refresh token comme cookie httpOnly
      res.cookie('refreshToken', authResponse.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 jours
      });

      // Logique spéciale pour l'utilisateur enseignant
      const isSpecialTeacher = credentials.email === 'mickael.andjui.21@gmail.com';
      
      // Retourner directement la structure attendue par le frontend
      res.status(200).json({
        success: true,
        token: authResponse.token,
        user: authResponse.user,
        expiresIn: authResponse.expiresIn,
        message: 'Connexion réussie',
        redirectTo: isSpecialTeacher ? '/payment' : undefined // Indication pour le frontend
      });
    } catch (error) {
      Logger.error('Login failed', error);
      
      if (error instanceof Error) {
        ApiResponseHelper.unauthorized(res, error.message);
      } else {
        ApiResponseHelper.serverError(res, 'Erreur lors de la connexion');
      }
    }
  };

  logout = async (req: Request, res: Response): Promise<void> => {
    try {
      // Supprimer le refresh token cookie
      res.clearCookie('refreshToken');
      
      Logger.info('User logged out');
      
      ApiResponseHelper.success(res, null, 'Déconnexion réussie');
    } catch (error) {
      Logger.error('Logout failed', error);
      ApiResponseHelper.serverError(res, 'Erreur lors de la déconnexion');
    }
  };

  getProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const user = await this.authService.getUserById(req.user.id);
      
      if (!user) {
        ApiResponseHelper.notFound(res, 'Utilisateur non trouvé');
        return;
      }

      ApiResponseHelper.success(res, user, 'Profil récupéré avec succès');
    } catch (error) {
      Logger.error('Get profile failed', error);
      ApiResponseHelper.serverError(res, 'Erreur lors de la récupération du profil');
    }
  };

  updateProfile = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const updateData: UpdateProfileData = req.body;
      
      Logger.info('Profile update attempt', { userId: req.user.id });
      
      const updatedUser = await this.authService.updateProfile(req.user.id, updateData);
      
      ApiResponseHelper.success(res, updatedUser, 'Profil mis à jour avec succès');
    } catch (error) {
      Logger.error('Profile update failed', error);
      
      if (error instanceof Error) {
        ApiResponseHelper.error(res, error.message, 400);
      } else {
        ApiResponseHelper.serverError(res, 'Erreur lors de la mise à jour du profil');
      }
    }
  };

  refreshToken = async (req: Request, res: Response): Promise<void> => {
    try {
      const refreshToken = req.cookies.refreshToken;
      
      if (!refreshToken) {
        ApiResponseHelper.unauthorized(res, 'Token de rafraîchissement manquant');
        return;
      }

      const result = await this.authService.refreshToken(refreshToken);
      
      // Retourner directement la structure attendue par le frontend
      res.status(200).json({
        success: true,
        token: result.token,
        message: 'Token rafraîchi avec succès'
      });
    } catch (error) {
      Logger.error('Token refresh failed', error);
      
      // Supprimer le cookie invalide
      res.clearCookie('refreshToken');
      
      if (error instanceof Error) {
        ApiResponseHelper.unauthorized(res, error.message);
      } else {
        ApiResponseHelper.unauthorized(res, 'Erreur lors du rafraîchissement du token');
      }
    }
  };
}
