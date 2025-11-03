import { Router } from 'express';
import { NoteController } from '../controllers/noteController';
import { authenticateToken } from '../middleware/auth';
import { body, param, query, validationResult } from 'express-validator';
import { PrismaClient } from '@prisma/client';

export function createNoteRoutes(prisma: PrismaClient): Router {
  const router = Router();
  const noteController = new NoteController(prisma);

  // Middleware d'authentification pour toutes les routes
  router.use(authenticateToken);

  // Middleware de validation des erreurs
  const handleValidationErrors = (req: any, res: any, next: any) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Données invalides',
        errors: errors.array()
      });
    }
    next();
  };

  // Validation pour la création de note
  const createNoteValidation = [
    body('studentId').isInt({ min: 1 }).withMessage('ID de l\'élève invalide'),
    body('subjectId').isInt({ min: 1 }).withMessage('ID de la matière invalide'),
    body('evaluationId').isInt({ min: 1 }).withMessage('ID de l\'évaluation invalide'),
    body('value').isFloat({ min: 0 }).withMessage('La note doit être positive'),
  ];

  // Validation pour la mise à jour de note
  const updateNoteValidation = [
    body('value').optional().isFloat({ min: 0 }).withMessage('La note doit être positive'),
  ];

  // Validation pour les paramètres
  const noteIdValidation = [
    param('id').isInt({ min: 1 }).withMessage('ID de note invalide'),
  ];

  // Validation pour les query parameters
  const queryValidation = [
    query('studentId').optional().isInt({ min: 1 }).withMessage('ID de l\'élève invalide'),
    query('subjectId').optional().isInt({ min: 1 }).withMessage('ID de la matière invalide'),
    query('classId').optional().isInt({ min: 1 }).withMessage('ID de la classe invalide'),
  ];

  // Routes
  router.get('/', queryValidation, handleValidationErrors, (req, res) => noteController.getNotes(req, res));
  router.get('/:id', noteIdValidation, handleValidationErrors, (req, res) => noteController.getNoteById(req, res));
  router.post('/', createNoteValidation, handleValidationErrors, (req, res) => noteController.createNote(req, res));
  router.post('/upsert', createNoteValidation, handleValidationErrors, (req, res) => noteController.upsertNote(req, res));
  router.put('/:id', noteIdValidation, updateNoteValidation, handleValidationErrors, (req, res) => noteController.updateNote(req, res));
  router.delete('/:id', noteIdValidation, handleValidationErrors, (req, res) => noteController.deleteNote(req, res));

  return router;
}
