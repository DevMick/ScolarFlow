import { PrismaClient } from '@prisma/client';
import { Logger } from '../utils/logger';
import type { 
  SchoolYear, 
  CreateSchoolYearData, 
  UpdateSchoolYearData 
} from '@edustats/shared';

export class SchoolYearService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Créer une nouvelle année scolaire
   */
  async create(userId: number, data: CreateSchoolYearData): Promise<SchoolYear> {
    try {
      Logger.info('Creating school year', { userId, startYear: data.startYear, endYear: data.endYear });

      // Vérifier s'il y a un chevauchement avec une année scolaire existante
      const overlapping = await (this.prisma as any).school_years.findFirst({
        where: {
          user_id: userId,
          OR: [
            {
              // Chevauchement : la nouvelle période chevauche une existante
              AND: [
                { start_year: { lte: data.endYear } },
                { end_year: { gte: data.startYear } }
              ]
            }
          ]
        },
      });

      if (overlapping) {
        throw new Error(
          `Une année scolaire existe déjà pour cette période (${overlapping.start_year}-${overlapping.end_year}). Veuillez choisir des années différentes.`
        );
      }

      // Si c'est la première année scolaire, la rendre active par défaut
      const count = await (this.prisma as any).school_years.count({
        where: { user_id: userId },
      });

      const schoolYear = await (this.prisma as any).school_years.create({
        data: {
          user_id: userId,
          start_year: data.startYear,
          end_year: data.endYear,
          is_active: count === 0, // Première année = active
        },
      });

      // Transformer en camelCase pour le frontend
      const transformed: SchoolYear = {
        id: schoolYear.id,
        userId: schoolYear.user_id,
        startYear: schoolYear.start_year,
        endYear: schoolYear.end_year,
        isActive: schoolYear.is_active,
        createdAt: schoolYear.created_at,
        updatedAt: schoolYear.updated_at,
      };

      Logger.info('School year created successfully', { 
        schoolYearId: schoolYear.id, 
        startYear: schoolYear.start_year,
        endYear: schoolYear.end_year
      });

      return transformed;
    } catch (error) {
      Logger.error('Failed to create school year', error);
      throw error;
    }
  }

  /**
   * Récupérer toutes les années scolaires d'un utilisateur
   */
  async getAllByUser(userId: number): Promise<SchoolYear[]> {
    try {
      const schoolYears = await (this.prisma as any).school_years.findMany({
        where: { user_id: userId },
        orderBy: { start_year: 'desc' }, // Plus récentes en premier
      });

      // Transformer en camelCase pour le frontend
      return schoolYears.map((sy: any) => ({
        id: sy.id,
        userId: sy.user_id,
        startYear: sy.start_year,
        endYear: sy.end_year,
        isActive: sy.is_active,
        createdAt: sy.created_at,
        updatedAt: sy.updated_at,
      }));
    } catch (error) {
      Logger.error('Failed to get school years', error);
      return [];
    }
  }

  /**
   * Récupérer l'année scolaire active
   */
  async getActive(userId: number): Promise<SchoolYear | null> {
    try {
      const activeSchoolYear = await (this.prisma as any).school_years.findFirst({
        where: {
          user_id: userId,
          is_active: true,
        },
      });

      if (!activeSchoolYear) {
        return null;
      }

      // Transformer en camelCase pour le frontend
      return {
        id: activeSchoolYear.id,
        userId: activeSchoolYear.user_id,
        startYear: activeSchoolYear.start_year,
        endYear: activeSchoolYear.end_year,
        isActive: activeSchoolYear.is_active,
        createdAt: activeSchoolYear.created_at,
        updatedAt: activeSchoolYear.updated_at,
      };
    } catch (error) {
      Logger.error('Failed to get active school year', error);
      return null;
    }
  }

  /**
   * Récupérer une année scolaire par ID
   */
  async getById(id: number, userId: number): Promise<SchoolYear | null> {
    try {
      const schoolYear = await (this.prisma as any).school_years.findFirst({
        where: {
          id,
          user_id: userId,
        },
      });

      if (!schoolYear) {
        return null;
      }

      // Transformer en camelCase pour le frontend
      return {
        id: schoolYear.id,
        userId: schoolYear.user_id,
        startYear: schoolYear.start_year,
        endYear: schoolYear.end_year,
        isActive: schoolYear.is_active,
        createdAt: schoolYear.created_at,
        updatedAt: schoolYear.updated_at,
      };
    } catch (error) {
      Logger.error('Failed to get school year by ID', error);
      return null;
    }
  }

  /**
   * Mettre à jour une année scolaire
   */
  async update(
    id: number, 
    userId: number, 
    data: UpdateSchoolYearData
  ): Promise<SchoolYear> {
    try {
      Logger.info('Updating school year', { id, userId });

      // Vérifier que l'année scolaire existe et appartient à l'utilisateur
      const schoolYear = await this.getById(id, userId);
      if (!schoolYear) {
        throw new Error('Année scolaire non trouvée');
      }

      // Si on active cette année, désactiver les autres
      if (data.isActive) {
        await (this.prisma as any).school_years.updateMany({
          where: {
            user_id: userId,
            id: { not: id },
          },
          data: {
            is_active: false,
          },
        });
      }

      // Mettre à jour l'année scolaire
      const updated = await (this.prisma as any).school_years.update({
        where: { id },
        data: {
          start_year: data.startYear,
          end_year: data.endYear,
          is_active: data.isActive,
        },
      });

      // Transformer en camelCase pour le frontend
      const transformed: SchoolYear = {
        id: updated.id,
        userId: updated.user_id,
        startYear: updated.start_year,
        endYear: updated.end_year,
        isActive: updated.is_active,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      };

      Logger.info('School year updated successfully', { id });
      return transformed;
    } catch (error) {
      Logger.error('Failed to update school year', error);
      throw error;
    }
  }

  /**
   * Activer une année scolaire (désactive les autres)
   */
  async setActive(id: number, userId: number): Promise<SchoolYear> {
    try {
      Logger.info('Setting active school year', { id, userId });

      // Vérifier que l'année scolaire existe et appartient à l'utilisateur
      const schoolYear = await this.getById(id, userId);
      if (!schoolYear) {
        throw new Error('Année scolaire non trouvée');
      }

      // Désactiver toutes les autres années
      await (this.prisma as any).school_years.updateMany({
        where: {
          user_id: userId,
          id: { not: id },
        },
        data: {
          is_active: false,
        },
      });

      // Activer l'année sélectionnée
      const updated = await (this.prisma as any).school_years.update({
        where: { id },
        data: {
          is_active: true,
        },
      });

      // Transformer en camelCase pour le frontend
      const transformed: SchoolYear = {
        id: updated.id,
        userId: updated.user_id,
        startYear: updated.start_year,
        endYear: updated.end_year,
        isActive: updated.is_active,
        createdAt: updated.created_at,
        updatedAt: updated.updated_at,
      };

      Logger.info('School year activated successfully', { id });
      return transformed;
    } catch (error) {
      Logger.error('Failed to activate school year', error);
      throw error;
    }
  }

  /**
   * Supprimer une année scolaire
   */
  async delete(id: number, userId: number): Promise<void> {
    try {
      Logger.info('Deleting school year', { id, userId });

      // Vérifier que l'année scolaire existe et appartient à l'utilisateur
      const schoolYear = await this.getById(id, userId);
      if (!schoolYear) {
        throw new Error('Année scolaire non trouvée');
      }

      // Vérifier s'il y a des classes associées
      const classCount = await (this.prisma as any).classes.count({
        where: { school_year_id: id },
      });

      if (classCount > 0) {
        throw new Error(
          `Impossible de supprimer cette année scolaire car elle contient ${classCount} classe(s)`
        );
      }

      await (this.prisma as any).school_years.delete({
        where: { id },
      });

      Logger.info('School year deleted successfully', { id });
    } catch (error) {
      Logger.error('Failed to delete school year', error);
      throw error;
    }
  }

  /**
   * Vérifier si une année scolaire a des classes
   */
  async hasClasses(id: number): Promise<boolean> {
    try {
      const count = await (this.prisma as any).classes.count({
        where: { school_year_id: id },
      });

      return count > 0;
    } catch (error) {
      Logger.error('Failed to check if school year has classes', error);
      return false;
    }
  }
}

