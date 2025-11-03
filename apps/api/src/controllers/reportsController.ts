// ========================================
// REPORTS CONTROLLER - CONTRÔLEUR BILANS ANNUELS
// ========================================

import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { 
  AnnualReportService,
  ArchiveService,
  ExportService
} from '../services/reports';
import { StatisticsEngine } from '../services/statistics/StatisticsEngine';
import { EvaluationService } from '../services/evaluationService';
import { 
  ReportGenerationOptions,
  ReportExportOptions,
  DEFAULT_REPORT_CONFIG
} from '@edustats/shared/types';
// TODO: Remplacer par des types locaux si le package n'existe pas
import { z } from 'zod';

/**
 * Contrôleur pour les bilans annuels
 */
export class ReportsController {
  private annualReportService: AnnualReportService;
  private archiveService: ArchiveService;
  private exportService: ExportService;

  constructor(
    private prisma: PrismaClient,
    private statisticsEngine: StatisticsEngine,
    private evaluationService: EvaluationService
  ) {
    this.annualReportService = new AnnualReportService(
      prisma,
      statisticsEngine,
      evaluationService
    );
    this.archiveService = new ArchiveService(prisma);
    this.exportService = new ExportService();
  }

  // ========================================
  // GÉNÉRATION DE RAPPORTS
  // ========================================

