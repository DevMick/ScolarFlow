// ========================================
// SERVICE POUR LES ÉLÈVES
// ========================================

import { PrismaClient, Student, Prisma } from '@prisma/client';
import { Logger } from '../utils/logger';

export interface CreateStudentData {
  name: string;
  gender?: 'M' | 'F';
  studentNumber?: string;
}

export interface UpdateStudentData {
  name?: string;
  gender?: 'M' | 'F';
  studentNumber?: string;
  isActive?: boolean;
}

export interface StudentFilters {
  isActive?: boolean;
  gender?: 'M' | 'F';
  search?: string;
  schoolYearId?: number; // Filtrer par année scolaire
}

export interface StudentWithClass extends Student {
  class: {
    id: number;
    name: string;
  };
  schoolYear: {
    id: number;
    startYear: number;
    endYear: number;
    isActive: boolean;
  };
}

export class StudentService {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Récupère tous les élèves d'une classe avec filtres
   */
  async getStudentsByClass(classId: number, filters: StudentFilters = {}): Promise<StudentWithClass[]> {
    try {
      console.log('🔍 StudentService.getStudentsByClass - Filters received:', filters);
      
      // Construire la clause where avec les noms snake_case
      const whereClause: any = {
        class_id: classId,
      };

      if (filters.isActive !== undefined) {
        whereClause.is_active = filters.isActive;
      }

      if (filters.gender) {
        whereClause.gender = filters.gender;
      }

      if (filters.search) {
        whereClause.name = {
          contains: filters.search,
          mode: 'insensitive',
        };
      }

      if (filters.schoolYearId) {
        console.log('✅ Applying schoolYearId filter:', filters.schoolYearId);
        whereClause.school_year_id = filters.schoolYearId;
      } else {
        console.log('⚠️ No schoolYearId filter applied');
      }

      console.log('📋 Final whereClause:', JSON.stringify(whereClause, null, 2));

      const students = await (this.prisma as any).students.findMany({
        where: whereClause,
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
        orderBy: [
          { name: 'asc' },
        ],
      });

      // Transformer en camelCase pour le frontend
      return students.map((student: any) => ({
        id: student.id,
        classId: student.class_id,
        schoolYearId: student.school_year_id,
        name: student.name,
        gender: student.gender,
        studentNumber: student.student_number,
        isActive: student.is_active,
        createdAt: student.created_at,
        updatedAt: student.updated_at,
        class: student.classes ? {
          id: student.classes.id,
          name: student.classes.name,
        } : null,
        schoolYear: student.school_years ? {
          id: student.school_years.id,
          startYear: student.school_years.start_year,
          endYear: student.school_years.end_year,
          isActive: student.school_years.is_active,
        } : null,
      }));
    } catch (error) {
      Logger.error('Failed to fetch students by class', error);
      throw new Error('Erreur lors de la récupération des élèves');
    }
  }

