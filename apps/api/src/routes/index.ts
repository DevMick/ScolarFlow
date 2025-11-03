// ========================================
// ROUTES API PRINCIPALES - ÉVALUATIONS
// ========================================

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { createEvaluationRoutes } from './evaluations';
import { createResultRoutes } from './results';
import { createCalculationRoutes } from './calculations';
import statisticsRoutes from './statistics';
import tablesRoutes from './tables';
import { createReportsRoutes } from './reports'; // Phase 7 - Bilans Annuels
import moyennesRoutes from './moyennes';
import exportBilanRoutes from './exportBilan';
import classThresholdsRoutes from './classThresholds';
import { createCompteGratuitRoutes } from './compteGratuit';

/**
 * Crée et configure toutes les routes API pour le système d'évaluations
 * @param prisma Instance PrismaClient configurée
 * @returns Router Express configuré avec toutes les routes
 */
export async function createApiRoutes(prisma: PrismaClient): Promise<Router> {
  const router = Router();

  // ========================================
  // ROUTE DE SANTÉ
  // ========================================

  /**
   * GET /api/health
   * Endpoint de vérification de l'état de l'API
   */
  router.get('/health', async (req, res) => {
    try {
      // Vérifier la connexion à la base de données
      await prisma.$queryRaw`SELECT 1`;
      
      res.status(200).json({
        success: true,
        status: 'healthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
          database: 'connected',
          api: 'operational'
        },
        uptime: process.uptime()
      });
    } catch (error) {
      res.status(503).json({
        success: false,
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        version: '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        services: {
          database: 'disconnected',
          api: 'operational'
        },
        error: 'Database connection failed',
        uptime: process.uptime()
      });
    }
  });

  // ========================================
  // ROUTES SYSTÈME D'ÉVALUATIONS
  // ========================================

  // Routes pour les évaluations - temporairement désactivé
  // router.use('/', createEvaluationRoutes(prisma));

  // Routes pour les résultats
  router.use('/', createResultRoutes(prisma));

  // Routes pour les calculs et statistiques
  router.use('/', createCalculationRoutes(prisma));

  // Routes pour les moyennes
  router.use('/', moyennesRoutes);

  // Routes pour les statistiques personnalisées
  router.use('/statistics', statisticsRoutes);

  // Routes pour les tableaux personnalisés
  router.use('/tables', tablesRoutes);
  
  // Routes pour l'export du bilan annuel
  router.use('/export', exportBilanRoutes);
  
  // Routes pour les seuils de classe
  router.use('/class-thresholds', classThresholdsRoutes);
  
  // Routes pour les comptes gratuits
  router.use('/compte-gratuit', createCompteGratuitRoutes(prisma));
  
  // Routes pour les bilans annuels (Phase 7)
  const { StatisticsEngine } = await import('../services/statistics/StatisticsEngine');
  const { EvaluationService } = await import('../services/EvaluationService');
  const statisticsEngine = new StatisticsEngine(prisma);
  const evaluationService = new EvaluationService(prisma);
  router.use('/reports', createReportsRoutes(prisma, statisticsEngine, evaluationService));

  // ========================================
  // ROUTE D'INFORMATION API
  // ========================================

  /**
   * GET /api/info
   * Informations sur l'API et les endpoints disponibles
   */
  router.get('/info', (req, res) => {
    res.json({
      success: true,
      name: 'EduStats Evaluation API',
      version: '1.0.0',
      description: 'API pour la gestion des évaluations scolaires',
      timestamp: new Date().toISOString(),
      endpoints: {
        evaluations: {
          description: 'Gestion des évaluations',
          routes: [
            'GET /api/classes/:classId/evaluations - Lister les évaluations d\'une classe',
            'POST /api/classes/:classId/evaluations - Créer une évaluation',
            'GET /api/evaluations/:id - Récupérer une évaluation',
            'PUT /api/evaluations/:id - Modifier une évaluation',
            'PATCH /api/evaluations/:id/finalize - Finaliser une évaluation',
            'POST /api/evaluations/:id/duplicate - Dupliquer une évaluation',
            'DELETE /api/evaluations/:id - Supprimer une évaluation'
          ]
        },
        results: {
          description: 'Gestion des résultats d\'évaluations',
          routes: [
            'GET /api/evaluations/:evaluationId/results - Lister les résultats',
            'GET /api/evaluations/:evaluationId/results/:studentId - Récupérer un résultat',
            'PUT /api/evaluations/:evaluationId/results/:studentId - Modifier un résultat',
            'PATCH /api/evaluations/:evaluationId/results/bulk - Modification en lot',
            'GET /api/evaluations/:evaluationId/results/:studentId/history - Historique résultat',
            'GET /api/evaluations/:evaluationId/history - Historique évaluation'
          ]
        },
        calculations: {
          description: 'Calculs et statistiques',
          routes: [
            'POST /api/evaluations/:id/recalculate - Recalculer une évaluation',
            'GET /api/evaluations/:id/ranking - Classement',
            'GET /api/evaluations/:id/statistics - Statistiques de base',
            'GET /api/evaluations/:id/statistics/full - Statistiques complètes',
            'GET /api/evaluations/:id/distribution - Distribution des scores',
            'GET /api/evaluations/:id/report - Rapport complet',
            'GET /api/evaluations/:id/anomalies - Détection d\'anomalies',
            'POST /api/evaluations/compare - Comparaison d\'évaluations',
            'GET /api/classes/:classId/summary - Résumé de classe'
          ]
        },
        statistics: {
          description: 'Statistiques personnalisées',
          routes: [
            'GET /api/statistics/configurations - Lister les configurations',
            'POST /api/statistics/configurations - Créer une configuration',
            'GET /api/statistics/configurations/:id - Récupérer une configuration',
            'PUT /api/statistics/configurations/:id - Modifier une configuration',
            'DELETE /api/statistics/configurations/:id - Supprimer une configuration',
            'POST /api/statistics/configurations/:id/duplicate - Dupliquer configuration',
            'GET /api/statistics/templates - Lister les templates',
            'POST /api/statistics/templates/:id/create - Créer depuis template',
            'POST /api/statistics/generate - Générer statistiques',
            'GET /api/statistics/results/:id - Récupérer résultat',
            'GET /api/statistics/metadata - Métadonnées disponibles'
          ]
        },
        tables: {
          description: 'Tableaux personnalisés',
          routes: [
            'GET /api/tables - Lister les tableaux de l\'utilisateur',
            'POST /api/tables - Créer un nouveau tableau',
            'GET /api/tables/:id - Récupérer un tableau',
            'PUT /api/tables/:id - Modifier un tableau',
            'DELETE /api/tables/:id - Supprimer un tableau',
            'GET /api/tables/:id/data - Générer les données du tableau',
            'POST /api/tables/:id/duplicate - Dupliquer un tableau',
            'POST /api/tables/:id/export - Exporter un tableau',
            'POST /api/tables/:id/template - Créer un template depuis un tableau',
            'GET /api/tables/templates - Lister les templates',
            'GET /api/tables/templates/popular - Templates populaires',
            'GET /api/tables/templates/categories - Templates par catégorie',
            'GET /api/tables/templates/:id - Récupérer un template',
            'POST /api/tables/templates/:id/use - Utiliser un template'
          ]
        },
        
        reports: {
          description: 'Bilans annuels intelligents (Phase 7)',
          routes: [
            'POST /api/reports/generate - Générer un bilan annuel complet',
            'GET /api/reports - Lister les bilans de l\'utilisateur',
            'GET /api/reports/:id - Récupérer un bilan spécifique',
            'DELETE /api/reports/:id - Supprimer un bilan',
            'POST /api/reports/:id/export - Exporter un bilan (PDF, Excel, CSV, HTML, JSON)',
            'POST /api/reports/:id/archive - Archiver un bilan',
            'GET /api/reports/templates - Lister les templates de bilans',
            'GET /api/reports/templates/popular - Templates les plus utilisés',
            'GET /api/reports/templates/categories - Templates par catégorie',
            'GET /api/reports/templates/:id - Récupérer un template',
            'POST /api/reports/templates/:id/use - Utiliser un template',
            'GET /api/reports/archives - Lister les archives',
            'POST /api/reports/archives/:id/restore - Restaurer depuis archive',
            'POST /api/reports/archives/search - Recherche avancée dans archives',
            'GET /api/reports/archives/stats - Statistiques d\'archivage',
            'POST /api/reports/archives/cleanup - Nettoyer archives expirées (admin)',
            'POST /api/reports/compare - Comparaison entre années',
            'GET /api/reports/health - État du service bilans'
          ],
          features: [
            '🧠 IA de classification automatique (6 profils d\'élèves)',
            '📊 Analyses prédictives et recommandations pédagogiques',
            '🎯 Détection automatique d\'insights et patterns',
            '📈 Génération < 30s avec cache intelligent',
            '📄 Export PDF professionnel avec graphiques',
            '🗄️ Archivage intelligent avec compression',
            '🔍 Recherche avancée dans historiques',
            '📋 Templates personnalisables par contexte',
            '⚡ Performance optimisée pour gros volumes',
            '🔒 Sécurité et conformité RGPD'
          ]
        },
        metadata: {
          description: 'Configuration et métadonnées',
          routes: [
            'GET /api/evaluations/types - Types d\'évaluations',
            'GET /api/evaluations/subjects - Matières',
            'GET /api/evaluations/config - Configuration évaluations',
            'GET /api/results/absent-reasons - Raisons d\'absence',
            'GET /api/results/validation-rules - Règles de validation',
            'GET /api/calculations/config - Configuration calculs',
            'GET /api/calculations/help - Aide calculs'
          ]
        }
      },
      authentication: {
        type: 'Bearer Token (JWT)',
        header: 'Authorization: Bearer <token>',
        expiration: '24 hours (access) / 7 days (refresh)'
      },
      rateLimiting: {
        evaluations: '200 requests / 15 minutes',
        results: '300 requests / 10 minutes',
        calculations: '150 requests / 10 minutes',
        mutations: '50 requests / 10 minutes',
        bulk: '20 requests / 15 minutes'
      },
      validation: {
        engine: 'Zod',
        features: [
          'Schema validation',
          'Cross-field validation',
          'Business rules validation',
          'French error messages'
        ]
      },
      features: [
        'CRUD complet des évaluations',
        'Gestion des résultats individuels et en lot',
        'Calculs automatiques de classement et statistiques',
        'Historique des modifications',
        'Validation métier avancée',
        'Détection d\'anomalies',
        'Génération de rapports',
        'Rate limiting intelligent',
        'Gestion des erreurs structurée'
      ]
    });
  });

  return router;
}

// Export par défaut pour compatibilité
export default createApiRoutes;
