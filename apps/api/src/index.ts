/// <reference path="./types/express.d.ts" />

import type { VercelRequest, VercelResponse } from '@vercel/node';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import configurations
import { SECURITY_CONFIG } from './config/security';
import { helmetConfig, additionalSecurityHeaders } from './config/helmet.config';
import { Logger } from './utils/logger';
import { notFoundHandler } from './middleware/errorHandler';
import { secureErrorHandler, validateSecurityHeaders } from './middleware/errorHandler.security';
import { sanitizeInputs } from './middleware/validation';
import { detectInjectionAttempts } from './middleware/securityLogging';
import { ensureDirectories } from './utils/fileUpload';

// Import Prisma instance globale
import { prisma } from './lib/prisma';

// Import routes
import healthRouter from './routes/health';
import authRouter from './routes/auth';
import { createSchoolYearsRoutes } from './routes/schoolYears';
import classesRouter from './routes/classes';
import studentsRouter from './routes/students';
import exportsRouter from './routes/exports';
import exportBilanRouter from './routes/exportBilan';
import { createNoteRoutes } from './routes/notes';
import evaluationsRouter from './routes/evaluations';
import { createSubjectRoutes } from './routes/subjects';
import { createEvaluationFormulaRoutes } from './routes/evaluationFormulas';
import { createClassAverageConfigRoutes } from './routes/classAverageConfigs';
import moyennesRouter from './routes/moyennes';
import { createCompteGratuitRoutes } from './routes/compteGratuit';
import paymentRouter from './routes/paymentRoutes';
import adminRouter from './routes/adminRoutes';
import adminAuthRouter from './routes/adminAuthRoutes';
import { createApiRoutes } from './routes';
import AdminService from './services/adminService';

const app = express();

// ========================================
// CONFIGURATION DE SÉCURITÉ DE BASE
// ========================================

// Helmet - En-têtes de sécurité HTTP
app.use(helmet(helmetConfig as any));

// En-têtes de sécurité supplémentaires
app.use(additionalSecurityHeaders);

// CORS doit être avant tout autre middleware
app.use(cors(SECURITY_CONFIG.cors));

// Handle preflight requests for all routes
app.options('*', cors(SECURITY_CONFIG.cors));

// Middleware CORS supplémentaire pour le développement
if (process.env.NODE_ENV === 'development') {
  app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', process.env.CORS_ORIGIN || 'http://localhost:3000');
    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
    res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin');
    res.header('Access-Control-Allow-Credentials', 'true');
    
    if (req.method === 'OPTIONS') {
      res.status(200).end();
      return;
    }
    
    next();
  });
}

// Rate limiting global (skip OPTIONS requests)
const limiter = rateLimit({
  ...SECURITY_CONFIG.rateLimit,
  skip: (req) => req.method === 'OPTIONS',
});
app.use(limiter);

// Body parsing middleware (avec limite de taille)
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cookieParser());

// ========================================
// MIDDLEWARES DE SÉCURITÉ
// ========================================

// Validation des headers de sécurité
app.use(validateSecurityHeaders);

// Sanitisation des entrées utilisateur
app.use(sanitizeInputs);

// Détection des tentatives d'injection
app.use(detectInjectionAttempts);

// Request logging middleware
app.use((req, res, next) => {
  // Générer un ID unique pour la requête si non existant
  if (!req.requestId) {
    req.requestId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
  
  Logger.info(`${req.method} ${req.path}`, {
    ip: req.ip,
    userAgent: req.get('user-agent'),
    requestId: req.requestId,
    timestamp: new Date().toISOString(),
  });
  next();
});

// Admin login route - added directly to bypass any middleware issues
app.post('/api/admin/auth/login', async (req: express.Request, res: express.Response) => {
  try {
    const { username, password } = req.body;

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

// Routes statiques
app.use('/api/health', healthRouter);
app.use('/api/auth', authRouter);
app.use('/api/school-years', createSchoolYearsRoutes(prisma));
app.use('/api/classes', classesRouter);
app.use('/api/students', studentsRouter);
app.use('/api/exports', exportsRouter);
app.use('/api/export', exportBilanRouter);
app.use('/api/notes', createNoteRoutes(prisma));
app.use('/api/evaluations', evaluationsRouter);
app.use('/api/subjects', createSubjectRoutes(prisma));
app.use('/api/evaluation-formulas', createEvaluationFormulaRoutes(prisma));
app.use('/api/class-average-configs', createClassAverageConfigRoutes(prisma));
app.use('/api', moyennesRouter);
app.use('/api/compte-gratuit', createCompteGratuitRoutes(prisma));
app.use('/api/payments', paymentRouter);
app.use('/api/admin/auth', adminAuthRouter);
app.use('/api/admin', adminRouter);

// Variable pour suivre l'état de l'initialisation
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

// Fonction pour initialiser l'app (routes dynamiques, connexion DB, etc.)
async function initializeApp() {
  if (isInitialized) {
    return;
  }

  if (!initializationPromise) {
    initializationPromise = (async () => {
      try {
        Logger.info('Initializing app for Vercel...');
        
        // Test database connection
        await prisma.$connect();
        Logger.info('Connected to PostgreSQL database (Vercel)');

        // Initialize file directories
        ensureDirectories();
        Logger.info('File directories initialized (Vercel)');

        // Initialize API routes (must be done before error handlers)
        Logger.info('Initializing API routes for Vercel...');
        const apiRoutes = await createApiRoutes(prisma);
        app.use('/api', apiRoutes);
        Logger.info('API routes initialized successfully for Vercel');

        // Error handling middleware (must be last)
        app.use(notFoundHandler);
        app.use(secureErrorHandler);

        isInitialized = true;
        Logger.info('App initialized successfully for Vercel');
      } catch (error) {
        Logger.error('Failed to initialize app for Vercel', error);
        throw error;
      }
    })();
  }

  return initializationPromise;
}

// Handler Vercel Serverless Function
export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    // Initialiser l'app si ce n'est pas déjà fait
    await initializeApp();
    
    // Passer la requête à Express
    app(req as any, res as any);
  } catch (error) {
    Logger.error('Error in Vercel handler', error);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? {
          message: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        } : undefined
      });
    }
  }
}