  /**
   * Récupère un élève par son ID
   */
  async getStudentById(id: number): Promise<StudentWithClass | null> {
    try {
      const student = await (this.prisma as any).students.findUnique({
        where: { id },
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

      if (!student) {
        return null;
      }

      // Transformer en camelCase pour le frontend
      return {
        id: student.id,
        classId: student.class_id,
        schoolYearId: student.school_year_id,
        name: student.name,
        gender: student.gender,
        studentNumber: student.student_number,
        isActive: student.is_active,
        createdAt: student.created_at,
        updatedAt: student.updated_at,
        class: student.classes ? {
          id: student.classes.id,
          name: student.classes.name,
        } : null,
        schoolYear: student.school_years ? {
          id: student.school_years.id,
          startYear: student.school_years.start_year,
          endYear: student.school_years.end_year,
          isActive: student.school_years.is_active,
        } : null,
      };
    } catch (error) {
      Logger.error('Failed to fetch student by ID', error);
      throw new Error('Erreur lors de la récupération de l\'élève');
    }
  }

  /**
   * Crée un nouvel élève
   */
  async createStudent(classId: number, data: CreateStudentData): Promise<StudentWithClass> {
    try {
      // Vérifier que la classe existe
      const classExists = await (this.prisma as any).classes.findUnique({
        where: { id: classId },
      });

      if (!classExists) {
        throw new Error('Classe non trouvée');
      }

      // Vérifier si le numéro d'étudiant est unique dans la classe
      if (data.studentNumber) {
        const existingStudent = await (this.prisma as any).students.findFirst({
          where: {
            class_id: classId,
            student_number: data.studentNumber,
          },
        });

        if (existingStudent) {
          throw new Error('Ce numéro d\'élève existe déjà dans cette classe');
        }
      }

      const student = await (this.prisma as any).students.create({
        data: {
          class_id: classId,
          school_year_id: (data as any).schoolYearId,
          name: data.name.trim(),
          gender: data.gender,
          student_number: data.studentNumber?.trim() || null,
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
      const transformed = {
        id: student.id,
        classId: student.class_id,
        schoolYearId: student.school_year_id,
        name: student.name,
        gender: student.gender,
        studentNumber: student.student_number,
        isActive: student.is_active,
        createdAt: student.created_at,
        updatedAt: student.updated_at,
        class: student.classes ? {
          id: student.classes.id,
          name: student.classes.name,
        } : null,
        schoolYear: student.school_years ? {
          id: student.school_years.id,
          startYear: student.school_years.start_year,
          endYear: student.school_years.end_year,
          isActive: student.school_years.is_active,
        } : null,
      };

      Logger.info('Student created successfully', {
        studentId: student.id,
        classId,
        studentName: student.name,
      });

      return transformed as any;
    } catch (error) {
      Logger.error('Failed to create student', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erreur lors de la création de l\'élève');
    }
  }

  /**
   * Met à jour un élève
   */
  async updateStudent(id: number, data: UpdateStudentData): Promise<StudentWithClass | null> {
    try {
      // Vérifier si l'élève existe
      const existingStudent = await (this.prisma as any).students.findUnique({
        where: { id },
      });

      if (!existingStudent) {
        return null;
      }

      // Vérifier si le numéro d'étudiant est unique dans la classe (si fourni)
      if (data.studentNumber && data.studentNumber !== existingStudent.student_number) {
        const duplicateStudent = await (this.prisma as any).students.findFirst({
          where: {
            class_id: existingStudent.class_id,
            student_number: data.studentNumber,
            id: { not: id },
          },
        });

        if (duplicateStudent) {
          throw new Error('Ce numéro d\'élève existe déjà dans cette classe');
        }
      }

      const updateData: any = {};

      if (data.name !== undefined) {
        updateData.name = data.name.trim();
      }

      if (data.gender !== undefined) {
        updateData.gender = data.gender;
      }

      if (data.studentNumber !== undefined) {
        updateData.student_number = data.studentNumber?.trim() || null;
      }

      if (data.isActive !== undefined) {
        updateData.is_active = data.isActive;
      }

      const student = await (this.prisma as any).students.update({
        where: { id },
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
      const transformed = {
        id: student.id,
        classId: student.class_id,
        schoolYearId: student.school_year_id,
        name: student.name,
        gender: student.gender,
        studentNumber: student.student_number,
        isActive: student.is_active,
        createdAt: student.created_at,
        updatedAt: student.updated_at,
        class: student.classes ? {
          id: student.classes.id,
          name: student.classes.name,
        } : null,
        schoolYear: student.school_years ? {
          id: student.school_years.id,
          startYear: student.school_years.start_year,
          endYear: student.school_years.end_year,
          isActive: student.school_years.is_active,
        } : null,
      };

      Logger.info('Student updated successfully', {
        studentId: student.id,
        updateData,
      });

      return transformed as any;
    } catch (error) {
      Logger.error('Failed to update student', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erreur lors de la mise à jour de l\'élève');
    }
  }

  /**
   * Supprime un élève
   */
  async deleteStudent(id: number): Promise<boolean> {
    try {
      const student = await (this.prisma as any).students.findUnique({
        where: { id },
      });

      if (!student) {
        return false;
      }

      await (this.prisma as any).students.delete({
        where: { id },
      });

      Logger.info('Student deleted successfully', {
        studentId: id,
        studentName: student.name,
      });

      return true;
    } catch (error) {
      Logger.error('Failed to delete student', error);
      throw new Error('Erreur lors de la suppression de l\'élève');
    }
  }

  /**
   * Crée plusieurs élèves en lot
   */
  async createBulkStudents(classId: number, studentsData: CreateStudentData[]): Promise<StudentWithClass[]> {
    try {
      // Vérifier que la classe existe
      const classExists = await (this.prisma as any).classes.findUnique({
        where: { id: classId },
      });

      if (!classExists) {
        throw new Error('Classe non trouvée');
      }

      // Vérifier les numéros d'élèves uniques
      const studentNumbers = studentsData
        .map(s => s.studentNumber?.trim())
        .filter((num): num is string => Boolean(num));

      if (studentNumbers.length > 0) {
        const uniqueNumbers = new Set(studentNumbers);
        if (uniqueNumbers.size !== studentNumbers.length) {
          throw new Error('Les numéros d\'élèves doivent être uniques');
        }

        // Vérifier contre la base de données
        const existingStudents = await (this.prisma as any).students.findMany({
          where: {
            class_id: classId,
            student_number: { in: studentNumbers },
          },
        });

        if (existingStudents.length > 0) {
          throw new Error('Certains numéros d\'élèves existent déjà dans cette classe');
        }
      }

      // Créer les élèves
      const students = await Promise.all(
        studentsData.map(data => this.createStudent(classId, data))
      );

      Logger.info('Bulk students created successfully', {
        classId,
        studentCount: students.length,
      });

      return students;
    } catch (error) {
      Logger.error('Failed to create bulk students', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Erreur lors de la création des élèves');
    }
  }

  /**
   * Met à jour le nombre d'élèves dans la classe
   */
  async updateClassStudentCount(classId: number): Promise<void> {
    try {
      const studentCount = await (this.prisma as any).students.count({
        where: {
          class_id: classId,
          is_active: true,
        },
      });

      await (this.prisma as any).classes.update({
        where: { id: classId },
        data: { student_count: studentCount },
      });

      Logger.info('Class student count updated', {
        classId,
        studentCount,
      });
    } catch (error) {
      Logger.error('Failed to update class student count', error);
      // Ne pas faire échouer l'opération principale
    }
  }
}