import { Router, type Request, type Response } from 'express';
import rateLimit from 'express-rate-limit';
import { AuthController } from '../controllers/authController';
import { validateBody } from '../middleware/validation';
import { authenticateToken } from '../middleware/auth';
import { SECURITY_CONFIG } from '../config/security';
import { 
  registerSchema, 
  loginSchema, 
  updateProfileSchema 
} from '@edustats/shared';

const router: Router = Router();
let authController: AuthController;

// Initialize controller lazily to avoid circular dependency
const getAuthController = () => {
  if (!authController) {
    authController = new AuthController();
  }
  return authController;
};

// Rate limiting spécifique à l'authentification (skip OPTIONS requests)
const authLimiter = rateLimit({
  ...SECURITY_CONFIG.authRateLimit,
  skip: (req) => req.method === 'OPTIONS',
});

// Routes publiques
router.post('/register', 
  authLimiter,
  validateBody(registerSchema),
  (req, res) => getAuthController().register(req, res)
);

router.post('/login',
  authLimiter,
  validateBody(loginSchema),
  (req, res) => getAuthController().login(req, res)
);

router.post('/logout', (req, res) => getAuthController().logout(req, res));

router.post('/refresh', (req, res) => getAuthController().refreshToken(req, res));

// Routes protégées
router.get('/me', authenticateToken, (req, res) => getAuthController().getProfile(req, res));
router.get('/profile', authenticateToken, (req, res) => getAuthController().getProfile(req, res));

router.put('/profile',
  authenticateToken,
  validateBody(updateProfileSchema),
  (req, res) => getAuthController().updateProfile(req, res)
);

export default router;
