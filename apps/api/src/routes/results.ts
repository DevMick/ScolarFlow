// ========================================
// ROUTES API - RÉSULTATS D'ÉVALUATIONS
// ========================================

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { PrismaClient } from '@prisma/client';
import { ResultController } from '../controllers/resultController';
import { ResultService } from '../services/resultService';
import { CalculationService } from '../services/calculationService';
import { ValidationService } from '../services/validationService';
import { authenticateToken } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { 
  updateEvaluationResultSchema,
  bulkResultsSchema
} from '@edustats/shared/validation';

export function createResultRoutes(prisma: PrismaClient): Router {
  const router = Router();

  // Rate limiting spécifique aux résultats
  const resultRateLimit = rateLimit({
    windowMs: 10 * 60 * 1000, // 10 minutes
    max: 300, // Limite à 300 requêtes par 10 minutes
    message: {
      error: 'Trop de requêtes pour les résultats. Réessayez dans 10 minutes.',
      retryAfter: 10 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Rate limiting pour les opérations en lot (plus restrictif)
  const bulkResultRateLimit = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 20, // Limite à 20 opérations en lot par 15 minutes
    message: {
      error: 'Trop d\'opérations en lot. Réessayez dans 15 minutes.',
      retryAfter: 15 * 60
    },
    standardHeaders: true,
    legacyHeaders: false,
  });

  // Initialisation des services et contrôleur
  const calculationService = new CalculationService(prisma);
  const validationService = new ValidationService(prisma);
  const resultService = new ResultService(prisma, validationService, calculationService);
  const resultController = new ResultController(resultService, calculationService);

  // Appliquer l'authentification et le rate limiting à toutes les routes
  router.use(authenticateToken);
  router.use(resultRateLimit);

  // ========================================
  // ROUTES GESTION RÉSULTATS
  // ========================================

  /**
   * GET /api/evaluations/:evaluationId/results
   * Récupérer tous les résultats d'une évaluation
   */
  router.get(
    '/evaluations/:evaluationId/results',
    resultController.getEvaluationResults
  );

  /**
   * GET /api/evaluations/:evaluationId/results/:studentId
   * Récupérer le résultat d'un élève spécifique
   */
  router.get(
    '/evaluations/:evaluationId/results/:studentId',
    resultController.getResultById
  );

  /**
   * PUT /api/evaluations/:evaluationId/results/:studentId
   * Modifier le résultat d'un élève
   */
  router.put(
    '/evaluations/:evaluationId/results/:studentId',
    validateBody(updateEvaluationResultSchema),
    resultController.updateSingleResult
  );

  /**
   * PATCH /api/evaluations/:evaluationId/results/bulk
   * Modification en lot de plusieurs résultats
   */
  router.patch(
    '/evaluations/:evaluationId/results/bulk',
    bulkResultRateLimit,
    validateBody(bulkResultsSchema),
    resultController.updateBulkResults
  );

  // ========================================
  // ROUTES HISTORIQUE
  // ========================================

  /**
   * GET /api/evaluations/:evaluationId/results/:studentId/history
   * Récupérer l'historique des modifications d'un résultat
   */
  router.get(
    '/evaluations/:evaluationId/results/:studentId/history',
    resultController.getResultHistory
  );

  /**
   * GET /api/evaluations/:evaluationId/history
   * Récupérer l'historique complet d'une évaluation
   */
  router.get(
    '/evaluations/:evaluationId/history',
    resultController.getEvaluationHistory
  );

  // ========================================
  // ROUTES MÉTADONNÉES
  // ========================================

  /**
   * GET /api/results/absent-reasons
   * Récupérer les raisons d'absence disponibles
   */
  router.get('/absent-reasons', (req, res) => {
    res.json({
      success: true,
      data: {
        reasons: [
          { value: 'maladie', label: 'Maladie' },
          { value: 'absence_justifiee', label: 'Absence justifiée' },
          { value: 'absence_injustifiee', label: 'Absence injustifiée' },
          { value: 'dispense', label: 'Dispensé(e)' },
          { value: 'exclusion', label: 'Exclusion temporaire' },
          { value: 'retard', label: 'Retard (non rattrapé)' },
          { value: 'autre', label: 'Autre motif' }
        ]
      },
      timestamp: new Date().toISOString()
    });
  });

  /**
   * GET /api/results/validation-rules
   * Récupérer les règles de validation pour les résultats
   */
  router.get('/validation-rules', (req, res) => {
    res.json({
      success: true,
      data: {
        rules: {
          score: {
            min: 0,
            required: 'Sauf si élève absent',
            precision: 'Jusqu\'à 2 décimales'
          },
          absence: {
            required_reason: 'Raison obligatoire si absent',
            incompatible_with_score: 'Score impossible si absent'
          },
          business_rules: {
            finalized_evaluation: 'Modification impossible si évaluation finalisée',
            active_student_only: 'Seuls les élèves actifs peuvent avoir des résultats',
            max_score_validation: 'Le score ne peut dépasser la note maximale'
          }
        },
        error_codes: {
          'VALIDATION_ERROR': 'Erreur de validation des données',
          'EVALUATION_FINALIZED': 'Évaluation déjà finalisée',
          'STUDENT_NOT_FOUND': 'Élève non trouvé ou inactif',
          'ABSENT_WITH_SCORE': 'Score fourni pour un élève absent',
          'PRESENT_WITHOUT_SCORE': 'Score manquant pour un élève présent'
        }
      },
      timestamp: new Date().toISOString()
    });
  });

  return router;
}
