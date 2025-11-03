import { Request, Response } from 'express';
import { EvaluationService } from '../services/evaluationService';
import { CreateEvaluationSimpleData, UpdateEvaluationSimpleData } from '@edustats/shared';

export class EvaluationController {
  private evaluationService: EvaluationService;

  constructor() {
    this.evaluationService = new EvaluationService();
  }

  // Récupérer toutes les évaluations d'une classe
  async getEvaluationsByClass(req: Request, res: Response) {
    try {
      const { classId } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      if (!classId || isNaN(parseInt(classId))) {
        return res.status(400).json({ error: 'ID de classe invalide' });
      }

      const evaluations = await this.evaluationService.getEvaluationsByClass(
        parseInt(classId),
        userId
      );

      res.json(evaluations);
    } catch (error) {
      console.error('Erreur lors de la récupération des évaluations:', error);
      res.status(500).json({ error: 'Erreur interne du serveur' });
    }
  }

  // Créer une nouvelle évaluation
  async createEvaluation(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const data: CreateEvaluationSimpleData = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      const evaluation = await this.evaluationService.createEvaluation(data, userId);

      res.status(201).json(evaluation);
    } catch (error) {
      console.error('Erreur lors de la création de l\'évaluation:', error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erreur interne du serveur' });
      }
    }
  }

  // Mettre à jour une évaluation
  async updateEvaluation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;
      const data: UpdateEvaluationSimpleData = req.body;

      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ error: 'ID d\'évaluation invalide' });
      }

      const evaluation = await this.evaluationService.updateEvaluation(
        parseInt(id),
        data,
        userId
      );

      res.json(evaluation);
    } catch (error) {
      console.error('Erreur lors de la mise à jour de l\'évaluation:', error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erreur interne du serveur' });
      }
    }
  }

  // Supprimer une évaluation
  async deleteEvaluation(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = (req as any).user?.id;

      if (!userId) {
        return res.status(401).json({ error: 'Utilisateur non authentifié' });
      }

      if (!id || isNaN(parseInt(id))) {
        return res.status(400).json({ error: 'ID d\'évaluation invalide' });
      }

      await this.evaluationService.deleteEvaluation(parseInt(id), userId);

      res.status(204).send();
    } catch (error) {
      console.error('Erreur lors de la suppression de l\'évaluation:', error);
      if (error instanceof Error) {
        res.status(400).json({ error: error.message });
      } else {
        res.status(500).json({ error: 'Erreur interne du serveur' });
      }
    }
  }
}