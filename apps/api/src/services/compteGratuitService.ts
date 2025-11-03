import { PrismaClient } from '@prisma/client';
import { Logger } from '../utils/logger';

export class CompteGratuitService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Vérifie si un compte gratuit est encore actif
   */
  async isTrialActive(userId: number): Promise<boolean> {
    try {
      const compteGratuit = await (this.prisma as any).compte_gratuit.findUnique({
        where: { user_id: userId },
        select: {
          is_active: true,
          date_fin: true
        }
      });

      if (!compteGratuit) {
        return false;
      }

      // Vérifier si l'essai a expiré (utiliser la même logique que getTrialInfo)
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endDate = new Date(compteGratuit.date_fin.getFullYear(), compteGratuit.date_fin.getMonth(), compteGratuit.date_fin.getDate());
      
      if (today > endDate && compteGratuit.is_active) {
        // Marquer comme inactif
        await (this.prisma as any).compte_gratuit.update({
          where: { user_id: userId },
          data: {
            is_active: false
          }
        });
        return false;
      }

      return compteGratuit.is_active;
    } catch (error) {
      Logger.error('Error checking trial status', error);
      return false;
    }
  }

  /**
   * Obtient les informations du compte gratuit d'un utilisateur
   */
  async getTrialInfo(userId: number) {
    try {
      const compteGratuit = await (this.prisma as any).compte_gratuit.findUnique({
        where: { user_id: userId },
        select: {
          id: true,
          date_debut: true,
          date_fin: true,
          is_active: true,
          created_at: true
        }
      });

      if (!compteGratuit) {
        return null;
      }

      const now = new Date();
      
      // Normaliser les dates pour éviter les problèmes de timezone
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const endDate = new Date(compteGratuit.date_fin.getFullYear(), compteGratuit.date_fin.getMonth(), compteGratuit.date_fin.getDate());
      
      // Calculer la différence en jours (plus précis)
      const timeDiff = endDate.getTime() - today.getTime();
      const daysRemaining = Math.ceil(timeDiff / (1000 * 60 * 60 * 24));
      
      // Debug logs
      Logger.info('Trial info calculation', {
        userId,
        date_fin: compteGratuit.date_fin,
        endDate,
        now,
        today,
        timeDiff,
        daysRemaining,
        isExpired: today > endDate
      });
      
      // Transformer en camelCase pour le frontend
      return {
        id: compteGratuit.id,
        dateDebut: compteGratuit.date_debut,
        dateFin: compteGratuit.date_fin,
        isActive: compteGratuit.is_active,
        createdAt: compteGratuit.created_at,
        daysRemaining: Math.max(0, daysRemaining),
        isExpired: today > endDate
      };
    } catch (error) {
      Logger.error('Error getting trial info', error);
      return null;
    }
  }

  /**
   * Marque un compte gratuit comme expiré
   */
  async expireTrial(userId: number): Promise<void> {
    try {
      await (this.prisma as any).compte_gratuit.update({
        where: { user_id: userId },
        data: {
          is_active: false
        }
      });

      Logger.info('Trial expired for user', { userId });
    } catch (error) {
      Logger.error('Error expiring trial', error);
      throw error;
    }
  }

  /**
   * Obtient tous les comptes gratuits actifs
   */
  async getActiveTrials() {
    try {
      const trials = await (this.prisma as any).compte_gratuit.findMany({
        where: {
          is_active: true
        },
        include: {
          users: {
            select: {
              id: true,
              email: true,
              first_name: true,
              last_name: true,
              created_at: true
            }
          }
        },
        orderBy: {
          date_fin: 'asc'
        }
      });

      // Transformer en camelCase
      return trials.map((trial: any) => ({
        id: trial.id,
        dateDebut: trial.date_debut,
        dateFin: trial.date_fin,
        isActive: trial.is_active,
        createdAt: trial.created_at,
        user: trial.users ? {
          id: trial.users.id,
          email: trial.users.email,
          firstName: trial.users.first_name,
          lastName: trial.users.last_name,
          createdAt: trial.users.created_at,
        } : null
      }));
    } catch (error) {
      Logger.error('Error getting active trials', error);
      return [];
    }
  }

  /**
   * Obtient les statistiques des comptes gratuits
   */
  async getTrialStats() {
    try {
      const totalTrials = await (this.prisma as any).compte_gratuit.count();
      const activeTrials = await (this.prisma as any).compte_gratuit.count({
        where: {
          is_active: true
        }
      });
      const inactiveTrials = await (this.prisma as any).compte_gratuit.count({
        where: {
          is_active: false
        }
      });

      return {
        totalTrials,
        activeTrials,
        inactiveTrials
      };
    } catch (error) {
      Logger.error('Error getting trial stats', error);
      return {
        totalTrials: 0,
        activeTrials: 0,
        inactiveTrials: 0
      };
    }
  }
}
