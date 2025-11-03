import { PrismaClient } from '@prisma/client';
import { Logger } from '../utils/logger';
import type { 
  EvaluationFormula, 
  CreateEvaluationFormulaData, 
  UpdateEvaluationFormulaData
} from '@edustats/shared';

export class EvaluationFormulaService {
  constructor(private prisma: PrismaClient) {}

  async getUserFormulas(userId: number): Promise<EvaluationFormula[]> {
    try {
      Logger.info('Fetching user evaluation formulas', { userId });

      const formulas = await this.prisma.evaluationFormula.findMany({
        where: {
          userId,
        },
        orderBy: {
          createdAt: 'desc',
        },
      });

      Logger.info('User evaluation formulas fetched successfully', { 
        userId, 
        formulaCount: formulas.length 
      });

      return formulas as EvaluationFormula[];
    } catch (error) {
      Logger.error('Failed to fetch user evaluation formulas', error);
      throw new Error('Erreur lors de la récupération des formules d\'évaluation');
    }
  }

  async createFormula(userId: number, data: CreateEvaluationFormulaData): Promise<EvaluationFormula> {
    try {
      Logger.info('Creating new evaluation formula', { userId, name: data.name, formula: data.formula });

      // Validation basique
      if (!data.name || data.name.trim().length === 0) {
        throw new Error('Le nom de la formule ne peut pas être vide');
      }

      if (!data.formula || data.formula.trim().length === 0) {
        throw new Error('La formule ne peut pas être vide');
      }

      // Vérifier que la formule commence par =
      if (!data.formula.startsWith('=')) {
        throw new Error('La formule doit commencer par =');
      }

      const newFormula = await this.prisma.evaluationFormula.create({
        data: {
          userId,
          name: data.name.trim(),
          formula: data.formula.trim(),
        }
      });

      Logger.info('Evaluation formula created successfully', { 
        userId, 
        formulaId: newFormula.id, 
        name: newFormula.name,
        formula: newFormula.formula 
      });

      return newFormula as EvaluationFormula;
    } catch (error) {
      Logger.error('Failed to create evaluation formula', error);
      throw error;
    }
  }

  async updateFormula(formulaId: number, userId: number, data: UpdateEvaluationFormulaData): Promise<EvaluationFormula> {
    try {
      Logger.info('Updating evaluation formula', { formulaId, userId });

      // Vérifier que la formule appartient à l'utilisateur
      const existingFormula = await this.prisma.evaluationFormula.findFirst({
        where: {
          id: formulaId,
          userId,
        }
      });

      if (!existingFormula) {
        throw new Error('Formule d\'évaluation non trouvée ou non autorisée');
      }

      // Validation basique de la formule
      if (data.formula && data.formula.trim().length === 0) {
        throw new Error('La formule ne peut pas être vide');
      }

      // Vérifier que la formule commence par =
      if (data.formula && !data.formula.startsWith('=')) {
        throw new Error('La formule doit commencer par =');
      }

      const updatedFormula = await this.prisma.evaluationFormula.update({
        where: { id: formulaId },
        data: {
          name: data.name?.trim(),
          formula: data.formula?.trim(),
        }
      });

      Logger.info('Evaluation formula updated successfully', { formulaId, userId });
      return updatedFormula as EvaluationFormula;
    } catch (error) {
      Logger.error('Failed to update evaluation formula', error);
      throw error;
    }
  }

  async deleteFormula(formulaId: number, userId: number): Promise<void> {
    try {
      Logger.info('Deleting evaluation formula', { formulaId, userId });

      // Vérifier que la formule appartient à l'utilisateur
      const existingFormula = await this.prisma.evaluationFormula.findFirst({
        where: {
          id: formulaId,
          userId,
        }
      });

      if (!existingFormula) {
        throw new Error('Formule d\'évaluation non trouvée ou non autorisée');
      }

      await this.prisma.evaluationFormula.delete({
        where: { id: formulaId }
      });

      Logger.info('Evaluation formula deleted successfully', { formulaId, userId });
    } catch (error) {
      Logger.error('Failed to delete evaluation formula', error);
      throw error;
    }
  }

  async getFormulaById(formulaId: number, userId: number): Promise<EvaluationFormula | null> {
    try {
      Logger.info('Fetching evaluation formula by ID', { formulaId, userId });

      const formula = await this.prisma.evaluationFormula.findFirst({
        where: {
          id: formulaId,
          userId,
        }
      });

      if (!formula) {
        return null;
      }

      Logger.info('Evaluation formula fetched successfully', { formulaId, userId });
      return formula as EvaluationFormula;
    } catch (error) {
      Logger.error('Failed to fetch evaluation formula by ID', error);
      throw new Error('Erreur lors de la récupération de la formule d\'évaluation');
    }
  }
}
