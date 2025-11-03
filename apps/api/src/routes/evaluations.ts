import express from 'express';
import { body, validationResult } from 'express-validator';
import { EvaluationController } from '../controllers/evaluationController';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();
const evaluationController = new EvaluationController();

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

// Validation pour la création d'évaluation
const createEvaluationValidation = [
  body('classId').isInt({ min: 1 }).withMessage('ID de classe invalide'),
  body('nom').isLength({ min: 2, max: 200 }).withMessage('Le nom doit contenir entre 2 et 200 caractères'),
  body('date').isISO8601().withMessage('Format de date invalide'),
];

// Validation pour la mise à jour d'évaluation
const updateEvaluationValidation = [
  body('nom').optional().isLength({ min: 2, max: 200 }).withMessage('Le nom doit contenir entre 2 et 200 caractères'),
  body('date').optional().isISO8601().withMessage('Format de date invalide'),
];

// Routes
router.get('/class/:classId', evaluationController.getEvaluationsByClass.bind(evaluationController));
router.post('/', createEvaluationValidation, handleValidationErrors, evaluationController.createEvaluation.bind(evaluationController));
router.put('/:id', updateEvaluationValidation, handleValidationErrors, evaluationController.updateEvaluation.bind(evaluationController));
router.delete('/:id', evaluationController.deleteEvaluation.bind(evaluationController));

export default router;