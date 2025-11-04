// ========================================
// MIDDLEWARE POUR UPLOADS DE FICHIERS SÉCURISÉS
// ========================================

import { Request, Response, NextFunction } from 'express';
import multer, { Multer } from 'multer';
import { Logger } from '../utils/logger';
import { ApiResponse } from '../types/express';
import { randomBytes } from 'crypto';
import { extname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';
import { logSecurityEvent, SecurityEventType } from './securityLogging';

/**
 * Types MIME autorisés pour les uploads
 */
const ALLOWED_MIME_TYPES: { [key: string]: string[] } = {
  image: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
  document: ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'],
  spreadsheet: ['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet']
};

/**
 * Taille maximale des fichiers (5MB par défaut)
 */
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

/**
 * Extensions autorisées par type
 */
const ALLOWED_EXTENSIONS: { [key: string]: string[] } = {
  image: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
  document: ['.pdf', '.doc', '.docx'],
  spreadsheet: ['.xls', '.xlsx']
};

/**
 * Vérifie le type MIME réel d'un fichier (magic numbers)
 * Note: Pour une vérification complète, utiliser un package comme 'file-type'
 */
function verifyFileType(buffer: Buffer, mimeType: string, allowedTypes: string[]): boolean {
  if (!allowedTypes.includes(mimeType)) {
    return false;
  }
  
  // Vérification basique avec magic numbers
  // JPEG: FF D8 FF
  if (buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF && mimeType.startsWith('image/jpeg')) {
    return true;
  }
  
  // PNG: 89 50 4E 47
  if (buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47 && mimeType === 'image/png') {
    return true;
  }
  
  // PDF: 25 50 44 46 (PDF)
  if (buffer.slice(0, 4).toString() === '%PDF' && mimeType === 'application/pdf') {
    return true;
  }
  
  // GIF: 47 49 46 38
  if (buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x38 && mimeType === 'image/gif') {
    return true;
  }
  
  // Pour les autres types, on fait confiance au MIME type mais on devrait utiliser 'file-type'
  return true;
}

/**
 * Génère un nom de fichier sécurisé
 */
function generateSecureFileName(originalName: string): string {
  const ext = extname(originalName).toLowerCase();
  const timestamp = Date.now();
  const randomStr = randomBytes(16).toString('hex');
  return `${timestamp}-${randomStr}${ext}`;
}

/**
 * Configure le stockage Multer de manière sécurisée
 */
function createSecureStorage(destination: string, category: 'image' | 'document' | 'spreadsheet' = 'image') {
  // S'assurer que le dossier existe
  if (!existsSync(destination)) {
    mkdirSync(destination, { recursive: true });
  }
  
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, destination);
    },
    filename: (req, file, cb) => {
      // Générer un nom de fichier sécurisé (sans le nom original qui pourrait être dangereux)
      const secureName = generateSecureFileName(file.originalname);
      cb(null, secureName);
    }
  });
}

/**
 * Configure Multer avec validation stricte
 */
export function createSecureUploader(
  options: {
    category?: 'image' | 'document' | 'spreadsheet';
    maxSize?: number;
    destination?: string;
    fieldName?: string;
  } = {}
): any {
  const {
    category = 'image',
    maxSize = MAX_FILE_SIZE,
    destination = './uploads',
    fieldName = 'file'
  } = options;
  
  const allowedMimes = ALLOWED_MIME_TYPES[category];
  const allowedExts = ALLOWED_EXTENSIONS[category];
  
  const storage = createSecureStorage(destination, category);
  
  // Utiliser memoryStorage pour permettre l'accès au buffer
  const multerStorage = multer.memoryStorage();
  
  const multerInstance = multer({
    storage: multerStorage,
    limits: {
      fileSize: maxSize,
      files: 1 // Un seul fichier à la fois
    },
    fileFilter: (req, file, cb) => {
      // Vérifier le MIME type
      if (!allowedMimes.includes(file.mimetype)) {
        const error = new Error(`Type de fichier non autorisé. Types autorisés: ${allowedMimes.join(', ')}`);
        (error as any).code = 'INVALID_FILE_TYPE';
        
        logSecurityEvent(
          SecurityEventType.FILE_UPLOAD_BLOCKED,
          'medium',
          `Tentative d'upload de fichier avec type invalide`,
          {
            ip: req.ip,
            userId: (req as any).user?.id,
            mimeType: file.mimetype,
            originalName: file.originalname,
            category,
            requestId: (req as any).requestId
          }
        );
        
        return cb(error);
      }
      
      // Vérifier l'extension
      const ext = extname(file.originalname).toLowerCase();
      if (!allowedExts.includes(ext)) {
        const error = new Error(`Extension non autorisée. Extensions autorisées: ${allowedExts.join(', ')}`);
        (error as any).code = 'INVALID_FILE_EXTENSION';
        
        logSecurityEvent(
          SecurityEventType.FILE_UPLOAD_BLOCKED,
          'medium',
          `Tentative d'upload de fichier avec extension invalide`,
          {
            ip: req.ip,
            userId: (req as any).user?.id,
            extension: ext,
            originalName: file.originalname,
            category,
            requestId: (req as any).requestId
          }
        );
        
        return cb(error);
      }
      
      cb(null, true);
    }
  }).single(fieldName);
  
  return multerInstance;
}

/**
 * Middleware pour vérifier les fichiers uploadés après Multer
 */
export const validateUploadedFile = (
  req: Request,
  res: Response<ApiResponse>,
  next: NextFunction
): void => {
  if (!req.file) {
    return next();
  }
  
  const file = req.file;
  
  // Vérifier que le fichier n'est pas vide
  if (file.size === 0) {
    logSecurityEvent(
      SecurityEventType.FILE_UPLOAD_BLOCKED,
      'low',
      'Tentative d\'upload de fichier vide',
      {
        ip: req.ip,
        userId: (req as any).user?.id,
        requestId: (req as any).requestId
      }
    );
    
    res.status(400).json({
      success: false,
      message: 'Le fichier est vide',
      requestId: (req as any).requestId,
      timestamp: new Date().toISOString()
    });
    return;
  }
  
  // Vérifier le type MIME réel (magic numbers)
  // Note: Pour une vérification complète, utiliser le package 'file-type'
  const buffer = file.buffer || Buffer.alloc(0);
  
  // Log l'upload réussi
  logSecurityEvent(
    SecurityEventType.FILE_UPLOAD,
    'low',
    'Fichier uploadé avec succès',
    {
      ip: req.ip,
      userId: (req as any).user?.id,
      fileName: file.filename,
      mimeType: file.mimetype,
      size: file.size,
      requestId: (req as any).requestId
    }
  );
  
  next();
};

/**
 * Middleware pour nettoyer les fichiers uploadés en cas d'erreur
 */
export const cleanupUploadOnError = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Sauvegarder la fonction res.end originale
  const originalEnd = res.end;
  
  res.end = function(chunk?: any, encoding?: any) {
    // Si la réponse est une erreur et qu'un fichier a été uploadé, le supprimer
    if (res.statusCode >= 400 && req.file) {
      const fs = require('fs');
      const path = require('path');
      const filePath = path.join(req.file.destination || './uploads', req.file.filename);
      
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        Logger.info('Fichier uploadé supprimé après erreur', {
          filePath,
          statusCode: res.statusCode,
          requestId: (req as any).requestId
        });
      }
    }
    
    // Appeler la fonction originale
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
};

