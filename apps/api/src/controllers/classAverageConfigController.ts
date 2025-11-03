import { Request, Response } from 'express';
import { ClassAverageConfigService, CreateClassAverageConfigData } from '../services/classAverageConfigService';
import { ApiResponseHelper } from '../utils/response';
import { Logger } from '../utils/logger';
import { prisma } from '../server';

export class ClassAverageConfigController {
  private classAverageConfigService: ClassAverageConfigService;

  constructor() {
    this.classAverageConfigService = new ClassAverageConfigService(prisma);
  }

  getUserConfigs = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      Logger.info('Fetching class average configs for user', { 
        userId: req.user.id
      });

      const configs = await this.classAverageConfigService.getUserClassConfigs(req.user.id);

      ApiResponseHelper.success(
        res,
        {
          configs,
          total: configs.length,
        },
        'Configurations de moyennes récupérées avec succès'
      );
    } catch (error) {
      Logger.error('Get class average configs failed', error);
      ApiResponseHelper.serverError(res, 'Erreur lors de la récupération des configurations de moyennes');
    }
  };

  getClassConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const classId = parseInt(req.params.classId);
      
      if (isNaN(classId)) {
        ApiResponseHelper.error(res, 'ID de classe invalide', 400);
        return;
      }

      Logger.info('Fetching class average config', { 
        classId, 
        userId: req.user.id 
      });

      const config = await this.classAverageConfigService.getClassConfig(classId, req.user.id);

      if (!config) {
        ApiResponseHelper.notFound(res, 'Configuration de moyenne non trouvée');
        return;
      }

      ApiResponseHelper.success(res, config, 'Configuration de moyenne récupérée avec succès');
    } catch (error) {
      Logger.error('Get class average config failed', error);
      ApiResponseHelper.serverError(res, 'Erreur lors de la récupération de la configuration de moyenne');
    }
  };

  createOrUpdateConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const configData: CreateClassAverageConfigData = req.body;

      // Validation basique
      if (!configData.classId || isNaN(configData.classId)) {
        ApiResponseHelper.error(res, 'ID de classe invalide', 400);
        return;
      }

      if (!configData.divisor || configData.divisor <= 0) {
        ApiResponseHelper.error(res, 'Le diviseur doit être un nombre positif', 400);
        return;
      }

      if (!configData.formula || configData.formula.trim().length === 0) {
        ApiResponseHelper.error(res, 'La formule ne peut pas être vide', 400);
        return;
      }

      Logger.info('Creating or updating class average config', { 
        userId: req.user.id, 
        classId: configData.classId,
        divisor: configData.divisor
      });

      const config = await this.classAverageConfigService.createOrUpdateConfig(req.user.id, configData);

      ApiResponseHelper.success(
        res,
        config,
        'Configuration de moyenne sauvegardée avec succès',
        201
      );
    } catch (error) {
      Logger.error('Create or update class average config failed', error);
      
      if (error instanceof Error) {
        ApiResponseHelper.error(res, error.message, 400);
      } else {
        ApiResponseHelper.serverError(res, 'Erreur lors de la sauvegarde de la configuration de moyenne');
      }
    }
  };

  deleteConfig = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const configId = parseInt(req.params.id);
      
      if (isNaN(configId)) {
        ApiResponseHelper.error(res, 'ID de configuration invalide', 400);
        return;
      }

      Logger.info('Deleting class average config', { 
        configId, 
        userId: req.user.id 
      });

      await this.classAverageConfigService.deleteConfig(configId, req.user.id);

      ApiResponseHelper.success(res, null, 'Configuration de moyenne supprimée avec succès');
    } catch (error) {
      Logger.error('Delete class average config failed', error);
      
      if (error instanceof Error) {
        ApiResponseHelper.error(res, error.message, 400);
      } else {
        ApiResponseHelper.serverError(res, 'Erreur lors de la suppression de la configuration de moyenne');
      }
    }
  };

  deleteConfigByClass = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const classId = parseInt(req.params.classId);
      
      if (isNaN(classId)) {
        ApiResponseHelper.error(res, 'ID de classe invalide', 400);
        return;
      }

      Logger.info('Deleting class average config by class', { 
        classId, 
        userId: req.user.id 
      });

      await this.classAverageConfigService.deleteConfigByClass(classId, req.user.id);

      ApiResponseHelper.success(res, null, 'Configuration de moyenne supprimée avec succès');
    } catch (error) {
      Logger.error('Delete class average config by class failed', error);
      
      if (error instanceof Error) {
        ApiResponseHelper.error(res, error.message, 400);
      } else {
        ApiResponseHelper.serverError(res, 'Erreur lors de la suppression de la configuration de moyenne');
      }
    }
  };
}
