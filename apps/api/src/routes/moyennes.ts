// ========================================
// ROUTES POUR LA GESTION DES MOYENNES
// ========================================

import { Router } from 'express';
import { MoyenneController } from '../controllers/moyenneController';
import { authenticateToken } from '../middleware/auth';

const router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

// GET /moyennes/evaluation/:evaluationId - Récupérer les moyennes par évaluation
router.get('/moyennes/evaluation/:evaluationId', (req, res) => 
  MoyenneController.getMoyennesByEvaluation(req, res)
);

// GET /moyennes/class/:classId - Récupérer les moyennes par classe
router.get('/moyennes/class/:classId', (req, res) => 
  MoyenneController.getMoyennesByClass(req, res)
);

// POST /moyennes - Créer ou mettre à jour une moyenne
router.post('/moyennes', (req, res) => 
  MoyenneController.upsertMoyenne(req, res)
);

// POST /moyennes/bulk - Créer ou mettre à jour plusieurs moyennes
router.post('/moyennes/bulk', (req, res) => 
  MoyenneController.upsertMoyennes(req, res)
);

// DELETE /moyennes/:id - Supprimer une moyenne
router.delete('/moyennes/:id', (req, res) => 
  MoyenneController.deleteMoyenne(req, res)
);

export default router;

