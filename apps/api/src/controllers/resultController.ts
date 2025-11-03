// ========================================
// CONTROLLER DE GESTION DES RÉSULTATS
// ========================================

import { Request, Response, NextFunction } from 'express';
import { ResultService } from '../services/resultService';
import { CalculationService } from '../services/calculationService';
import { AuthenticatedRequest, ApiResponse } from '../types/express';
import { 
  EvaluationResultInput, 
  BulkEvaluationResultInput,
  AbsentReason
} from '@edustats/shared';
import { Logger } from '../utils/logger';

export class ResultController {
  constructor(
    private resultService: ResultService,
    private calculationService: CalculationService
  ) {
    // Binding automatique des méthodes
    this.getEvaluationResults = this.getEvaluationResults.bind(this);
    this.getResultById = this.getResultById.bind(this);
    this.updateSingleResult = this.updateSingleResult.bind(this);
    this.updateBulkResults = this.updateBulkResults.bind(this);
    this.updateAbsentStatus = this.updateAbsentStatus.bind(this);
    this.clearEvaluationResults = this.clearEvaluationResults.bind(this);
    this.getResultHistory = this.getResultHistory.bind(this);
    this.getEvaluationHistory = this.getEvaluationHistory.bind(this);
    this.importResults = this.importResults.bind(this);
    this.exportResults = this.exportResults.bind(this);
  }

  // ========================================
  // RÉCUPÉRATION DES RÉSULTATS
  // ========================================

