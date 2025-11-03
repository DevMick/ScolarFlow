import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { ExportService } from '../services/exportService';
import { createExportsService } from '../exports/exports.module';
import { Logger } from '../utils/logger';
import { authenticateToken } from '../middleware/auth';
import { FILE_PATHS } from '../config/export';

const prisma = new PrismaClient();
const exportService = new ExportService(prisma);

// Créer une instance du service PDF
const exportsService = createExportsService(prisma);

export class MoyenneController {
  /**
   * Récupère les moyennes par évaluation
   */
  static async getMoyennesByEvaluation(req: Request, res: Response): Promise<void> {
    try {
      const { evaluationId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: 'Utilisateur non authentifié' 
        });
        return;
      }

      const evaluationIdNum = parseInt(evaluationId);
      if (isNaN(evaluationIdNum)) {
        res.status(400).json({ 
          success: false, 
          error: 'ID d\'évaluation invalide' 
        });
        return;
      }

      // Récupérer les moyennes de l'évaluation
      const moyennes = await (prisma as any).moyennes.findMany({
        where: { 
          evaluation_id: evaluationIdNum,
          user_id: userId,
          is_active: true
        },
        include: {
          students: {
            select: {
              id: true,
              name: true,
              gender: true,
              student_number: true
            }
          },
          evaluations: {
            select: {
              id: true,
              nom: true,
              date: true
            }
          }
        },
        orderBy: {
          moyenne: 'desc'
        }
      });

      // Transformer en camelCase pour le frontend
      const transformed = moyennes.map((m: any) => ({
        id: m.id,
        studentId: m.student_id,
        evaluationId: m.evaluation_id,
        userId: m.user_id,
        moyenne: m.moyenne,
        date: m.date,
        isActive: m.is_active,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
        student: m.students ? {
          id: m.students.id,
          name: m.students.name,
          gender: m.students.gender,
          studentNumber: m.students.student_number
        } : null,
        evaluation: m.evaluations ? {
          id: m.evaluations.id,
          nom: m.evaluations.nom,
          date: m.evaluations.date
        } : null
      }));

      Logger.info('Moyennes récupérées par évaluation', { 
        evaluationId: evaluationIdNum, 
        count: transformed.length 
      });

