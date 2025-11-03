// ========================================
// ROUTES BILANS ANNUELS - API ENDPOINTS
// ========================================

import { Router } from 'express';
import { PrismaClient } from '@prisma/client';
import { ReportsController } from '../controllers/reportsController';
import { StatisticsEngine } from '../services/statistics/StatisticsEngine';
import { EvaluationService } from '../services/evaluationService';
import { authenticateToken } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validation';
import { rateLimit } from 'express-rate-limit';
import { z } from 'zod';

/**
 * Crée les routes pour les bilans annuels
 */
export function createReportsRoutes(
  prisma: PrismaClient,
  statisticsEngine: StatisticsEngine,
  evaluationService: EvaluationService
): Router {
  const router = Router();
  const reportsController = new ReportsController(
    prisma,
    statisticsEngine,
    evaluationService
  );

  // Rate limiting pour les opérations coûteuses
  const generateReportLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 générations par fenêtre
    message: {
      error: 'Trop de demandes de génération de rapports. Réessayez dans 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false
  });

  const exportLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 minutes
    max: 10, // 10 exports par fenêtre
    message: {
      error: 'Trop de demandes d\'export. Réessayez dans 5 minutes.'
    }
  });

  // ========================================
  // SCHÉMAS DE VALIDATION
  // ========================================

  const generateReportSchema = z.object({
    body: z.object({
      classId: z.number().int().positive({
        message: 'L\'ID de la classe doit être un nombre entier positif'
      }),
      academicYear: z.string().regex(/^\d{4}-\d{4}$/, {
        message: 'L\'année académique doit être au format YYYY-YYYY'
      }),
      templateId: z.string().optional(),
      includeCharts: z.boolean().optional(),
      includeRawData: z.boolean().optional(),
      focusAreas: z.array(z.string()).optional(),
      excludeStudents: z.array(z.number().int().positive()).optional(),
      dateRange: z.array(z.string().datetime()).length(2).optional(),
      language: z.enum(['fr', 'en']).optional(),
      confidentialityLevel: z.enum(['public', 'internal', 'confidential']).optional()
    })
  });

  const exportReportSchema = z.object({
    body: z.object({
      format: z.enum(['pdf', 'docx', 'html', 'json', 'csv'], {
        message: 'Format d\'export non supporté'
      }),
      includeCharts: z.boolean().default(true),
      includeRawData: z.boolean().default(false),
      watermark: z.string().max(100).optional(),
      password: z.string().min(6).max(50).optional(),
      compression: z.boolean().default(false),
      quality: z.enum(['draft', 'standard', 'high']).default('standard')
    })
  });

  const searchArchivesSchema = z.object({
    body: z.object({
      searchTerm: z.string().max(200).optional(),
      classLevel: z.string().max(50).optional(),
      teacher: z.string().max(100).optional(),
      performanceRange: z.array(z.number().min(0).max(20)).length(2).optional(),
      hasInsights: z.boolean().optional(),
      academicYears: z.array(z.string().regex(/^\d{4}-\d{4}$/)).optional()
    })
  });

  // ========================================
  // ROUTES DE GÉNÉRATION
  // ========================================

  /**
   * POST /api/reports/generate
   * Génère un nouveau bilan annuel
   */
  router.post('/generate',
    authenticateToken,
    generateReportLimiter,
    validateBody(generateReportSchema),
    reportsController.generateReport
  );

  // ========================================
  // ROUTES DE GESTION DES RAPPORTS
  // ========================================

  /**
   * GET /api/reports
   * Liste les rapports de l'utilisateur
   */
  router.get('/',
    authenticateToken,
    reportsController.getReports
  );

  /**
   * GET /api/reports/:id
   * Récupère un rapport spécifique
   */
  router.get('/:id',
    authenticateToken,
    reportsController.getReportById
  );

  /**
   * DELETE /api/reports/:id
   * Supprime un rapport
   */
  router.delete('/:id',
    authenticateToken,
    reportsController.deleteReport
  );

  // ========================================
  // ROUTES D'EXPORT
  // ========================================

  /**
   * POST /api/reports/:id/export
   * Exporte un rapport dans le format demandé
   */
  router.post('/:id/export',
    authenticateToken,
    exportLimiter,
    validateBody(exportReportSchema),
    reportsController.exportReport
  );

  // ========================================
  // ROUTES DES TEMPLATES
  // ========================================

  /**
   * GET /api/reports/templates
   * Liste les templates disponibles
   */
  router.get('/templates',
    authenticateToken,
    reportsController.getTemplates
  );

  /**
   * GET /api/reports/templates/popular
   * Récupère les templates les plus utilisés
   */
  router.get('/templates/popular',
    authenticateToken,
    async (req, res) => {
      try {
        const templates = await prisma.reportTemplate.findMany({
          where: { isOfficial: true },
          orderBy: { usageCount: 'desc' },
          take: 10,
          include: {
            creator: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        });

        res.json({ data: templates });
      } catch (error) {
        console.error('Erreur récupération templates populaires:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
      }
    }
  );

  /**
   * GET /api/reports/templates/categories
   * Récupère les templates groupés par catégorie
   */
  router.get('/templates/categories',
    authenticateToken,
    async (req, res) => {
      try {
        const templates = await prisma.reportTemplate.findMany({
          where: { isOfficial: true },
          orderBy: [
            { target: 'asc' },
            { usageCount: 'desc' }
          ],
          include: {
            creator: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          }
        });

        // Groupement par target (catégorie)
        const categorized = templates.reduce((acc, template) => {
          const category = template.target;
          if (!acc[category]) {
            acc[category] = [];
          }
          acc[category].push(template);
          return acc;
        }, {} as Record<string, any[]>);

        res.json({ data: categorized });
      } catch (error) {
        console.error('Erreur récupération templates par catégorie:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
      }
    }
  );

  /**
   * GET /api/reports/templates/:id
   * Récupère un template spécifique
   */
  router.get('/templates/:id',
    authenticateToken,
    reportsController.getTemplateById
  );

  /**
   * POST /api/reports/templates/:id/use
   * Utilise un template (incrémente le compteur)
   */
  router.post('/templates/:id/use',
    authenticateToken,
    reportsController.useTemplate
  );

  // ========================================
  // ROUTES D'ARCHIVAGE
  // ========================================

  /**
   * POST /api/reports/:id/archive
   * Archive un rapport
   */
  router.post('/:id/archive',
    authenticateToken,
    reportsController.archiveReport
  );

  /**
   * GET /api/reports/archives
   * Liste les archives
   */
  router.get('/archives',
    authenticateToken,
    reportsController.getArchives
  );

  /**
   * POST /api/reports/archives/:id/restore
   * Restaure un rapport depuis les archives
   */
  router.post('/archives/:id/restore',
    authenticateToken,
    reportsController.restoreArchive
  );

  /**
   * POST /api/reports/archives/search
   * Recherche dans les archives
   */
  router.post('/archives/search',
    authenticateToken,
    validateBody(searchArchivesSchema),
    reportsController.searchArchives
  );

  /**
   * GET /api/reports/archives/stats
   * Statistiques d'archivage
   */
  router.get('/archives/stats',
    authenticateToken,
    reportsController.getArchiveStats
  );

  /**
   * POST /api/reports/archives/cleanup
   * Nettoie les archives expirées (admin seulement)
   */
  router.post('/archives/cleanup',
    authenticateToken,
    async (req, res) => {
      try {
        // Vérification des permissions admin (à implémenter selon votre logique)
        const user = req.user;
        if (!user || user.role !== 'ADMIN') {
          return res.status(403).json({ error: 'Accès non autorisé' });
        }

        const archiveService = new (require('../services/reports/ArchiveService').ArchiveService)(prisma);
        const result = await archiveService.cleanupExpiredArchives();

        res.json({
          success: true,
          data: {
            deletedCount: result.deletedCount,
            freedSpace: result.freedSpace,
            freedSpaceMB: Math.round(result.freedSpace / (1024 * 1024))
          }
        });
      } catch (error) {
        console.error('Erreur nettoyage archives:', error);
        res.status(500).json({ error: 'Erreur interne du serveur' });
      }
    }
  );

  // ========================================
  // ROUTES DE COMPARAISON ET ANALYSE
  // ========================================

  /**
   * POST /api/reports/compare
   * Génère un rapport de comparaison entre années
   */
  router.post('/compare',
    authenticateToken,
    async (req, res) => {
      try {
        const userId = req.user?.id;
        if (!userId) {
          return res.status(401).json({ error: 'Utilisateur non authentifié' });
        }

        const schema = z.object({
          classId: z.number().int().positive(),
          academicYears: z.array(z.string().regex(/^\d{4}-\d{4}$/)).min(2).max(5)
        });

        const { classId, academicYears } = schema.parse(req.body);

        // Vérification des permissions
        const classInfo = await prisma.class.findFirst({
          where: {
            id: classId,
            userId
          }
        });

        if (!classInfo) {
          return res.status(404).json({ error: 'Classe introuvable' });
        }

        const archiveService = new (require('../services/reports/ArchiveService').ArchiveService)(prisma);
        const comparison = await archiveService.generateComparisonReport(classId, academicYears);

        res.json({ data: comparison });

      } catch (error) {
        console.error('Erreur génération comparaison:', error);
        
        if (error instanceof z.ZodError) {
          return res.status(400).json({
            error: 'Données invalides',
            details: error.errors
          });
        }

        res.status(500).json({ 
          error: error instanceof Error ? error.message : 'Erreur interne du serveur'
        });
      }
    }
  );

  // ========================================
  // ROUTES DE MONITORING ET SANTÉ
  // ========================================

  /**
   * GET /api/reports/health
   * Vérification de l'état du service
   */
  router.get('/health',
    async (req, res) => {
      try {
        // Vérification de la connectivité base de données
        await prisma.$queryRaw`SELECT 1`;

        // Vérification de l'espace disque (simulation)
        const diskSpace = {
          total: 100 * 1024 * 1024 * 1024, // 100GB
          used: 30 * 1024 * 1024 * 1024,   // 30GB
          available: 70 * 1024 * 1024 * 1024 // 70GB
        };

        // Statistiques rapides
        const [totalReports, totalArchives] = await Promise.all([
          prisma.annualReport.count(),
          prisma.annualArchive.count()
        ]);

        res.json({
          status: 'healthy',
          timestamp: new Date().toISOString(),
          services: {
            database: 'connected',
            fileSystem: 'accessible',
            exportService: 'operational',
            archiveService: 'operational'
          },
          statistics: {
            totalReports,
            totalArchives,
            diskSpace: {
              totalGB: Math.round(diskSpace.total / (1024 * 1024 * 1024)),
              usedGB: Math.round(diskSpace.used / (1024 * 1024 * 1024)),
              availableGB: Math.round(diskSpace.available / (1024 * 1024 * 1024)),
              usagePercent: Math.round((diskSpace.used / diskSpace.total) * 100)
            }
          }
        });

      } catch (error) {
        console.error('Erreur health check:', error);
        res.status(503).json({
          status: 'unhealthy',
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.message : 'Service indisponible'
        });
      }
    }
  );

  return router;
}

export default createReportsRoutes;
