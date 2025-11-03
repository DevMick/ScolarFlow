// ========================================
// STATISTICS CONTROLLER - CONTRÔLEUR API STATISTIQUES
// ========================================

import { Request, Response } from 'express';
import { z } from 'zod';
import { PrismaClient } from '@prisma/client';
import { StatisticsEngine, ConfigurationService } from '../services/statistics';
import type {
  StatisticCategory,
  CalculationType,
  MetricType,
  GroupByOption,
  AggregationMethod,
  ChartType,
  LayoutType,
  ColorScheme
} from '@edustats/shared/types/statistics';

// Instance globale de Prisma
const prisma = new PrismaClient();
const statisticsEngine = new StatisticsEngine(prisma);
const configurationService = new ConfigurationService(prisma);

// ========================================
// SCHÉMAS DE VALIDATION ZOD
// ========================================

const createConfigurationSchema = z.object({
  name: z.string().min(3).max(200),
  description: z.string().optional(),
  category: z.enum(['performance', 'progression', 'comparison', 'custom']),
  dataSources: z.object({
    evaluationIds: z.array(z.number()).default([]),
    classIds: z.array(z.number()).min(1),
    dateRange: z.tuple([z.coerce.date(), z.coerce.date()]),
    subjectFilters: z.array(z.string()).default([]),
    typeFilters: z.array(z.string()).default([]),
    studentGroups: z.array(z.string()).optional(),
    excludeAbsent: z.boolean().default(true),
    excludeIncomplete: z.boolean().default(false)
  }),
  calculations: z.object({
    type: z.enum(['basic', 'comparative', 'temporal', 'predictive']),
    metrics: z.array(z.enum([
      'average', 'median', 'mode', 'min', 'max', 'standardDeviation',
      'variance', 'percentiles', 'quartiles', 'iqr', 'skewness',
      'kurtosis', 'correlation', 'regression', 'trend'
    ])).min(1),
    groupBy: z.enum(['student', 'evaluation', 'subject', 'class', 'month', 'week']),
    aggregation: z.enum(['sum', 'average', 'min', 'max', 'count'])
  }),
  visualization: z.object({
    chartType: z.enum(['bar', 'line', 'pie', 'radar', 'scatter', 'heatmap']),
    multiSeries: z.boolean().default(false),
    colors: z.array(z.string()).min(1),
    layout: z.enum(['single', 'grid', 'dashboard']),
    annotations: z.boolean().default(false),
    colorScheme: z.enum(['blue', 'green', 'purple', 'orange', 'rainbow', 'monochrome']),
    showLegend: z.boolean().default(true),
    showGrid: z.boolean().default(true)
  }),
  isTemplate: z.boolean().default(false),
  isPublic: z.boolean().default(false),
  tags: z.array(z.string()).default([])
});

const updateConfigurationSchema = createConfigurationSchema.partial();

const generateStatisticsSchema = z.object({
  configurationId: z.string().optional(),
  configuration: createConfigurationSchema.optional()
}).refine(data => data.configurationId || data.configuration, {
  message: "Either configurationId or configuration must be provided"
});

// ========================================
// CONTRÔLEURS
// ========================================

/**
 * Crée une nouvelle configuration statistique
 */
export const createStatisticsConfig = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    const validatedData = createConfigurationSchema.parse(req.body);
    
    const configuration = await configurationService.createConfig(userId, validatedData);
    
    res.status(201).json({
      success: true,
      data: configuration,
      message: 'Configuration créée avec succès'
    });
  } catch (error) {
    console.error('Erreur création configuration:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création de la configuration'
    });
  }
};

/**
 * Récupère les configurations de l'utilisateur
 */
export const getStatisticsConfigs = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    const {
      category,
      isTemplate,
      isPublic,
      search,
      tags,
      page = '1',
      limit = '20',
      sortBy = 'updatedAt',
      sortOrder = 'desc'
    } = req.query;

    const filters: any = { userId };
    
    if (category) filters.category = category as StatisticCategory;
    if (isTemplate !== undefined) filters.isTemplate = isTemplate === 'true';
    if (isPublic !== undefined) filters.isPublic = isPublic === 'true';
    if (search) filters.search = search as string;
    if (tags) filters.tags = (tags as string).split(',');

    const pagination = {
      page: parseInt(page as string),
      limit: parseInt(limit as string),
      sortBy: sortBy as string,
      sortOrder: sortOrder as 'asc' | 'desc'
    };

    const result = await configurationService.getConfigs(filters, pagination);
    
    res.json({
      success: true,
      data: result.configurations,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: result.total,
        totalPages: Math.ceil(result.total / pagination.limit)
      }
    });
  } catch (error) {
    console.error('Erreur récupération configurations:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des configurations'
    });
  }
};

/**
 * Récupère une configuration par ID
 */
export const getStatisticsConfigById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const configuration = await configurationService.getConfigById(id, userId);
    
    if (!configuration) {
      return res.status(404).json({
        success: false,
        error: 'Configuration non trouvée'
      });
    }
    
    res.json({
      success: true,
      data: configuration
    });
  } catch (error) {
    console.error('Erreur récupération configuration:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération de la configuration'
    });
  }
};

/**
 * Met à jour une configuration
 */
