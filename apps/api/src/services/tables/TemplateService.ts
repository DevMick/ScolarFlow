// ========================================
// TEMPLATE SERVICE - SERVICE TEMPLATES TABLEAUX
// ========================================

import { PrismaClient } from '@prisma/client';
import { 
  CustomTableTemplate, 
  CreateTableTemplateData,
  CustomTableConfig,
  TableCategory
} from '@edustats/shared/types';
import { ServiceError, NotFoundError, ValidationError, ForbiddenError } from '../../utils/errors';

/**
 * Service pour la gestion des templates de tableaux
 */
export class TemplateService {
  private prisma: PrismaClient;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
  }

  /**
   * Crée un nouveau template
   */
  async createTemplate(userId: number, data: CreateTableTemplateData): Promise<CustomTableTemplate> {
    try {
      this.validateTemplateData(data);

      const template = await this.prisma.customTableTemplate.create({
        data: {
          name: data.name,
          description: data.description,
          category: data.category,
          config: data.config as any,
          createdBy: userId,
          tags: data.tags || []
        }
      });

      return this.mapPrismaToTemplate(template);
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError('Erreur lors de la création du template', error);
    }
  }

  /**
   * Obtient tous les templates disponibles
   */
  async getTemplates(
    userId?: number,
    options: {
      category?: TableCategory;
      isOfficial?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ templates: CustomTableTemplate[]; total: number }> {
    try {
      const { category, isOfficial, search, page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;

      const where: any = {
        OR: [
          { isOfficial: true },
          { createdBy: userId }
        ]
      };

      if (category) where.category = category;
      if (isOfficial !== undefined) where.isOfficial = isOfficial;
      if (search) {
        where.AND = [
          where,
          {
            OR: [
              { name: { contains: search, mode: 'insensitive' } },
              { description: { contains: search, mode: 'insensitive' } }
            ]
          }
        ];
      }

      const [templates, total] = await Promise.all([
        this.prisma.customTableTemplate.findMany({
          where,
          include: {
            creator: { select: { firstName: true, lastName: true } }
          },
          orderBy: [
            { isOfficial: 'desc' },
            { usageCount: 'desc' },
            { createdAt: 'desc' }
          ],
          skip,
          take: limit
        }),
        this.prisma.customTableTemplate.count({ where })
      ]);

      return {
        templates: templates.map(template => this.mapPrismaToTemplate(template)),
        total
      };
    } catch (error) {
      throw new ServiceError('Erreur lors de la récupération des templates', error);
    }
  }

  /**
   * Obtient un template par ID
   */
  async getTemplateById(templateId: string): Promise<CustomTableTemplate> {
    try {
      const template = await this.prisma.customTableTemplate.findUnique({
        where: { id: parseInt(templateId) },
        include: {
          creator: { select: { firstName: true, lastName: true } }
        }
      });

      if (!template) {
        throw new NotFoundError('Template non trouvé');
      }

      return this.mapPrismaToTemplate(template);
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError('Erreur lors de la récupération du template', error);
    }
  }

  /**
   * Met à jour un template
   */
  async updateTemplate(
    userId: number, 
    templateId: string, 
    data: Partial<CreateTableTemplateData>
  ): Promise<CustomTableTemplate> {
    try {
      const existingTemplate = await this.prisma.customTableTemplate.findUnique({
        where: { id: parseInt(templateId) }
      });

      if (!existingTemplate) {
        throw new NotFoundError('Template non trouvé');
      }

      // Seuls les créateurs ou admins peuvent modifier
      if (existingTemplate.createdBy !== userId && !existingTemplate.isOfficial) {
        throw new ForbiddenError('Vous ne pouvez modifier que vos propres templates');
      }

      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.category) updateData.category = data.category;
      if (data.config) updateData.config = data.config;
      if (data.tags) updateData.tags = data.tags;

      const updatedTemplate = await this.prisma.customTableTemplate.update({
        where: { id: parseInt(templateId) },
        data: updateData,
        include: {
          creator: { select: { firstName: true, lastName: true } }
        }
      });

      return this.mapPrismaToTemplate(updatedTemplate);
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError('Erreur lors de la mise à jour du template', error);
    }
  }

  /**
   * Supprime un template
   */
  async deleteTemplate(userId: number, templateId: string): Promise<void> {
    try {
      const template = await this.prisma.customTableTemplate.findUnique({
        where: { id: parseInt(templateId) }
      });

      if (!template) {
        throw new NotFoundError('Template non trouvé');
      }

      // Seuls les créateurs peuvent supprimer (pas les templates officiels)
      if (template.createdBy !== userId || template.isOfficial) {
        throw new ForbiddenError('Vous ne pouvez supprimer que vos propres templates non officiels');
      }

      await this.prisma.customTableTemplate.delete({
        where: { id: parseInt(templateId) }
      });
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError('Erreur lors de la suppression du template', error);
    }
  }

  /**
   * Utilise un template pour créer un tableau
   */
  async useTemplate(templateId: string): Promise<Partial<CustomTableConfig>> {
    try {
      const template = await this.getTemplateById(templateId);

      // Incrémenter le compteur d'utilisation
      await this.prisma.customTableTemplate.update({
        where: { id: parseInt(templateId) },
        data: { usageCount: { increment: 1 } }
      });

      return template.config;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError('Erreur lors de l\'utilisation du template', error);
    }
  }

  /**
   * Obtient les templates les plus populaires
   */
  async getPopularTemplates(limit = 10): Promise<CustomTableTemplate[]> {
    try {
      const templates = await this.prisma.customTableTemplate.findMany({
        where: {
          OR: [
            { isOfficial: true },
            { usageCount: { gt: 0 } }
          ]
        },
        include: {
          creator: { select: { firstName: true, lastName: true } }
        },
        orderBy: { usageCount: 'desc' },
        take: limit
      });

      return templates.map(template => this.mapPrismaToTemplate(template));
    } catch (error) {
      throw new ServiceError('Erreur lors de la récupération des templates populaires', error);
    }
  }

  /**
   * Obtient les templates par catégorie
   */
  async getTemplatesByCategory(): Promise<Record<string, CustomTableTemplate[]>> {
    try {
      const templates = await this.prisma.customTableTemplate.findMany({
        where: {
          OR: [
            { isOfficial: true },
            { usageCount: { gt: 0 } }
          ]
        },
        include: {
          creator: { select: { firstName: true, lastName: true } }
        },
        orderBy: [
          { isOfficial: 'desc' },
          { usageCount: 'desc' }
        ]
      });

      const templatesByCategory: Record<string, CustomTableTemplate[]> = {};

      templates.forEach(template => {
        const category = template.category || 'custom';
        if (!templatesByCategory[category]) {
          templatesByCategory[category] = [];
        }
        templatesByCategory[category].push(this.mapPrismaToTemplate(template));
      });

      return templatesByCategory;
    } catch (error) {
      throw new ServiceError('Erreur lors de la récupération des templates par catégorie', error);
    }
  }

  /**
   * Crée un template à partir d'un tableau existant
   */
  async createTemplateFromTable(
    userId: number, 
    tableId: string, 
    templateData: {
      name: string;
      description?: string;
      category: TableCategory;
      tags?: string[];
    }
  ): Promise<CustomTableTemplate> {
    try {
      // Récupérer le tableau source
      const sourceTable = await this.prisma.customTable.findUnique({
        where: { id: parseInt(tableId) }
      });

      if (!sourceTable) {
        throw new NotFoundError('Tableau source non trouvé');
      }

      if (sourceTable.userId !== userId) {
        throw new ForbiddenError('Vous ne pouvez créer un template qu\'à partir de vos propres tableaux');
      }

      // Créer le template
      const template = await this.createTemplate(userId, {
        name: templateData.name,
        description: templateData.description,
        category: templateData.category,
        config: sourceTable.config as any,
        tags: templateData.tags
      });

      return template;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError('Erreur lors de la création du template depuis le tableau', error);
    }
  }

  /**
   * Obtient les statistiques d'utilisation des templates
   */
  async getTemplateStats(): Promise<{
    totalTemplates: number;
    officialTemplates: number;
    userTemplates: number;
    totalUsage: number;
    topTemplates: Array<{ name: string; usageCount: number }>;
  }> {
    try {
      const [
        totalTemplates,
        officialTemplates,
        userTemplates,
        usageStats,
        topTemplates
      ] = await Promise.all([
        this.prisma.customTableTemplate.count(),
        this.prisma.customTableTemplate.count({ where: { isOfficial: true } }),
        this.prisma.customTableTemplate.count({ where: { isOfficial: false } }),
        this.prisma.customTableTemplate.aggregate({
          _sum: { usageCount: true }
        }),
        this.prisma.customTableTemplate.findMany({
          select: { name: true, usageCount: true },
          orderBy: { usageCount: 'desc' },
          take: 5
        })
      ]);

      return {
        totalTemplates,
        officialTemplates,
        userTemplates,
        totalUsage: usageStats._sum.usageCount || 0,
        topTemplates
      };
    } catch (error) {
      throw new ServiceError('Erreur lors de la récupération des statistiques', error);
    }
  }

  /**
   * Valide les données d'un template
   */
  private validateTemplateData(data: CreateTableTemplateData): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Le nom du template est requis');
    }

    if (data.name.length > 200) {
      throw new ValidationError('Le nom du template ne peut pas dépasser 200 caractères');
    }

    if (!data.config || !data.config.columns || data.config.columns.length === 0) {
      throw new ValidationError('Le template doit avoir au moins une colonne');
    }

    // Valider la configuration
    if (data.config.columns.length > 50) {
      throw new ValidationError('Le template ne peut pas avoir plus de 50 colonnes');
    }
  }

  /**
   * Mappe un objet Prisma vers CustomTableTemplate
   */
  private mapPrismaToTemplate(prismaTemplate: any): CustomTableTemplate {
    return {
      id: prismaTemplate.id.toString(),
      name: prismaTemplate.name,
      description: prismaTemplate.description,
      category: prismaTemplate.category,
      config: prismaTemplate.config,
      isOfficial: prismaTemplate.isOfficial,
      createdBy: prismaTemplate.createdBy,
      usageCount: prismaTemplate.usageCount,
      tags: prismaTemplate.tags || [],
      createdAt: prismaTemplate.createdAt,
      updatedAt: prismaTemplate.updatedAt
    };
  }
}