  async getEvaluationResults(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const evaluationId = parseInt(req.params.evaluationId);
      const userId = req.user.id;
      const query = req.query as any;

      Logger.info('Récupération résultats évaluation', {
        evaluationId,
        userId,
        options: {
          includeInactive: query.includeInactive,
          orderBy: query.orderBy,
          order: query.order
        },
        requestId: req.requestId
      });

      const results = await this.resultService.getEvaluationResults(
        evaluationId,
        userId,
        {
          includeInactive: query.includeInactive,
          orderBy: query.orderBy || 'name',
          order: query.order || 'asc'
        }
      );

      Logger.info('Résultats récupérés', {
        evaluationId,
        resultsCount: results.length,
        userId,
        requestId: req.requestId
      });

      res.status(200).json({
        success: true,
        data: results,
        message: 'Résultats récupérés avec succès',
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        duration: req.startTime ? Date.now() - req.startTime : undefined
      });
    } catch (error) {
      Logger.error('Erreur récupération résultats évaluation', {
        error: (error as Error).message,
        evaluationId: req.params.evaluationId,
        userId: req.user.id,
        requestId: req.requestId
      });
      next(error);
    }
  }

  async getResultById(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const resultId = parseInt(req.params.resultId);
      const userId = req.user.id;

      Logger.info('Récupération résultat par ID', {
        resultId,
        userId,
        requestId: req.requestId
      });

      const result = await this.resultService.getResultById(resultId, userId);

      if (!result) {
        res.status(404).json({
          success: false,
          message: 'Résultat non trouvé',
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        });
        return;
      }

      Logger.info('Résultat récupéré par ID', {
        resultId,
        studentId: result.studentId,
        evaluationId: result.evaluationId,
        userId,
        requestId: req.requestId
      });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Résultat récupéré avec succès',
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        duration: req.startTime ? Date.now() - req.startTime : undefined
      });
    } catch (error) {
      Logger.error('Erreur récupération résultat par ID', {
        error: (error as Error).message,
        resultId: req.params.resultId,
        userId: req.user.id,
        requestId: req.requestId
      });
      next(error);
    }
  }

  // ========================================
  // MODIFICATION DES RÉSULTATS
  // ========================================

  async updateSingleResult(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const evaluationId = parseInt(req.params.evaluationId);
      const studentId = parseInt(req.params.studentId);
      const userId = req.user.id;
      const data = req.validatedData as Partial<EvaluationResultInput>;

      Logger.info('Modification résultat individuel', {
        evaluationId,
        studentId,
        userId,
        changes: Object.keys(data),
        hasScore: data.score !== undefined,
        isAbsent: data.isAbsent,
        requestId: req.requestId
      });

      const result = await this.resultService.createOrUpdateResult(
        evaluationId,
        studentId,
        {
          score: data.score,
          isAbsent: data.isAbsent || false,
          absentReason: data.absentReason,
          notes: data.notes
        },
        userId
      );

      Logger.info('Résultat individuel modifié', {
        evaluationId,
        studentId,
        newScore: result.score,
        userId,
        requestId: req.requestId
      });

      res.status(200).json({
        success: true,
        data: result,
        message: 'Résultat mis à jour avec succès',
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        duration: req.startTime ? Date.now() - req.startTime : undefined
      });
    } catch (error) {
      Logger.error('Erreur modification résultat individuel', {
        error: (error as Error).message,
        evaluationId: req.params.evaluationId,
        studentId: req.params.studentId,
        userId: req.user.id,
        requestId: req.requestId
      });
      next(error);
    }
  }

  async updateBulkResults(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const evaluationId = parseInt(req.params.evaluationId);
      const userId = req.user.id;
      const data = req.validatedData as BulkEvaluationResultInput;

      Logger.info('Modification bulk résultats', {
        evaluationId,
        userId,
        resultsCount: data.results.length,
        recalculate: data.recalculate,
        validateAll: data.validateAll,
        requestId: req.requestId
      });

      const result = await this.resultService.bulkCreateOrUpdateResults(
        evaluationId,
        data.results,
        userId,
        {
          recalculate: data.recalculate,
          validateAll: data.validateAll,
          skipErrors: false
        }
      );

      Logger.info('Modification bulk terminée', {
        evaluationId,
        successful: result.successful,
        failed: result.failed,
        userId,
        requestId: req.requestId
      });

      const statusCode = result.failed > 0 ? 207 : 200; // 207 Multi-Status si erreurs partielles

      res.status(statusCode).json({
        success: result.failed === 0,
        data: {
          summary: {
            total: result.successful + result.failed,
            successful: result.successful,
            failed: result.failed
          },
          errors: result.errors,
          warnings: result.warnings
        },
        message: result.failed === 0 
          ? `${result.successful} résultat(s) mis à jour avec succès`
          : `${result.successful} succès, ${result.failed} échec(s)`,
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        duration: req.startTime ? Date.now() - req.startTime : undefined
      });
    } catch (error) {
      Logger.error('Erreur modification bulk résultats', {
        error: (error as Error).message,
        evaluationId: req.params.evaluationId,
        userId: req.user.id,
        requestId: req.requestId
      });
      next(error);
    }
  }

  async updateAbsentStatus(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const evaluationId = parseInt(req.params.evaluationId);
      const studentId = parseInt(req.params.studentId);
      const userId = req.user.id;
      const { isAbsent, absentReason } = req.body;

      Logger.info('Modification statut absence', {
        evaluationId,
        studentId,
        isAbsent,
        absentReason,
        userId,
        requestId: req.requestId
      });

      // Récupérer d'abord le résultat existant
      const existingResults = await this.resultService.getEvaluationResults(
        evaluationId,
        userId
      );
      
      const existingResult = existingResults.find(r => r.studentId === studentId);
      if (!existingResult) {
        res.status(404).json({
          success: false,
          message: 'Résultat non trouvé pour cet élève',
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const updatedResult = await this.resultService.updateAbsentStatus(
        existingResult.id,
        isAbsent,
        absentReason as AbsentReason,
        userId
      );

      Logger.info('Statut absence modifié', {
        evaluationId,
        studentId,
        isAbsent,
        userId,
        requestId: req.requestId
      });

      res.status(200).json({
        success: true,
        data: updatedResult,
        message: 'Statut d\'absence mis à jour avec succès',
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        duration: req.startTime ? Date.now() - req.startTime : undefined
      });
    } catch (error) {
      Logger.error('Erreur modification statut absence', {
        error: (error as Error).message,
        evaluationId: req.params.evaluationId,
        studentId: req.params.studentId,
        userId: req.user.id,
        requestId: req.requestId
      });
      next(error);
    }
  }

  // ========================================
  // OPÉRATIONS EN LOT
  // ========================================

  async clearEvaluationResults(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const evaluationId = parseInt(req.params.evaluationId);
      const userId = req.user.id;
      const { keepAbsences, reason } = req.body;

      Logger.warn('Suppression résultats évaluation', {
        evaluationId,
        userId,
        keepAbsences,
        reason,
        requestId: req.requestId
      });

      const result = await this.resultService.clearEvaluationResults(
        evaluationId,
        userId,
        {
          keepAbsences: keepAbsences || false,
          reason: reason || 'Suppression manuelle des résultats'
        }
      );

      Logger.warn('Résultats supprimés', {
        evaluationId,
        deletedCount: result.deletedCount,
        userId,
        requestId: req.requestId
      });

      res.status(200).json({
        success: true,
        data: result,
        message: `${result.deletedCount} résultat(s) supprimé(s) avec succès`,
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        duration: req.startTime ? Date.now() - req.startTime : undefined
      });
    } catch (error) {
      Logger.error('Erreur suppression résultats évaluation', {
        error: (error as Error).message,
        evaluationId: req.params.evaluationId,
        userId: req.user.id,
        requestId: req.requestId
      });
      next(error);
    }
  }

  // ========================================
  // HISTORIQUE DES MODIFICATIONS
  // ========================================

  async getResultHistory(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const evaluationId = parseInt(req.params.evaluationId);
      const studentId = parseInt(req.params.studentId);
      const userId = req.user.id;

      Logger.info('Récupération historique résultat', {
        evaluationId,
        studentId,
        userId,
        requestId: req.requestId
      });

      const history = await this.resultService.getStudentResults(
        studentId,
        evaluationId,
        userId
      );

      Logger.info('Historique résultat récupéré', {
        evaluationId,
        studentId,
        entriesCount: history.length,
        userId,
        requestId: req.requestId
      });

      res.status(200).json({
        success: true,
        data: history,
        message: 'Historique récupéré avec succès',
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        duration: req.startTime ? Date.now() - req.startTime : undefined
      });
    } catch (error) {
      Logger.error('Erreur récupération historique résultat', {
        error: (error as Error).message,
        evaluationId: req.params.evaluationId,
        studentId: req.params.studentId,
        userId: req.user.id,
        requestId: req.requestId
      });
      next(error);
    }
  }

  async getEvaluationHistory(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const evaluationId = parseInt(req.params.evaluationId);
      const userId = req.user.id;

      Logger.info('Récupération historique évaluation', {
        evaluationId,
        userId,
        requestId: req.requestId
      });

      // Cette méthode devrait être implémentée dans ResultService
      // Pour le moment, retourner une réponse vide
      res.status(501).json({
        success: false,
        message: 'Fonctionnalité d\'historique non encore implémentée',
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      Logger.error('Erreur récupération historique évaluation', {
        error: (error as Error).message,
        evaluationId: req.params.evaluationId,
        userId: req.user.id,
        requestId: req.requestId
      });
      next(error);
    }
  }

  // ========================================
  // IMPORT / EXPORT
  // ========================================

  async importResults(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const evaluationId = parseInt(req.params.evaluationId);
      const userId = req.user.id;
      const { data: importData, mapping } = req.body;

      Logger.info('Import résultats demandé', {
        evaluationId,
        userId,
        dataCount: importData?.length,
        mapping,
        requestId: req.requestId
      });

      const result = await this.resultService.importResults(
        evaluationId,
        importData,
        userId,
        mapping
      );

      Logger.info('Import résultats terminé', {
        evaluationId,
        successful: result.successful,
        failed: result.failed,
        userId,
        requestId: req.requestId
      });

      const statusCode = result.failed > 0 ? 207 : 200;

      res.status(statusCode).json({
        success: result.failed === 0,
        data: result,
        message: result.failed === 0
          ? `${result.successful} résultat(s) importé(s) avec succès`
          : `${result.successful} succès, ${result.failed} échec(s)`,
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        duration: req.startTime ? Date.now() - req.startTime : undefined
      });
    } catch (error) {
      Logger.error('Erreur import résultats', {
        error: (error as Error).message,
        evaluationId: req.params.evaluationId,
        userId: req.user.id,
        requestId: req.requestId
      });
      next(error);
    }
  }

  async exportResults(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const evaluationId = parseInt(req.params.evaluationId);
      const userId = req.user.id;
      const { format, includeStats, template } = req.query as any;

      Logger.info('Export résultats demandé', {
        evaluationId,
        userId,
        format,
        includeStats,
        template,
        requestId: req.requestId
      });

      // Cette fonctionnalité devrait être implémentée dans ResultService
      // Pour le moment, retourner une erreur non implémentée
      res.status(501).json({
        success: false,
        message: 'Fonctionnalité d\'export non encore implémentée',
        requestId: req.requestId,
        timestamp: new Date().toISOString()
      });
    } catch (error) {
      Logger.error('Erreur export résultats', {
        error: (error as Error).message,
        evaluationId: req.params.evaluationId,
        userId: req.user.id,
        requestId: req.requestId
      });
      next(error);
    }
  }

  // ========================================
  // RECALCUL ET SYNCHRONISATION
  // ========================================

  async recalculateResults(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const evaluationId = parseInt(req.params.evaluationId);
      const userId = req.user.id;

      Logger.info('Recalcul résultats demandé', {
        evaluationId,
        userId,
        requestId: req.requestId
      });

      // Vérifier l'accès à l'évaluation via ResultService
      const results = await this.resultService.getEvaluationResults(
        evaluationId,
        userId
      );

      if (results.length === 0) {
        res.status(404).json({
          success: false,
          message: 'Aucun résultat trouvé pour cette évaluation',
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Effectuer le recalcul
      await this.calculationService.recalculateEvaluation(evaluationId);

      Logger.info('Recalcul résultats terminé', {
        evaluationId,
        userId,
        requestId: req.requestId
      });

      res.status(200).json({
        success: true,
        message: 'Recalcul effectué avec succès',
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        duration: req.startTime ? Date.now() - req.startTime : undefined
      });
    } catch (error) {
      Logger.error('Erreur recalcul résultats', {
        error: (error as Error).message,
        evaluationId: req.params.evaluationId,
        userId: req.user.id,
        requestId: req.requestId
      });
      next(error);
    }
  }

  // ========================================
  // STATISTIQUES DES RÉSULTATS
  // ========================================

  async getResultsStatistics(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const evaluationId = parseInt(req.params.evaluationId);
      const userId = req.user.id;

      Logger.info('Statistiques résultats demandées', {
        evaluationId,
        userId,
        requestId: req.requestId
      });

      const stats = await this.calculationService.calculateFullStatistics(evaluationId);

      Logger.info('Statistiques résultats calculées', {
        evaluationId,
        totalStudents: stats.totalStudents,
        averageScore: stats.averageScore,
        userId,
        requestId: req.requestId
      });

      res.status(200).json({
        success: true,
        data: stats,
        message: 'Statistiques calculées avec succès',
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        duration: req.startTime ? Date.now() - req.startTime : undefined
      });
    } catch (error) {
      Logger.error('Erreur calcul statistiques résultats', {
        error: (error as Error).message,
        evaluationId: req.params.evaluationId,
        userId: req.user.id,
        requestId: req.requestId
      });
      next(error);
    }
  }
}
