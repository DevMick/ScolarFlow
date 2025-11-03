// ========================================
// CUSTOM TABLE SERVICE - SERVICE TABLEAUX PERSONNALISÉS
// ========================================

import { PrismaClient } from '@prisma/client';
// TODO: @edustats/shared/types n'existe pas
// Types locaux temporaires
type CustomTable = any;
type CustomTableConfig = any;
type CreateCustomTableData = any;
type UpdateCustomTableData = any;
type TableData = any;
type TableRow = any;
type TableCell = any;
type FormulaContext = any;
type TableCategory = any;
import { FormulaEngine } from './FormulaEngine';
import { ServiceError, NotFoundError, ValidationError, ForbiddenError } from '../../utils/errors';

/**
 * Service pour la gestion des tableaux personnalisés
 */
export class CustomTableService {
  private prisma: PrismaClient;
  private formulaEngine: FormulaEngine;

  constructor(prisma: PrismaClient) {
    this.prisma = prisma;
    this.formulaEngine = new FormulaEngine();
  }

  /**
   * Crée un nouveau tableau personnalisé
   */
  async createTable(userId: number, data: CreateCustomTableData): Promise<CustomTable> {
    try {
      // Validation des données
      this.validateTableData(data);

      // Vérifier les permissions sur la classe si spécifiée
      if (data.classId) {
        await this.verifyClassOwnership(userId, data.classId);
      }

      // TODO: customTable n'existe pas dans le schéma Prisma
      throw new Error('customTable model not available in Prisma schema');
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError('Erreur lors de la création du tableau', error);
    }
  }

  /**
   * Obtient un tableau par ID
   */
  async getTableById(userId: number, tableId: string): Promise<CustomTable> {
    try {
      // TODO: customTable n'existe pas dans le schéma Prisma
      throw new Error('customTable model not available in Prisma schema');
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError('Erreur lors de la récupération du tableau', error);
    }
  }

  /**
   * Obtient tous les tableaux d'un utilisateur
   */
  async getTablesByUser(
    userId: number, 
    options: {
      category?: TableCategory;
      classId?: number;
      isTemplate?: boolean;
      search?: string;
      page?: number;
      limit?: number;
    } = {}
  ): Promise<{ tables: CustomTable[]; total: number }> {
    try {
      const { category, classId, isTemplate, search, page = 1, limit = 20 } = options;
      const skip = (page - 1) * limit;

      const where: any = {
        OR: [
          { userId },
          { isPublic: true }
        ]
      };

      if (category) where.category = category;
      if (classId) where.classId = classId;
      if (isTemplate !== undefined) where.isTemplate = isTemplate;
      if (search) {
        where.OR = [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ];
      }

      // TODO: customTable n'existe pas dans le schéma Prisma
      const tables: any[] = [];
      const total = 0;

      return {
        tables: tables.map(table => this.mapPrismaToCustomTable(table)),
        total
      };
    } catch (error) {
      throw new ServiceError('Erreur lors de la récupération des tableaux', error);
    }
  }

  /**
   * Met à jour un tableau
   */
  async updateTable(
    userId: number, 
    tableId: string, 
    data: UpdateCustomTableData
  ): Promise<CustomTable> {
    try {
      // TODO: customTable n'existe pas dans le schéma Prisma
      const existingTable: any = null;

      const updateData: any = {};
      if (data.name) updateData.name = data.name;
      if (data.description !== undefined) updateData.description = data.description;
      if (data.category) updateData.category = data.category;
      if (data.config) updateData.config = data.config;
      if (data.isTemplate !== undefined) updateData.isTemplate = data.isTemplate;
      if (data.isPublic !== undefined) updateData.isPublic = data.isPublic;
      if (data.tags) updateData.tags = data.tags;

      // Invalider le cache des données calculées si la config change
      if (data.config) {
        updateData.computedData = null;
      }

      // TODO: customTable n'existe pas dans le schéma Prisma
      throw new Error('customTable model not available');
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError('Erreur lors de la mise à jour du tableau', error);
    }
  }

  /**
   * Supprime un tableau
   */
  async deleteTable(userId: number, tableId: string): Promise<void> {
    try {
      // TODO: customTable n'existe pas dans le schéma Prisma
      throw new Error('customTable model not available in Prisma schema');
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError('Erreur lors de la suppression du tableau', error);
    }
  }

