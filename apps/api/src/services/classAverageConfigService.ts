import { PrismaClient } from '@prisma/client';
import { Logger } from '../utils/logger';

export interface ClassAverageConfig {
  id: number;
  classId: number;
  userId: number;
  divisor: number;
  formula: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClassAverageConfigData {
  classId: number;
  divisor: number;
  formula: string;
}

export interface UpdateClassAverageConfigData {
  divisor?: number;
  formula?: string;
  isActive?: boolean;
}

export class ClassAverageConfigService {
  constructor(private prisma: PrismaClient) {}

  async getUserClassConfigs(userId: number): Promise<ClassAverageConfig[]> {
    try {
      Logger.info('Fetching user class average configs', { userId });

      const configs = await (this.prisma as any).class_average_configs.findMany({
        where: {
          user_id: userId,
          is_active: true,
        },
        include: {
          classes: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Transformer en camelCase pour le frontend
      const transformed = configs.map((config: any) => ({
        id: config.id,
        classId: config.class_id,
        userId: config.user_id,
        divisor: Number(config.divisor),
        formula: config.formula,
        isActive: config.is_active,
        createdAt: config.created_at,
        updatedAt: config.updated_at,
      }));

      Logger.info('User class average configs fetched successfully', { 
        userId, 
        configCount: transformed.length 
      });

      return transformed;
    } catch (error) {
      Logger.error('Failed to fetch user class average configs', error);
      throw new Error('Erreur lors de la récupération des configurations de moyennes');
    }
  }

  async getClassConfig(classId: number, userId: number): Promise<ClassAverageConfig | null> {
    try {
      Logger.info('Fetching class average config', { classId, userId });

      const config = await (this.prisma as any).class_average_configs.findFirst({
        where: {
          class_id: classId,
          user_id: userId,
          is_active: true,
        },
      });

      if (!config) {
        return null;
      }

      // Transformer en camelCase pour le frontend
      const transformed = {
        id: config.id,
        classId: config.class_id,
        userId: config.user_id,
        divisor: Number(config.divisor),
        formula: config.formula,
        isActive: config.is_active,
        createdAt: config.created_at,
        updatedAt: config.updated_at,
      };

      Logger.info('Class average config fetched successfully', { classId, userId });
      return transformed;
    } catch (error) {
      Logger.error('Failed to fetch class average config', error);
      throw new Error('Erreur lors de la récupération de la configuration de moyenne');
    }
  }

  async createOrUpdateConfig(userId: number, data: CreateClassAverageConfigData): Promise<ClassAverageConfig> {
    try {
      Logger.info('Creating or updating class average config', { 
        userId, 
        classId: data.classId, 
        divisor: data.divisor 
      });

      // Vérifier si une configuration existe déjà
      const existingConfig = await (this.prisma as any).class_average_configs.findFirst({
        where: {
          class_id: data.classId,
          user_id: userId,
        },
      });

      if (existingConfig) {
        // Mettre à jour la configuration existante
        const updatedConfig = await (this.prisma as any).class_average_configs.update({
          where: { id: existingConfig.id },
          data: {
            divisor: data.divisor,
            formula: data.formula,
            is_active: true,
          },
        });

        // Transformer en camelCase pour le frontend
        const transformed = {
          id: updatedConfig.id,
          classId: updatedConfig.class_id,
          userId: updatedConfig.user_id,
          divisor: Number(updatedConfig.divisor),
          formula: updatedConfig.formula,
          isActive: updatedConfig.is_active,
          createdAt: updatedConfig.created_at,
          updatedAt: updatedConfig.updated_at,
        };

        Logger.info('Class average config updated successfully', { 
          userId, 
          classId: data.classId, 
          configId: updatedConfig.id 
        });

        return transformed;
      } else {
        // Créer une nouvelle configuration
        const newConfig = await (this.prisma as any).class_average_configs.create({
          data: {
            class_id: data.classId,
            user_id: userId,
            divisor: data.divisor,
            formula: data.formula,
          },
        });

        // Transformer en camelCase pour le frontend
        const transformed = {
          id: newConfig.id,
          classId: newConfig.class_id,
          userId: newConfig.user_id,
          divisor: Number(newConfig.divisor),
          formula: newConfig.formula,
          isActive: newConfig.is_active,
          createdAt: newConfig.created_at,
          updatedAt: newConfig.updated_at,
        };

        Logger.info('Class average config created successfully', { 
          userId, 
          classId: data.classId, 
          configId: newConfig.id 
        });

        return transformed;
      }
    } catch (error) {
      Logger.error('Failed to create or update class average config', error);
      throw error;
    }
  }

  async deleteConfig(configId: number, userId: number): Promise<void> {
    try {
      Logger.info('Deleting class average config', { configId, userId });

      // Vérifier que la configuration appartient à l'utilisateur
      const existingConfig = await (this.prisma as any).class_average_configs.findFirst({
        where: {
          id: configId,
          user_id: userId,
        },
      });

      if (!existingConfig) {
        throw new Error('Configuration de moyenne non trouvée ou non autorisée');
      }

      await (this.prisma as any).class_average_configs.delete({
        where: { id: configId },
      });

      Logger.info('Class average config deleted successfully', { configId, userId });
    } catch (error) {
      Logger.error('Failed to delete class average config', error);
      throw error;
    }
  }

  async deleteConfigByClass(classId: number, userId: number): Promise<void> {
    try {
      Logger.info('Deleting class average config by class', { classId, userId });

      const existingConfig = await (this.prisma as any).class_average_configs.findFirst({
        where: {
          class_id: classId,
          user_id: userId,
        },
      });

      if (existingConfig) {
        await (this.prisma as any).class_average_configs.delete({
          where: { id: existingConfig.id },
        });

        Logger.info('Class average config deleted by class successfully', { classId, userId });
      }
    } catch (error) {
      Logger.error('Failed to delete class average config by class', error);
      throw error;
    }
  }
}
