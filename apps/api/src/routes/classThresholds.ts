import { Router } from 'express';
import { ClassThresholdController } from '../controllers/classThresholdController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

/**
 * @route GET /api/class-thresholds
 * @desc Récupère tous les seuils de classe
 * @access Private
 */
router.get('/', ClassThresholdController.getAll);

/**
 * @route GET /api/class-thresholds/:classId
 * @desc Récupère les seuils d'une classe
 * @access Private
 */
router.get('/:classId', ClassThresholdController.getByClassId);

/**
 * @route POST /api/class-thresholds
 * @desc Crée les seuils pour une classe
 * @access Private
 */
router.post('/', ClassThresholdController.create);

/**
 * @route PUT /api/class-thresholds/:classId
 * @desc Met à jour les seuils d'une classe
 * @access Private
 */
router.put('/:classId', ClassThresholdController.update);

/**
 * @route DELETE /api/class-thresholds/:classId
 * @desc Supprime les seuils d'une classe
 * @access Private
 */
router.delete('/:classId', ClassThresholdController.delete);

export default router;

