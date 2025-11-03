// Routes pour la gestion des paiements
import { Router, Request, Response } from 'express';
import PaymentService from '../services/paymentService';
import { authenticateToken } from '../middleware/auth';
import { createSecureUploader, validateUploadedFile, cleanupUploadOnError } from '../middleware/secureFileUpload';
import { validateParams } from '../middleware/validation';
import { idSchema } from '../validations/common.validations';

const router = Router();

// Configuration sécurisée de multer pour l'upload d'images
const upload = createSecureUploader({
  category: 'image',
  maxSize: 5 * 1024 * 1024, // 5MB max
  fieldName: 'screenshot'
});

/**
 * POST /api/payments
 * Créer un nouveau paiement
 */
router.post('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    const result = await PaymentService.createPayment({
      userId,
      isPaid: false
    });

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Erreur lors de la création du paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * POST /api/payments/:id/screenshot
 * Ajouter une capture d'écran à un paiement
 */
router.post(
  '/:id/screenshot', 
  authenticateToken, 
  validateParams(idSchema),
  upload,
  validateUploadedFile,
  cleanupUploadOnError,
  async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const paymentId = parseInt(req.params.id);

    console.log('🔍 DEBUG - Upload screenshot request:', {
      userId,
      paymentId,
      hasFile: !!req.file,
      fileInfo: req.file ? {
        fieldname: req.file.fieldname,
        originalname: req.file.originalname,
        mimetype: req.file.mimetype,
        size: req.file.size
      } : null,
      body: req.body,
      headers: {
        'content-type': req.headers['content-type'],
        'content-length': req.headers['content-length']
      }
    });

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    if (!req.file) {
      console.error('❌ DEBUG - No file received:', {
        files: req.files,
        body: req.body,
        headers: req.headers
      });
      return res.status(400).json({
        success: false,
        message: 'Aucun fichier fourni'
      });
    }

    const result = await PaymentService.addScreenshotToPayment(
      paymentId,
      userId,
      req.file.buffer,
      req.file.mimetype
    );

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Erreur lors de l\'ajout de la capture d\'écran:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * GET /api/payments
 * Récupérer les paiements de l'utilisateur
 */
router.get('/', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    const result = await PaymentService.getUserPayments(userId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Erreur lors de la récupération des paiements:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * GET /api/payments/status
 * Vérifier le statut de paiement de l'utilisateur connecté
 * IMPORTANT: Cette route doit être définie AVANT /:id pour éviter que "status" soit interprété comme un ID
 */
router.get('/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    // Vérifier s'il existe un abonnement actif pour cet utilisateur
    const paymentStatus = await PaymentService.checkUserPaymentStatus(userId);

    res.status(200).json({
      success: true,
      isPaid: paymentStatus.isPaid,
      subscriptionEndDate: paymentStatus.subscriptionEndDate ? paymentStatus.subscriptionEndDate.toISOString() : null,
      message: paymentStatus.isPaid 
        ? `Abonnement actif jusqu'au ${paymentStatus.subscriptionEndDate?.toLocaleDateString('fr-FR')}` 
        : 'Aucun abonnement actif'
    });

  } catch (error) {
    console.error('Erreur lors de la vérification du statut de paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * GET /api/payments/stats
 * Obtenir les statistiques des paiements
 * IMPORTANT: Cette route doit être définie AVANT /:id pour éviter que "stats" soit interprété comme un ID
 */
router.get('/stats', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    const result = await PaymentService.getUserPaymentStats(userId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Erreur lors du calcul des statistiques:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * GET /api/payments/:id
 * Récupérer un paiement spécifique
 */
router.get('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const paymentId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    const result = await PaymentService.getPaymentById(paymentId, userId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }

  } catch (error) {
    console.error('Erreur lors de la récupération du paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * GET /api/payments/:id/screenshot
 * Récupérer la capture d'écran d'un paiement
 */
router.get('/:id/screenshot', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const paymentId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    const result = await PaymentService.getPaymentScreenshot(paymentId, userId);

    if (result.success && result.screenshot) {
      const buffer = result.screenshot;
      const contentType = result.screenshotType || 'application/octet-stream';

      res.set('Content-Type', contentType);
      res.set('Content-Length', buffer.length.toString());
      res.send(buffer);
    } else {
      res.status(404).json({
        success: false,
        message: 'Capture d\'écran non trouvée'
      });
    }

  } catch (error) {
    console.error('Erreur lors de la récupération de la capture d\'écran:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * PUT /api/payments/:id/status
 * Mettre à jour le statut d'un paiement
 */
router.put('/:id/status', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const paymentId = parseInt(req.params.id);
    const { isPaid } = req.body;

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    if (typeof isPaid !== 'boolean') {
      return res.status(400).json({
        success: false,
        message: 'Le statut isPaid doit être un booléen'
      });
    }

    const result = await PaymentService.updatePaymentStatus(paymentId, userId, isPaid);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error('Erreur lors de la mise à jour du paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

/**
 * DELETE /api/payments/:id
 * Supprimer un paiement
 */
router.delete('/:id', authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = req.user?.id;
    const paymentId = parseInt(req.params.id);

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: 'Utilisateur non authentifié'
      });
    }

    const result = await PaymentService.deletePayment(paymentId, userId);

    if (result.success) {
      res.status(200).json(result);
    } else {
      res.status(404).json(result);
    }

  } catch (error) {
    console.error('Erreur lors de la suppression du paiement:', error);
    res.status(500).json({
      success: false,
      message: 'Erreur interne du serveur'
    });
  }
});

export default router;
