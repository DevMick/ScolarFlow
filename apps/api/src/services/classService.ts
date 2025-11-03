import { PrismaClient } from '@prisma/client';
import { Logger } from '../utils/logger';
import type { 
  Class, 
  CreateClassData, 
  UpdateClassData,
  ClassWithStats,
  ClassFilters
} from '@edustats/shared';

export class ClassService {
  constructor(private prisma: PrismaClient) {}

  async getUserClasses(userId: number, filters?: ClassFilters): Promise<ClassWithStats[]> {
    try {
      Logger.info('Fetching user classes', { userId, filters });

      const whereClause: any = {
        user_id: userId,
        is_active: true,
      };

      if (filters?.search) {
        whereClause.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const classes = await (this.prisma as any).classes.findMany({
        where: whereClause,
        include: {
          _count: {
            select: {
              students: { where: { is_active: true } },
            }
          }
        },
        orderBy: [
          { name: 'asc' },
        ],
      });

      // Transformer les données pour inclure les statistiques (snake_case → camelCase)
      const classesWithStats: ClassWithStats[] = classes.map(classItem => ({
        id: classItem.id,
        userId: classItem.user_id,
        name: classItem.name,
        studentCount: classItem._count.students, // Calculé depuis la relation
        isActive: classItem.is_active,
        createdAt: classItem.created_at,
        updatedAt: classItem.updated_at,
        evaluationCount: 0,
        lastEvaluationDate: undefined,
      }));

      Logger.info('User classes fetched successfully', { 
        userId, 
        classCount: classesWithStats.length 
      });

      return classesWithStats;
    } catch (error) {
      Logger.error('Failed to fetch user classes', error);
      throw new Error('Erreur lors de la récupération des classes');
    }
  }

  async createClass(userId: number, data: CreateClassData): Promise<Class> {
    try {
      Logger.info('Creating new class', { userId, className: data.name });

      // Vérifier si une classe avec ce nom existe déjà
      const existingClass = await (this.prisma as any).classes.findFirst({
        where: {
          user_id: userId,
          name: data.name,
          is_active: true,
        }
      });

      if (existingClass) {
        throw new Error('Une classe avec ce nom existe déjà');
      }

      const newClass = await (this.prisma as any).classes.create({
        data: {
          user_id: userId,
          name: data.name,
          is_active: true,
        }
      });

      // Transformer en camelCase
      const transformedClass: Class = {
        id: newClass.id,
        userId: newClass.user_id,
        name: newClass.name,
        isActive: newClass.is_active,
        createdAt: newClass.created_at,
        updatedAt: newClass.updated_at,
      };

      Logger.info('Class created successfully', { 
        userId, 
        classId: newClass.id, 
        className: newClass.name 
      });

      return transformedClass;
    } catch (error) {
      Logger.error('Failed to create class', error);
      throw error;
    }
  }

  async updateClass(classId: number, userId: number, data: UpdateClassData): Promise<Class> {
    try {
      Logger.info('Updating class', { classId, userId });

      // Vérifier que la classe appartient à l'utilisateur
      const existingClass = await (this.prisma as any).classes.findFirst({
        where: {
          id: classId,
          user_id: userId,
          is_active: true,
        }
      });

      if (!existingClass) {
        throw new Error('Classe non trouvée ou non autorisée');
      }

      // Si on change le nom, vérifier qu'il n'existe pas déjà
      if (data.name && data.name !== existingClass.name) {
        const duplicateClass = await (this.prisma as any).classes.findFirst({
          where: {
            user_id: userId,
            name: data.name,
            is_active: true,
            id: { not: classId },
          }
        });

        if (duplicateClass) {
          throw new Error('Une classe avec ce nom existe déjà');
        }
      }

      const updatedClass = await (this.prisma as any).classes.update({
        where: { id: classId },
        data: {
          name: data.name,
        }
      });

      // Transformer en camelCase
      const transformedClass: Class = {
        id: updatedClass.id,
        userId: updatedClass.user_id,
        name: updatedClass.name,
        isActive: updatedClass.is_active,
        createdAt: updatedClass.created_at,
        updatedAt: updatedClass.updated_at,
      };

      Logger.info('Class updated successfully', { classId, userId });
      return transformedClass;
    } catch (error) {
      Logger.error('Failed to update class', error);
      throw error;
    }
  }

  async deleteClass(classId: number, userId: number): Promise<void> {
    try {
      Logger.info('Deleting class', { classId, userId });

      // Vérifier que la classe appartient à l'utilisateur
      const existingClass = await (this.prisma as any).classes.findFirst({
        where: {
          id: classId,
          user_id: userId,
          is_active: true,
        },
        include: {
          _count: {
            select: {
              students: { where: { is_active: true } },
            }
          }
        }
      });

      if (!existingClass) {
        throw new Error('Classe non trouvée ou non autorisée');
      }

      // Si la classe a des élèves actifs, on fait un soft delete
      if (existingClass._count.students > 0) {
        await (this.prisma as any).classes.update({
          where: { id: classId },
          data: {
            is_active: false,
          }
        });
        
        Logger.info('Class soft deleted (has students)', { classId, userId });
      } else {
        // Sinon, on supprime vraiment
        await (this.prisma as any).classes.delete({
          where: { id: classId },
        });
        
        Logger.info('Class hard deleted (no students)', { classId, userId });
      }
    } catch (error) {
      Logger.error('Failed to delete class', error);
      throw error;
    }
  }

  async getClassById(classId: number, userId: number): Promise<ClassWithStats | null> {
    try {
      Logger.info('Fetching class by ID', { classId, userId });

      const classItem = await (this.prisma as any).classes.findFirst({
        where: {
          id: classId,
          user_id: userId,
          is_active: true,
        },
        include: {
          _count: {
            select: {
              students: { where: { is_active: true } },
            }
          }
        }
      });

      if (!classItem) {
        return null;
      }

      // Transformer en camelCase
      const classWithStats: ClassWithStats = {
        id: classItem.id,
        userId: classItem.user_id,
        name: classItem.name,
        studentCount: classItem._count.students, // Calculé depuis la relation
        isActive: classItem.is_active,
        createdAt: classItem.created_at,
        updatedAt: classItem.updated_at,
        evaluationCount: 0,
        averageScore: undefined,
        lastEvaluationDate: undefined,
      };

      Logger.info('Class fetched successfully', { classId, userId });
      return classWithStats;
    } catch (error) {
      Logger.error('Failed to fetch class by ID', error);
      throw new Error('Erreur lors de la récupération de la classe');
    }
  }
}
