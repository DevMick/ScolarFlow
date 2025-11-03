import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { SchoolYearController } from '../controllers/schoolYearController';
import { authenticateToken } from '../middleware/auth';

export function createSchoolYearsRoutes(prisma: PrismaClient): Router {
  const router = Router();

  // Toutes les routes nécessitent une authentification
  router.use(authenticateToken);

  // Initialize controller with prisma instance
  const schoolYearController = new SchoolYearController(prisma);

  // Routes pour les années scolaires
  router.post('/', (req, res) => schoolYearController.create(req, res));
  router.get('/', (req, res) => schoolYearController.getAll(req, res));
  router.get('/active', (req, res) => schoolYearController.getActive(req, res));
  router.get('/:id', (req, res) => schoolYearController.getById(req, res));
  router.put('/:id', (req, res) => schoolYearController.update(req, res));
  router.post('/:id/activate', (req, res) => schoolYearController.activate(req, res));
  router.delete('/:id', (req, res) => schoolYearController.delete(req, res));

  return router;
}

