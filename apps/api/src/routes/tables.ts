// ========================================
// ROUTES TABLEAUX PERSONNALISÉS
// ========================================

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import rateLimit from '../middleware/rateLimiter';
import {
  createCustomTable,
  getCustomTables,
  getCustomTableById,
  updateCustomTable,
  deleteCustomTable,
  generateTableData,
  duplicateCustomTable,
  exportCustomTable,
  getTemplates,
  getTemplateById,
  useTemplate,
  createTemplateFromTable,
  getPopularTemplates,
  getTemplatesByCategory,
  getTemplateStats
} from '../controllers/tablesController';
import { 
  createCustomTableSchema,
  updateCustomTableSchema,
  exportTableSchema,
  createTemplateSchema
} from '@edustats/shared/validation';

const router = Router();

// ========================================
// ROUTES TABLEAUX PERSONNALISÉS
// ========================================

/**
 * @route   POST /api/tables
 * @desc    Créer un nouveau tableau personnalisé
 * @access  Private
 */
router.post(
  '/',
  authenticateToken,
  rateLimit({ windowMs: 15 * 60 * 1000, max: 20 }), // 20 créations par 15min
  validateBody(createCustomTableSchema),
  createCustomTable
);

/**
 * @route   GET /api/tables
 * @desc    Obtenir tous les tableaux de l'utilisateur
 * @access  Private
 */
router.get(
  '/',
  authenticateToken,
  rateLimit({ windowMs: 1 * 60 * 1000, max: 60 }), // 60 requêtes par minute
  getCustomTables
);

/**
 * @route   GET /api/tables/:tableId
 * @desc    Obtenir un tableau par ID
 * @access  Private
 */
router.get(
  '/:tableId',
  authenticateToken,
  rateLimit({ windowMs: 1 * 60 * 1000, max: 100 }),
  getCustomTableById
);

/**
 * @route   PUT /api/tables/:tableId
 * @desc    Mettre à jour un tableau
 * @access  Private
 */
router.put(
  '/:tableId',
  authenticateToken,
  rateLimit({ windowMs: 15 * 60 * 1000, max: 30 }),
  validateBody(updateCustomTableSchema),
  updateCustomTable
);

/**
 * @route   DELETE /api/tables/:tableId
 * @desc    Supprimer un tableau
 * @access  Private
 */
router.delete(
  '/:tableId',
  authenticateToken,
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }),
  deleteCustomTable
);

/**
 * @route   GET /api/tables/:tableId/data
 * @desc    Générer les données d'un tableau
 * @access  Private
 */
router.get(
  '/:tableId/data',
  authenticateToken,
  rateLimit({ windowMs: 1 * 60 * 1000, max: 30 }), // Calculs intensifs
  generateTableData
);

/**
 * @route   POST /api/tables/:tableId/duplicate
 * @desc    Dupliquer un tableau
 * @access  Private
 */
router.post(
  '/:tableId/duplicate',
  authenticateToken,
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }),
  duplicateCustomTable
);

/**
 * @route   POST /api/tables/:tableId/export
 * @desc    Exporter un tableau
 * @access  Private
 */
router.post(
  '/:tableId/export',
  authenticateToken,
  rateLimit({ windowMs: 5 * 60 * 1000, max: 10 }), // 10 exports par 5min
  validateBody(exportTableSchema),
  exportCustomTable
);

/**
 * @route   POST /api/tables/:tableId/template
 * @desc    Créer un template à partir d'un tableau
 * @access  Private
 */
router.post(
  '/:tableId/template',
  authenticateToken,
  rateLimit({ windowMs: 15 * 60 * 1000, max: 5 }),
  validateBody(createTemplateSchema),
  createTemplateFromTable
);

// ========================================
// ROUTES TEMPLATES
// ========================================

/**
 * @route   GET /api/tables/templates
 * @desc    Obtenir tous les templates disponibles
 * @access  Public (avec authentification optionnelle)
 */
router.get(
  '/templates',
  (req, res, next) => {
    // Authentification optionnelle pour les templates
    const token = req.headers.authorization?.replace('Bearer ', '');
    if (token) {
      return authenticateToken(req, res, next);
    }
    next();
  },
  rateLimit({ windowMs: 1 * 60 * 1000, max: 100 }),
  getTemplates
);

/**
 * @route   GET /api/tables/templates/popular
 * @desc    Obtenir les templates populaires
 * @access  Public
 */
router.get(
  '/templates/popular',
  rateLimit({ windowMs: 5 * 60 * 1000, max: 100 }),
  getPopularTemplates
);

/**
 * @route   GET /api/tables/templates/categories
 * @desc    Obtenir les templates par catégorie
 * @access  Public
 */
router.get(
  '/templates/categories',
  rateLimit({ windowMs: 5 * 60 * 1000, max: 100 }),
  getTemplatesByCategory
);

/**
 * @route   GET /api/tables/templates/stats
 * @desc    Obtenir les statistiques des templates
 * @access  Public
 */
router.get(
  '/templates/stats',
  rateLimit({ windowMs: 5 * 60 * 1000, max: 50 }),
  getTemplateStats
);

/**
 * @route   GET /api/tables/templates/:templateId
 * @desc    Obtenir un template par ID
 * @access  Public
 */
router.get(
  '/templates/:templateId',
  rateLimit({ windowMs: 1 * 60 * 1000, max: 100 }),
  getTemplateById
);

/**
 * @route   POST /api/tables/templates/:templateId/use
 * @desc    Utiliser un template
 * @access  Private
 */
router.post(
  '/templates/:templateId/use',
  authenticateToken,
  rateLimit({ windowMs: 1 * 60 * 1000, max: 50 }),
  useTemplate
);

export default router;