      res.json({
        success: true,
        data: transformed,
        message: 'Moyennes récupérées avec succès'
      });

    } catch (error) {
      Logger.error('Erreur lors de la récupération des moyennes par évaluation:', error);
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Récupère les moyennes par classe
   */
  static async getMoyennesByClass(req: Request, res: Response): Promise<void> {
    try {
      const { classId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: 'Utilisateur non authentifié' 
        });
        return;
      }

      const classIdNum = parseInt(classId);
      if (isNaN(classIdNum)) {
        res.status(400).json({ 
          success: false, 
          error: 'ID de classe invalide' 
        });
        return;
      }

      // Récupérer les moyennes de la classe avec jointure sur les évaluations
      const moyennes = await (prisma as any).moyennes.findMany({
        where: { 
          user_id: userId,
          is_active: true,
          students: {
            class_id: classIdNum
          }
        },
        include: {
          students: {
            select: {
              id: true,
              name: true,
              gender: true,
              student_number: true
            }
          },
          evaluations: {
            select: {
              id: true,
              nom: true,
              date: true
            }
          }
        },
        orderBy: [
          { evaluation_id: 'desc' },
          { moyenne: 'desc' }
        ]
      });

      // Transformer en camelCase pour le frontend
      const transformed = moyennes.map((m: any) => ({
        id: m.id,
        studentId: m.student_id,
        evaluationId: m.evaluation_id,
        userId: m.user_id,
        moyenne: m.moyenne,
        date: m.date,
        isActive: m.is_active,
        createdAt: m.created_at,
        updatedAt: m.updated_at,
        student: m.students ? {
          id: m.students.id,
          name: m.students.name,
          gender: m.students.gender,
          studentNumber: m.students.student_number
        } : null,
        evaluation: m.evaluations ? {
          id: m.evaluations.id,
          nom: m.evaluations.nom,
          date: m.evaluations.date
        } : null
      }));

      Logger.info('Moyennes récupérées par classe', { 
        classId: classIdNum, 
        count: transformed.length 
      });

      res.json({
        success: true,
        data: transformed,
        message: 'Moyennes récupérées avec succès'
      });

    } catch (error) {
      Logger.error('Erreur lors de la récupération des moyennes par classe:', error);
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Crée ou met à jour une moyenne
   */
  static async upsertMoyenne(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const { studentId, evaluationId, moyenne, date } = req.body;

      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: 'Utilisateur non authentifié' 
        });
        return;
      }

      // Valider les données
      if (!studentId || !evaluationId || moyenne === undefined) {
        res.status(400).json({ 
          success: false, 
          error: 'Données manquantes (studentId, evaluationId, ou moyenne requis)' 
        });
        return;
      }

      // Vérifier si une moyenne existe déjà
      const existingMoyenne = await (prisma as any).moyennes.findFirst({
        where: {
          student_id: studentId,
          evaluation_id: evaluationId,
          user_id: userId
        }
      });

      // Convertir la date en objet Date si c'est une chaîne
      const dateValue = date 
        ? (typeof date === 'string' ? new Date(date) : date)
        : new Date();

      let savedMoyenne;
      if (existingMoyenne) {
        // Mettre à jour
        savedMoyenne = await (prisma as any).moyennes.update({
          where: { id: existingMoyenne.id },
          data: {
            moyenne: moyenne,
            date: dateValue
          }
        });
        Logger.info('Moyenne mise à jour', { moyenneId: savedMoyenne.id, studentId, evaluationId });
      } else {
        // Créer
        savedMoyenne = await (prisma as any).moyennes.create({
          data: {
            student_id: studentId,
            evaluation_id: evaluationId,
            user_id: userId,
            moyenne: moyenne,
            date: dateValue,
            is_active: true
          }
        });
        Logger.info('Nouvelle moyenne créée', { moyenneId: savedMoyenne.id, studentId, evaluationId });
      }

      res.json({
        success: true,
        data: savedMoyenne,
        message: 'Moyenne enregistrée avec succès'
      });

    } catch (error) {
      Logger.error('Erreur lors de l\'enregistrement de la moyenne:', error);
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Crée ou met à jour plusieurs moyennes en lot
   */
  static async upsertMoyennes(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;
      const moyennes = req.body;

      Logger.info('Requête upsertMoyennes reçue', { 
        userId, 
        bodyType: typeof moyennes,
        isArray: Array.isArray(moyennes),
        bodyKeys: moyennes ? Object.keys(moyennes) : 'null',
        bodyLength: moyennes ? (Array.isArray(moyennes) ? moyennes.length : 'not array') : 'null'
      });

      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: 'Utilisateur non authentifié' 
        });
        return;
      }

      if (!moyennes || !Array.isArray(moyennes)) {
        Logger.warn('Données de moyennes invalides', { 
          moyennes, 
          type: typeof moyennes, 
          isArray: Array.isArray(moyennes) 
        });
        res.status(400).json({ 
          success: false, 
          error: 'Données de moyennes invalides - un tableau est attendu' 
        });
        return;
      }

      if (moyennes.length === 0) {
        Logger.warn('Tableau de moyennes vide');
        res.status(400).json({ 
          success: false, 
          error: 'Aucune moyenne à enregistrer' 
        });
        return;
      }

      Logger.info('Enregistrement en lot des moyennes', { 
        userId, 
        count: moyennes.length,
        sample: moyennes[0] // Log du premier élément pour debug
      });

      // Enregistrer les moyennes dans la base de données
      const savedMoyennes = [];
      const errors = [];

      for (const moyenneData of moyennes) {
        try {
          // Valider les données
          if (!moyenneData.studentId || !moyenneData.evaluationId || moyenneData.moyenne === undefined) {
            errors.push({
              studentId: moyenneData.studentId,
              error: 'Données manquantes (studentId, evaluationId, ou moyenne)'
            });
            continue;
          }

          // Vérifier si une moyenne existe déjà pour cet élève et cette évaluation
          const existingMoyenne = await (prisma as any).moyennes.findFirst({
            where: {
              student_id: moyenneData.studentId,
              evaluation_id: moyenneData.evaluationId,
              user_id: userId
            }
          });

          // Convertir la moyenne en Decimal (Prisma accepte les nombres ou les chaînes)
          const moyenneValue = typeof moyenneData.moyenne === 'number' 
            ? moyenneData.moyenne 
            : parseFloat(moyenneData.moyenne);
          
          // Convertir la date en objet Date si c'est une chaîne
          const dateValue = moyenneData.date 
            ? (typeof moyenneData.date === 'string' ? new Date(moyenneData.date) : moyenneData.date)
            : new Date();
          
          let savedMoyenne;
          if (existingMoyenne) {
            // Mettre à jour la moyenne existante
            savedMoyenne = await (prisma as any).moyennes.update({
              where: { id: existingMoyenne.id },
              data: {
                moyenne: moyenneValue,
                date: dateValue
              }
            });
          } else {
            // Créer une nouvelle moyenne
            savedMoyenne = await (prisma as any).moyennes.create({
              data: {
                student_id: moyenneData.studentId,
                evaluation_id: moyenneData.evaluationId,
                user_id: userId,
                moyenne: moyenneValue,
                date: dateValue,
                is_active: true
              }
            });
          }

          savedMoyennes.push(savedMoyenne);
        } catch (moyenneError) {
          Logger.error('Erreur lors de l\'enregistrement d\'une moyenne', { 
            moyenneData, 
            error: moyenneError 
          });
          errors.push({
            studentId: moyenneData.studentId,
            error: moyenneError instanceof Error ? moyenneError.message : 'Erreur inconnue'
          });
        }
      }

      Logger.info('Moyennes enregistrées en lot', { 
        userId, 
        totalRequested: moyennes.length,
        saved: savedMoyennes.length,
        errors: errors.length
      });

      res.json({
        success: true,
        data: savedMoyennes,  // Retourner les moyennes créées, pas juste le compteur
        meta: {
          saved: savedMoyennes.length,
          errors: errors.length > 0 ? errors : undefined
        },
        message: `${savedMoyennes.length} moyenne(s) enregistrée(s) avec succès${errors.length > 0 ? `, ${errors.length} erreur(s)` : ''}`
      });

    } catch (error) {
      Logger.error('Erreur lors de l\'enregistrement en lot des moyennes:', error);
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Supprime une moyenne
   */
  static async deleteMoyenne(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: 'Utilisateur non authentifié' 
        });
        return;
      }

      const moyenneId = parseInt(id);
      if (isNaN(moyenneId)) {
        res.status(400).json({ 
          success: false, 
          error: 'ID de moyenne invalide' 
        });
        return;
      }

      // Vérifier que la moyenne appartient bien à l'utilisateur
      const moyenne = await (prisma as any).moyennes.findFirst({
        where: {
          id: moyenneId,
          user_id: userId
        }
      });

      if (!moyenne) {
        res.status(404).json({ 
          success: false, 
          error: 'Moyenne non trouvée' 
        });
        return;
      }

      // Soft delete: marquer comme inactive
      await (prisma as any).moyennes.update({
        where: { id: moyenneId },
        data: { is_active: false }
      });

      Logger.info('Moyenne supprimée (soft delete)', { moyenneId, userId });

      res.json({
        success: true,
        message: 'Moyenne supprimée avec succès'
      });

    } catch (error) {
      Logger.error('Erreur lors de la suppression de la moyenne:', error);
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Exporte les moyennes d'une évaluation au format Word
   */
  static async exportMoyennesToWord(req: Request, res: Response): Promise<void> {
    try {
      const { classId, evaluationId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: 'Utilisateur non authentifié' 
        });
        return;
      }

      if (!classId || !evaluationId) {
        res.status(400).json({ 
          success: false, 
          error: 'ID de classe et ID d\'évaluation requis' 
        });
        return;
      }

      const classIdNum = parseInt(classId);
      const evaluationIdNum = parseInt(evaluationId);

      if (isNaN(classIdNum) || isNaN(evaluationIdNum)) {
        res.status(400).json({ 
          success: false, 
          error: 'IDs invalides' 
        });
        return;
      }

      Logger.info('Export Word des moyennes demandé', { 
        classId: classIdNum, 
        evaluationId: evaluationIdNum, 
        userId 
      });

      // Exporter les moyennes au format Word
      const result = await exportService.exportMoyennesToWord(
        classIdNum,
        evaluationIdNum,
        userId
      );

      res.json({
        success: true,
        data: result,
        message: 'Export Word des moyennes généré avec succès'
      });

    } catch (error) {
      Logger.error('Erreur lors de l\'export Word des moyennes:', error);
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Exporte les moyennes d'une évaluation au format PDF
   */
  static async exportMoyennesToPDF(req: Request, res: Response): Promise<void> {
    try {
      const { classId, evaluationId } = req.params;
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ 
          success: false, 
          error: 'Utilisateur non authentifié' 
        });
        return;
      }

      if (!classId || !evaluationId) {
        res.status(400).json({ 
          success: false, 
          error: 'ID de classe et ID d\'évaluation requis' 
        });
        return;
      }

      const classIdNum = parseInt(classId);
      const evaluationIdNum = parseInt(evaluationId);

      if (isNaN(classIdNum) || isNaN(evaluationIdNum)) {
        res.status(400).json({ 
          success: false, 
          error: 'IDs invalides' 
        });
        return;
      }

      Logger.info('Export des moyennes demandé', { 
        classId: classIdNum, 
        evaluationId: evaluationIdNum, 
        userId 
      });

      // Exporter les moyennes avec le nouveau service Puppeteer
      const result = await exportsService.exportEvaluationToPDF(
        evaluationIdNum,
        classIdNum
      );

      res.json({
        success: true,
        data: result,
        message: 'Export des moyennes généré avec succès'
      });

    } catch (error) {
      Logger.error('Erreur lors de l\'export des moyennes:', error);
      
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : 'Erreur interne du serveur'
      });
    }
  }

  /**
   * Télécharge un fichier d'export des moyennes
   */
  static async downloadMoyennesExport(req: Request, res: Response): Promise<void> {
    try {
      const { filename } = req.params;
      
      if (!filename) {
        res.status(400).json({ 
          success: false, 
          error: 'Nom de fichier requis' 
        });
        return;
      }

      const fs = require('fs');
      const path = require('path');
      
      // Vérifier que le fichier existe
      let filepath = path.join(FILE_PATHS.exports, filename);
      
      // Si le fichier n'existe pas dans exports, chercher dans pdfs
      if (!fs.existsSync(filepath)) {
        const pdfPath = path.join(FILE_PATHS.pdfs, filename);
        if (fs.existsSync(pdfPath)) {
          filepath = pdfPath;
        }
      }
      
      if (!fs.existsSync(filepath)) {
        res.status(404).json({ 
          success: false, 
          error: 'Fichier non trouvé' 
        });
        return;
      }

      // Vérifier que c'est un fichier de moyennes ou bulletin
      const isPDF = filename.endsWith('.pdf');
      const isWord = filename.endsWith('.docx');
      
      // Accepter les fichiers qui commencent par moyennes- ou Bulletin- ou bulletin_
      const isValidPrefix = filename.startsWith('moyennes-') || 
                           filename.startsWith('Bulletin-') || 
                           filename.startsWith('bulletin_');
      
      if (!isValidPrefix || (!isPDF && !isWord)) {
        Logger.warn('Tentative de téléchargement de fichier non autorisé', { filename, isPDF, isWord, isValidPrefix });
        res.status(400).json({ 
          success: false, 
          error: 'Type de fichier non autorisé' 
        });
        return;
      }

      // Configurer les headers pour le téléchargement
      res.setHeader('Content-Type', isPDF ? 'application/pdf' : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      
      // Envoyer le fichier
      res.sendFile(path.resolve(filepath), (err) => {
        if (err) {
          Logger.error('Erreur lors de l\'envoi du fichier:', err);
          if (!res.headersSent) {
            res.status(500).json({ 
              success: false, 
              error: 'Erreur lors de l\'envoi du fichier' 
            });
          }
        } else {
          // Supprimer le fichier temporaire après envoi
          setTimeout(() => {
            try {
              fs.unlinkSync(filepath);
              Logger.info('Fichier temporaire supprimé', { filename });
            } catch (deleteError) {
              Logger.warn('Impossible de supprimer le fichier temporaire', { filename, error: deleteError });
            }
          }, 1000);
        }
      });

    } catch (error) {
      Logger.error('Erreur lors du téléchargement:', error);
      
      if (!res.headersSent) {
        res.status(500).json({
          success: false,
          error: error instanceof Error ? error.message : 'Erreur interne du serveur'
        });
      }
    }
  }
}