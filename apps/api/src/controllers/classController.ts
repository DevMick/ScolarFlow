import { Request, Response } from 'express';
import { ClassService } from '../services/classService';
import { ApiResponseHelper } from '../utils/response';
import { Logger } from '../utils/logger';
import { prisma } from '../server';
import type { CreateClassData, UpdateClassData, ClassFilters } from '@edustats/shared';
import { z } from 'zod';

export class ClassController {
  private classService: ClassService;

  constructor() {
    this.classService = new ClassService(prisma);
  }

  getClasses = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const filters: ClassFilters = {
        search: req.query.search as string,
      };

      Logger.info('Fetching classes for user', { 
        userId: req.user.id, 
        filters 
      });

      const classes = await this.classService.getUserClasses(req.user.id, filters);

      ApiResponseHelper.success(
        res,
        {
          classes,
          total: classes.length,
        },
        'Classes récupérées avec succès'
      );
    } catch (error) {
      Logger.error('Get classes failed', error);
      ApiResponseHelper.serverError(res, 'Erreur lors de la récupération des classes');
    }
  };

  getClassById = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const classId = parseInt(req.params.id);
      
      if (isNaN(classId)) {
        ApiResponseHelper.error(res, 'ID de classe invalide', 400);
        return;
      }

      Logger.info('Fetching class by ID', { 
        classId, 
        userId: req.user.id 
      });

      const classData = await this.classService.getClassById(classId, req.user.id);

      if (!classData) {
        ApiResponseHelper.notFound(res, 'Classe non trouvée');
        return;
      }

      ApiResponseHelper.success(res, classData, 'Classe récupérée avec succès');
    } catch (error) {
      Logger.error('Get class by ID failed', error);
      ApiResponseHelper.serverError(res, 'Erreur lors de la récupération de la classe');
    }
  };

  createClass = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const classData: CreateClassData = req.body;

      Logger.info('Creating new class', { 
        userId: req.user.id, 
        className: classData.name 
      });

      const newClass = await this.classService.createClass(req.user.id, classData);

      ApiResponseHelper.success(
        res,
        newClass,
        'Classe créée avec succès',
        201
      );
    } catch (error) {
      Logger.error('Create class failed', error);
      
      if (error instanceof Error) {
        ApiResponseHelper.error(res, error.message, 400);
      } else {
        ApiResponseHelper.serverError(res, 'Erreur lors de la création de la classe');
      }
    }
  };

  updateClass = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const classId = parseInt(req.params.id);
      
      if (isNaN(classId)) {
        ApiResponseHelper.error(res, 'ID de classe invalide', 400);
        return;
      }

      const updateData: UpdateClassData = req.body;

      Logger.info('Updating class', { 
        classId, 
        userId: req.user.id 
      });

      const updatedClass = await this.classService.updateClass(
        classId, 
        req.user.id, 
        updateData
      );

      ApiResponseHelper.success(res, updatedClass, 'Classe mise à jour avec succès');
    } catch (error) {
      Logger.error('Update class failed', error);
      
      if (error instanceof Error) {
        ApiResponseHelper.error(res, error.message, 400);
      } else {
        ApiResponseHelper.serverError(res, 'Erreur lors de la mise à jour de la classe');
      }
    }
  };

  deleteClass = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const classId = parseInt(req.params.id);
      
      if (isNaN(classId)) {
        ApiResponseHelper.error(res, 'ID de classe invalide', 400);
        return;
      }

      Logger.info('Deleting class', { 
        classId, 
        userId: req.user.id 
      });

      await this.classService.deleteClass(classId, req.user.id);

      ApiResponseHelper.success(res, null, 'Classe supprimée avec succès');
    } catch (error) {
      Logger.error('Delete class failed', error);
      
      if (error instanceof Error) {
        ApiResponseHelper.error(res, error.message, 400);
      } else {
        ApiResponseHelper.serverError(res, 'Erreur lors de la suppression de la classe');
      }
    }
  };

  getAcademicYears = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const years = await this.classService.getAcademicYears();

      ApiResponseHelper.success(
        res,
        years,
        'Années académiques récupérées avec succès'
      );
    } catch (error) {
      Logger.error('Get academic years failed', error);
      ApiResponseHelper.serverError(res, 'Erreur lors de la récupération des années académiques');
    }
  };
}
