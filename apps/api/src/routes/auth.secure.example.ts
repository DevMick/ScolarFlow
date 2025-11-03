// ========================================
// EXEMPLE D'UTILISATION DES VALIDATIONS ET SÉCURITÉ
// ========================================

import { Router, Request, Response } from 'express';
import { authenticateToken } from '../middleware/auth';
import { validateBody, validateQuery, validateParams } from '../middleware/validation';
import { registerSchema, loginSchema, changePasswordSchema } from '../validations/auth.validations';
import { idSchema, paginationSchema } from '../validations/common.validations';
import { errorCatcher } from '../middleware/errorHandler.security';
import { csrfProtectionLite } from '../middleware/csrf';

const router = Router();

/**
 * EXEMPLE 1 : Route d'inscription avec validation Zod
 */
router.post(
  '/register',
  // 1. Validation avec Zod (sanitisation automatique)
  validateBody(registerSchema),
  // 2. Handler avec gestion d'erreur sécurisée
  errorCatcher(async (req: Request, res: Response) => {
    // req.body est maintenant validé et sanitizé
    const { email, password, firstName, lastName } = req.body;
    
    // Vous pouvez utiliser les données en toute sécurité
    // ... votre logique métier
    
    res.status(201).json({
      success: true,
      message: 'Utilisateur créé avec succès'
    });
  })
);

/**
 * EXEMPLE 2 : Route de connexion avec validation et rate limiting
 */
router.post(
  '/login',
  // Validation
  validateBody(loginSchema),
  // Handler
  errorCatcher(async (req: Request, res: Response) => {
    // req.body est validé et sanitizé
    const { email, password, remember } = req.body;
    
    // ... votre logique d'authentification
    
    res.status(200).json({
      success: true,
      message: 'Connexion réussie'
    });
  })
);

/**
 * EXEMPLE 3 : Route protégée avec validation de paramètres
 */
router.get(
  '/users/:id',
  // 1. Authentification
  authenticateToken,
  // 2. Validation des paramètres
  validateParams(idSchema),
  // 3. Handler
  errorCatcher(async (req: Request, res: Response) => {
    // req.params.id est validé comme un nombre positif
    const userId = req.params.id; // Type: number (grâce à z.coerce)
    
    // ... votre logique
    
    res.status(200).json({
      success: true,
      data: { userId }
    });
  })
);

/**
 * EXEMPLE 4 : Route avec query params et pagination
 */
router.get(
  '/items',
  // 1. Authentification
  authenticateToken,
  // 2. Validation des query params
  validateQuery(paginationSchema),
  // 3. Handler
  errorCatcher(async (req: Request, res: Response) => {
    // req.query est validé
    const { page = 1, limit = 10 } = req.query;
    
    // ... votre logique avec pagination
    
    res.status(200).json({
      success: true,
      data: [],
      pagination: { page, limit }
    });
  })
);

/**
 * EXEMPLE 5 : Route modifiant l'état avec CSRF protection
 */
router.post(
  '/change-password',
  // 1. Authentification
  authenticateToken,
  // 2. Protection CSRF (lite pour API REST avec JWT)
  csrfProtectionLite,
  // 3. Validation
  validateBody(changePasswordSchema),
  // 4. Handler
  errorCatcher(async (req: Request, res: Response) => {
    const { currentPassword, newPassword } = req.body;
    
    // ... votre logique
    
    res.status(200).json({
      success: true,
      message: 'Mot de passe changé avec succès'
    });
  })
);

export default router;

