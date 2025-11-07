import { Request, Response } from 'express';
import { SubjectService } from '../services/subjectService';
import { ApiResponseHelper } from '../utils/response';
import { Logger } from '../utils/logger';
import { prisma } from '../lib/prisma';
import type { CreateSubjectData, UpdateSubjectData, SubjectFilters } from '@edustats/shared';

export class SubjectController {
  private subjectService: SubjectService;

  constructor() {
    this.subjectService = new SubjectService(prisma);
  }

  getSubjects = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const filters: SubjectFilters = {
        classId: req.query.classId ? parseInt(req.query.classId as string) : undefined,
        search: req.query.search as string,
      };

      Logger.info('Fetching subjects for user', { 
        userId: req.user.id, 
        filters 
      });

      const subjects = await this.subjectService.getUserSubjects(req.user.id, filters);

      ApiResponseHelper.success(
        res,
        {
          subjects,
          total: subjects.length,
        },
        'Matières récupérées avec succès'
      );
    } catch (error) {
      Logger.error('Get subjects failed', error);
      ApiResponseHelper.serverError(res, 'Erreur lors de la récupération des matières');
    }
  };

  getSubjectById = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const subjectId = parseInt(req.params.id);
      
      if (isNaN(subjectId)) {
        ApiResponseHelper.error(res, 'ID de matière invalide', 400);
        return;
      }

      Logger.info('Fetching subject by ID', { 
        subjectId, 
        userId: req.user.id 
      });

      const subject = await this.subjectService.getSubjectById(subjectId, req.user.id);

      if (!subject) {
        ApiResponseHelper.notFound(res, 'Matière non trouvée');
        return;
      }

      ApiResponseHelper.success(res, subject, 'Matière récupérée avec succès');
    } catch (error) {
      Logger.error('Get subject by ID failed', error);
      ApiResponseHelper.serverError(res, 'Erreur lors de la récupération de la matière');
    }
  };

  createSubject = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const subjectData: CreateSubjectData = req.body;

      Logger.info('Creating new subject', { 
        userId: req.user.id, 
        subjectName: subjectData.name,
        classId: subjectData.classId
      });

      const newSubject = await this.subjectService.createSubject(req.user.id, subjectData);

      ApiResponseHelper.success(
        res,
        newSubject,
        'Matière créée avec succès',
        201
      );
    } catch (error) {
      Logger.error('Create subject failed', error);
      
      if (error instanceof Error) {
        ApiResponseHelper.error(res, error.message, 400);
      } else {
        ApiResponseHelper.serverError(res, 'Erreur lors de la création de la matière');
      }
    }
  };

  updateSubject = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const subjectId = parseInt(req.params.id);
      
      if (isNaN(subjectId)) {
        ApiResponseHelper.error(res, 'ID de matière invalide', 400);
        return;
      }

      const updateData: UpdateSubjectData = req.body;

      Logger.info('Updating subject', { 
        subjectId, 
        userId: req.user.id 
      });

      const updatedSubject = await this.subjectService.updateSubject(
        subjectId, 
        req.user.id, 
        updateData
      );

      ApiResponseHelper.success(res, updatedSubject, 'Matière mise à jour avec succès');
    } catch (error) {
      Logger.error('Update subject failed', error);
      
      if (error instanceof Error) {
        ApiResponseHelper.error(res, error.message, 400);
      } else {
        ApiResponseHelper.serverError(res, 'Erreur lors de la mise à jour de la matière');
      }
    }
  };

  deleteSubject = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const subjectId = parseInt(req.params.id);
      
      if (isNaN(subjectId)) {
        ApiResponseHelper.error(res, 'ID de matière invalide', 400);
        return;
      }

      Logger.info('Deleting subject', { 
        subjectId, 
        userId: req.user.id 
      });

      await this.subjectService.deleteSubject(subjectId, req.user.id);

      ApiResponseHelper.success(res, null, 'Matière supprimée avec succès');
    } catch (error) {
      Logger.error('Delete subject failed', error);
      
      if (error instanceof Error) {
        ApiResponseHelper.error(res, error.message, 400);
      } else {
        ApiResponseHelper.serverError(res, 'Erreur lors de la suppression de la matière');
      }
    }
  };
}
