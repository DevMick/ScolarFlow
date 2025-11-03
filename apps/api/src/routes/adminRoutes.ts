// Routes pour l'administration
import { Router, Request, Response, NextFunction } from 'express';
import type { Router as ExpressRouter } from 'express';
import PaymentService from '../services/paymentService';
import { authenticateToken } from '../middleware/auth';
import { ApiResponse } from '../types/express';
import { prisma } from '../server';

const router: ExpressRouter = Router();

// Email autorisé pour l'accès admin
const ADMIN_EMAIL = 'mickael.andjui.21@gmail.com';

/**
 * Middleware pour vérifier que l'utilisateur est l'admin autorisé
 */
const requireAdminEmail = (req: Request, res: Response<ApiResponse>, next: NextFunction): void => {
  try {
    if (!req.user) {
      res.status(401).json({
        success: false,
        message: 'Authentification requise',
        requestId: (req as any).requestId || undefined,
        timestamp: new Date().toISOString()
      });
      return;
    }

    if (req.user.email !== ADMIN_EMAIL) {
      res.status(403).json({
        success: false,
        message: 'Accès non autorisé. Seul l\'administrateur autorisé peut accéder à cette ressource.',
        requestId: (req as any).requestId || undefined,
        timestamp: new Date().toISOString()
      });
      return;
    }

    next();
  } catch (error) {
    console.error('Erreur dans requireAdminEmail:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification des permissions',
      requestId: (req as any).requestId || undefined,
      timestamp: new Date().toISOString()
    });
  }
};

/**
 * GET /api/admin/payments
 * Récupérer tous les paiements pour l'administration
 * Nécessite l'authentification standard avec l'email admin
 */
router.get('/payments', authenticateToken, requireAdminEmail, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const { validated } = req.query;
    
    // validated peut être 'true', 'false', ou undefined (pour tous)
    // Si undefined ou 'all', on retourne tous les paiements
    // Si 'true', on retourne seulement les validés
    // Si 'false', on retourne seulement les non validés
    let validatedOnly: boolean | undefined;
    if (validated === 'true') {
      validatedOnly = true;
    } else if (validated === 'false') {
      validatedOnly = false;
    } else {
      validatedOnly = undefined; // Tous les paiements
    }
    
    const result = await PaymentService.getAllPayments(validatedOnly);

    if (result.success) {
      res.status(200).json({
        success: true,
        payments: result.payments,
        message: result.message,
        requestId: (req as any).requestId || undefined,
        timestamp: new Date().toISOString()
      } as ApiResponse & { payments: any[] });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        requestId: (req as any).requestId || undefined,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Erreur lors de la récupération des paiements admin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur interne du serveur';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('Stack trace:', errorStack);
    
    res.status(500).json({
      success: false,
      message: errorMessage,
      ...(process.env.NODE_ENV === 'development' && { details: errorStack }),
      requestId: (req as any).requestId || undefined,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * PUT /api/admin/payments/:id/status
 * Mettre à jour le statut d'un paiement (admin)
 * Nécessite l'authentification standard avec l'email admin
 */
router.put('/payments/:id/status', authenticateToken, requireAdminEmail, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const paymentId = parseInt(req.params.id);
    const { isPaid } = req.body;

    if (isNaN(paymentId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de paiement invalide',
        requestId: (req as any).requestId || undefined,
        timestamp: new Date().toISOString()
      });
    }

    if (typeof isPaid !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Le statut isPaid doit être un booléen',
        requestId: (req as any).requestId || undefined,
        timestamp: new Date().toISOString()
      });
    }

    // Pour l'admin, on peut modifier n'importe quel paiement
    const result = await PaymentService.updatePaymentStatusAdmin(paymentId, isPaid);

    if (result.success) {
      res.status(200).json({
        success: true,
        message: result.message,
        requestId: (req as any).requestId || undefined,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        requestId: (req as any).requestId || undefined,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Erreur lors de la mise à jour du paiement admin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur interne du serveur';
    res.status(500).json({
      success: false,
      message: errorMessage,
      requestId: (req as any).requestId || undefined,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/admin/payments/:id/screenshot
 * Récupérer la capture d'écran d'un paiement (admin - sans restriction de propriétaire)
 * Nécessite l'authentification standard avec l'email admin
 */
router.get('/payments/:id/screenshot', authenticateToken, requireAdminEmail, async (req: Request, res: Response) => {
  try {
    const paymentId = parseInt(req.params.id);

    if (isNaN(paymentId)) {
      return res.status(400).json({
        success: false,
        message: 'ID de paiement invalide',
        requestId: (req as any).requestId || undefined,
        timestamp: new Date().toISOString()
      });
    }

    // Récupérer le screenshot directement (admin peut voir tous les paiements)
    const payment = await (prisma as any).paiements.findUnique({
      where: { id: paymentId },
      select: {
        screenshot: true,
        screenshot_type: true
      }
    });

    if (!payment || !payment.screenshot) {
      return res.status(404).json({
        success: false,
        message: 'Capture d\'écran non trouvée',
        requestId: (req as any).requestId || undefined,
        timestamp: new Date().toISOString()
      });
    }

    const buffer = payment.screenshot as Buffer;
    const contentType = payment.screenshot_type || 'image/jpeg';

    res.set('Content-Type', contentType);
    res.set('Content-Length', buffer.length.toString());
    res.set('Cache-Control', 'public, max-age=3600');
    res.send(buffer);

  } catch (error) {
    console.error('Erreur lors de la récupération de la capture d\'écran admin:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur interne du serveur';
    res.status(500).json({
      success: false,
      message: errorMessage,
      requestId: (req as any).requestId || undefined,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * GET /api/admin/payments/stats
 * Obtenir les statistiques globales des paiements
 * Nécessite l'authentification standard avec l'email admin
 */
router.get('/payments/stats', authenticateToken, requireAdminEmail, async (req: Request, res: Response<ApiResponse>) => {
  try {
    const result = await PaymentService.getGlobalPaymentStats();

    if (result.success) {
      res.status(200).json({
        success: true,
        data: result.stats,
        message: result.message,
        requestId: (req as any).requestId || undefined,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(400).json({
        success: false,
        message: result.message,
        requestId: (req as any).requestId || undefined,
        timestamp: new Date().toISOString()
      });
    }

  } catch (error) {
    console.error('Erreur lors du calcul des statistiques globales:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erreur interne du serveur';
    res.status(500).json({
      success: false,
      message: errorMessage,
      requestId: (req as any).requestId || undefined,
      timestamp: new Date().toISOString()
    });
  }
});

export default router;