export const updateStatisticsConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    const validatedData = updateConfigurationSchema.parse(req.body);
    
    const configuration = await configurationService.updateConfig(id, userId, validatedData);
    
    res.json({
      success: true,
      data: configuration,
      message: 'Configuration mise à jour avec succès'
    });
  } catch (error) {
    console.error('Erreur mise à jour configuration:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: error.errors
      });
    }
    
    if (error.message.includes('non trouvée') || error.message.includes('non autorisé')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la mise à jour de la configuration'
    });
  }
};

/**
 * Supprime une configuration
 */
export const deleteStatisticsConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    await configurationService.deleteConfig(id, userId);
    
    res.json({
      success: true,
      message: 'Configuration supprimée avec succès'
    });
  } catch (error) {
    console.error('Erreur suppression configuration:', error);
    
    if (error.message.includes('non trouvée') || error.message.includes('non autorisé')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la suppression de la configuration'
    });
  }
};

/**
 * Génère les statistiques
 */
export const generateStatistics = async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    const validatedData = generateStatisticsSchema.parse(req.body);
    
    let configuration;
    
    if (validatedData.configurationId) {
      // Utiliser une configuration existante
      configuration = await configurationService.getConfigById(validatedData.configurationId, userId);
      if (!configuration) {
        return res.status(404).json({
          success: false,
          error: 'Configuration non trouvée'
        });
      }
    } else if (validatedData.configuration) {
      // Utiliser une configuration temporaire
      configuration = {
        id: 'temp',
        userId,
        ...validatedData.configuration,
        createdAt: new Date(),
        updatedAt: new Date()
      };
    }

    // Générer les statistiques
    const result = await statisticsEngine.generateStatistics(configuration);
    
    // Sauvegarder le résultat en base si c'est une configuration persistante
    if (validatedData.configurationId && configuration.id !== 'temp') {
      try {
        // @ts-ignore - statisticsResult model not in Prisma schema yet
        await prisma.statisticsResult.create({
          data: {
            configId: parseInt(configuration.id),
            generatedBy: userId,
            datasets: result.datasets as any,
            summary: result.summary as any,
            statistics: result.statistics as any,
            insights: result.insights as any,
            processingTime: result.processingTime,
            dataPointsCount: result.dataPointsCount,
            cacheKey: result.cacheKey,
            expiresAt: result.expiresAt
          }
        });

        // Mettre à jour le cache de la configuration
        await configurationService.updateConfigCache(configuration.id, result);
      } catch (saveError) {
        console.error('Erreur sauvegarde résultat:', saveError);
        // Continue même si la sauvegarde échoue
      }
    }
    
    res.json({
      success: true,
      data: result,
      message: 'Statistiques générées avec succès'
    });
  } catch (error) {
    console.error('Erreur génération statistiques:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Données invalides',
        details: error.errors
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la génération des statistiques'
    });
  }
};

/**
 * Récupère un résultat de statistiques par ID
 */
export const getStatisticsResultById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    // @ts-ignore - statisticsResult model not in Prisma schema yet
    const result = await prisma.statisticsResult.findFirst({
      where: { 
        id: parseInt(id),
        config: {
          OR: [
            { userId },
            { isPublic: true }
          ]
        }
      },
      include: {
        config: true
      }
    });
    
    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'Résultat non trouvé'
      });
    }
    
    res.json({
      success: true,
      data: {
        id: result.id.toString(),
        configId: result.configId.toString(),
        configuration: result.config,
        datasets: result.datasets,
        summary: result.summary,
        statistics: result.statistics,
        insights: result.insights,
        processingTime: result.processingTime,
        dataPointsCount: result.dataPointsCount,
        cacheKey: result.cacheKey,
        createdAt: result.createdAt,
        expiresAt: result.expiresAt
      }
    });
  } catch (error) {
    console.error('Erreur récupération résultat:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération du résultat'
    });
  }
};

/**
 * Récupère les templates publics
 */
export const getStatisticsTemplates = async (req: Request, res: Response) => {
  try {
    const templates = await configurationService.getTemplates();
    
    res.json({
      success: true,
      data: templates
    });
  } catch (error) {
    console.error('Erreur récupération templates:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la récupération des templates'
    });
  }
};

/**
 * Crée une configuration depuis un template
 */
export const createFromTemplate = async (req: Request, res: Response) => {
  try {
    const { templateId } = req.params;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    const customizations = req.body;
    
    const configuration = await configurationService.createFromTemplate(
      templateId,
      userId,
      customizations
    );
    
    res.status(201).json({
      success: true,
      data: configuration,
      message: 'Configuration créée depuis le template avec succès'
    });
  } catch (error) {
    console.error('Erreur création depuis template:', error);
    
    if (error.message.includes('non trouvé')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la création depuis le template'
    });
  }
};

/**
 * Duplique une configuration
 */
export const duplicateConfig = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name } = req.body;
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'Utilisateur non authentifié' });
    }

    const configuration = await configurationService.duplicateConfig(id, userId, name);
    
    res.status(201).json({
      success: true,
      data: configuration,
      message: 'Configuration dupliquée avec succès'
    });
  } catch (error) {
    console.error('Erreur duplication configuration:', error);
    
    if (error.message.includes('non trouvée')) {
      return res.status(404).json({
        success: false,
        error: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      error: 'Erreur lors de la duplication de la configuration'
    });
  }
};