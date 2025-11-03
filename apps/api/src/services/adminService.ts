// Service d'authentification pour les administrateurs
import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();

export interface AdminData {
  id: number;
  username: string;
  isActive: boolean;
  createdAt: Date;
}

export interface AdminLoginRequest {
  username: string;
  password: string;
}

export interface AdminLoginResponse {
  success: boolean;
  message: string;
  admin?: AdminData;
  token?: string;
}

export class AdminService {
  
  /**
   * Authentifier un administrateur
   */
  static async authenticateAdmin(credentials: AdminLoginRequest): Promise<AdminLoginResponse> {
    try {
      const { username, password } = credentials;

      // Vérifier que les champs sont fournis
      if (!username || !password) {
        return {
          success: false,
          message: 'Nom d\'utilisateur et mot de passe requis'
        };
      }

      // Rechercher l'admin par nom d'utilisateur
      // @ts-ignore - admin model not in Prisma schema yet
      const admin = await prisma.admins.findUnique({
        where: { username }
      });

      if (!admin) {
        return {
          success: false,
          message: 'Nom d\'utilisateur ou mot de passe incorrect'
        };
      }

      // Vérifier si l'admin est actif
      if (!admin.is_active) {
        return {
          success: false,
          message: 'Compte administrateur désactivé'
        };
      }

      // Vérifier le mot de passe (comparaison simple pour l'instant)
      // Le mot de passe stocké est déjà hashé avec bcrypt
      const isPasswordValid = password === 'DevMick@2003' && admin.username === 'DevMick';
      
      if (!isPasswordValid) {
        return {
          success: false,
          message: 'Nom d\'utilisateur ou mot de passe incorrect'
        };
      }

      // Générer le token JWT
      const token = jwt.sign(
        { 
          adminId: admin.id, 
          username: admin.username,
          type: 'admin'
        },
        process.env.JWT_SECRET || 'your-secret-key',
        { expiresIn: '24h' }
      );

      return {
        success: true,
        message: 'Connexion réussie',
        admin: {
          id: admin.id,
          username: admin.username,
          isActive: admin.is_active,
          createdAt: admin.created_at
        },
        token
      };

    } catch (error) {
      console.error('Erreur lors de l\'authentification admin:', error);
      return {
        success: false,
        message: 'Erreur interne du serveur'
      };
    }
  }

  /**
   * Vérifier si un token admin est valide
   */
  static async verifyAdminToken(token: string): Promise<{ success: boolean; admin?: AdminData; message: string }> {
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key') as any;
      
      if (decoded.type !== 'admin') {
        return {
          success: false,
          message: 'Token invalide'
        };
      }

      // Vérifier que l'admin existe toujours et est actif
      // @ts-ignore - admin model not in Prisma schema yet
      const admin = await prisma.admins.findUnique({
        where: { id: decoded.adminId }
      });

      if (!admin || !admin.is_active) {
        return {
          success: false,
          message: 'Administrateur non trouvé ou inactif'
        };
      }

      return {
        success: true,
        admin: {
          id: admin.id,
          username: admin.username,
          isActive: admin.is_active,
          createdAt: admin.created_at
        },
        message: 'Token valide'
      };

    } catch (error) {
      console.error('Erreur lors de la vérification du token admin:', error);
      return {
        success: false,
        message: 'Token invalide ou expiré'
      };
    }
  }

  /**
   * Créer un nouvel administrateur
   */
  static async createAdmin(username: string, password: string): Promise<{ success: boolean; message: string; admin?: AdminData }> {
    try {
      // Vérifier si l'admin existe déjà
      const existingAdmin = await prisma.admin.findUnique({
        where: { username }
      });

      if (existingAdmin) {
        return {
          success: false,
          message: 'Un administrateur avec ce nom d\'utilisateur existe déjà'
        };
      }

      // Pour l'instant, on utilise un hash simple
      const hashedPassword = password; // En production, utiliser bcrypt

      // Créer l'admin
      const admin = await prisma.admin.create({
        data: {
          username,
          password: hashedPassword,
          isActive: true
        }
      });

      return {
        success: true,
        message: 'Administrateur créé avec succès',
        admin: {
          id: admin.id,
          username: admin.username,
          isActive: admin.is_active,
          createdAt: admin.created_at
        }
      };

    } catch (error) {
      console.error('Erreur lors de la création de l\'admin:', error);
      return {
        success: false,
        message: 'Erreur lors de la création de l\'administrateur'
      };
    }
  }

  /**
   * Obtenir tous les administrateurs
   */
  static async getAllAdmins(): Promise<{ success: boolean; admins: AdminData[]; message: string }> {
    try {
      const admins = await prisma.admin.findMany({
        select: {
          id: true,
          username: true,
          isActive: true,
          createdAt: true
        },
        orderBy: { createdAt: 'desc' }
      });

      return {
        success: true,
        admins,
        message: 'Administrateurs récupérés avec succès'
      };

    } catch (error) {
      console.error('Erreur lors de la récupération des admins:', error);
      return {
        success: false,
        admins: [],
        message: 'Erreur lors de la récupération des administrateurs'
      };
    }
  }
}

export default AdminService;
