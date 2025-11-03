// ========================================
// CONTROLLER DE CALCULS ET STATISTIQUES
// ========================================

import { Request, Response, NextFunction } from 'express';
import { CalculationService } from '../services/calculationService';
import { EvaluationService } from '../services/evaluationService';
import { AuthenticatedRequest, ApiResponse } from '../types/express';
import { Logger } from '../utils/logger';

export class CalculationController {
  constructor(
    private calculationService: CalculationService,
    private evaluationService: EvaluationService
  ) {
    // Binding automatique des méthodes
    this.recalculateEvaluation = this.recalculateEvaluation.bind(this);
    this.getRanking = this.getRanking.bind(this);
    this.getBasicStatistics = this.getBasicStatistics.bind(this);
    this.getFullStatistics = this.getFullStatistics.bind(this);
    this.generateReport = this.generateReport.bind(this);
    this.detectAnomalies = this.detectAnomalies.bind(this);
    this.getDistribution = this.getDistribution.bind(this);
    this.compareEvaluations = this.compareEvaluations.bind(this);
    this.getClassSummary = this.getClassSummary.bind(this);
  }

  // ========================================
  // RECALCUL D'ÉVALUATION
  // ========================================

  async recalculateEvaluation(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const evaluationId = parseInt(req.params.id);
      const userId = req.user.id;
      const { force } = req.body;

      Logger.info('Recalcul évaluation demandé', {
        evaluationId,
        userId,
        force,
        requestId: req.requestId
      });

      // Vérifier l'accès à l'évaluation
      const evaluation = await this.evaluationService.getEvaluationById(
        evaluationId,
        userId
      );

      if (!evaluation) {
        res.status(404).json({
          success: false,
          message: 'Évaluation non trouvée',
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        });
        return;
      }

      if (evaluation.isFinalized && !force) {
        res.status(403).json({
          success: false,
          message: 'Impossible de recalculer une évaluation finalisée sans forcer',
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Effectuer le recalcul
      await this.calculationService.recalculateEvaluation(evaluationId);

      Logger.info('Recalcul évaluation terminé', {
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
      Logger.error('Erreur recalcul évaluation', {
        error: (error as Error).message,
        evaluationId: req.params.id,
        userId: req.user.id,
        requestId: req.requestId
      });
      next(error);
    }
  }

  // ========================================
  // CLASSEMENT
  // ========================================

  async getRanking(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const evaluationId = parseInt(req.params.id);
      const userId = req.user.id;
      const { limit, includeNonRanked } = req.query as any;

      Logger.info('Classement demandé', {
        evaluationId,
        userId,
        limit: limit ? parseInt(limit) : undefined,
        includeNonRanked,
        requestId: req.requestId
      });

      // Vérifier l'accès à l'évaluation
      const evaluation = await this.evaluationService.getEvaluationById(
        evaluationId,
        userId
      );

      if (!evaluation) {
        res.status(404).json({
          success: false,
          message: 'Évaluation non trouvée',
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Récupérer le classement
      let ranking = await this.calculationService.calculateRanking(evaluationId);

      // Filtrer les non-classés si demandé
      if (!includeNonRanked) {
        ranking = ranking.filter(r => r.rank > 0);
      }

      // Limiter les résultats si demandé
      if (limit) {
        const limitNum = parseInt(limit);
        ranking = ranking.slice(0, limitNum);
      }

      Logger.info('Classement calculé', {
        evaluationId,
        totalRanked: ranking.filter(r => r.rank > 0).length,
        totalResults: ranking.length,
        userId,
        requestId: req.requestId
      });

      res.status(200).json({
        success: true,
        data: {
          ranking,
          metadata: {
            evaluationId,
            title: evaluation.title,
            subject: evaluation.subject,
            maxScore: evaluation.maxScore,
            isFinalized: evaluation.isFinalized,
            totalStudents: ranking.length,
            rankedStudents: ranking.filter(r => r.rank > 0).length
          }
        },
        message: 'Classement récupéré avec succès',
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        duration: req.startTime ? Date.now() - req.startTime : undefined
      });
    } catch (error) {
      Logger.error('Erreur récupération classement', {
        error: (error as Error).message,
        evaluationId: req.params.id,
        userId: req.user.id,
        requestId: req.requestId
      });
      next(error);
    }
  }

  // ========================================
  // STATISTIQUES
  // ========================================

  async getBasicStatistics(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const evaluationId = parseInt(req.params.id);
      const userId = req.user.id;

      Logger.info('Statistiques de base demandées', {
        evaluationId,
        userId,
        requestId: req.requestId
      });

      // Vérifier l'accès
      const evaluation = await this.evaluationService.getEvaluationById(
        evaluationId,
        userId
      );

      if (!evaluation) {
        res.status(404).json({
          success: false,
          message: 'Évaluation non trouvée',
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const statistics = await this.calculationService.calculateBasicStats(evaluationId);

      Logger.info('Statistiques de base calculées', {
        evaluationId,
        averageScore: statistics.averageScore,
        completedCount: statistics.completedCount,
        userId,
        requestId: req.requestId
      });

      res.status(200).json({
        success: true,
        data: {
          statistics,
          evaluation: {
            id: evaluation.id,
            title: evaluation.title,
            subject: evaluation.subject,
            maxScore: evaluation.maxScore
          }
        },
        message: 'Statistiques de base récupérées avec succès',
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        duration: req.startTime ? Date.now() - req.startTime : undefined
      });
    } catch (error) {
      Logger.error('Erreur calcul statistiques de base', {
        error: (error as Error).message,
        evaluationId: req.params.id,
        userId: req.user.id,
        requestId: req.requestId
      });
      next(error);
    }
  }

  async getFullStatistics(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const evaluationId = parseInt(req.params.id);
      const userId = req.user.id;

      Logger.info('Statistiques complètes demandées', {
        evaluationId,
        userId,
        requestId: req.requestId
      });

      // Vérifier l'accès
      const evaluation = await this.evaluationService.getEvaluationById(
        evaluationId,
        userId
      );

      if (!evaluation) {
        res.status(404).json({
          success: false,
          message: 'Évaluation non trouvée',
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const statistics = await this.calculationService.calculateFullStatistics(evaluationId);

      Logger.info('Statistiques complètes calculées', {
        evaluationId,
        totalStudents: statistics.totalStudents,
        averageScore: statistics.averageScore,
        userId,
        requestId: req.requestId
      });

      res.status(200).json({
        success: true,
        data: {
          statistics,
          evaluation: {
            id: evaluation.id,
            title: evaluation.title,
            subject: evaluation.subject,
            maxScore: evaluation.maxScore,
            type: evaluation.type,
            isFinalized: evaluation.isFinalized
          }
        },
        message: 'Statistiques complètes récupérées avec succès',
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        duration: req.startTime ? Date.now() - req.startTime : undefined
      });
    } catch (error) {
      Logger.error('Erreur calcul statistiques complètes', {
        error: (error as Error).message,
        evaluationId: req.params.id,
        userId: req.user.id,
        requestId: req.requestId
      });
      next(error);
    }
  }

  // ========================================
  // RAPPORT D'ÉVALUATION
  // ========================================

  async generateReport(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const evaluationId = parseInt(req.params.id);
      const userId = req.user.id;
      const { format, includeCharts, includeRecommendations } = req.query as any;

      Logger.info('Génération rapport demandée', {
        evaluationId,
        userId,
        format,
        includeCharts,
        includeRecommendations,
        requestId: req.requestId
      });

      // Vérifier l'accès
      const evaluation = await this.evaluationService.getEvaluationById(
        evaluationId,
        userId
      );

      if (!evaluation) {
        res.status(404).json({
          success: false,
          message: 'Évaluation non trouvée',
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const report = await this.calculationService.generateEvaluationReport(evaluationId);

      Logger.info('Rapport généré', {
        evaluationId,
        totalStudents: report.overview.totalStudents,
        userId,
        requestId: req.requestId
      });

      res.status(200).json({
        success: true,
        data: {
          evaluation: {
            id: evaluation.id,
            title: evaluation.title,
            subject: evaluation.subject,
            type: evaluation.type,
            maxScore: evaluation.maxScore,
            evaluationDate: evaluation.evaluationDate,
            isFinalized: evaluation.isFinalized
          },
          report,
          generated: {
            timestamp: new Date().toISOString(),
            by: {
              id: userId,
              name: `${req.user.firstName} ${req.user.lastName}`
            },
            options: {
              format: format || 'json',
              includeCharts: includeCharts === 'true',
              includeRecommendations: includeRecommendations === 'true'
            }
          }
        },
        message: 'Rapport généré avec succès',
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        duration: req.startTime ? Date.now() - req.startTime : undefined
      });
    } catch (error) {
      Logger.error('Erreur génération rapport', {
        error: (error as Error).message,
        evaluationId: req.params.id,
        userId: req.user.id,
        requestId: req.requestId
      });
      next(error);
    }
  }

  // ========================================
  // DÉTECTION D'ANOMALIES
  // ========================================

  async detectAnomalies(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const evaluationId = parseInt(req.params.id);
      const userId = req.user.id;
      const { threshold } = req.query as any;

      Logger.info('Détection anomalies demandée', {
        evaluationId,
        userId,
        threshold,
        requestId: req.requestId
      });

      // Vérifier l'accès
      const evaluation = await this.evaluationService.getEvaluationById(
        evaluationId,
        userId
      );

      if (!evaluation) {
        res.status(404).json({
          success: false,
          message: 'Évaluation non trouvée',
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Pour le moment, utiliser une détection d'anomalies simple
      const stats = await this.calculationService.calculateFullStatistics(evaluationId);
      
      const anomalies = [];

      // Anomalie 1: Moyenne très faible
      if (stats.averageOn20 < 5) {
        anomalies.push({
          type: 'low_average',
          severity: 'high',
          message: `Moyenne de classe très faible (${stats.averageOn20}/20)`,
          recommendation: 'Vérifier la difficulté de l\'évaluation ou revoir les notions'
        });
      }

      // Anomalie 2: Moyenne très élevée
      if (stats.averageOn20 > 18) {
        anomalies.push({
          type: 'high_average',
          severity: 'medium',
          message: `Moyenne de classe très élevée (${stats.averageOn20}/20)`,
          recommendation: 'Évaluation peut-être trop facile'
        });
      }

      // Anomalie 3: Écart-type très faible
      if (stats.standardDeviation < 1) {
        anomalies.push({
          type: 'low_discrimination',
          severity: 'medium',
          message: `Écart-type très faible (${stats.standardDeviation})`,
          recommendation: 'Évaluation peu discriminante, diversifier les questions'
        });
      }

      // Anomalie 4: Taux d'absence élevé
      const absentRate = (stats.absentStudents / stats.totalStudents) * 100;
      if (absentRate > 30) {
        anomalies.push({
          type: 'high_absence_rate',
          severity: 'high',
          message: `Taux d'absence élevé (${Math.round(absentRate)}%)`,
          recommendation: 'Vérifier les raisons d\'absence et envisager une reprogrammation'
        });
      }

      Logger.info('Anomalies détectées', {
        evaluationId,
        anomaliesCount: anomalies.length,
        userId,
        requestId: req.requestId
      });

      res.status(200).json({
        success: true,
        data: {
          evaluation: {
            id: evaluation.id,
            title: evaluation.title
          },
          anomalies,
          analysis: {
            totalAnomalies: anomalies.length,
            severity: {
              high: anomalies.filter(a => a.severity === 'high').length,
              medium: anomalies.filter(a => a.severity === 'medium').length,
              low: anomalies.filter(a => a.severity === 'low').length
            }
          },
          statistics: stats
        },
        message: `${anomalies.length} anomalie(s) détectée(s)`,
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        duration: req.startTime ? Date.now() - req.startTime : undefined
      });
    } catch (error) {
      Logger.error('Erreur détection anomalies', {
        error: (error as Error).message,
        evaluationId: req.params.id,
        userId: req.user.id,
        requestId: req.requestId
      });
      next(error);
    }
  }

  // ========================================
  // DISTRIBUTION DES SCORES
  // ========================================

  async getDistribution(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const evaluationId = parseInt(req.params.id);
      const userId = req.user.id;
      const { bins } = req.query as any;

      Logger.info('Distribution scores demandée', {
        evaluationId,
        userId,
        bins: bins ? parseInt(bins) : 5,
        requestId: req.requestId
      });

      // Vérifier l'accès
      const evaluation = await this.evaluationService.getEvaluationById(
        evaluationId,
        userId
      );

      if (!evaluation) {
        res.status(404).json({
          success: false,
          message: 'Évaluation non trouvée',
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        });
        return;
      }

      const stats = await this.calculationService.calculateFullStatistics(evaluationId);

      Logger.info('Distribution calculée', {
        evaluationId,
        bins: stats.distribution.length,
        userId,
        requestId: req.requestId
      });

      res.status(200).json({
        success: true,
        data: {
          evaluation: {
            id: evaluation.id,
            title: evaluation.title,
            maxScore: evaluation.maxScore
          },
          distribution: stats.distribution,
          summary: {
            totalStudents: stats.totalStudents,
            averageScore: stats.averageScore,
            successRate: stats.successRate
          }
        },
        message: 'Distribution des scores récupérée avec succès',
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        duration: req.startTime ? Date.now() - req.startTime : undefined
      });
    } catch (error) {
      Logger.error('Erreur calcul distribution', {
        error: (error as Error).message,
        evaluationId: req.params.id,
        userId: req.user.id,
        requestId: req.requestId
      });
      next(error);
    }
  }

  // ========================================
  // COMPARAISON D'ÉVALUATIONS
  // ========================================

  async compareEvaluations(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const evaluationIds = req.body.evaluationIds as number[];
      const userId = req.user.id;

      if (!evaluationIds || evaluationIds.length < 2) {
        res.status(400).json({
          success: false,
          message: 'Au moins 2 évaluations sont requises pour la comparaison',
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        });
        return;
      }

      Logger.info('Comparaison évaluations demandée', {
        evaluationIds,
        count: evaluationIds.length,
        userId,
        requestId: req.requestId
      });

      // Vérifier l'accès et récupérer les statistiques pour chaque évaluation
      const comparisons = [];

      for (const evaluationId of evaluationIds) {
        const evaluation = await this.evaluationService.getEvaluationById(
          evaluationId,
          userId
        );

        if (!evaluation) {
          res.status(404).json({
            success: false,
            message: `Évaluation ${evaluationId} non trouvée`,
            requestId: req.requestId,
            timestamp: new Date().toISOString()
          });
          return;
        }

        const stats = await this.calculationService.calculateBasicStats(evaluationId);

        comparisons.push({
          evaluation: {
            id: evaluation.id,
            title: evaluation.title,
            subject: evaluation.subject,
            type: evaluation.type,
            maxScore: evaluation.maxScore,
            evaluationDate: evaluation.evaluationDate
          },
          statistics: stats
        });
      }

      Logger.info('Comparaison évaluations calculée', {
        evaluationsCount: comparisons.length,
        userId,
        requestId: req.requestId
      });

      res.status(200).json({
        success: true,
        data: {
          comparisons,
          analysis: {
            bestAverage: comparisons.reduce((best, current) => 
              current.statistics.averageScore > best.statistics.averageScore ? current : best
            ),
            worstAverage: comparisons.reduce((worst, current) => 
              current.statistics.averageScore < worst.statistics.averageScore ? current : worst
            ),
            totalEvaluations: comparisons.length
          }
        },
        message: 'Comparaison des évaluations effectuée avec succès',
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        duration: req.startTime ? Date.now() - req.startTime : undefined
      });
    } catch (error) {
      Logger.error('Erreur comparaison évaluations', {
        error: (error as Error).message,
        evaluationIds: req.body.evaluationIds,
        userId: req.user.id,
        requestId: req.requestId
      });
      next(error);
    }
  }

  // ========================================
  // RÉSUMÉ DE CLASSE
  // ========================================

  async getClassSummary(
    req: AuthenticatedRequest,
    res: Response<ApiResponse>,
    next: NextFunction
  ): Promise<void> {
    try {
      const classId = parseInt(req.params.classId);
      const userId = req.user.id;
      const { period, subject } = req.query as any;

      Logger.info('Résumé classe demandé', {
        classId,
        userId,
        period,
        subject,
        requestId: req.requestId
      });

      // Récupérer toutes les évaluations de la classe
      const evaluationsResult = await this.evaluationService.getClassEvaluations(
        classId,
        userId,
        {
          includeStats: true,
          ...(subject && { subject }),
          limit: 100 // Limite élevée pour avoir toutes les évaluations
        }
      );

      if (evaluationsResult.evaluations.length === 0) {
        res.status(200).json({
          success: true,
          data: {
            classId,
            summary: {
              totalEvaluations: 0,
              averageClassScore: 0,
              subjects: [],
              period: period || 'all'
            }
          },
          message: 'Aucune évaluation trouvée pour cette classe',
          requestId: req.requestId,
          timestamp: new Date().toISOString()
        });
        return;
      }

      // Calculer le résumé
      const evaluations = evaluationsResult.evaluations;
      const totalEvaluations = evaluations.length;
      
      // Grouper par matière
      const subjectGroups = evaluations.reduce((groups, evaluation) => {
        if (!groups[evaluation.subject]) {
          groups[evaluation.subject] = [];
        }
        groups[evaluation.subject].push(evaluation);
        return groups;
      }, {} as Record<string, any[]>);

      const subjects = Object.keys(subjectGroups).map(subject => ({
        name: subject,
        evaluationsCount: subjectGroups[subject].length,
        averageScore: subjectGroups[subject].reduce((sum, evaluation) => 
          sum + (evaluation.averageScore || 0), 0) / subjectGroups[subject].length
      }));

      const overallAverage = evaluations.reduce((sum, evaluation) => 
        sum + (evaluation.averageScore || 0), 0) / totalEvaluations;

      Logger.info('Résumé classe calculé', {
        classId,
        totalEvaluations,
        subjectsCount: subjects.length,
        overallAverage,
        userId,
        requestId: req.requestId
      });

      res.status(200).json({
        success: true,
        data: {
          classId,
          summary: {
            totalEvaluations,
            averageClassScore: Math.round(overallAverage * 100) / 100,
            subjects,
            period: period || 'all',
            dateRange: {
              first: evaluations[evaluations.length - 1]?.evaluationDate,
              last: evaluations[0]?.evaluationDate
            }
          },
          evaluations: evaluations.slice(0, 10) // Les 10 dernières
        },
        message: 'Résumé de classe généré avec succès',
        requestId: req.requestId,
        timestamp: new Date().toISOString(),
        duration: req.startTime ? Date.now() - req.startTime : undefined
      });
    } catch (error) {
      Logger.error('Erreur génération résumé classe', {
        error: (error as Error).message,
        classId: req.params.classId,
        userId: req.user.id,
        requestId: req.requestId
      });
      next(error);
    }
  }
}
