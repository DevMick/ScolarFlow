import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ClassAverageConfigController } from '../controllers/classAverageConfigController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

export function createClassAverageConfigRoutes(prisma: PrismaClient): Router {
  const classAverageConfigController = new ClassAverageConfigController();

  // Middleware d'authentification pour toutes les routes
  router.use(authenticateToken);

  // Routes pour les configurations de moyennes par classe
  router.get('/', classAverageConfigController.getUserConfigs);
  router.get('/class/:classId', classAverageConfigController.getClassConfig);
  router.post('/', classAverageConfigController.createOrUpdateConfig);
  router.delete('/:id', classAverageConfigController.deleteConfig);
  router.delete('/class/:classId', classAverageConfigController.deleteConfigByClass);

  return router;
}

export default createClassAverageConfigRoutes;
