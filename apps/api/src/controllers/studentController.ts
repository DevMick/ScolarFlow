// ========================================
// CONTRÔLEUR POUR LES ÉLÈVES
// ========================================

import { Request, Response } from 'express';
import { StudentService } from '../services/studentService';
import { ApiResponseHelper } from '../utils/response';
import { Logger } from '../utils/logger';

export class StudentController {
  private studentService: StudentService;

  constructor() {
    this.studentService = new StudentService();
  }

  /**
   * Récupère tous les élèves d'une classe
   */
  getStudentsByClass = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const classId = parseInt(req.query.classId as string);
      const { isActive, gender, search, schoolYearId } = req.query;

      if (isNaN(classId)) {
        ApiResponseHelper.badRequest(res, 'ID de classe invalide');
        return;
      }

      const filters = {
        isActive: isActive ? isActive === 'true' : undefined,
        gender: gender as 'M' | 'F' | undefined,
        search: search as string | undefined,
        schoolYearId: schoolYearId ? parseInt(schoolYearId as string) : undefined,
      };

      console.log('🎯 StudentController - Received filters:', filters);

      Logger.info('Fetching students for class', {
        userId: req.user.id,
        classId,
        filters
      });

      const students = await this.studentService.getStudentsByClass(classId, filters);

      ApiResponseHelper.success(res, students, 'Élèves récupérés avec succès');
    } catch (error) {
      Logger.error('Get students by class failed', error);
      if (error instanceof Error) {
        ApiResponseHelper.error(res, error.message, 400);
      } else {
        ApiResponseHelper.serverError(res, 'Erreur lors de la récupération des élèves');
      }
    }
  };

  /**
   * Récupère un élève par son ID
   */
  getStudentById = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const studentId = parseInt(req.params.id);

      if (isNaN(studentId)) {
        ApiResponseHelper.badRequest(res, 'ID étudiant invalide');
        return;
      }

      Logger.info('Fetching student by ID', {
        userId: req.user.id,
        studentId
      });

      const student = await this.studentService.getStudentById(studentId);

      if (!student) {
        ApiResponseHelper.notFound(res, 'Élève non trouvé');
        return;
      }

      ApiResponseHelper.success(res, student, 'Élève récupéré avec succès');
    } catch (error) {
      Logger.error('Get student by ID failed', error);
      if (error instanceof Error) {
        ApiResponseHelper.error(res, error.message, 400);
      } else {
        ApiResponseHelper.serverError(res, 'Erreur lors de la récupération de l\'élève');
      }
    }
  };

  /**
   * Crée un nouvel élève
   */
  createStudent = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const studentData = req.body;
      const classId = studentData.classId;

      if (!classId) {
        ApiResponseHelper.badRequest(res, 'ID de classe requis');
        return;
      }

      Logger.info('Creating new student', {
        userId: req.user.id,
        classId,
        studentName: studentData.name
      });

      const newStudent = await this.studentService.createStudent(classId, studentData);

      ApiResponseHelper.success(
        res,
        newStudent,
        'Élève créé avec succès',
        201
      );
    } catch (error) {
      Logger.error('Create student failed', error);
      if (error instanceof Error) {
        ApiResponseHelper.error(res, error.message, 400);
      } else {
        ApiResponseHelper.serverError(res, 'Erreur lors de la création de l\'élève');
      }
    }
  };

  /**
   * Met à jour un élève
   */
  updateStudent = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const studentId = parseInt(req.params.id);
      const updateData = req.body;

      if (isNaN(studentId)) {
        ApiResponseHelper.badRequest(res, 'ID étudiant invalide');
        return;
      }

      Logger.info('Updating student', {
        userId: req.user.id,
        studentId,
        updateData
      });

      const updatedStudent = await this.studentService.updateStudent(studentId, updateData);

      if (!updatedStudent) {
        ApiResponseHelper.notFound(res, 'Élève non trouvé');
        return;
      }

      ApiResponseHelper.success(res, updatedStudent, 'Élève mis à jour avec succès');
    } catch (error) {
      Logger.error('Update student failed', error);
      if (error instanceof Error) {
        ApiResponseHelper.error(res, error.message, 400);
      } else {
        ApiResponseHelper.serverError(res, 'Erreur lors de la mise à jour de l\'élève');
      }
    }
  };

  /**
   * Supprime un élève
   */
  deleteStudent = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const studentId = parseInt(req.params.id);

      if (isNaN(studentId)) {
        ApiResponseHelper.badRequest(res, 'ID étudiant invalide');
        return;
      }

      Logger.info('Deleting student', {
        userId: req.user.id,
        studentId
      });

      const deleted = await this.studentService.deleteStudent(studentId);

      if (!deleted) {
        ApiResponseHelper.notFound(res, 'Élève non trouvé');
        return;
      }

      ApiResponseHelper.success(res, null, 'Élève supprimé avec succès');
    } catch (error) {
      Logger.error('Delete student failed', error);
      if (error instanceof Error) {
        ApiResponseHelper.error(res, error.message, 400);
      } else {
        ApiResponseHelper.serverError(res, 'Erreur lors de la suppression de l\'élève');
      }
    }
  };

  /**
   * Crée plusieurs élèves en lot
   */
  createBulkStudents = async (req: Request, res: Response): Promise<void> => {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const { classId, students } = req.body;

      if (!classId) {
        ApiResponseHelper.badRequest(res, 'ID de classe requis');
        return;
      }

      if (!students || !Array.isArray(students) || students.length === 0) {
        ApiResponseHelper.badRequest(res, 'Liste d\'élèves requise');
        return;
      }

      Logger.info('Creating bulk students', {
        userId: req.user.id,
        classId,
        studentCount: students.length
      });

      const createdStudents = await this.studentService.createBulkStudents(classId, students);

      ApiResponseHelper.success(
        res,
        createdStudents,
        `${createdStudents.length} élève(s) créé(s) avec succès`,
        201
      );
    } catch (error) {
      Logger.error('Create bulk students failed', error);
      if (error instanceof Error) {
        ApiResponseHelper.error(res, error.message, 400);
      } else {
        ApiResponseHelper.serverError(res, 'Erreur lors de la création des élèves');
      }
    }
  };
}

// Instance singleton
let studentController: StudentController | null = null;

export const getStudentController = (): StudentController => {
  if (!studentController) {
    studentController = new StudentController();
  }
  return studentController;
};