import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { SchoolYearService } from '../services/schoolYearService';
import { Logger } from '../utils/logger';
import { createSchoolYearSchema, updateSchoolYearSchema } from '@edustats/shared';

export class SchoolYearController {
  private schoolYearService: SchoolYearService;

  constructor(prisma: PrismaClient) {
    this.schoolYearService = new SchoolYearService(prisma);
  }
  /**
   * Créer une nouvelle année scolaire
   * POST /api/school-years
   */
  async create(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié',
        });
        return;
      }

      // Validation des données
      const validated = createSchoolYearSchema.parse(req.body);

      const schoolYear = await this.schoolYearService.create(userId, validated);

      res.status(201).json({
        success: true,
        message: 'Année scolaire créée avec succès',
        schoolYear,
      });
    } catch (error: any) {
      Logger.error('Error in SchoolYearController.create', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur lors de la création de l\'année scolaire',
      });
    }
  }

  /**
   * Récupérer toutes les années scolaires
   * GET /api/school-years
   */
  async getAll(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié',
        });
        return;
      }

      const schoolYears = await this.schoolYearService.getAllByUser(userId);
      const activeSchoolYear = await this.schoolYearService.getActive(userId);

      res.json({
        success: true,
        schoolYears,
        activeSchoolYear,
      });
    } catch (error: any) {
      Logger.error('Error in SchoolYearController.getAll', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération des années scolaires',
      });
    }
  }

  /**
   * Récupérer l'année scolaire active
   * GET /api/school-years/active
   */
  async getActive(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié',
        });
        return;
      }

      const activeSchoolYear = await this.schoolYearService.getActive(userId);

      if (!activeSchoolYear) {
        res.status(404).json({
          success: false,
          message: 'Aucune année scolaire active',
        });
        return;
      }

      res.json({
        success: true,
        schoolYear: activeSchoolYear,
      });
    } catch (error: any) {
      Logger.error('Error in SchoolYearController.getActive', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'année scolaire active',
      });
    }
  }

  /**
   * Récupérer une année scolaire par ID
   * GET /api/school-years/:id
   */
  async getById(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié',
        });
        return;
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'ID invalide',
        });
        return;
      }

      const schoolYear = await this.schoolYearService.getById(id, userId);

      if (!schoolYear) {
        res.status(404).json({
          success: false,
          message: 'Année scolaire non trouvée',
        });
        return;
      }

      res.json({
        success: true,
        schoolYear,
      });
    } catch (error: any) {
      Logger.error('Error in SchoolYearController.getById', error);
      res.status(500).json({
        success: false,
        message: 'Erreur lors de la récupération de l\'année scolaire',
      });
    }
  }

  /**
   * Mettre à jour une année scolaire
   * PUT /api/school-years/:id
   */
  async update(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié',
        });
        return;
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'ID invalide',
        });
        return;
      }

      // Validation des données
      const validated = updateSchoolYearSchema.parse(req.body);

      const schoolYear = await this.schoolYearService.update(id, userId, validated);

      res.json({
        success: true,
        message: 'Année scolaire mise à jour avec succès',
        schoolYear,
      });
    } catch (error: any) {
      Logger.error('Error in SchoolYearController.update', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur lors de la mise à jour de l\'année scolaire',
      });
    }
  }

  /**
   * Activer une année scolaire
   * POST /api/school-years/:id/activate
   */
  async activate(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié',
        });
        return;
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'ID invalide',
        });
        return;
      }

      const schoolYear = await this.schoolYearService.setActive(id, userId);

      res.json({
        success: true,
        message: 'Année scolaire activée avec succès',
        schoolYear,
      });
    } catch (error: any) {
      Logger.error('Error in SchoolYearController.activate', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur lors de l\'activation de l\'année scolaire',
      });
    }
  }

  /**
   * Supprimer une année scolaire
   * DELETE /api/school-years/:id
   */
  async delete(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      if (!userId) {
        res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié',
        });
        return;
      }

      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        res.status(400).json({
          success: false,
          message: 'ID invalide',
        });
        return;
      }

      await this.schoolYearService.delete(id, userId);

      res.json({
        success: true,
        message: 'Année scolaire supprimée avec succès',
      });
    } catch (error: any) {
      Logger.error('Error in SchoolYearController.delete', error);
      res.status(400).json({
        success: false,
        message: error.message || 'Erreur lors de la suppression de l\'année scolaire',
      });
    }
  }
}

