import { Request, Response } from 'express';
import { NoteService } from '../services/noteService';
import { ApiResponseHelper } from '../utils/response';
import { Logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';
import type { CreateNoteData, UpdateNoteData } from '@edustats/shared';

export class NoteController {
  private noteService: NoteService;

  constructor(prisma: PrismaClient) {
    this.noteService = new NoteService(prisma);
  }

  async getNotes(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const { studentId, subjectId, classId, evaluationId } = req.query;

      Logger.info('Fetching notes', { 
        userId: req.user.id,
        studentId,
        subjectId,
        classId,
        evaluationId
      });

      let notes;
      
      // Cas spécifique : récupérer toutes les notes d'une classe pour une évaluation
      if (classId && evaluationId) {
        notes = await this.noteService.getNotesByClassAndEvaluation(
          parseInt(classId as string),
          parseInt(evaluationId as string)
        );
      } else if (evaluationId) {
        notes = await this.noteService.getNotesByEvaluation(parseInt(evaluationId as string));
      } else if (studentId && subjectId) {
        notes = await this.noteService.getNotesByStudentAndSubject(
          parseInt(studentId as string), 
          parseInt(subjectId as string)
        );
      } else if (classId && subjectId) {
        notes = await this.noteService.getNotesByClassAndSubject(
          parseInt(classId as string), 
          parseInt(subjectId as string)
        );
      } else if (studentId) {
        notes = await this.noteService.getNotesByStudent(parseInt(studentId as string));
      } else if (subjectId) {
        notes = await this.noteService.getNotesBySubject(parseInt(subjectId as string));
      } else {
        notes = await this.noteService.getUserNotes(req.user.id);
      }

      ApiResponseHelper.success(
        res,
        {
          notes,
          total: notes.length,
        },
        'Notes récupérées avec succès'
      );
    } catch (error) {
      Logger.error('Get notes failed', error);
      ApiResponseHelper.serverError(res, 'Erreur lors de la récupération des notes');
    }
  }

  async getNoteById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const noteId = parseInt(req.params.id);
      
      if (isNaN(noteId)) {
        ApiResponseHelper.error(res, 'ID de note invalide', 400);
        return;
      }

      Logger.info('Fetching note by ID', { 
        noteId, 
        userId: req.user.id 
      });

      const note = await this.noteService.getNoteById(noteId, req.user.id);

      if (!note) {
        ApiResponseHelper.notFound(res, 'Note non trouvée');
        return;
      }

      ApiResponseHelper.success(res, note, 'Note récupérée avec succès');
    } catch (error) {
      Logger.error('Get note by ID failed', error);
      ApiResponseHelper.serverError(res, 'Erreur lors de la récupération de la note');
    }
  }

  async createNote(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const noteData: CreateNoteData = req.body;

      Logger.info('Creating new note', { 
        userId: req.user.id, 
        studentId: noteData.studentId,
        subjectId: noteData.subjectId,
        value: noteData.value
      });

      const newNote = await this.noteService.createNote(req.user.id, noteData);

      ApiResponseHelper.success(
        res,
        newNote,
        'Note créée avec succès',
        201
      );
    } catch (error) {
      Logger.error('Create note failed', error);
      
      if (error instanceof Error) {
        ApiResponseHelper.error(res, error.message, 400);
      } else {
        ApiResponseHelper.serverError(res, 'Erreur lors de la création de la note');
      }
    }
  }

  async upsertNote(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const noteData: CreateNoteData = req.body;

      Logger.info('Upserting note', { 
        userId: req.user.id, 
        studentId: noteData.studentId,
        subjectId: noteData.subjectId,
        value: noteData.value
      });

      const note = await this.noteService.upsertNote(req.user.id, noteData);

      ApiResponseHelper.success(
        res,
        note,
        'Note sauvegardée avec succès',
        201
      );
    } catch (error) {
      Logger.error('Upsert note failed', error);
      
      if (error instanceof Error) {
        ApiResponseHelper.error(res, error.message, 400);
      } else {
        ApiResponseHelper.serverError(res, 'Erreur lors de la sauvegarde de la note');
      }
    }
  }

  async updateNote(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const noteId = parseInt(req.params.id);
      
      if (isNaN(noteId)) {
        ApiResponseHelper.error(res, 'ID de note invalide', 400);
        return;
      }

      const updateData: UpdateNoteData = req.body;

      Logger.info('Updating note', { 
        noteId, 
        userId: req.user.id 
      });

      const updatedNote = await this.noteService.updateNote(
        noteId, 
        req.user.id, 
        updateData
      );

      ApiResponseHelper.success(res, updatedNote, 'Note mise à jour avec succès');
    } catch (error) {
      Logger.error('Update note failed', error);
      
      if (error instanceof Error) {
        ApiResponseHelper.error(res, error.message, 400);
      } else {
        ApiResponseHelper.serverError(res, 'Erreur lors de la mise à jour de la note');
      }
    }
  }

  async deleteNote(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        ApiResponseHelper.unauthorized(res, 'Utilisateur non authentifié');
        return;
      }

      const noteId = parseInt(req.params.id);
      
      if (isNaN(noteId)) {
        ApiResponseHelper.error(res, 'ID de note invalide', 400);
        return;
      }

      Logger.info('Deleting note', { 
        noteId, 
        userId: req.user.id 
      });

      await this.noteService.deleteNote(noteId, req.user.id);

      ApiResponseHelper.success(res, null, 'Note supprimée avec succès');
    } catch (error) {
      Logger.error('Delete note failed', error);
      
      if (error instanceof Error) {
        ApiResponseHelper.error(res, error.message, 400);
      } else {
        ApiResponseHelper.serverError(res, 'Erreur lors de la suppression de la note');
      }
    }
  }
}
