import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

// Load environment variables
dotenv.config();

// Import configurations
import { SECURITY_CONFIG } from './config/security';
import { helmetConfig, additionalSecurityHeaders } from './config/helmet.config';
import { Logger } from './utils/logger';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { secureErrorHandler, validateSecurityHeaders } from './middleware/errorHandler.security';
import { sanitizeInputs } from './middleware/validation';
import { detectInjectionAttempts } from './middleware/securityLogging';
import { ensureDirectories, startCleanupScheduler } from './utils/fileUpload';
import { createServer } from 'http';

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

const app: Express = express();
const DEFAULT_PORT = 3001;
const PORT = process.env.PORT || DEFAULT_PORT;

// Initialize Prisma Client
export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
});

// Export de l'app pour Vercel Serverless Functions
export { app };

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

// Routes
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

// Error handling (will be set up after async routes are initialized)
// app.use(notFoundHandler);
// app.use(errorHandler);

/**
 * Trouve un port disponible en commençant par le port spécifié
 */
const findAvailablePort = async (startPort: number, maxAttempts: number = 10): Promise<number> => {
  return new Promise((resolve, reject) => {
    const server = createServer();
    
    server.listen(startPort, () => {
      const port = (server.address() as any)?.port;
      server.close(() => {
        resolve(port || startPort);
      });
    });
    
    server.on('error', (err: any) => {
      if (err.code === 'EADDRINUSE') {
        if (startPort - parseInt(PORT.toString()) >= maxAttempts) {
          reject(new Error(`No available port found after ${maxAttempts} attempts. Last attempted port: ${startPort}`));
        } else {
          // Essayer le port suivant
          findAvailablePort(startPort + 1, maxAttempts)
            .then(resolve)
            .catch(reject);
        }
      } else {
        reject(err);
      }
    });
  });
};

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  Logger.info(`Received ${signal}, shutting down gracefully...`);
  
  try {
    await prisma.$disconnect();
    Logger.info('Database connection closed');
    process.exit(0);
  } catch (error) {
    Logger.error('Error during shutdown', error);
    process.exit(1);
  }
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

async function startServer() {
  try {
    // Test database connection
    await prisma.$connect();
    Logger.info('Connected to PostgreSQL database');

    // Initialize file directories
    ensureDirectories();
    Logger.info('File directories initialized');

    // Start automatic cleanup scheduler
    startCleanupScheduler();

    // Initialize API routes (must be done before error handlers)
    Logger.info('Initializing API routes...');
    const apiRoutes = await createApiRoutes(prisma);
    app.use('/api', apiRoutes);
    Logger.info('API routes initialized successfully');

    // Error handling middleware (must be last)
    app.use(notFoundHandler);
    // Utiliser le handler d'erreur sécurisé qui ne révèle pas de détails en production
    app.use(secureErrorHandler);

    // Trouver un port disponible
    const availablePort = await findAvailablePort(parseInt(PORT.toString()));
    
    if (availablePort !== parseInt(PORT.toString())) {
      Logger.warn(`Port ${PORT} is already in use, using port ${availablePort} instead`, {
        requestedPort: PORT,
        actualPort: availablePort
      });
    }

    app.listen(availablePort, () => {
      Logger.info(`EduStats API Server running on port ${availablePort}`, {
        environment: process.env.NODE_ENV,
        corsOrigin: process.env.CORS_ORIGIN,
        requestedPort: PORT,
        actualPort: availablePort
      });
    });
  } catch (error) {
    Logger.error('Failed to start server', error);
    process.exit(1);
  }
}

// Initialiser les routes pour Vercel (même si on n'écoute pas sur un port)
// Cela permet à l'app Express d'être utilisable directement dans Vercel
async function initializeForVercel() {
  if (process.env.VERCEL === '1' || process.env.LAMBDA_TASK_ROOT) {
    try {
      // Test database connection
      await prisma.$connect();
      Logger.info('Connected to PostgreSQL database (Vercel)');

      // Initialize file directories
      ensureDirectories();
      Logger.info('File directories initialized (Vercel)');

      // Initialize API routes
      Logger.info('Initializing API routes for Vercel...');
      const apiRoutes = await createApiRoutes(prisma);
      app.use('/api', apiRoutes);
      Logger.info('API routes initialized successfully for Vercel');

      // Error handling middleware (must be last)
      app.use(notFoundHandler);
      app.use(secureErrorHandler);
    } catch (error) {
      Logger.error('Failed to initialize for Vercel', error);
      throw error;
    }
  }
}

// Ne pas initialiser automatiquement pour Vercel ici
// L'initialisation sera faite dans api/server.ts pour éviter les conflits
// L'initialisation dans src/server.ts peut causer des problèmes avec les serverless functions

// Démarrer le serveur seulement si on n'est pas dans un environnement serverless (Vercel)
// Vercel définit automatiquement VERCEL=1
if (process.env.VERCEL !== '1' && !process.env.LAMBDA_TASK_ROOT) {
  startServer();
}
