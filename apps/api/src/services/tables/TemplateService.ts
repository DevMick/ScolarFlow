// ========================================
// TEMPLATE SERVICE - SERVICE TEMPLATES TABLEAUX
// ========================================

import { PrismaClient } from '@prisma/client';
// TODO: @edustats/shared/types n'existe pas
// Types locaux temporaires
type CustomTableTemplate = any;
type CreateTableTemplateData = any;
type CustomTableConfig = any;
type TableCategory = any;
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

      // TODO: customTableTemplate n'existe pas dans le schéma Prisma
      throw new Error('customTableTemplate model not available in Prisma schema');
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

      // TODO: customTableTemplate n'existe pas dans le schéma Prisma
      const templates: any[] = [];
      const total = 0;

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
      // TODO: customTableTemplate n'existe pas dans le schéma Prisma
      const template: any = null;
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
      // TODO: customTableTemplate n'existe pas dans le schéma Prisma
      throw new Error('customTableTemplate model not available');
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
      // TODO: customTableTemplate n'existe pas dans le schéma Prisma
      throw new Error('customTableTemplate model not available');
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
      // TODO: customTableTemplate n'existe pas dans le schéma Prisma
      throw new Error('customTableTemplate model not available');
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
      // TODO: customTableTemplate n'existe pas dans le schéma Prisma
      return [];
    } catch (error) {
      throw new ServiceError('Erreur lors de la récupération des templates populaires', error);
    }
  }

  /**
   * Obtient les templates par catégorie
   */
  async getTemplatesByCategory(): Promise<Record<string, CustomTableTemplate[]>> {
    try {
      // TODO: customTableTemplate n'existe pas dans le schéma Prisma
      return {};
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
      // TODO: customTable n'existe pas dans le schéma Prisma
      throw new Error('customTable model not available in Prisma schema');
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
      // TODO: customTableTemplate n'existe pas dans le schéma Prisma
      const totalTemplates = 0;
      const officialTemplates = 0;
      const userTemplates = 0;
      const usageStats: any = { _sum: { usageCount: 0 } };
      const topTemplates: any[] = [];

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