  /**
   * Génère un nouveau bilan annuel
   * POST /api/reports/generate
   */
  generateReport = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ 
          success: false, 
          error: 'Utilisateur non authentifié' 
        });
      }

      // Validation des données
      const schema = z.object({
        classId: z.number().int().positive(),
        academicYear: z.string().regex(/^\d{4}-\d{4}$/),
        templateId: z.string().optional(),
        includeCharts: z.boolean().optional(),
        includeRawData: z.boolean().optional(),
        focusAreas: z.array(z.string()).optional(),
        excludeStudents: z.array(z.number()).optional(),
        dateRange: z.array(z.string().datetime()).length(2).optional(),
        language: z.enum(['fr', 'en']).optional(),
        confidentialityLevel: z.enum(['public', 'internal', 'confidential']).optional()
      });

      const validatedData = schema.parse(req.body);

      const options: ReportGenerationOptions = {
        templateId: validatedData.templateId,
        includeCharts: validatedData.includeCharts ?? DEFAULT_REPORT_CONFIG.includeCharts,
        includeRawData: validatedData.includeRawData ?? DEFAULT_REPORT_CONFIG.includeRawData,
        focusAreas: validatedData.focusAreas,
        excludeStudents: validatedData.excludeStudents,
        dateRange: validatedData.dateRange ? 
          [new Date(validatedData.dateRange[0]), new Date(validatedData.dateRange[1])] : 
          undefined,
        language: validatedData.language ?? DEFAULT_REPORT_CONFIG.language,
        confidentialityLevel: validatedData.confidentialityLevel ?? DEFAULT_REPORT_CONFIG.confidentialityLevel
      };

      const result = await this.annualReportService.generateReport(
        userId,
        validatedData.classId,
        validatedData.academicYear,
        options
      );

      res.json(result);

    } catch (error) {
      console.error('Erreur génération rapport:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          success: false,
          error: 'Données invalides',
          details: error.errors
        });
      }

      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur interne du serveur'
      });
    }
  };

  /**
   * Liste les rapports de l'utilisateur
   * GET /api/reports
   */
  getReports = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      const {
        classId,
        academicYear,
        status,
        page = '1',
        limit = '20'
      } = req.query;

      // Récupération des classes de l'utilisateur
      const userClasses = await this.prisma.classes.findMany({
        where: { user_id: userId },
        select: { id: true }
      });

      const classIds = userClasses.map(c => c.id);

      // Construction des filtres
      const where: any = {
        classId: { in: classIds }
      };

      if (classId) where.classId = parseInt(classId as string);
      if (academicYear) where.academicYear = academicYear;
      if (status) where.status = status;

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      const [reports, total] = await Promise.all([
        // @ts-ignore - annualReport model not in Prisma schema yet
        this.prisma.annualReport.findMany({
          where,
          include: {
            class: {
              select: {
                name: true,
                level: true,
                studentCount: true
              }
            },
            template: {
              select: {
                name: true,
                target: true
              }
            }
          },
          orderBy: { generatedAt: 'desc' },
          skip: (pageNum - 1) * limitNum,
          take: limitNum
        }),
        // @ts-ignore - annualReport model not in Prisma schema yet
        this.prisma.annualReport.count({ where })
      ]);

      res.json({
        data: reports,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
          hasNext: pageNum * limitNum < total,
          hasPrev: pageNum > 1
        }
      });

    } catch (error) {
      console.error('Erreur récupération rapports:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  };

  /**
   * Récupère un rapport spécifique
   * GET /api/reports/:id
   */
  getReportById = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const reportId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      // @ts-ignore - annualReport model not in Prisma schema yet
      const report = await this.prisma.annualReport.findFirst({
        where: {
          id: reportId,
          class: {
            userId
          }
        },
        include: {
          class: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true
                }
              }
            }
          },
          template: true
        }
      });

      if (!report) {
        return res.status(404).json({ error: 'Rapport introuvable' });
      }

      res.json({ data: report });

    } catch (error) {
      console.error('Erreur récupération rapport:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  };

  /**
   * Supprime un rapport
   * DELETE /api/reports/:id
   */
  deleteReport = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const reportId = parseInt(req.params.id);

      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      // Vérification des permissions
      // @ts-ignore - annualReport model not in Prisma schema yet
      const report = await this.prisma.annualReport.findFirst({
        where: {
          id: reportId,
          class: {
            userId
          }
        }
      });

      if (!report) {
        return res.status(404).json({ error: 'Rapport introuvable' });
      }

      // @ts-ignore - annualReport model not in Prisma schema yet
      await this.prisma.annualReport.delete({
        where: { id: reportId }
      });

      res.json({ success: true });

    } catch (error) {
      console.error('Erreur suppression rapport:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  };

  // ========================================
  // EXPORT DE RAPPORTS
  // ========================================

  /**
   * Exporte un rapport dans le format demandé
   * POST /api/reports/:id/export
   */
  exportReport = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const reportId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      // Validation des options d'export
      const schema = z.object({
        format: z.enum(['pdf', 'docx', 'html', 'json', 'csv']),
        includeCharts: z.boolean().default(true),
        includeRawData: z.boolean().default(false),
        watermark: z.string().optional(),
        password: z.string().optional(),
        compression: z.boolean().default(false),
        quality: z.enum(['draft', 'standard', 'high']).default('standard')
      });

      const options: ReportExportOptions = schema.parse(req.body);

      // Récupération du rapport
      // @ts-ignore - annualReport model not in Prisma schema yet
      const report = await this.prisma.annualReport.findFirst({
        where: {
          id: parseInt(reportId),
          class: {
            userId
          }
        }
      });

      if (!report) {
        return res.status(404).json({ error: 'Rapport introuvable' });
      }

      // Export
      const result = await this.exportService.exportReport(
        report.reportData as any,
        options
      );

      if (!result.success) {
        return res.status(500).json({ 
          error: 'Erreur lors de l\'export',
          details: result
        });
      }

      res.json({ data: result });

    } catch (error) {
      console.error('Erreur export rapport:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Options d\'export invalides',
          details: error.errors
        });
      }

      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  };

  // ========================================
  // GESTION DES TEMPLATES
  // ========================================

  /**
   * Liste les templates disponibles
   * GET /api/reports/templates
   */
  getTemplates = async (req: Request, res: Response) => {
    try {
      const {
        target,
        isOfficial,
        search,
        page = '1',
        limit = '50'
      } = req.query;

      const where: any = {};

      if (target) where.target = target;
      if (isOfficial !== undefined) where.isOfficial = isOfficial === 'true';
      if (search) {
        where.OR = [
          { name: { contains: search as string, mode: 'insensitive' } },
          { description: { contains: search as string, mode: 'insensitive' } }
        ];
      }

      const pageNum = parseInt(page as string);
      const limitNum = parseInt(limit as string);

      const [templates, total] = await Promise.all([
        // @ts-ignore - reportTemplate model not in Prisma schema yet
        this.prisma.reportTemplate.findMany({
          where,
          include: {
            creator: {
              select: {
                firstName: true,
                lastName: true
              }
            }
          },
          orderBy: [
            { isOfficial: 'desc' },
            { usageCount: 'desc' },
            { name: 'asc' }
          ],
          skip: (pageNum - 1) * limitNum,
          take: limitNum
        }),
        // @ts-ignore - reportTemplate model not in Prisma schema yet
        this.prisma.reportTemplate.count({ where })
      ]);

      res.json({
        data: templates,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      });

    } catch (error) {
      console.error('Erreur récupération templates:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  };

  /**
   * Récupère un template spécifique
   * GET /api/reports/templates/:id
   */
  getTemplateById = async (req: Request, res: Response) => {
    try {
      const templateId = parseInt(req.params.id);

      // @ts-ignore - reportTemplate model not in Prisma schema yet
      const template = await this.prisma.reportTemplate.findUnique({
        where: { id: templateId },
        include: {
          creator: {
            select: {
              firstName: true,
              lastName: true
            }
          }
        }
      });

      if (!template) {
        return res.status(404).json({ error: 'Template introuvable' });
      }

      res.json({ data: template });

    } catch (error) {
      console.error('Erreur récupération template:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  };

  /**
   * Utilise un template (incrémente le compteur d'usage)
   * POST /api/reports/templates/:id/use
   */
  useTemplate = async (req: Request, res: Response) => {
    try {
      const templateId = parseInt(req.params.id);

      // @ts-ignore - reportTemplate model not in Prisma schema yet
      await this.prisma.reportTemplate.update({
        where: { id: templateId },
        data: {
          usageCount: {
            increment: 1
          }
        }
      });

      res.json({ success: true });

    } catch (error) {
      console.error('Erreur utilisation template:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  };

  // ========================================
  // GESTION DES ARCHIVES
  // ========================================

  /**
   * Archive un rapport
   * POST /api/reports/:id/archive
   */
  archiveReport = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const reportId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      // Vérification des permissions
      // @ts-ignore - annualReport model not in Prisma schema yet
      const report = await this.prisma.annualReport.findFirst({
        where: {
          id: parseInt(reportId),
          class: {
            userId
          }
        }
      });

      if (!report) {
        return res.status(404).json({ error: 'Rapport introuvable' });
      }

      const archive = await this.archiveService.archiveReport(reportId);

      res.json({ data: archive });

    } catch (error) {
      console.error('Erreur archivage rapport:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erreur interne du serveur'
      });
    }
  };

  /**
   * Liste les archives
   * GET /api/reports/archives
   */
  getArchives = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      const {
        classId,
        academicYear,
        dateFrom,
        dateTo,
        page = '1',
        limit = '20'
      } = req.query;

      // Récupération des classes de l'utilisateur
      const userClasses = await this.prisma.classes.findMany({
        where: { user_id: userId },
        select: { id: true }
      });

      const classIds = userClasses.map(c => c.id);

      const options = {
        classId: classId ? parseInt(classId as string) : undefined,
        academicYear: academicYear as string,
        dateFrom: dateFrom ? new Date(dateFrom as string) : undefined,
        dateTo: dateTo ? new Date(dateTo as string) : undefined,
        page: parseInt(page as string),
        limit: parseInt(limit as string)
      };

      // Filtrer par les classes de l'utilisateur
      if (options.classId && !classIds.includes(options.classId)) {
        return res.status(403).json({ error: 'Accès non autorisé à cette classe' });
      }

      const result = await this.archiveService.listArchives(options);

      // Filtrer les résultats par les classes de l'utilisateur
      result.archives = result.archives.filter(archive => 
        classIds.includes(archive.classId)
      );

      res.json(result);

    } catch (error) {
      console.error('Erreur récupération archives:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  };

  /**
   * Restaure un rapport depuis les archives
   * POST /api/reports/archives/:id/restore
   */
  restoreArchive = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      const archiveId = req.params.id;

      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      // Vérification des permissions
      // @ts-ignore - annualArchive model not in Prisma schema yet
      const archive = await this.prisma.annualArchive.findFirst({
        where: {
          id: parseInt(archiveId),
          class: {
            userId
          }
        }
      });

      if (!archive) {
        return res.status(404).json({ error: 'Archive introuvable' });
      }

      const report = await this.archiveService.restoreReport(archiveId);

      res.json({ data: report });

    } catch (error) {
      console.error('Erreur restauration archive:', error);
      res.status(500).json({ 
        error: error instanceof Error ? error.message : 'Erreur interne du serveur'
      });
    }
  };

  /**
   * Recherche dans les archives
   * POST /api/reports/archives/search
   */
  searchArchives = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      const schema = z.object({
        searchTerm: z.string().optional(),
        classLevel: z.string().optional(),
        teacher: z.string().optional(),
        performanceRange: z.tuple([z.number(), z.number()]).optional(),
        hasInsights: z.boolean().optional(),
        academicYears: z.array(z.string()).optional()
      });

      const parsed = schema.parse(req.body);
      // Convertir performanceRange en tuple strict si fourni
      const searchQuery: any = { ...parsed };
      if (parsed.performanceRange && Array.isArray(parsed.performanceRange)) {
        searchQuery.performanceRange = [parsed.performanceRange[0], parsed.performanceRange[1]] as [number, number];
      }

      const archives = await this.archiveService.searchArchives(searchQuery);

      // Filtrer par les classes de l'utilisateur
      const userClasses = await this.prisma.classes.findMany({
        where: { user_id: userId },
        select: { id: true }
      });

      const classIds = userClasses.map(c => c.id);
      const filteredArchives = archives.filter(archive => 
        classIds.includes(archive.classId)
      );

      res.json({ data: filteredArchives });

    } catch (error) {
      console.error('Erreur recherche archives:', error);
      
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: 'Critères de recherche invalides',
          details: error.errors
        });
      }

      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  };

  /**
   * Obtient les statistiques d'archivage
   * GET /api/reports/archives/stats
   */
  getArchiveStats = async (req: Request, res: Response) => {
    try {
      const userId = req.user?.id;
      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      const stats = await this.archiveService.getArchiveStats();

      res.json({ data: stats });

    } catch (error) {
      console.error('Erreur statistiques archives:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  };
}