  /**
   * Génère les données du tableau avec calculs
   */
  async generateTableData(userId: number, tableId: string): Promise<TableData> {
    try {
      const table = await this.getTableById(userId, tableId);

      // Vérifier le cache
      if (table.computedData) {
        const cached = table.computedData as any;
        const cacheAge = Date.now() - new Date(cached.calculatedAt).getTime();
        
        // Cache valide pendant 5 minutes
        if (cacheAge < 5 * 60 * 1000) {
          return cached;
        }
      }

      const startTime = Date.now();
      const tableData = await this.computeTableData(table);
      const processingTime = Date.now() - startTime;

      // Mettre à jour le cache
      // TODO: customTable n'existe pas dans le schéma Prisma
      throw new Error('customTable model not available');
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError('Erreur lors de la génération des données', error);
    }
  }

  /**
   * Duplique un tableau
   */
  async duplicateTable(
    userId: number, 
    tableId: string, 
    newName?: string
  ): Promise<CustomTable> {
    try {
      const originalTable = await this.getTableById(userId, tableId);

      const duplicateData: CreateCustomTableData = {
        name: newName || `${originalTable.name} (Copie)`,
        description: originalTable.description,
        category: originalTable.category,
        classId: originalTable.classId,
        config: originalTable.config,
        isTemplate: false,
        isPublic: false,
        tags: originalTable.tags
      };

      return await this.createTable(userId, duplicateData);
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      throw new ServiceError('Erreur lors de la duplication du tableau', error);
    }
  }

  /**
   * Calcule les données du tableau
   */
  private async computeTableData(table: CustomTable): Promise<TableData> {
    const { config } = table;
    const errors: string[] = [];
    const warnings: string[] = [];

    // Récupérer les données des élèves
    const students = await this.getStudentsData(table.classId);
    
    if (students.length === 0) {
      return {
        headers: config.columns.map(col => col.label),
        rows: [],
        summary: {
          totalRows: 0,
          calculatedAt: new Date(),
          hasErrors: false,
          errors: [],
          warnings: ['Aucun élève trouvé dans cette classe']
        }
      };
    }

    // Récupérer les données d'évaluations si nécessaire
    const evaluationsData = await this.getEvaluationsData(table.classId);

    const rows: TableRow[] = [];

    for (const student of students) {
      const cells: TableCell[] = [];

      for (const column of config.columns) {
        try {
          const cell = await this.computeCell(column, student, evaluationsData, students);
          cells.push(cell);
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : 'Erreur de calcul';
          errors.push(`Erreur colonne "${column.label}" pour ${(student as any).name || 'élève'}: ${errorMessage}`);
          
          cells.push({
            value: null,
            formattedValue: '#ERREUR',
            style: { backgroundColor: '#fee2e2', color: '#dc2626' },
            metadata: { error: errorMessage }
          });
        }
      }

      rows.push({
        studentId: student.id,
        cells
      });
    }

    return {
      headers: config.columns.map(col => col.label),
      rows,
      summary: {
        totalRows: rows.length,
        calculatedAt: new Date(),
        hasErrors: errors.length > 0,
        errors,
        warnings
      }
    };
  }

  /**
   * Calcule la valeur d'une cellule
   */
  private async computeCell(
    column: any, 
    student: any, 
    evaluationsData: any[], 
    allStudents: any[]
  ): Promise<TableCell> {
    let value: any = null;
    let formattedValue = '';
    let style: Record<string, any> = {};
    const metadata: any = {};

    switch (column.type) {
      case 'student_info':
        value = this.getStudentInfo(student, column.source?.field);
        formattedValue = String(value || '');
        break;

      case 'evaluation_score':
        const evaluation = evaluationsData.find(e => e.id === column.source?.evaluationId);
        if (evaluation) {
          const result = evaluation.results?.find((r: any) => r.studentId === student.id);
          value = result?.score || null;
          formattedValue = value !== null ? value.toString() : 'Absent';
        }
        break;

      case 'static':
        value = column.source?.staticValue || '';
        formattedValue = String(value);
        break;

      case 'calculated':
      case 'formula':
        if (column.formula?.expression) {
          const context: FormulaContext = {
            studentId: student.id,
            variables: this.buildFormulaContext(student, evaluationsData, allStudents),
            functions: {},
            metadata: {
              currentRow: 0,
              totalRows: allStudents.length,
              calculationDate: new Date()
            }
          };

          const result = await this.formulaEngine.evaluate(column.formula.expression, context);
          
          if (result.errors.length > 0) {
            throw new Error(result.errors.join(', '));
          }

          value = result.value;
          metadata.formula = column.formula.expression;
          metadata.isCalculated = true;
        }
        break;
    }

    // Formatage de la valeur
    if (value !== null && value !== undefined) {
      formattedValue = this.formatValue(value, column.formatting);
    }

    // Application du formatage conditionnel
    if (column.formatting?.conditionalFormatting) {
      const conditionalStyle = this.applyConditionalFormatting(value, column.formatting.conditionalFormatting);
      style = { ...style, ...conditionalStyle };
    }

    return {
      value,
      formattedValue,
      style,
      metadata
    };
  }

