/// <reference path="./types/express.d.ts" />
/// <reference types="express" />
/// <reference types="node" />

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

// Import AdminService (utilisé dans la route admin)
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
        console.log('[Vercel] Initializing app...');
        
        // Test database connection
        try {
          await prisma.$connect();
          console.log('[Vercel] Connected to PostgreSQL database');
        } catch (dbError) {
          console.error('[Vercel] Database connection error:', dbError);
          throw new Error(`Database connection failed: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
        }

        // Initialize file directories
        try {
          ensureDirectories();
          console.log('[Vercel] File directories initialized');
        } catch (dirError) {
          console.warn('[Vercel] File directories initialization warning:', dirError);
          // Ne pas bloquer si les répertoires ne peuvent pas être créés
        }

        // Importer les routes dynamiquement pour éviter les dépendances circulaires
        const healthRouter = (await import('./routes/health.js')).default;
        const authRouter = (await import('./routes/auth.js')).default;
        const { createSchoolYearsRoutes } = await import('./routes/schoolYears.js');
        const classesRouter = (await import('./routes/classes.js')).default;
        const studentsRouter = (await import('./routes/students.js')).default;
        const exportsRouter = (await import('./routes/exports.js')).default;
        const exportBilanRouter = (await import('./routes/exportBilan.js')).default;
        const { createNoteRoutes } = await import('./routes/notes.js');
        const evaluationsRouter = (await import('./routes/evaluations.js')).default;
        const { createSubjectRoutes } = await import('./routes/subjects.js');
        const { createEvaluationFormulaRoutes } = await import('./routes/evaluationFormulas.js');
        const { createClassAverageConfigRoutes } = await import('./routes/classAverageConfigs.js');
        const moyennesRouter = (await import('./routes/moyennes.js')).default;
        const { createCompteGratuitRoutes } = await import('./routes/compteGratuit.js');
        const paymentRouter = (await import('./routes/paymentRoutes.js')).default;
        const adminRouter = (await import('./routes/adminRoutes.js')).default;
        const adminAuthRouter = (await import('./routes/adminAuthRoutes.js')).default;

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

        // Initialize API routes (must be done before error handlers)
        console.log('[Vercel] Initializing API routes...');
        try {
          const { createApiRoutes } = await import('./routes/index.js');
          const apiRoutes = await createApiRoutes(prisma);
          app.use('/api', apiRoutes);
          console.log('[Vercel] API routes initialized successfully');
        } catch (routesError) {
          console.error('[Vercel] Failed to initialize API routes:', routesError);
          throw routesError;
        }

        // Error handling middleware (must be last)
        app.use(notFoundHandler);
        app.use(secureErrorHandler);

        isInitialized = true;
        console.log('[Vercel] App initialized successfully');
      } catch (error) {
        console.error('[Vercel] Failed to initialize app:', error);
        isInitialized = false;
        initializationPromise = null;
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
    // Express peut gérer directement les objets VercelRequest et VercelResponse
    return new Promise<void>((resolve, reject) => {
      app(req as any, res as any, (err?: any) => {
        if (err) {
          reject(err);
        } else {
          resolve();
        }
      });
    });
  } catch (error) {
    console.error('[Vercel] Error in handler:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    });
    
    if (!res.headersSent) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      const errorStack = error instanceof Error ? error.stack : undefined;
      
      // Afficher plus de détails en preview/development
      const showDetails = process.env.VERCEL_ENV === 'preview' || 
                         process.env.VERCEL_ENV === 'development' ||
                         process.env.NODE_ENV === 'development';
      
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        code: 'FUNCTION_INVOCATION_FAILED',
        ...(showDetails && {
          error: {
            message: errorMessage,
            stack: errorStack
          }
        })
      });
    }
  }
}

