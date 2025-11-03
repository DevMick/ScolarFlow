import { PrismaClient } from '@prisma/client';
import { Logger } from '../utils/logger';
import type { 
  Subject, 
  CreateSubjectData, 
  UpdateSubjectData,
  SubjectFilters
} from '@edustats/shared';

export class SubjectService {
  constructor(private prisma: PrismaClient) {}

  async getUserSubjects(userId: number, filters?: SubjectFilters): Promise<Subject[]> {
    try {
      Logger.info('Fetching user subjects', { userId, filters });

      const whereClause: any = {
        user_id: userId,
      };

      if (filters?.classId) {
        whereClause.class_id = filters.classId;
      }

      if (filters?.search) {
        whereClause.OR = [
          { name: { contains: filters.search, mode: 'insensitive' } },
        ];
      }

      const subjects = await (this.prisma as any).subjects.findMany({
        where: whereClause,
        include: {
          classes: {
            select: {
              id: true,
              name: true,
            }
          }
        },
        orderBy: [
          { classes: { name: 'asc' } },
          { name: 'asc' },
        ],
      });

      // Transformer en camelCase pour le frontend
      const transformed = subjects.map((subject: any) => ({
        id: subject.id,
        userId: subject.user_id,
        classId: subject.class_id,
        name: subject.name,
        createdAt: subject.created_at,
        updatedAt: subject.updated_at,
        class: subject.classes ? {
          id: subject.classes.id,
          name: subject.classes.name,
        } : null,
      }));

      Logger.info('User subjects fetched successfully', { 
        userId, 
        subjectCount: transformed.length 
      });

      return transformed as Subject[];
    } catch (error) {
      Logger.error('Failed to fetch user subjects', error);
      throw new Error('Erreur lors de la récupération des matières');
    }
  }

  async createSubject(userId: number, data: CreateSubjectData): Promise<Subject> {
    try {
      Logger.info('Creating new subject', { userId, subjectName: data.name, classId: data.classId });

      // Vérifier que la classe appartient à l'utilisateur
      const classExists = await (this.prisma as any).classes.findFirst({
        where: {
          id: data.classId,
          user_id: userId,
          is_active: true,
        }
      });

      if (!classExists) {
        throw new Error('Classe non trouvée ou non autorisée');
      }

      // Vérifier si une matière avec le même nom existe déjà pour cette classe
      const existingSubject = await (this.prisma as any).subjects.findFirst({
        where: {
          class_id: data.classId,
          name: data.name,
        }
      });

      if (existingSubject) {
        throw new Error('Une matière avec ce nom existe déjà pour cette classe');
      }

      const newSubject = await (this.prisma as any).subjects.create({
        data: {
          user_id: userId,
          class_id: data.classId,
          name: data.name,
        },
        include: {
          classes: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });

      // Transformer en camelCase pour le frontend
      const transformed = {
        id: newSubject.id,
        userId: newSubject.user_id,
        classId: newSubject.class_id,
        name: newSubject.name,
        createdAt: newSubject.created_at,
        updatedAt: newSubject.updated_at,
        class: newSubject.classes ? {
          id: newSubject.classes.id,
          name: newSubject.classes.name,
        } : null,
      };

      Logger.info('Subject created successfully', { 
        userId, 
        subjectId: newSubject.id, 
        subjectName: newSubject.name 
      });

      return transformed as Subject;
    } catch (error) {
      Logger.error('Failed to create subject', error);
      throw error;
    }
  }

  async updateSubject(subjectId: number, userId: number, data: UpdateSubjectData): Promise<Subject> {
    try {
      Logger.info('Updating subject', { subjectId, userId });

      // Vérifier que la matière appartient à l'utilisateur
      const existingSubject = await (this.prisma as any).subjects.findFirst({
        where: {
          id: subjectId,
          user_id: userId,
        }
      });

      if (!existingSubject) {
        throw new Error('Matière non trouvée ou non autorisée');
      }

      // Si on change le nom, vérifier qu'il n'existe pas déjà pour cette classe
      if (data.name && data.name !== existingSubject.name) {
        const duplicateSubject = await (this.prisma as any).subjects.findFirst({
          where: {
            class_id: existingSubject.class_id,
            name: data.name,
            id: { not: subjectId },
          }
        });

        if (duplicateSubject) {
          throw new Error('Une matière avec ce nom existe déjà pour cette classe');
        }
      }

      const updatedSubject = await (this.prisma as any).subjects.update({
        where: { id: subjectId },
        data: {
          name: data.name,
        },
        include: {
          classes: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });

      // Transformer en camelCase pour le frontend
      const transformed = {
        id: updatedSubject.id,
        userId: updatedSubject.user_id,
        classId: updatedSubject.class_id,
        name: updatedSubject.name,
        createdAt: updatedSubject.created_at,
        updatedAt: updatedSubject.updated_at,
        class: updatedSubject.classes ? {
          id: updatedSubject.classes.id,
          name: updatedSubject.classes.name,
        } : null,
      };

      Logger.info('Subject updated successfully', { subjectId, userId });
      return transformed as Subject;
    } catch (error) {
      Logger.error('Failed to update subject', error);
      throw error;
    }
  }

  async deleteSubject(subjectId: number, userId: number): Promise<void> {
    try {
      Logger.info('Deleting subject', { subjectId, userId });

      // Vérifier que la matière appartient à l'utilisateur
      const existingSubject = await (this.prisma as any).subjects.findFirst({
        where: {
          id: subjectId,
          user_id: userId,
        },
        include: {
          _count: {
            select: {
              notes: true,
            }
          }
        }
      });

      if (!existingSubject) {
        throw new Error('Matière non trouvée ou non autorisée');
      }

      // Vérifier s'il y a des notes liées à cette matière
      if (existingSubject._count.notes > 0) {
        throw new Error('Impossible de supprimer cette matière car elle contient des notes');
      }

      await (this.prisma as any).subjects.delete({
        where: { id: subjectId }
      });

      Logger.info('Subject deleted successfully', { subjectId, userId });
    } catch (error) {
      Logger.error('Failed to delete subject', error);
      throw error;
    }
  }

  async getSubjectById(subjectId: number, userId: number): Promise<Subject | null> {
    try {
      Logger.info('Fetching subject by ID', { subjectId, userId });

      const subject = await (this.prisma as any).subjects.findFirst({
        where: {
          id: subjectId,
          user_id: userId,
        },
        include: {
          classes: {
            select: {
              id: true,
              name: true,
            }
          }
        }
      });

      if (!subject) {
        return null;
      }

      // Transformer en camelCase pour le frontend
      const transformed = {
        id: subject.id,
        userId: subject.user_id,
        classId: subject.class_id,
        name: subject.name,
        createdAt: subject.created_at,
        updatedAt: subject.updated_at,
        class: subject.classes ? {
          id: subject.classes.id,
          name: subject.classes.name,
        } : null,
      };

      Logger.info('Subject fetched successfully', { subjectId, userId });
      return transformed as Subject;
    } catch (error) {
      Logger.error('Failed to fetch subject by ID', error);
      throw new Error('Erreur lors de la récupération de la matière');
    }
  }
}
