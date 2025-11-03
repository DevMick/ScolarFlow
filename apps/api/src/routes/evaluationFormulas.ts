import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { EvaluationFormulaController } from '../controllers/evaluationFormulaController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

export function createEvaluationFormulaRoutes(prisma: PrismaClient): Router {
  const evaluationFormulaController = new EvaluationFormulaController();

  // Middleware d'authentification pour toutes les routes
  router.use(authenticateToken);

  // Routes pour les formules d'évaluation
  router.get('/', evaluationFormulaController.getFormulas);
  router.get('/:id', evaluationFormulaController.getFormulaById);
  router.post('/', evaluationFormulaController.createFormula);
  router.put('/:id', evaluationFormulaController.updateFormula);
  router.delete('/:id', evaluationFormulaController.deleteFormula);

  return router;
}

export default createEvaluationFormulaRoutes;
