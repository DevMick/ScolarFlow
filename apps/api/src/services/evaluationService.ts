import { PrismaClient } from '@prisma/client';
import { CreateEvaluationSimpleData, UpdateEvaluationSimpleData, EvaluationSimple } from '@edustats/shared';
import { prisma as globalPrisma } from '../lib/prisma';

export class EvaluationService {
  private prisma: PrismaClient;

  constructor(prisma?: PrismaClient, calculationService?: any, validationService?: any) {
    this.prisma = prisma || globalPrisma;
  }

  // Récupérer toutes les évaluations d'une classe
  async getEvaluationsByClass(classId: number, userId: number): Promise<EvaluationSimple[]> {
    try {
      // Vérifier que la classe appartient à l'utilisateur
      const classExists = await (this.prisma as any).classes.findFirst({
        where: {
          id: classId,
          user_id: userId,
        },
      });

      if (!classExists) {
        throw new Error('Classe non trouvée ou accès non autorisé');
      }

      const evaluations = await (this.prisma as any).evaluations.findMany({
        where: {
          class_id: classId,
        },
        include: {
          classes: {
            select: {
              id: true,
              name: true,
            },
          },
          school_years: {
            select: {
              id: true,
              start_year: true,
              end_year: true,
              is_active: true,
            },
          },
        },
        orderBy: {
          date: 'desc',
        },
      });

      // Transformer en camelCase pour le frontend
      return evaluations.map((evaluation: any) => ({
        id: evaluation.id,
        classId: evaluation.class_id,
        schoolYearId: evaluation.school_year_id,
        nom: evaluation.nom,
        date: evaluation.date.toISOString().split('T')[0],
        createdAt: evaluation.created_at.toISOString(),
        updatedAt: evaluation.updated_at.toISOString(),
        class: evaluation.classes,
        schoolYear: {
          id: evaluation.school_years.id,
          startYear: evaluation.school_years.start_year,
          endYear: evaluation.school_years.end_year,
          name: `${evaluation.school_years.start_year}-${evaluation.school_years.end_year}`,
        },
      }));
    } catch (error) {
      console.error('Erreur lors de la récupération des évaluations:', error);
      throw error;
    }
  }

  // Créer une nouvelle évaluation
  async createEvaluation(data: CreateEvaluationSimpleData, userId: number): Promise<EvaluationSimple> {
    try {
      // Vérifier que la classe appartient à l'utilisateur
      const classExists = await (this.prisma as any).classes.findFirst({
        where: {
          id: data.classId,
          user_id: userId,
        },
      });

      if (!classExists) {
        throw new Error('Classe non trouvée ou accès non autorisé');
      }

      // Validation des données
      if (!data.nom || data.nom.trim().length < 2) {
        throw new Error('Le nom de l\'évaluation doit contenir au moins 2 caractères');
      }

      if (data.nom.trim().length > 200) {
        throw new Error('Le nom de l\'évaluation ne peut pas dépasser 200 caractères');
      }

      if (!data.date) {
        throw new Error('La date de l\'évaluation est requise');
      }

      const evaluationDate = new Date(data.date);
      if (isNaN(evaluationDate.getTime())) {
        throw new Error('Format de date invalide');
      }

      const newEvaluation = await (this.prisma as any).evaluations.create({
        data: {
          class_id: data.classId,
          school_year_id: data.schoolYearId,
          nom: data.nom.trim(),
          date: evaluationDate,
        },
        include: {
          classes: {
            select: {
              id: true,
              name: true,
            },
          },
          school_years: {
            select: {
              id: true,
              start_year: true,
              end_year: true,
              is_active: true,
            },
          },
        },
      });

      // Transformer en camelCase pour le frontend
      return {
        id: newEvaluation.id,
        classId: newEvaluation.class_id,
        schoolYearId: newEvaluation.school_year_id,
        nom: newEvaluation.nom,
        date: newEvaluation.date.toISOString().split('T')[0],
        createdAt: newEvaluation.created_at.toISOString(),
        updatedAt: newEvaluation.updated_at.toISOString(),
        class: newEvaluation.classes,
        schoolYear: {
          id: newEvaluation.school_years.id,
          startYear: newEvaluation.school_years.start_year,
          endYear: newEvaluation.school_years.end_year,
          name: `${newEvaluation.school_years.start_year}-${newEvaluation.school_years.end_year}`,
        },
      };
    } catch (error) {
      console.error('Erreur lors de la création de l\'évaluation:', error);
      throw error;
    }
  }

