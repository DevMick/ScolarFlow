import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { CompteGratuitService } from '../services/compteGratuitService';
import { ApiResponseHelper } from '../utils/response';
import { Logger } from '../utils/logger';

export class CompteGratuitController {
  private compteGratuitService: CompteGratuitService;

  constructor(prisma: PrismaClient) {
    this.compteGratuitService = new CompteGratuitService(prisma);
  }

  /**
   * Récupère les informations du compte gratuit de l'utilisateur connecté
   */
  getTrialInfo = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const trialInfo = await this.compteGratuitService.getTrialInfo(req.user.id);
      
      if (!trialInfo) {
        ApiResponseHelper.notFound(res, 'Aucun compte gratuit trouvé pour cet utilisateur');
        return;
      }

      ApiResponseHelper.success(res, trialInfo, 'Informations du compte gratuit récupérées avec succès');
    } catch (error) {
      Logger.error('Get trial info failed', error);
      ApiResponseHelper.serverError(res, 'Erreur lors de la récupération des informations du compte gratuit');
    }
  };

  /**
   * Vérifie si le compte gratuit est encore actif
   */
  checkTrialStatus = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const isActive = await this.compteGratuitService.isTrialActive(req.user.id);
      
      ApiResponseHelper.success(res, { isActive }, 'Statut du compte gratuit vérifié');
    } catch (error) {
      Logger.error('Check trial status failed', error);
      ApiResponseHelper.serverError(res, 'Erreur lors de la vérification du statut du compte gratuit');
    }
  };

  /**
   * Obtient tous les comptes gratuits actifs (admin seulement)
   */
  getActiveTrials = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      // TODO: Ajouter une vérification d'admin si nécessaire
      const activeTrials = await this.compteGratuitService.getActiveTrials();
      
      ApiResponseHelper.success(res, activeTrials, 'Comptes gratuits actifs récupérés avec succès');
    } catch (error) {
      Logger.error('Get active trials failed', error);
      ApiResponseHelper.serverError(res, 'Erreur lors de la récupération des comptes gratuits actifs');
    }
  };

  /**
   * Obtient les statistiques des comptes gratuits (admin seulement)
   */
  getTrialStats = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      // TODO: Ajouter une vérification d'admin si nécessaire
      const stats = await this.compteGratuitService.getTrialStats();
      
      ApiResponseHelper.success(res, stats, 'Statistiques des comptes gratuits récupérées avec succès');
    } catch (error) {
      Logger.error('Get trial stats failed', error);
      ApiResponseHelper.serverError(res, 'Erreur lors de la récupération des statistiques des comptes gratuits');
    }
  };
}