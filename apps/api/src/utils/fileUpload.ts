import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { UPLOAD_CONFIG } from '../config/pdf';
import { FILE_PATHS } from '../config/export';
import { Logger } from './logger';

// Créer les dossiers nécessaires
export const ensureDirectories = () => {
  const dirs = Object.values(FILE_PATHS);
  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      Logger.info(`Created directory: ${dir}`);
    }
  });
};

// Configuration du stockage multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    ensureDirectories();
    cb(null, FILE_PATHS.temp);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = uuidv4();
    const ext = path.extname(file.originalname);
    const filename = `${uniqueSuffix}${ext}`;
    cb(null, filename);
  }
});

// Middleware multer configuré
export const uploadMiddleware = multer({
  storage,
  limits: UPLOAD_CONFIG.limits,
  fileFilter: UPLOAD_CONFIG.fileFilter,
});

// Utilitaire pour nettoyer les fichiers temporaires
export const cleanupTempFile = (filePath: string): void => {
  try {
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      Logger.info(`Cleaned up temp file: ${filePath}`);
    }
  } catch (error) {
    Logger.error(`Failed to cleanup temp file: ${filePath}`, error);
  }
};

// Utilitaire pour nettoyer les anciens fichiers d'export
export const cleanupOldExports = (): void => {
  try {
    const exportsDir = FILE_PATHS.exports;
    if (!fs.existsSync(exportsDir)) return;

    const files = fs.readdirSync(exportsDir);
    const now = Date.now();
    let cleanedCount = 0;

    files.forEach(file => {
      const filePath = path.join(exportsDir, file);
      const stats = fs.statSync(filePath);
      
      // Supprimer les fichiers de plus de 24h
      if (now - stats.mtime.getTime() > 24 * 60 * 60 * 1000) {
        fs.unlinkSync(filePath);
        cleanedCount++;
      }
    });

    if (cleanedCount > 0) {
      Logger.info(`Cleaned up ${cleanedCount} old export files`);
    }
  } catch (error) {
    Logger.error('Failed to cleanup old exports', error);
  }
};

// Utilitaire pour générer un nom de fichier d'export
export const generateExportFilename = (
  format: string,
  type: string = 'moyennes'
): string => {
  const timestamp = new Date().toISOString().split('T')[0];
  const randomId = Math.random().toString(36).substring(2, 8);
  return `moyennes-${type}-${timestamp}-${randomId}.${format}`;
};

// Utilitaire pour valider le type de fichier
export const validateFileType = (file: Express.Multer.File): boolean => {
  const allowedMimes = ['application/pdf'];
  return allowedMimes.includes(file.mimetype);
};

// Utilitaire pour obtenir la taille du fichier de manière lisible
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Démarrer le nettoyage automatique des anciens exports (toutes les heures)
export const startCleanupScheduler = (): void => {
  // Nettoyage initial
  cleanupOldExports();
  
  // Puis toutes les heures
  setInterval(cleanupOldExports, 60 * 60 * 1000);
  Logger.info('Started automatic export cleanup scheduler');
};
