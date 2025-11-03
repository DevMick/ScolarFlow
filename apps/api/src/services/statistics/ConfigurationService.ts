// ========================================
// CONFIGURATION SERVICE - GESTION DES CONFIGURATIONS STATISTIQUES
// ========================================

import { PrismaClient } from '@prisma/client';
// TODO: @edustats/shared/types/statistics n'existe pas
// Types locaux temporaires
type StatisticConfiguration = any;
type CreateStatisticConfigurationData = any;
type UpdateStatisticConfigurationData = any;
type StatisticCategory = any;
const statisticsTemplates: any[] = [];

/**
 * Interface pour les filtres de recherche
 */
interface ConfigurationFilters {
  userId?: number;
  category?: StatisticCategory;
  isTemplate?: boolean;
  isPublic?: boolean;
  tags?: string[];
  search?: string;
}

/**
 * Interface pour la pagination
 */
interface PaginationOptions {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Service de gestion des configurations statistiques
 */
export class ConfigurationService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Crée une nouvelle configuration
   */
  async createConfig(userId: number, data: CreateStatisticConfigurationData): Promise<StatisticConfiguration> {
    try {
      // TODO: statisticsConfig n'existe pas dans le schéma Prisma
      throw new Error('statisticsConfig model not available in Prisma schema');
      /* const config = await this.prisma.statisticsConfig.create({
        data: {
          userId,
          name: data.name,
          description: data.description,
          category: data.category,
          dataSources: data.dataSources as any,
          calculations: data.calculations as any,
          visualization: data.visualization as any,
          isTemplate: data.isTemplate || false,
          isPublic: data.isPublic || false,
          tags: data.tags || []
        }
      });

      return this.mapToStatisticConfiguration(config);
    } catch (error) {
      console.error('Erreur création configuration:', error);
      throw new Error('Erreur lors de la création de la configuration');
    }
  }

  /**
   * Récupère les configurations avec filtres et pagination
   */
  async getConfigs(
    filters: ConfigurationFilters = {},
    pagination: PaginationOptions = {}
  ): Promise<{ configurations: StatisticConfiguration[]; total: number }> {
    try {
      const { page = 1, limit = 20, sortBy = 'updatedAt', sortOrder = 'desc' } = pagination;
      const skip = (page - 1) * limit;

      // Construction des conditions WHERE
      const whereConditions: any = {};

      if (filters.userId) {
        whereConditions.userId = filters.userId;
      }

      if (filters.category) {
        whereConditions.category = filters.category;
      }

      if (filters.isTemplate !== undefined) {
        whereConditions.isTemplate = filters.isTemplate;
      }

      if (filters.isPublic !== undefined) {
        whereConditions.isPublic = filters.isPublic;
      }

      if (filters.tags && filters.tags.length > 0) {
        whereConditions.tags = {
          hasSome: filters.tags
        };
      }

      if (filters.search) {
        whereConditions.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
          { description: { contains: filters.search, mode: 'insensitive' } }
        ];
      }

      // Récupération des configurations
      // TODO: statisticsConfig n'existe pas dans le schéma Prisma
      const configurations: any[] = [];
      const total = 0;
      /* const [configurations, total] = await Promise.all([
        this.prisma.statisticsConfig.findMany({
          where: whereConditions,
          skip,
          take: limit,
          orderBy: { [sortBy]: sortOrder },
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true
              }
            }
          }
        }),
        this.prisma.statisticsConfig.count({ where: whereConditions })
      ]); */

      return {
        configurations: configurations.map(config => this.mapToStatisticConfiguration(config)),
        total
      };
    } catch (error) {
      console.error('Erreur récupération configurations:', error);
      throw new Error('Erreur lors de la récupération des configurations');
    }
  }

  /**
   * Récupère une configuration par ID
   */
  async getConfigById(id: string, userId?: number): Promise<StatisticConfiguration | null> {
    try {
      const whereCondition: any = { id: parseInt(id) };

      // Si un userId est fourni, vérifier que l'utilisateur a accès à la configuration
      if (userId) {
        whereCondition.OR = [
          { userId },
          { isPublic: true }
        ];
      }

      // TODO: statisticsConfig n'existe pas dans le schéma Prisma
      const config: any = null;
      /* const config = await this.prisma.statisticsConfig.findFirst({
        where: whereCondition,
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }); */

      // TODO: config n'est plus disponible car statisticsConfig n'existe pas
      return null;
    } catch (error) {
      console.error('Erreur récupération configuration:', error);
      throw new Error('Erreur lors de la récupération de la configuration');
    }
  }

  /**
   * Met à jour une configuration
   */
  async updateConfig(
    id: string,
    userId: number,
    data: Partial<UpdateStatisticConfigurationData>
  ): Promise<StatisticConfiguration> {
    try {
      // Vérifier que l'utilisateur est propriétaire de la configuration
      // TODO: statisticsConfig n'existe pas dans le schéma Prisma
      const existingConfig: any = null;
      /* const existingConfig = await this.prisma.statisticsConfig.findFirst({
        where: { id: parseInt(id), userId }
      });

      if (!existingConfig) {
        throw new Error('Configuration non trouvée ou accès non autorisé');
      }

      // TODO: statisticsConfig n'existe pas dans le schéma Prisma
      throw new Error('statisticsConfig model not available');
      /* const updatedConfig = await this.prisma.statisticsConfig.update({
        where: { id: parseInt(id) },
        data: {
          ...data.name && { name: data.name },
          ...data.description && { description: data.description },
          ...data.category && { category: data.category },
          ...data.dataSources && { dataSources: data.dataSources as any },
          ...data.calculations && { calculations: data.calculations as any },
          ...data.visualization && { visualization: data.visualization as any },
          ...data.isTemplate !== undefined && { isTemplate: data.isTemplate },
          ...data.isPublic !== undefined && { isPublic: data.isPublic },
          ...data.tags && { tags: data.tags },
          // Réinitialiser le cache si la configuration change
          lastResult: null,
          lastGenerated: null
        }
      }); */

      // TODO: updatedConfig n'est plus disponible car statisticsConfig n'existe pas
      throw new Error('statisticsConfig model not available');
      // return this.mapToStatisticConfiguration(updatedConfig);
    } catch (error) {
      console.error('Erreur mise à jour configuration:', error);
      throw new Error('Erreur lors de la mise à jour de la configuration');
    }
  }

  /**
   * Supprime une configuration
   */
  async deleteConfig(id: string, userId: number): Promise<void> {
    try {
      // Vérifier que l'utilisateur est propriétaire de la configuration
      // TODO: statisticsConfig n'existe pas dans le schéma Prisma
      const existingConfig: any = null;
      /* const existingConfig = await this.prisma.statisticsConfig.findFirst({
        where: { id: parseInt(id), userId }
      });

      if (!existingConfig) {
        throw new Error('Configuration non trouvée ou accès non autorisé');
      }

      // TODO: statisticsConfig n'existe pas dans le schéma Prisma
      throw new Error('statisticsConfig model not available');
      /* await this.prisma.statisticsConfig.delete({
        where: { id: parseInt(id) }
      });
    } catch (error) {
      console.error('Erreur suppression configuration:', error);
      throw new Error('Erreur lors de la suppression de la configuration');
    }
  }

  /**
   * Duplique une configuration
   */
  async duplicateConfig(id: string, userId: number, newName?: string): Promise<StatisticConfiguration> {
    try {
      const originalConfig = await this.getConfigById(id, userId);
      if (!originalConfig) {
        throw new Error('Configuration non trouvée');
      }

      const duplicatedData: CreateStatisticConfigurationData = {
        name: newName || `${originalConfig.name} (Copie)`,
        description: originalConfig.description,
        category: originalConfig.category,
        dataSources: originalConfig.dataSources,
        calculations: originalConfig.calculations,
        visualization: originalConfig.visualization,
        isTemplate: false, // Les copies ne sont pas des templates par défaut
        isPublic: false,   // Les copies sont privées par défaut
        tags: originalConfig.tags
      };

      return await this.createConfig(userId, duplicatedData);
    } catch (error) {
      console.error('Erreur duplication configuration:', error);
      throw new Error('Erreur lors de la duplication de la configuration');
    }
  }

  /**
   * Récupère les templates publics
   */
  async getTemplates(): Promise<StatisticConfiguration[]> {
    try {
      // TODO: statisticsConfig n'existe pas dans le schéma Prisma
      const templates: any[] = [];
      /* const templates = await this.prisma.statisticsConfig.findMany({
        where: {
          OR: [
            { isTemplate: true, isPublic: true },
            { isTemplate: true } // Pour les templates système
          ]
        },
        orderBy: [
          { isPublic: 'desc' }, // Templates publics en premier
          { updatedAt: 'desc' }
        ],
        include: {
          user: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      }); */

      // TODO: templates n'est plus disponible car statisticsConfig n'existe pas
      return [];
    } catch (error) {
      console.error('Erreur récupération templates:', error);
      throw new Error('Erreur lors de la récupération des templates');
    }
  }

  /**
   * Crée une configuration depuis un template
   */
  async createFromTemplate(
    templateId: string,
    userId: number,
    customizations?: Partial<CreateStatisticConfigurationData>
  ): Promise<StatisticConfiguration> {
    try {
      // Récupérer le template
      const template = await this.getConfigById(templateId);
      if (!template || !template.isTemplate) {
        throw new Error('Template non trouvé');
      }

      // Créer la nouvelle configuration basée sur le template
      const configData: CreateStatisticConfigurationData = {
        name: customizations?.name || `${template.name} - Ma copie`,
        description: customizations?.description || template.description,
        category: customizations?.category || template.category,
        dataSources: customizations?.dataSources || template.dataSources,
        calculations: customizations?.calculations || template.calculations,
        visualization: customizations?.visualization || template.visualization,
        isTemplate: false,
        isPublic: customizations?.isPublic || false,
        tags: customizations?.tags || template.tags
      };

      return await this.createConfig(userId, configData);
    } catch (error) {
      console.error('Erreur création depuis template:', error);
      throw new Error('Erreur lors de la création depuis le template');
    }
  }

  /**
   * Met à jour le cache d'un résultat
   */
  async updateConfigCache(id: string, result: any): Promise<void> {
    try {
      // TODO: statisticsConfig n'existe pas dans le schéma Prisma
      throw new Error('statisticsConfig model not available');
      /* await this.prisma.statisticsConfig.update({
        where: { id: parseInt(id) },
        data: {
          lastResult: result,
          lastGenerated: new Date()
        }
      });
    } catch (error) {
      console.error('Erreur mise à jour cache:', error);
      // Ne pas propager l'erreur, le cache n'est pas critique
    }
  }

  /**
   * Initialise les templates système
   */
  async initializeSystemTemplates(): Promise<void> {
    try {
      // Vérifier si les templates système existent déjà
      // TODO: statisticsConfig n'existe pas dans le schéma Prisma
      const existingTemplates = 0;
      /* const existingTemplates = await this.prisma.statisticsConfig.count({
        where: { isTemplate: true, userId: 1 } // User ID 1 pour les templates système
      });

      if (existingTemplates === 0) {
        // Créer les templates système depuis les données partagées
        for (const template of statisticsTemplates) {
          // TODO: statisticsConfig n'existe pas dans le schéma Prisma
          // await this.prisma.statisticsConfig.create({
            data: {
              userId: 1, // User système
              name: template.name,
              description: template.description,
              category: template.category,
              dataSources: template.dataSources as any,
              calculations: template.calculations as any,
              visualization: template.visualization as any,
              isTemplate: true,
              isPublic: true,
              tags: template.tags
            }
          });
        }
        console.log('Templates système initialisés');
      }
    } catch (error) {
      console.error('Erreur initialisation templates système:', error);
    }
  }

  /**
   * Convertit un objet Prisma en StatisticConfiguration
   */
  private mapToStatisticConfiguration(config: any): StatisticConfiguration {
    return {
      id: config.id.toString(),
      userId: config.userId,
      name: config.name,
      description: config.description,
      category: config.category,
      dataSources: config.dataSources,
      calculations: config.calculations,
      visualization: config.visualization,
      isTemplate: config.isTemplate,
      isPublic: config.isPublic,
      tags: config.tags || [],
      lastResult: config.lastResult,
      lastGenerated: config.lastGenerated,
      createdAt: config.createdAt,
      updatedAt: config.updatedAt
    };
  }
}

export default ConfigurationService;