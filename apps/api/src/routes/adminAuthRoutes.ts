// Routes d'authentification pour les administrateurs
import { Router, Request, Response } from 'express';
import AdminService from '../services/adminService';
import { authenticateAdmin } from '../middleware/adminAuth';

const router = Router();

/**
 * POST /api/admin/auth/login
 * Connexion administrateur
 */
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { username, password } = req.body;

    // Validation des champs
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Nom d\'utilisateur et mot de passe requis'
      });
    }

    const result = await AdminService.authenticateAdmin({ username, password });

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(401).json(result);
    }

  } catch (error) {
    console.error('Erreur lors de la connexion admin:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * POST /api/admin/auth/verify
 * Vérifier le token admin
 */
router.post('/verify', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      message: 'Token valide',
      admin: req.admin
    });
  } catch (error) {
    console.error('Erreur lors de la vérification du token:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * POST /api/admin/auth/logout
 * Déconnexion administrateur
 */
router.post('/logout', (req: Request, res: Response) => {
  // Pour JWT, la déconnexion se fait côté client en supprimant le token
  res.status(200).json({
    success: true,
    message: 'Déconnexion réussie'
  });
});

/**
 * GET /api/admin/auth/profile
 * Obtenir le profil de l'administrateur connecté
 */
router.get('/profile', authenticateAdmin, async (req: Request, res: Response) => {
  try {
    res.status(200).json({
      success: true,
      admin: req.admin,
      message: 'Profil récupéré avec succès'
    });
  } catch (error) {
    console.error('Erreur lors de la récupération du profil:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

export default router;