  /**
   * Récupère les informations d'un élève
   */
  private getStudentInfo(student: any, field?: string): any {
    switch (field) {
      case 'firstName': return (student as any).firstName || (student as any).name?.split(' ')[1] || '';
      case 'lastName': return (student as any).lastName || (student as any).name?.split(' ')[0] || '';
      case 'fullName': return (student as any).name || '';
      case 'dateOfBirth': return (student as any).dateOfBirth || (student as any).date_of_birth || null;
      case 'age': 
        if (student.dateOfBirth) {
          const today = new Date();
          const birth = new Date(student.dateOfBirth);
          return today.getFullYear() - birth.getFullYear();
        }
        return null;
      case 'gender': return student.gender;
      case 'studentNumber': return (student as any).studentNumber || (student as any).student_number || '';
      case 'className': return student.class?.name;
      default: return (student as any).firstName || (student as any).name || '';
    }
  }

  /**
   * Construit le contexte pour l'évaluation des formules
   */
  private buildFormulaContext(student: any, evaluationsData: any[], allStudents: any[]): Record<string, any> {
    const context: Record<string, any> = {
      // Informations élève
      PRENOM: (student as any).firstName || (student as any).name?.split(' ')[1] || '',
      NOM: (student as any).lastName || (student as any).name?.split(' ')[0] || '',
      NOM_COMPLET: (student as any).name || '',
      
      // Variables système
      DATE_AUJOURD_HUI: new Date(),
      NOMBRE_ELEVES: allStudents.length
    };

    // Ajouter les notes des évaluations
    evaluationsData.forEach(evaluation => {
      const result = evaluation.results?.find((r: any) => r.studentId === student.id);
      const score = result?.score;
      
      // Variable par ID d'évaluation
      context[`EVAL_${evaluation.id}`] = score;
      
      // Variable par matière (dernière évaluation de la matière)
      const subjectKey = evaluation.subject.toUpperCase().replace(/\s+/g, '_');
      context[`${subjectKey}_DERNIERE`] = score;
    });

    // Calculer les moyennes par matière
    const subjectAverages: Record<string, number[]> = {};
    evaluationsData.forEach(evaluation => {
      const result = evaluation.results?.find((r: any) => r.studentId === student.id);
      if (result?.score !== null && result?.score !== undefined) {
        const subject = evaluation.subject.toUpperCase().replace(/\s+/g, '_');
        if (!subjectAverages[subject]) subjectAverages[subject] = [];
        subjectAverages[subject].push(result.score);
      }
    });

    Object.entries(subjectAverages).forEach(([subject, scores]) => {
      const average = scores.reduce((sum, score) => sum + score, 0) / scores.length;
      context[`MOYENNE_${subject}`] = average;
    });

    // Moyenne générale
    const allScores = Object.values(subjectAverages).flat();
    if (allScores.length > 0) {
      context.MOYENNE_GENERALE = allScores.reduce((sum, score) => sum + score, 0) / allScores.length;
    }

    return context;
  }

  /**
   * Formate une valeur selon les options de formatage
   */
  private formatValue(value: any, formatting: any): string {
    if (value === null || value === undefined) return '';

    if (typeof value === 'number') {
      if (formatting?.numberFormat) {
        switch (formatting.numberFormat) {
          case '0': return Math.round(value).toString();
          case '0.0': return value.toFixed(1);
          case '0.00': return value.toFixed(2);
          case '0%': return Math.round(value * 100) + '%';
          case '0.0%': return (value * 100).toFixed(1) + '%';
          case '0.00 €': return value.toFixed(2) + ' €';
          default: return value.toString();
        }
      }
      return value.toString();
    }

    if (value instanceof Date) {
      return value.toLocaleDateString('fr-FR');
    }

    return String(value);
  }

