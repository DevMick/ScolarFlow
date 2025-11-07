import { Request, Response } from 'express';
import { EvaluationFormulaService } from '../services/evaluationFormulaService';
import { ApiResponseHelper } from '../utils/response';
import { Logger } from '../utils/logger';
import { prisma } from '../lib/prisma';
import type { CreateEvaluationFormulaData, UpdateEvaluationFormulaData } from '@edustats/shared';

export class EvaluationFormulaController {
  private evaluationFormulaService: EvaluationFormulaService;

  constructor() {
    this.evaluationFormulaService = new EvaluationFormulaService(prisma);
  }

  getFormulas = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      Logger.info('Fetching evaluation formulas for user', { 
        userId: req.user.id
      });

      const formulas = await this.evaluationFormulaService.getUserFormulas(req.user.id);

      ApiResponseHelper.success(
        res,
        {
          formulas,
          total: formulas.length,
        },
        'Formules d\'évaluation récupérées avec succès'
      );
    } catch (error) {
      Logger.error('Get evaluation formulas failed', error);
      ApiResponseHelper.serverError(res, 'Erreur lors de la récupération des formules d\'évaluation');
    }
  };

  getFormulaById = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const formulaId = parseInt(req.params.id);
      
      if (isNaN(formulaId)) {
        ApiResponseHelper.error(res, 'ID de formule invalide', 400);
        return;
      }

      Logger.info('Fetching evaluation formula by ID', { 
        formulaId, 
        userId: req.user.id 
      });

      const formula = await this.evaluationFormulaService.getFormulaById(formulaId, req.user.id);

      if (!formula) {
        ApiResponseHelper.notFound(res, 'Formule d\'évaluation non trouvée');
        return;
      }

      ApiResponseHelper.success(res, formula, 'Formule d\'évaluation récupérée avec succès');
    } catch (error) {
      Logger.error('Get evaluation formula by ID failed', error);
      ApiResponseHelper.serverError(res, 'Erreur lors de la récupération de la formule d\'évaluation');
    }
  };

  createFormula = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const formulaData: CreateEvaluationFormulaData = req.body;

      Logger.info('Creating new evaluation formula', { 
        userId: req.user.id, 
        formula: formulaData.formula
      });

      const newFormula = await this.evaluationFormulaService.createFormula(req.user.id, formulaData);

      ApiResponseHelper.success(
        res,
        newFormula,
        'Formule d\'évaluation créée avec succès',
        201
      );
    } catch (error) {
      Logger.error('Create evaluation formula failed', error);
      
      if (error instanceof Error) {
        ApiResponseHelper.error(res, error.message, 400);
      } else {
        ApiResponseHelper.serverError(res, 'Erreur lors de la création de la formule d\'évaluation');
      }
    }
  };

  updateFormula = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const formulaId = parseInt(req.params.id);
      
      if (isNaN(formulaId)) {
        ApiResponseHelper.error(res, 'ID de formule invalide', 400);
        return;
      }

      const updateData: UpdateEvaluationFormulaData = req.body;

      Logger.info('Updating evaluation formula', { 
        formulaId, 
        userId: req.user.id 
      });

      const updatedFormula = await this.evaluationFormulaService.updateFormula(
        formulaId, 
        req.user.id, 
        updateData
      );

      ApiResponseHelper.success(res, updatedFormula, 'Formule d\'évaluation mise à jour avec succès');
    } catch (error) {
      Logger.error('Update evaluation formula failed', error);
      
      if (error instanceof Error) {
        ApiResponseHelper.error(res, error.message, 400);
      } else {
        ApiResponseHelper.serverError(res, 'Erreur lors de la mise à jour de la formule d\'évaluation');
      }
    }
  };

  deleteFormula = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const formulaId = parseInt(req.params.id);
      
      if (isNaN(formulaId)) {
        ApiResponseHelper.error(res, 'ID de formule invalide', 400);
        return;
      }

      Logger.info('Deleting evaluation formula', { 
        formulaId, 
        userId: req.user.id 
      });

      await this.evaluationFormulaService.deleteFormula(formulaId, req.user.id);

      ApiResponseHelper.success(res, null, 'Formule d\'évaluation supprimée avec succès');
    } catch (error) {
      Logger.error('Delete evaluation formula failed', error);
      
      if (error instanceof Error) {
        ApiResponseHelper.error(res, error.message, 400);
      } else {
        ApiResponseHelper.serverError(res, 'Erreur lors de la suppression de la formule d\'évaluation');
      }
    }
  };
}