  // Mettre à jour une évaluation
  async updateEvaluation(
    id: number,
    data: UpdateEvaluationSimpleData,
    userId: number
  ): Promise<EvaluationSimple> {
    try {
      // Vérifier que l'évaluation existe et appartient à l'utilisateur
      const existingEvaluation = await (this.prisma as any).evaluations.findFirst({
        where: {
          id: id,
          classes: {
            user_id: userId,
          },
        },
        include: {
          classes: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      if (!existingEvaluation) {
        throw new Error('Évaluation non trouvée ou accès non autorisé');
      }

      // Validation des données si fournies
      if (data.nom !== undefined) {
        if (!data.nom || data.nom.trim().length < 2) {
          throw new Error('Le nom de l\'évaluation doit contenir au moins 2 caractères');
        }

        if (data.nom.trim().length > 200) {
          throw new Error('Le nom de l\'évaluation ne peut pas dépasser 200 caractères');
        }
      }

      if (data.date !== undefined) {
        if (!data.date) {
          throw new Error('La date de l\'évaluation est requise');
        }

        const evaluationDate = new Date(data.date);
        if (isNaN(evaluationDate.getTime())) {
          throw new Error('Format de date invalide');
        }
      }

      const updateData: any = {};
      if (data.nom !== undefined) {
        updateData.nom = data.nom.trim();
      }
      if (data.date !== undefined) {
        updateData.date = new Date(data.date);
      }
      if (data.schoolYearId !== undefined) {
        updateData.school_year_id = data.schoolYearId;
      }

      const updatedEvaluation = await (this.prisma as any).evaluations.update({
        where: { id: id },
        data: updateData,
        include: {
          classes: {
            select: {
              id: true,
              name: true,
            },
          },
          school_years: {
            select: {
              id: true,
              start_year: true,
              end_year: true,
              is_active: true,
            },
          },
        },
      });

      // Transformer en camelCase pour le frontend
      return {
        id: updatedEvaluation.id,
        classId: updatedEvaluation.class_id,
        schoolYearId: updatedEvaluation.school_year_id,
        nom: updatedEvaluation.nom,
        date: updatedEvaluation.date.toISOString().split('T')[0],
        createdAt: updatedEvaluation.created_at.toISOString(),
        updatedAt: updatedEvaluation.updated_at.toISOString(),
        class: updatedEvaluation.classes,
        schoolYear: {
          id: updatedEvaluation.school_years.id,
          startYear: updatedEvaluation.school_years.start_year,
          endYear: updatedEvaluation.school_years.end_year,
          name: `${updatedEvaluation.school_years.start_year}-${updatedEvaluation.school_years.end_year}`,
        },
      };
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'évaluation:', error);
      throw error;
    }
  }

  // Supprimer une évaluation
  async deleteEvaluation(id: number, userId: number): Promise<void> {
    try {
      // Vérifier que l'évaluation existe et appartient à l'utilisateur
      const existingEvaluation = await (this.prisma as any).evaluations.findFirst({
        where: {
          id: id,
          classes: {
            user_id: userId,
          },
        },
      });

      if (!existingEvaluation) {
        throw new Error('Évaluation non trouvée ou accès non autorisé');
      }

      await (this.prisma as any).evaluations.delete({
        where: { id: id },
      });
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'évaluation:', error);
      throw error;
    }
  }

  // Méthode stub pour compatibilité
  async getEvaluationById(id: number, userId: number): Promise<EvaluationSimple | null> {
    try {
      const evaluation = await (this.prisma as any).evaluations.findFirst({
        where: {
          id,
          class_id: {
            in: await (this.prisma as any).classes.findMany({
              where: { user_id: userId },
              select: { id: true }
            }).then((classes: any[]) => classes.map(c => c.id))
          }
        },
        include: {
          classes: { select: { id: true, name: true } },
          school_years: { select: { id: true, start_year: true, end_year: true } }
        }
      });

      if (!evaluation) return null;

      return {
        id: evaluation.id,
        classId: evaluation.class_id,
        schoolYearId: evaluation.school_year_id,
        nom: evaluation.nom,
        date: evaluation.date.toISOString().split('T')[0],
        createdAt: evaluation.created_at.toISOString(),
        updatedAt: evaluation.updated_at.toISOString(),
        class: evaluation.classes,
        schoolYear: {
          id: evaluation.school_years.id,
          startYear: evaluation.school_years.start_year,
          endYear: evaluation.school_years.end_year,
          name: `${evaluation.school_years.start_year}-${evaluation.school_years.end_year}`
        }
      };
    } catch (error) {
      console.error('Erreur lors de la récupération de l\'évaluation:', error);
      return null;
    }
  }

  // Méthode stub pour compatibilité
  async getClassEvaluations(classId: number, userId: number, options?: any): Promise<{ evaluations: EvaluationSimple[] }> {
    const evaluations = await this.getEvaluationsByClass(classId, userId);
    return { evaluations };
  }
}