import { PrismaClient } from '@prisma/client';
import { Logger } from '../utils/logger';
import type { 
  Note, 
  CreateNoteData, 
  UpdateNoteData
} from '@edustats/shared';

export class NoteService {
  constructor(private prisma: PrismaClient) {}

  async getUserNotes(userId: number): Promise<Note[]> {
    try {
      Logger.info('Fetching user notes', { userId });

      const notes = await (this.prisma as any).notes.findMany({
        where: {
          user_id: userId,
          is_active: true,
        },
        include: {
          students: {
            select: {
              id: true,
              name: true,
              gender: true,
              student_number: true,
            }
          },
          subjects: {
            select: {
              id: true,
              name: true,
              classes: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          }
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Transformer en camelCase pour le frontend
      const transformed = notes.map((note: any) => ({
        id: note.id,
        userId: note.user_id,
        studentId: note.student_id,
        subjectId: note.subject_id,
        evaluationId: note.evaluation_id,
        value: note.value,
        isAbsent: note.is_absent,
        isActive: note.is_active,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
        student: note.students ? {
          id: note.students.id,
          name: note.students.name,
          gender: note.students.gender,
          studentNumber: note.students.student_number,
        } : null,
        subject: note.subjects ? {
          id: note.subjects.id,
          name: note.subjects.name,
          class: note.subjects.classes ? {
            id: note.subjects.classes.id,
            name: note.subjects.classes.name,
          } : null,
        } : null,
      }));

      Logger.info('User notes fetched successfully', { 
        userId, 
        noteCount: transformed.length 
      });

      return transformed as Note[];
    } catch (error) {
      Logger.error('Failed to fetch user notes', error);
      throw new Error('Erreur lors de la récupération des notes');
    }
  }

  async getNotesByStudentAndSubject(studentId: number, subjectId: number): Promise<Note[]> {
    try {
      Logger.info('Fetching notes by student and subject', { studentId, subjectId });

      const notes = await (this.prisma as any).notes.findMany({
        where: {
          student_id: studentId,
          subject_id: subjectId,
          is_active: true,
        },
        include: {
          students: {
            select: {
              id: true,
              name: true,
              gender: true,
              student_number: true,
            }
          },
          subjects: {
            select: {
              id: true,
              name: true,
              classes: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          }
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Transformer en camelCase pour le frontend
      const transformed = notes.map((note: any) => ({
        id: note.id,
        userId: note.user_id,
        studentId: note.student_id,
        subjectId: note.subject_id,
        evaluationId: note.evaluation_id,
        value: note.value,
        isAbsent: note.is_absent,
        isActive: note.is_active,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
        student: note.students ? {
          id: note.students.id,
          name: note.students.name,
          gender: note.students.gender,
          studentNumber: note.students.student_number,
        } : null,
        subject: note.subjects ? {
          id: note.subjects.id,
          name: note.subjects.name,
          class: note.subjects.classes ? {
            id: note.subjects.classes.id,
            name: note.subjects.classes.name,
          } : null,
        } : null,
      }));

      Logger.info('Notes by student and subject fetched successfully', { 
        studentId, 
        subjectId,
        noteCount: transformed.length 
      });

      return transformed as Note[];
    } catch (error) {
      Logger.error('Failed to fetch notes by student and subject', error);
      throw new Error('Erreur lors de la récupération des notes');
    }
  }

  async getNotesByClassAndSubject(classId: number, subjectId: number): Promise<Note[]> {
    try {
      Logger.info('Fetching notes by class and subject', { classId, subjectId });

      const notes = await (this.prisma as any).notes.findMany({
        where: {
          subjects: {
            class_id: classId,
            id: subjectId,
          },
          is_active: true,
        },
        include: {
          students: {
            select: {
              id: true,
              name: true,
              gender: true,
              student_number: true,
            }
          },
          subjects: {
            select: {
              id: true,
              name: true,
              classes: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          }
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Transformer en camelCase pour le frontend
      const transformed = notes.map((note: any) => ({
        id: note.id,
        userId: note.user_id,
        studentId: note.student_id,
        subjectId: note.subject_id,
        evaluationId: note.evaluation_id,
        value: note.value,
        isAbsent: note.is_absent,
        isActive: note.is_active,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
        student: note.students ? {
          id: note.students.id,
          name: note.students.name,
          gender: note.students.gender,
          studentNumber: note.students.student_number,
        } : null,
        subject: note.subjects ? {
          id: note.subjects.id,
          name: note.subjects.name,
          class: note.subjects.classes ? {
            id: note.subjects.classes.id,
            name: note.subjects.classes.name,
          } : null,
        } : null,
      }));

      Logger.info('Notes by class and subject fetched successfully', { 
        classId, 
        subjectId,
        noteCount: transformed.length 
      });

      return transformed as Note[];
    } catch (error) {
      Logger.error('Failed to fetch notes by class and subject', error);
      throw new Error('Erreur lors de la récupération des notes');
    }
  }

  async getNotesByStudent(studentId: number): Promise<Note[]> {
    try {
      Logger.info('Fetching notes by student', { studentId });

      const notes = await (this.prisma as any).notes.findMany({
        where: {
          student_id: studentId,
          is_active: true,
        },
        include: {
          students: {
            select: {
              id: true,
              name: true,
              gender: true,
              student_number: true,
            }
          },
          subjects: {
            select: {
              id: true,
              name: true,
              classes: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          }
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Transformer en camelCase pour le frontend
      const transformed = notes.map((note: any) => ({
        id: note.id,
        userId: note.user_id,
        studentId: note.student_id,
        subjectId: note.subject_id,
        evaluationId: note.evaluation_id,
        value: note.value,
        isAbsent: note.is_absent,
        isActive: note.is_active,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
        student: note.students ? {
          id: note.students.id,
          name: note.students.name,
          gender: note.students.gender,
          studentNumber: note.students.student_number,
        } : null,
        subject: note.subjects ? {
          id: note.subjects.id,
          name: note.subjects.name,
          class: note.subjects.classes ? {
            id: note.subjects.classes.id,
            name: note.subjects.classes.name,
          } : null,
        } : null,
      }));

      Logger.info('Notes by student fetched successfully', { 
        studentId,
        noteCount: transformed.length 
      });

      return transformed as Note[];
    } catch (error) {
      Logger.error('Failed to fetch notes by student', error);
      throw new Error('Erreur lors de la récupération des notes');
    }
  }

  async getNotesBySubject(subjectId: number): Promise<Note[]> {
    try {
      Logger.info('Fetching notes by subject', { subjectId });

      const notes = await (this.prisma as any).notes.findMany({
        where: {
          subject_id: subjectId,
          is_active: true,
        },
        include: {
          students: {
            select: {
              id: true,
              name: true,
              gender: true,
              student_number: true,
            }
          },
          subjects: {
            select: {
              id: true,
              name: true,
              classes: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          }
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Transformer en camelCase pour le frontend
      const transformed = notes.map((note: any) => ({
        id: note.id,
        userId: note.user_id,
        studentId: note.student_id,
        subjectId: note.subject_id,
        evaluationId: note.evaluation_id,
        value: note.value,
        isAbsent: note.is_absent,
        isActive: note.is_active,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
        student: note.students ? {
          id: note.students.id,
          name: note.students.name,
          gender: note.students.gender,
          studentNumber: note.students.student_number,
        } : null,
        subject: note.subjects ? {
          id: note.subjects.id,
          name: note.subjects.name,
          class: note.subjects.classes ? {
            id: note.subjects.classes.id,
            name: note.subjects.classes.name,
          } : null,
        } : null,
      }));

      Logger.info('Notes by subject fetched successfully', { 
        subjectId,
        noteCount: transformed.length 
      });

      return transformed as Note[];
    } catch (error) {
      Logger.error('Failed to fetch notes by subject', error);
      throw new Error('Erreur lors de la récupération des notes');
    }
  }

  async getNotesByEvaluation(evaluationId: number): Promise<Note[]> {
    try {
      Logger.info('Fetching notes by evaluation', { evaluationId });

      const notes = await (this.prisma as any).notes.findMany({
        where: {
          evaluation_id: evaluationId,
          is_active: true,
        },
        include: {
          students: {
            select: {
              id: true,
              name: true,
              gender: true,
              student_number: true,
            }
          },
          subjects: {
            select: {
              id: true,
              name: true,
              classes: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          }
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Transformer en camelCase pour le frontend
      const transformed = notes.map((note: any) => ({
        id: note.id,
        userId: note.user_id,
        studentId: note.student_id,
        subjectId: note.subject_id,
        evaluationId: note.evaluation_id,
        value: note.value,
        isAbsent: note.is_absent,
        isActive: note.is_active,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
        student: note.students ? {
          id: note.students.id,
          name: note.students.name,
          gender: note.students.gender,
          studentNumber: note.students.student_number,
        } : null,
        subject: note.subjects ? {
          id: note.subjects.id,
          name: note.subjects.name,
          class: note.subjects.classes ? {
            id: note.subjects.classes.id,
            name: note.subjects.classes.name,
          } : null,
        } : null,
      }));

      Logger.info('Notes by evaluation fetched successfully', { 
        evaluationId,
        noteCount: transformed.length 
      });

      return transformed as Note[];
    } catch (error) {
      Logger.error('Failed to fetch notes by evaluation', error);
      throw new Error('Erreur lors de la récupération des notes');
    }
  }

  async getNotesByClassAndEvaluation(classId: number, evaluationId: number): Promise<Note[]> {
    try {
      Logger.info('Fetching notes by class and evaluation', { classId, evaluationId });

      const notes = await (this.prisma as any).notes.findMany({
        where: {
          evaluation_id: evaluationId,
          subjects: {
            class_id: classId,
          },
          is_active: true,
        },
        include: {
          students: {
            select: {
              id: true,
              name: true,
              gender: true,
              student_number: true,
            }
          },
          subjects: {
            select: {
              id: true,
              name: true,
              classes: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          }
        },
        orderBy: {
          created_at: 'desc',
        },
      });

      // Transformer en camelCase pour le frontend
      const transformed = notes.map((note: any) => ({
        id: note.id,
        userId: note.user_id,
        studentId: note.student_id,
        subjectId: note.subject_id,
        evaluationId: note.evaluation_id,
        value: note.value,
        isAbsent: note.is_absent,
        isActive: note.is_active,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
        student: note.students ? {
          id: note.students.id,
          name: note.students.name,
          gender: note.students.gender,
          studentNumber: note.students.student_number,
        } : null,
        subject: note.subjects ? {
          id: note.subjects.id,
          name: note.subjects.name,
          class: note.subjects.classes ? {
            id: note.subjects.classes.id,
            name: note.subjects.classes.name,
          } : null,
        } : null,
      }));

      Logger.info('Notes by class and evaluation fetched successfully', { 
        classId,
        evaluationId,
        noteCount: transformed.length 
      });

      return transformed as Note[];
    } catch (error) {
      Logger.error('Failed to fetch notes by class and evaluation', error);
      throw new Error('Erreur lors de la récupération des notes');
    }
  }

  async createNote(userId: number, data: CreateNoteData): Promise<Note> {
    try {
      Logger.info('Creating new note', { userId, studentId: data.studentId, subjectId: data.subjectId, value: data.value });

      // Validation
      if (data.value < 0) {
        throw new Error('La note doit être positive');
      }

      // Vérifier que l'élève et la matière existent
      const student = await (this.prisma as any).students.findUnique({
        where: { id: data.studentId }
      });

      if (!student) {
        throw new Error('Élève non trouvé');
      }

      const subject = await (this.prisma as any).subjects.findUnique({
        where: { id: data.subjectId }
      });

      if (!subject) {
        throw new Error('Matière non trouvée');
      }

      const newNote = await (this.prisma as any).notes.create({
        data: {
          user_id: userId,
          student_id: data.studentId,
          subject_id: data.subjectId,
          evaluation_id: data.evaluationId,
          value: data.value,
        },
        include: {
          students: {
            select: {
              id: true,
              name: true,
              gender: true,
              student_number: true,
            }
          },
          subjects: {
            select: {
              id: true,
              name: true,
              classes: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          }
        }
      });

      // Transformer en camelCase pour le frontend
      const transformed = {
        id: newNote.id,
        userId: newNote.user_id,
        studentId: newNote.student_id,
        subjectId: newNote.subject_id,
        evaluationId: newNote.evaluation_id,
        value: newNote.value,
        isAbsent: newNote.is_absent,
        isActive: newNote.is_active,
        createdAt: newNote.created_at,
        updatedAt: newNote.updated_at,
        student: newNote.students ? {
          id: newNote.students.id,
          name: newNote.students.name,
          gender: newNote.students.gender,
          studentNumber: newNote.students.student_number,
        } : null,
        subject: newNote.subjects ? {
          id: newNote.subjects.id,
          name: newNote.subjects.name,
          class: newNote.subjects.classes ? {
            id: newNote.subjects.classes.id,
            name: newNote.subjects.classes.name,
          } : null,
        } : null,
      };

      Logger.info('Note created successfully', { 
        userId, 
        noteId: newNote.id, 
        studentId: newNote.student_id,
        subjectId: newNote.subject_id,
        value: newNote.value
      });

      return transformed as Note;
    } catch (error) {
      Logger.error('Failed to create note', error);
      throw error;
    }
  }

  async upsertNote(userId: number, data: CreateNoteData): Promise<Note> {
    try {
      Logger.info('Upserting note', { userId, studentId: data.studentId, subjectId: data.subjectId, value: data.value });

      // Validation
      if (data.value < 0) {
        throw new Error('La note doit être positive');
      }

      // Vérifier que l'élève et la matière existent
      const student = await (this.prisma as any).students.findUnique({
        where: { id: data.studentId }
      });

      if (!student) {
        throw new Error('Élève non trouvé');
      }

      const subject = await (this.prisma as any).subjects.findUnique({
        where: { id: data.subjectId }
      });

      if (!subject) {
        throw new Error('Matière non trouvée');
      }

      // Chercher une note existante pour cette évaluation spécifique
      const existingNote = await (this.prisma as any).notes.findFirst({
        where: {
          student_id: data.studentId,
          subject_id: data.subjectId,
          evaluation_id: data.evaluationId,
          user_id: userId,
          is_active: true,
        }
      });

      let note;
      if (existingNote) {
        // Mettre à jour la note existante
        note = await (this.prisma as any).notes.update({
          where: { id: existingNote.id },
          data: {
            value: data.value,
            is_absent: data.isAbsent ?? false,
          },
          include: {
            students: {
              select: {
                id: true,
                name: true,
                gender: true,
                student_number: true,
              }
            },
            subjects: {
              select: {
                id: true,
                name: true,
                classes: {
                  select: {
                    id: true,
                    name: true,
                  }
                }
              }
            }
          }
        });
      } else {
        // Créer une nouvelle note
        note = await (this.prisma as any).notes.create({
          data: {
            user_id: userId,
            student_id: data.studentId,
            subject_id: data.subjectId,
            evaluation_id: data.evaluationId,
            value: data.value,
            is_absent: data.isAbsent ?? false,
          },
          include: {
            students: {
              select: {
                id: true,
                name: true,
                gender: true,
                student_number: true,
              }
            },
            subjects: {
              select: {
                id: true,
                name: true,
                classes: {
                  select: {
                    id: true,
                    name: true,
                  }
                }
              }
            }
          }
        });
      }

      // Transformer en camelCase pour le frontend
      const transformed = {
        id: note.id,
        userId: note.user_id,
        studentId: note.student_id,
        subjectId: note.subject_id,
        evaluationId: note.evaluation_id,
        value: note.value,
        isAbsent: note.is_absent,
        isActive: note.is_active,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
        student: note.students ? {
          id: note.students.id,
          name: note.students.name,
          gender: note.students.gender,
          studentNumber: note.students.student_number,
        } : null,
        subject: note.subjects ? {
          id: note.subjects.id,
          name: note.subjects.name,
          class: note.subjects.classes ? {
            id: note.subjects.classes.id,
            name: note.subjects.classes.name,
          } : null,
        } : null,
      };

      Logger.info('Note upserted successfully', { 
        userId, 
        noteId: note.id, 
        studentId: note.student_id,
        subjectId: note.subject_id,
        value: note.value
      });

      return transformed as Note;
    } catch (error) {
      Logger.error('Failed to upsert note', error);
      throw error;
    }
  }

  async updateNote(noteId: number, userId: number, data: UpdateNoteData): Promise<Note> {
    try {
      Logger.info('Updating note', { noteId, userId });

      // Vérifier que la note appartient à l'utilisateur
      const existingNote = await (this.prisma as any).notes.findFirst({
        where: {
          id: noteId,
          user_id: userId,
        }
      });

      if (!existingNote) {
        throw new Error('Note non trouvée ou non autorisée');
      }

      // Validation
      if (data.value !== undefined && data.value < 0) {
        throw new Error('La note doit être positive');
      }

      const updateData: any = {};
      if (data.value !== undefined) {
        updateData.value = data.value;
      }
      if (data.isAbsent !== undefined) {
        updateData.is_absent = data.isAbsent;
      }

      const updatedNote = await (this.prisma as any).notes.update({
        where: { id: noteId },
        data: updateData,
        include: {
          students: {
            select: {
              id: true,
              name: true,
              gender: true,
              student_number: true,
            }
          },
          subjects: {
            select: {
              id: true,
              name: true,
              classes: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          }
        }
      });

      // Transformer en camelCase pour le frontend
      const transformed = {
        id: updatedNote.id,
        userId: updatedNote.user_id,
        studentId: updatedNote.student_id,
        subjectId: updatedNote.subject_id,
        evaluationId: updatedNote.evaluation_id,
        value: updatedNote.value,
        isAbsent: updatedNote.is_absent,
        isActive: updatedNote.is_active,
        createdAt: updatedNote.created_at,
        updatedAt: updatedNote.updated_at,
        student: updatedNote.students ? {
          id: updatedNote.students.id,
          name: updatedNote.students.name,
          gender: updatedNote.students.gender,
          studentNumber: updatedNote.students.student_number,
        } : null,
        subject: updatedNote.subjects ? {
          id: updatedNote.subjects.id,
          name: updatedNote.subjects.name,
          class: updatedNote.subjects.classes ? {
            id: updatedNote.subjects.classes.id,
            name: updatedNote.subjects.classes.name,
          } : null,
        } : null,
      };

      Logger.info('Note updated successfully', { noteId, userId });
      return transformed as Note;
    } catch (error) {
      Logger.error('Failed to update note', error);
      throw error;
    }
  }

  async deleteNote(noteId: number, userId: number): Promise<void> {
    try {
      Logger.info('Deleting note', { noteId, userId });

      // Vérifier que la note appartient à l'utilisateur
      const existingNote = await (this.prisma as any).notes.findFirst({
        where: {
          id: noteId,
          user_id: userId,
        }
      });

      if (!existingNote) {
        throw new Error('Note non trouvée ou non autorisée');
      }

      // Marquer comme inactive au lieu de supprimer
      await (this.prisma as any).notes.update({
        where: { id: noteId },
        data: { is_active: false }
      });

      Logger.info('Note deleted successfully', { noteId, userId });
    } catch (error) {
      Logger.error('Failed to delete note', error);
      throw error;
    }
  }

  async getNoteById(noteId: number, userId: number): Promise<Note | null> {
    try {
      Logger.info('Fetching note by ID', { noteId, userId });

      const note = await (this.prisma as any).notes.findFirst({
        where: {
          id: noteId,
          user_id: userId,
          is_active: true,
        },
        include: {
          students: {
            select: {
              id: true,
              name: true,
              gender: true,
              student_number: true,
            }
          },
          subjects: {
            select: {
              id: true,
              name: true,
              classes: {
                select: {
                  id: true,
                  name: true,
                }
              }
            }
          }
        }
      });

      if (!note) {
        return null;
      }

      // Transformer en camelCase pour le frontend
      const transformed = {
        id: note.id,
        userId: note.user_id,
        studentId: note.student_id,
        subjectId: note.subject_id,
        evaluationId: note.evaluation_id,
        value: note.value,
        isAbsent: note.is_absent,
        isActive: note.is_active,
        createdAt: note.created_at,
        updatedAt: note.updated_at,
        student: note.students ? {
          id: note.students.id,
          name: note.students.name,
          gender: note.students.gender,
          studentNumber: note.students.student_number,
        } : null,
        subject: note.subjects ? {
          id: note.subjects.id,
          name: note.subjects.name,
          class: note.subjects.classes ? {
            id: note.subjects.classes.id,
            name: note.subjects.classes.name,
          } : null,
        } : null,
      };

      Logger.info('Note fetched successfully', { noteId, userId });
      return transformed as Note;
    } catch (error) {
      Logger.error('Failed to fetch note by ID', error);
      throw new Error('Erreur lors de la récupération de la note');
    }
  }
}
