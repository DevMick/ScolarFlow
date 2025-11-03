// ========================================
// STATISTICS ROUTES - ROUTES API STATISTIQUES
// ========================================

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { rateLimit } from 'express-rate-limit';
import {
  createStatisticsConfig,
  getStatisticsConfigs,
  getStatisticsConfigById,
  updateStatisticsConfig,
  deleteStatisticsConfig,
  generateStatistics,
  getStatisticsResultById,
  getStatisticsTemplates,
  createFromTemplate,
  duplicateConfig
} from '../controllers/statisticsController';

const router: Router = Router();

// ========================================
// MIDDLEWARE DE LIMITATION DE DÉBIT
// ========================================

// Limitation pour les calculs intensifs
const computeRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 10, // 10 générations de statistiques par minute
  message: {
    success: false,
    error: 'Trop de demandes de calcul. Veuillez patienter avant de réessayer.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Limitation générale pour les configurations
const configRateLimit = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 60, // 60 requêtes par minute
  message: {
    success: false,
    error: 'Trop de demandes. Veuillez patienter avant de réessayer.'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// ========================================
// ROUTES DES CONFIGURATIONS
// ========================================

/**
 * @route   GET /api/statistics/configurations
 * @desc    Récupère les configurations de l'utilisateur
 * @access  Private
 * @params  ?category, ?isTemplate, ?isPublic, ?search, ?tags, ?page, ?limit
 */
router.get('/configurations', authenticateToken, configRateLimit, getStatisticsConfigs);

/**
 * @route   POST /api/statistics/configurations
 * @desc    Crée une nouvelle configuration
 * @access  Private
 * @body    CreateStatisticConfigurationData
 */
router.post('/configurations', authenticateToken, configRateLimit, createStatisticsConfig);

/**
 * @route   GET /api/statistics/configurations/:id
 * @desc    Récupère une configuration par ID
 * @access  Private
 */
router.get('/configurations/:id', authenticateToken, configRateLimit, getStatisticsConfigById);

/**
 * @route   PUT /api/statistics/configurations/:id
 * @desc    Met à jour une configuration
 * @access  Private
 * @body    Partial<UpdateStatisticConfigurationData>
 */
router.put('/configurations/:id', authenticateToken, configRateLimit, updateStatisticsConfig);

/**
 * @route   DELETE /api/statistics/configurations/:id
 * @desc    Supprime une configuration
 * @access  Private
 */
router.delete('/configurations/:id', authenticateToken, configRateLimit, deleteStatisticsConfig);

/**
 * @route   POST /api/statistics/configurations/:id/duplicate
 * @desc    Duplique une configuration
 * @access  Private
 * @body    { name?: string }
 */
router.post('/configurations/:id/duplicate', authenticateToken, configRateLimit, duplicateConfig);

// ========================================
// ROUTES DES TEMPLATES
// ========================================

/**
 * @route   GET /api/statistics/templates
 * @desc    Récupère les templates publics
 * @access  Public
 */
router.get('/templates', getStatisticsTemplates);

/**
 * @route   POST /api/statistics/templates/:templateId/create
 * @desc    Crée une configuration depuis un template
 * @access  Private
 * @body    Partial<CreateStatisticConfigurationData>
 */
router.post('/templates/:templateId/create', authenticateToken, configRateLimit, createFromTemplate);

// ========================================
// ROUTES DE GÉNÉRATION DE STATISTIQUES
// ========================================

/**
 * @route   POST /api/statistics/generate
 * @desc    Génère des statistiques
 * @access  Private
 * @body    { configurationId?: string, configuration?: StatisticConfiguration }
 */
router.post('/generate', authenticateToken, computeRateLimit, generateStatistics);

/**
 * @route   GET /api/statistics/results/:id
 * @desc    Récupère un résultat de statistiques par ID
 * @access  Private
 */
router.get('/results/:id', authenticateToken, configRateLimit, getStatisticsResultById);

// ========================================
// ROUTES D'UTILITAIRES
// ========================================

/**
 * @route   GET /api/statistics/health
 * @desc    Vérification de santé du service statistiques
 * @access  Public
 */
router.get('/health', (req, res) => {
  res.json({
    success: true,
    service: 'Statistics API',
    status: 'healthy',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

/**
 * @route   GET /api/statistics/metadata
 * @desc    Récupère les métadonnées disponibles pour les configurations
 * @access  Private
 */
router.get('/metadata', authenticateToken, (req, res) => {
  res.json({
    success: true,
    data: {
      categories: [
        { value: 'performance', label: 'Performance', description: 'Analyses de performance par matière ou élève' },
        { value: 'progression', label: 'Progression', description: 'Suivi temporel des performances' },
        { value: 'comparison', label: 'Comparaison', description: 'Comparaisons entre classes ou groupes' },
        { value: 'custom', label: 'Personnalisé', description: 'Analyses sur mesure' }
      ],
      calculationTypes: [
        { value: 'basic', label: 'De base', description: 'Statistiques descriptives simples' },
        { value: 'comparative', label: 'Comparative', description: 'Comparaisons entre groupes' },
        { value: 'temporal', label: 'Temporelle', description: 'Analyses dans le temps' },
        { value: 'predictive', label: 'Prédictive', description: 'Prédictions et tendances' }
      ],
      metrics: [
        { value: 'average', label: 'Moyenne', description: 'Moyenne arithmétique' },
        { value: 'median', label: 'Médiane', description: 'Valeur centrale' },
        { value: 'standardDeviation', label: 'Écart-type', description: 'Mesure de dispersion' },
        { value: 'percentiles', label: 'Percentiles', description: 'Répartition en centiles' },
        { value: 'correlation', label: 'Corrélation', description: 'Relations entre variables' },
        { value: 'trend', label: 'Tendance', description: 'Direction d\'évolution' }
      ],
      chartTypes: [
        { value: 'bar', label: 'Barres', description: 'Graphique en barres' },
        { value: 'line', label: 'Courbes', description: 'Graphique linéaire' },
        { value: 'pie', label: 'Camembert', description: 'Graphique circulaire' },
        { value: 'radar', label: 'Radar', description: 'Graphique en étoile' },
        { value: 'scatter', label: 'Nuage de points', description: 'Graphique de dispersion' },
        { value: 'heatmap', label: 'Carte de chaleur', description: 'Matrice colorée' }
      ],
      colorSchemes: [
        { value: 'blue', label: 'Bleus', colors: ['#3B82F6', '#1D4ED8', '#60A5FA'] },
        { value: 'green', label: 'Verts', colors: ['#10B981', '#059669', '#34D399'] },
        { value: 'purple', label: 'Violets', colors: ['#8B5CF6', '#7C3AED', '#A78BFA'] },
        { value: 'rainbow', label: 'Arc-en-ciel', colors: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6'] }
      ]
    }
  });
});

// ========================================
// MIDDLEWARE DE GESTION D'ERREURS SPÉCIFIQUE
// ========================================

router.use((error: any, req: any, res: any, next: any) => {
  console.error('Erreur API Statistics:', {
    error: error.message,
    stack: error.stack,
    path: req.path,
    method: req.method,
    userId: req.user?.id
  });

  // Erreurs de validation Zod
  if (error.name === 'ZodError') {
    return res.status(400).json({
      success: false,
      error: 'Données de requête invalides',
      details: error.errors
    });
  }

  // Erreurs de base de données Prisma
  if (error.code === 'P2002') {
    return res.status(409).json({
      success: false,
      error: 'Conflit de données - ressource déjà existante'
    });
  }

  if (error.code === 'P2025') {
    return res.status(404).json({
      success: false,
      error: 'Ressource non trouvée'
    });
  }

  // Erreurs de calcul statistique
  if (error.message.includes('calcul') || error.message.includes('statistiques')) {
    return res.status(422).json({
      success: false,
      error: 'Erreur de calcul des statistiques',
      details: error.message
    });
  }

  // Erreur générique
  res.status(500).json({
    success: false,
    error: 'Erreur interne du serveur statistiques',
    requestId: req.id || Date.now().toString()
  });
});

export default router;