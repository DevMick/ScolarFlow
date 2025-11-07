import { Request, Response, NextFunction } from 'express';
import { ClassThresholdService } from '../services/classThresholdService';
import { prisma } from '../lib/prisma';
const classThresholdService = new ClassThresholdService(prisma);

export class ClassThresholdController {
  /**
   * Récupère les seuils d'une classe
   */
  static async getByClassId(req: Request, res: Response, next: NextFunction) {
    try {
      const classId = parseInt(req.params.classId);

      if (isNaN(classId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de classe invalide'
        });
      }

      const threshold = await classThresholdService.getByClassId(classId);

      if (!threshold) {
        return res.status(404).json({
          success: false,
          message: 'Seuils non trouvés pour cette classe'
        });
      }

      return res.status(200).json({
        success: true,
        data: threshold
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Crée les seuils pour une classe
   */
  static async create(req: Request, res: Response, next: NextFunction) {
    try {
      const { classId, moyenneAdmission, moyenneRedoublement, maxNote } = req.body;
      const userId = (req as any).user?.id;

      // Validation
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      if (!classId || moyenneAdmission === undefined || moyenneRedoublement === undefined || !maxNote) {
        return res.status(400).json({
          success: false,
          message: 'Tous les champs sont requis'
        });
      }

      if (maxNote !== 10 && maxNote !== 20) {
        return res.status(400).json({
          success: false,
          message: 'La note maximale doit être 10 ou 20'
        });
      }

      if (moyenneAdmission > maxNote || moyenneRedoublement > maxNote) {
        return res.status(400).json({
          success: false,
          message: `Les moyennes ne peuvent pas dépasser ${maxNote}`
        });
      }

      const threshold = await classThresholdService.create({
        classId,
        userId,
        moyenneAdmission: parseFloat(moyenneAdmission),
        moyenneRedoublement: parseFloat(moyenneRedoublement),
        maxNote
      });

      return res.status(201).json({
        success: true,
        message: 'Seuils créés avec succès',
        data: threshold
      });
    } catch (error: any) {
      if (error.message === 'Classe non trouvée') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      if (error.message === 'Des seuils existent déjà pour cette classe') {
        return res.status(409).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * Met à jour les seuils d'une classe
   */
  static async update(req: Request, res: Response, next: NextFunction) {
    try {
      const classId = parseInt(req.params.classId);
      const { moyenneAdmission, moyenneRedoublement, maxNote } = req.body;
      const userId = (req as any).user?.id;

      if (isNaN(classId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de classe invalide'
        });
      }

      // Validation
      if (!userId) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non authentifié'
        });
      }

      if (moyenneAdmission === undefined || moyenneRedoublement === undefined || !maxNote) {
        return res.status(400).json({
          success: false,
          message: 'Tous les champs sont requis'
        });
      }

      if (maxNote !== 10 && maxNote !== 20) {
        return res.status(400).json({
          success: false,
          message: 'La note maximale doit être 10 ou 20'
        });
      }

      if (moyenneAdmission > maxNote || moyenneRedoublement > maxNote) {
        return res.status(400).json({
          success: false,
          message: `Les moyennes ne peuvent pas dépasser ${maxNote}`
        });
      }

      const threshold = await classThresholdService.update(classId, {
        classId,
        userId,
        moyenneAdmission: parseFloat(moyenneAdmission),
        moyenneRedoublement: parseFloat(moyenneRedoublement),
        maxNote
      });

      return res.status(200).json({
        success: true,
        message: 'Seuils mis à jour avec succès',
        data: threshold
      });
    } catch (error: any) {
      if (error.message === 'Seuils non trouvés pour cette classe') {
        return res.status(404).json({
          success: false,
          message: error.message
        });
      }
      next(error);
    }
  }

  /**
   * Supprime les seuils d'une classe
   */
  static async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const classId = parseInt(req.params.classId);

      if (isNaN(classId)) {
        return res.status(400).json({
          success: false,
          message: 'ID de classe invalide'
        });
      }

      await classThresholdService.delete(classId);

      return res.status(200).json({
        success: true,
        message: 'Seuils supprimés avec succès'
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Récupère tous les seuils
   */
  static async getAll(req: Request, res: Response, next: NextFunction) {
    try {
      const thresholds = await classThresholdService.getAll();

      return res.status(200).json({
        success: true,
        data: thresholds
      });
    } catch (error) {
      next(error);
    }
  }
}

