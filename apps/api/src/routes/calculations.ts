// ========================================
// ROUTES API - CALCULS ET STATISTIQUES
// ========================================

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { CalculationController } from '../controllers/calculationController';
import { EvaluationService } from '../services/evaluationService';
import { CalculationService } from '../services/calculationService';
import { ValidationService } from '../services/validationService';
import { authenticateToken } from '../middleware/auth';

export function createCalculationRoutes(prisma: PrismaClient): Router {
  const router = Router();

  // Rate limiting spécifique aux calculs (plus permissif car lecture seule généralement)
  const calculationRateLimit = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 150, // Limite à 150 requêtes par 10 minutes
    message: {
      error: 'Trop de requêtes pour les calculs. Réessayez dans 10 minutes.',
      retryAfter: 10 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Rate limiting pour les recalculs (plus restrictif)
  const recalculationRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 30, // Limite à 30 recalculs par 15 minutes
    message: {
      error: 'Trop de recalculs demandés. Réessayez dans 15 minutes.',
      retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Initialisation des services et contrôleur
  const calculationService = new CalculationService(prisma);
  const validationService = new ValidationService(prisma);
  const evaluationService = new EvaluationService(prisma, calculationService, validationService);
  const calculationController = new CalculationController(calculationService, evaluationService);

  // Appliquer l'authentification et le rate limiting à toutes les routes
  router.use(authenticateToken);
  router.use(calculationRateLimit);

  // ========================================
  // ROUTES CALCULS ÉVALUATION
  // ========================================

  /**
   * POST /api/evaluations/:id/recalculate
   * Recalculer une évaluation (rangs, percentiles)
   */
  router.post(
    '/evaluations/:id/recalculate',
    recalculationRateLimit,
    calculationController.recalculateEvaluation
  );

  /**
   * GET /api/evaluations/:id/ranking
   * Récupérer le classement d'une évaluation
   */
  router.get(
    '/evaluations/:id/ranking',
    calculationController.getRanking
  );

  /**
   * GET /api/evaluations/:id/statistics
   * Récupérer les statistiques de base d'une évaluation
   */
  router.get(
    '/evaluations/:id/statistics',
    calculationController.getBasicStatistics
  );

  /**
   * GET /api/evaluations/:id/statistics/full
   * Récupérer les statistiques complètes d'une évaluation
   */
  router.get(
    '/evaluations/:id/statistics/full',
    calculationController.getFullStatistics
  );

  /**
   * GET /api/evaluations/:id/distribution
   * Récupérer la distribution des scores
   */
  router.get(
    '/evaluations/:id/distribution',
    calculationController.getDistribution
  );

  // ========================================
  // ROUTES ANALYSES ET RAPPORTS
  // ========================================

  /**
   * GET /api/evaluations/:id/report
   * Générer un rapport complet d'évaluation
   */
  router.get(
    '/evaluations/:id/report',
    calculationController.generateReport
  );

  /**
   * GET /api/evaluations/:id/anomalies
   * Détecter les anomalies dans une évaluation
   */
  router.get(
    '/evaluations/:id/anomalies',
    calculationController.detectAnomalies
  );

  /**
   * POST /api/evaluations/compare
   * Comparer plusieurs évaluations
   */
  router.post(
    '/evaluations/compare',
    calculationController.compareEvaluations
  );

  // ========================================
  // ROUTES STATISTIQUES DE CLASSE
  // ========================================

  /**
   * GET /api/classes/:classId/summary
   * Récupérer le résumé statistique d'une classe
   */
  router.get(
    '/classes/:classId/summary',
    calculationController.getClassSummary
  );

  // ========================================
  // ROUTES MÉTADONNÉES ET CONFIGURATION
  // ========================================

  /**
   * GET /api/calculations/config
   * Récupérer la configuration des calculs
   */
  router.get('/config', (req, res) => {
    res.json({
      success: true,
      data: {
        ranking: {
          methods: [
            { value: 'standard', label: 'Classement standard' },
            { value: 'modified', label: 'Classement modifié (ex-aequo)' }
          ],
          default: 'modified'
        },
        statistics: {
          precision: 2,
          successThreshold: 0.5, // 50% de la note maximale
          outlierMethod: 'iqr', // Méthode IQR pour détecter les outliers
          distributionBins: 5
        },
        performance: {
          topPerformersPercentage: 20, // Top 20%
          strugglingStudentsPercentage: 20, // Bottom 20%
          anomalyThresholds: {
            lowAverage: 5, // Moyenne < 5/20
            highAverage: 18, // Moyenne > 18/20
            lowDiscrimination: 1, // Écart-type < 1
            highAbsenceRate: 30 // Taux d'absence > 30%
          }
        }
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /api/calculations/help
   * Documentation des calculs et formules
   */
  router.get('/help', (req, res) => {
    res.json({
      success: true,
      data: {
        formulas: {
          average: 'Moyenne = Somme des scores / Nombre de scores',
          median: 'Médiane = Valeur centrale dans une série ordonnée',
          standardDeviation: 'Écart-type = √(Σ(xi - moyenne)² / (n-1))',
          percentile: 'Percentile = (Nombre de scores inférieurs / Total) × 100',
          successRate: 'Taux de réussite = (Scores ≥ seuil / Total scores) × 100'
        },
        ranking: {
          description: 'Le classement est calculé par ordre décroissant des scores',
          exAequo: 'Les ex-aequo partagent le même rang',
          absentHandling: {
            'exclude_from_ranking': 'Les absents ne sont pas classés',
            'zero_score': 'Les absents ont un score de 0',
            'class_average': 'Les absents ont la moyenne de classe',
            'manual_decision': 'Décision manuelle au cas par cas'
          }
        },
        anomalies: {
          lowAverage: 'Moyenne de classe anormalement basse',
          highAverage: 'Moyenne de classe anormalement haute',
          lowDiscrimination: 'Évaluation peu discriminante (faible écart-type)',
          highAbsenceRate: 'Taux d\'absence élevé',
          outliers: 'Scores aberrants (méthode IQR)'
        },
        recommendations: 'Les recommandations sont générées automatiquement selon les résultats'
      },
      timestamp: new Date().toISOString()
    });
  });

  return router;
}
