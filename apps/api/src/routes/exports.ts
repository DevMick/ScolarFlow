import { Router } from 'express';
import path from 'path';
import fs from 'fs';
import { authenticateToken } from '../middleware/auth';
import { ApiResponseHelper } from '../utils/response';
import { Logger } from '../utils/logger';
import { FILE_PATHS } from '../config/export';
import { MoyenneController } from '../controllers/moyenneController';

const router: Router = Router();

// Toutes les routes nécessitent une authentification
router.use(authenticateToken);

/**
 * Exporte les moyennes d'une évaluation au format PDF
 */
router.post('/moyennes/:classId/:evaluationId', MoyenneController.exportMoyennesToPDF);

/**
 * Exporte les moyennes d'une évaluation au format Word
 */
router.post('/moyennes/:classId/:evaluationId/word', MoyenneController.exportMoyennesToWord);

/**
 * Télécharge un fichier d'export des moyennes
 */
router.get('/download/:filename', MoyenneController.downloadMoyennesExport);

/**
 * Sert les fichiers d'export
 */
router.get('/:fileName', async (req, res) => {
  try {
    const fileName = req.params.fileName;
    let filePath = path.join(FILE_PATHS.exports, fileName);
    
    // Si le fichier n'existe pas dans exports, chercher dans pdfs
    if (!fs.existsSync(filePath)) {
      const pdfPath = path.join(FILE_PATHS.pdfs, fileName);
      if (fs.existsSync(pdfPath)) {
        filePath = pdfPath;
      }
    }

    // Vérifier que le fichier existe
    if (!fs.existsSync(filePath)) {
      ApiResponseHelper.notFound(res, 'Fichier non trouvé ou expiré');
      return;
    }

    // Vérifier que le fichier n'est pas trop ancien (24h)
    const stats = fs.statSync(filePath);
    const age = Date.now() - stats.mtime.getTime();
    const maxAge = 24 * 60 * 60 * 1000; // 24 heures

    if (age > maxAge) {
      // Supprimer le fichier expiré
      fs.unlinkSync(filePath);
      ApiResponseHelper.notFound(res, 'Fichier expiré');
      return;
    }

    // Déterminer le type MIME
    const ext = path.extname(fileName).toLowerCase();
    let contentType = 'application/octet-stream';
    
    switch (ext) {
      case '.pdf':
        contentType = 'application/pdf';
        break;
      case '.xlsx':
        contentType = 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
        break;
      case '.csv':
        contentType = 'text/csv';
        break;
    }

    // Définir les en-têtes pour le téléchargement
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `attachment; filename="${fileName}"`);
    res.setHeader('Content-Length', stats.size);

    // Stream le fichier
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

    // Log le téléchargement
    Logger.info('File download', { 
      fileName, 
      userId: req.user?.id,
      size: stats.size 
    });

    // Nettoyer le fichier après téléchargement (optionnel)
    fileStream.on('end', () => {
      // Optionnel: supprimer le fichier après téléchargement
      // fs.unlinkSync(filePath);
    });

  } catch (error) {
    Logger.error('Export file serving failed', error);
    ApiResponseHelper.serverError(res, 'Erreur lors du téléchargement du fichier');
  }
});

export default router;