  /**
   * Applique le formatage conditionnel
   */
  private applyConditionalFormatting(value: any, conditions: any[]): Record<string, any> {
    for (const condition of conditions) {
      if (this.evaluateCondition(value, condition.condition)) {
        return {
          backgroundColor: condition.style.backgroundColor,
          color: condition.style.textColor,
          fontWeight: condition.style.fontWeight,
          fontStyle: condition.style.fontStyle,
          border: condition.style.border
        };
      }
    }
    return {};
  }

  /**
   * Évalue une condition de formatage
   */
  private evaluateCondition(value: any, condition: any): boolean {
    const { operator, value: conditionValue, value2 } = condition;

    switch (operator) {
      case '>': return value > conditionValue;
      case '<': return value < conditionValue;
      case '>=': return value >= conditionValue;
      case '<=': return value <= conditionValue;
      case '=': return value === conditionValue;
      case '!=': return value !== conditionValue;
      case 'contains': return String(value).includes(String(conditionValue));
      case 'between': return value >= conditionValue && value <= value2;
      case 'starts_with': return String(value).startsWith(String(conditionValue));
      case 'ends_with': return String(value).endsWith(String(conditionValue));
      default: return false;
    }
  }

  /**
   * Récupère les données des élèves
   */
  private async getStudentsData(classId?: number): Promise<any[]> {
    if (!classId) return [];

    return await this.prisma.students.findMany({
      where: { 
        class_id: classId,
        is_active: true
      },
      include: {
        classes: { select: { name: true, level: true } }
      },
      orderBy: [
        { name: 'asc' }
      ]
    });
  }

  /**
   * Récupère les données des évaluations
   */
  private async getEvaluationsData(classId?: number): Promise<any[]> {
    if (!classId) return [];

    return await this.prisma.evaluations.findMany({
      where: { class_id: classId },
      include: {
        // TODO: results n'existe pas dans evaluations
        // notes: {
        //   include: {
        //     students: { select: { id: true, name: true } }
        //   }
        // }
      },
      orderBy: { date: 'desc' }
    });
  }

  /**
   * Valide les données d'un tableau
   */
  private validateTableData(data: CreateCustomTableData): void {
    if (!data.name || data.name.trim().length === 0) {
      throw new ValidationError('Le nom du tableau est requis');
    }

    if (data.name.length > 200) {
      throw new ValidationError('Le nom du tableau ne peut pas dépasser 200 caractères');
    }

    this.validateTableConfig(data.config);
  }

  /**
   * Valide la configuration d'un tableau
   */
  private validateTableConfig(config: Partial<CustomTableConfig>): void {
    if (!config.columns || config.columns.length === 0) {
      throw new ValidationError('Le tableau doit avoir au moins une colonne');
    }

    if (config.columns.length > 50) {
      throw new ValidationError('Le tableau ne peut pas avoir plus de 50 colonnes');
    }

    // Valider chaque colonne
    config.columns.forEach((column, index) => {
      if (!column.id || !column.label) {
        throw new ValidationError(`Colonne ${index + 1}: ID et label requis`);
      }

      if (column.type === 'formula' && !column.formula?.expression) {
        throw new ValidationError(`Colonne "${column.label}": Expression de formule requise`);
      }
    });
  }

  /**
   * Vérifie la propriété d'une classe
   */
  private async verifyClassOwnership(userId: number, classId: number): Promise<void> {
    const classExists = await this.prisma.classes.findFirst({
      where: {
        id: classId,
        user_id: userId
      }
    });

    if (!classExists) {
      throw new ForbiddenError('Vous n\'avez pas accès à cette classe');
    }
  }

  /**
   * Mappe un objet Prisma vers CustomTable
   */
  private mapPrismaToCustomTable(prismaTable: any): CustomTable {
    return {
      id: prismaTable.id.toString(),
      userId: prismaTable.userId,
      classId: prismaTable.classId,
      name: prismaTable.name,
      description: prismaTable.description,
      category: prismaTable.category,
      config: prismaTable.config,
      computedData: prismaTable.computedData,
      isTemplate: prismaTable.isTemplate,
      isPublic: prismaTable.isPublic,
      tags: prismaTable.tags || [],
      createdAt: prismaTable.createdAt,
      updatedAt: prismaTable.updatedAt
    };
  }
}
