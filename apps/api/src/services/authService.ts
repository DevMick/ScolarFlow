import bcrypt from 'bcryptjs';
import { PrismaClient } from '@prisma/client';
import { SECURITY_CONFIG } from '../config/security';
import { TokenService } from './tokenService';
import { Logger } from '../utils/logger';
import type { 
  RegisterData, 
  LoginCredentials, 
  User, 
  AuthResponse,
  UpdateProfileData 
} from '@edustats/shared';

export class AuthService {
  constructor(private prisma: PrismaClient) {}

  async register(data: RegisterData): Promise<AuthResponse> {
    try {
      Logger.info('Attempting user registration', { email: data.email });

      // Vérifier si l'email existe déjà
      const existingUser = await (this.prisma as any).users.findUnique({
        where: { email: data.email.toLowerCase() }
      });

      if (existingUser) {
        throw new Error('Un compte avec cet email existe déjà');
      }

      // Hasher le mot de passe
      const passwordHash = await bcrypt.hash(data.password, SECURITY_CONFIG.bcrypt.saltRounds);

      // Créer l'utilisateur avec un compte gratuit
      const user = await (this.prisma as any).users.create({
        data: {
          email: data.email.toLowerCase(),
          password_hash: passwordHash,
          first_name: data.firstName,
          last_name: data.lastName,
          gender: data.gender,
          establishment: data.establishment || null,
          direction_regionale: data.directionRegionale,
          secteur_pedagogique: data.secteurPedagogique,
          // Créer automatiquement un compte gratuit (essai de 14 jours)
          compte_gratuit: {
            create: {
              date_debut: new Date(),
              // Calculer la date de fin en ajoutant 14 jours à la date actuelle
              date_fin: (() => {
                const now = new Date();
                const endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14);
                return endDate;
              })(),
              is_active: true
            }
          }
        },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          gender: true,
          establishment: true,
          direction_regionale: true,
          secteur_pedagogique: true,
          is_active: true,
          created_at: true,
          updated_at: true,
        }
      });

      // Transformer en camelCase pour le frontend
      const transformedUser = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        gender: user.gender,
        establishment: user.establishment,
        directionRegionale: user.direction_regionale,
        secteurPedagogique: user.secteur_pedagogique,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      };

      // Générer les tokens
      const token = TokenService.generateAccessToken({ 
        userId: user.id, 
        email: user.email 
      });
      const refreshToken = TokenService.generateRefreshToken({ userId: user.id });

      Logger.info('User registration successful with free trial', { 
        userId: user.id, 
        email: user.email,
        trialEnds: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
      });

      return {
        token,
        refreshToken,
        user: transformedUser,
        expiresIn: TokenService.getTokenExpiryTime(),
      };
    } catch (error) {
      Logger.error('Registration failed', error);
      throw error;
    }
  }

  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    try {
      Logger.info('Attempting user login', { email: credentials.email });

      // Trouver l'utilisateur
      const user = await (this.prisma as any).users.findUnique({
        where: { email: credentials.email.toLowerCase() },
        select: {
          id: true,
          email: true,
          password_hash: true,
          first_name: true,
          last_name: true,
          establishment: true,
          direction_regionale: true,
          secteur_pedagogique: true,
          is_active: true,
          created_at: true,
          updated_at: true,
        }
      });

      if (!user) {
        throw new Error('Email ou mot de passe incorrect');
      }

      if (!user.is_active) {
        throw new Error('Compte désactivé');
      }

      // Vérifier le mot de passe
      const isValidPassword = await bcrypt.compare(credentials.password, user.password_hash);
      if (!isValidPassword) {
        throw new Error('Email ou mot de passe incorrect');
      }

      // Générer les tokens
      const token = TokenService.generateAccessToken({ 
        userId: user.id, 
        email: user.email 
      });
      const refreshToken = TokenService.generateRefreshToken({ userId: user.id });

      // Transformer en camelCase pour le frontend
      const userData = {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        gender: user.gender,
        establishment: user.establishment,
        directionRegionale: user.direction_regionale,
        secteurPedagogique: user.secteur_pedagogique,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      };

      Logger.info('User login successful', { userId: user.id, email: user.email });

      return {
        token,
        refreshToken,
        user: userData,
        expiresIn: TokenService.getTokenExpiryTime(),
      };
    } catch (error) {
      Logger.error('Login failed', error);
      throw error;
    }
  }

  async getUserById(id: number): Promise<User | null> {
    try {
      const user = await (this.prisma as any).users.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          gender: true,
          establishment: true,
          direction_regionale: true,
          secteur_pedagogique: true,
          is_active: true,
          created_at: true,
          updated_at: true,
        }
      });

      if (!user) {
        return null;
      }

      // Transformer en camelCase pour le frontend
      return {
        id: user.id,
        email: user.email,
        firstName: user.first_name,
        lastName: user.last_name,
        gender: user.gender,
        establishment: user.establishment,
        directionRegionale: user.direction_regionale,
        secteurPedagogique: user.secteur_pedagogique,
        isActive: user.is_active,
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      };
    } catch (error) {
      Logger.error('Get user by ID failed', error);
      throw new Error('Erreur lors de la récupération de l\'utilisateur');
    }
  }

  async updateProfile(userId: number, data: UpdateProfileData): Promise<User> {
    try {
      Logger.info('Updating user profile', { userId });

      const updatedUser = await (this.prisma as any).users.update({
        where: { id: userId },
        data: {
          first_name: data.firstName,
          last_name: data.lastName,
          gender: data.gender || null,
          establishment: data.establishment || null,
          direction_regionale: data.directionRegionale || null,
          secteur_pedagogique: data.secteurPedagogique || null,
        },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          gender: true,
          establishment: true,
          direction_regionale: true,
          secteur_pedagogique: true,
          is_active: true,
          created_at: true,
          updated_at: true,
        }
      });

      // Transformer en camelCase pour le frontend
      const transformedUser = {
        id: updatedUser.id,
        email: updatedUser.email,
        firstName: updatedUser.first_name,
        lastName: updatedUser.last_name,
        gender: updatedUser.gender,
        establishment: updatedUser.establishment,
        directionRegionale: updatedUser.direction_regionale,
        secteurPedagogique: updatedUser.secteur_pedagogique,
        isActive: updatedUser.is_active,
        createdAt: updatedUser.created_at,
        updatedAt: updatedUser.updated_at,
      };

      Logger.info('User profile updated successfully', { userId });
      return transformedUser;
    } catch (error) {
      Logger.error('Profile update failed', error);
      throw new Error('Erreur lors de la mise à jour du profil');
    }
  }

  async refreshToken(refreshToken: string): Promise<{ token: string; expiresIn: number }> {
    try {
      const payload = TokenService.verifyRefreshToken(refreshToken);
      
      const user = await this.getUserById(payload.userId);
      if (!user || !user.isActive) {
        throw new Error('Utilisateur non trouvé ou désactivé');
      }

      const newToken = TokenService.generateAccessToken({
        userId: user.id,
        email: user.email,
      });

      return {
        token: newToken,
        expiresIn: TokenService.getTokenExpiryTime(),
      };
    } catch (error) {
      Logger.error('Token refresh failed', error);
      throw error;
    }
  }
}
