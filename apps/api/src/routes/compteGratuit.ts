import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { CompteGratuitController } from '../controllers/compteGratuitController';
import { authenticateToken } from '../middleware/auth';

export function createCompteGratuitRoutes(prisma: PrismaClient): Router {
  const router: Router = Router();
  
  // Initialize controller with prisma instance
  const compteGratuitController = new CompteGratuitController(prisma);

  // Routes protégées - toutes nécessitent une authentification
  router.get('/info', authenticateToken, (req, res) => compteGratuitController.getTrialInfo(req, res));
  router.get('/status', authenticateToken, (req, res) => compteGratuitController.checkTrialStatus(req, res));

  // Routes admin (pour l'instant accessibles à tous les utilisateurs authentifiés)
  router.get('/active', authenticateToken, (req, res) => compteGratuitController.getActiveTrials(req, res));
  router.get('/stats', authenticateToken, (req, res) => compteGratuitController.getTrialStats(req, res));

  return router;
}