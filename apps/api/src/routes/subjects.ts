import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { SubjectController } from '../controllers/subjectController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

export function createSubjectRoutes(prisma: PrismaClient): Router {
  const subjectController = new SubjectController();

  // Middleware d'authentification pour toutes les routes
  router.use(authenticateToken);

  // Routes pour les matières
  router.get('/', subjectController.getSubjects);
  router.get('/:id', subjectController.getSubjectById);
  router.post('/', subjectController.createSubject);
  router.put('/:id', subjectController.updateSubject);
  router.delete('/:id', subjectController.deleteSubject);

  return router;
}

export default createSubjectRoutes;
