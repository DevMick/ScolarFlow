// Point d'entrée Vercel Serverless Function
// Ce fichier réexporte l'application depuis dist/server.js

import { app, prisma } from '../dist/server.js';
import serverless from 'serverless-http';
import { createApiRoutes } from '../dist/routes/index.js';
import { notFoundHandler } from '../dist/middleware/errorHandler.js';
import { secureErrorHandler } from '../dist/middleware/errorHandler.security.js';

// Variable pour suivre l'état de l'initialisation
let isInitialized = false;
let initializationPromise = null;
let initializationError = null;

// Vérifier les variables d'environnement critiques
function checkEnvironmentVariables() {
  const requiredVars = ['DATABASE_URL'];
  const missingVars = requiredVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    const error = new Error(`Variables d'environnement manquantes: ${missingVars.join(', ')}`);
    console.error('Environment check failed:', error.message);
    console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('VERCEL')));
    throw error;
  }
}

// Fonction pour initialiser l'app pour Vercel
async function initializeApp() {
  if (isInitialized) {
    return;
  }

  if (initializationError) {
    throw initializationError;
  }

  if (!initializationPromise) {
    initializationPromise = (async () => {
      try {
        console.log('[Vercel] Initializing app...');
        console.log('[Vercel] Environment:', {
          NODE_ENV: process.env.NODE_ENV,
          VERCEL: process.env.VERCEL,
          VERCEL_ENV: process.env.VERCEL_ENV,
          hasDATABASE_URL: !!process.env.DATABASE_URL
        });
        
        // Vérifier les variables d'environnement
        checkEnvironmentVariables();
        
        // Connecter Prisma avec gestion d'erreur améliorée
        try {
          await prisma.$connect();
          console.log('[Vercel] Prisma connected successfully');
        } catch (error) {
          console.error('[Vercel] Prisma connection failed:', {
            message: error?.message,
            code: error?.code,
            name: error?.name
          });
          // Ne pas ignorer l'erreur de connexion, elle est critique
          throw new Error(`Database connection failed: ${error?.message || String(error)}`);
        }

        // Initialiser les routes API dynamiques
        // Note: Les routes statiques sont déjà montées dans server.ts
        try {
          const apiRoutes = await createApiRoutes(prisma);
          app.use('/api', apiRoutes);
          console.log('[Vercel] API routes initialized');
        } catch (error) {
          console.error('[Vercel] Failed to initialize API routes:', {
            message: error?.message,
            stack: error?.stack
          });
          throw error;
        }

        // Error handling middleware (must be last)
        try {
          app.use(notFoundHandler);
          app.use(secureErrorHandler);
          console.log('[Vercel] Error handlers initialized');
        } catch (error) {
          console.warn('[Vercel] Error handlers initialization warning:', error.message);
        }

        isInitialized = true;
        console.log('[Vercel] App initialized successfully');
      } catch (error) {
        console.error('[Vercel] Failed to initialize app:', {
          message: error?.message,
          stack: error?.stack,
          name: error?.name,
          code: error?.code
        });
        isInitialized = false;
        initializationError = error;
        initializationPromise = null;
        throw error;
      }
    })();
  }

  return initializationPromise;
}

// Créer le handler serverless avec l'app Express
let handler = null;

async function getHandler() {
  try {
    // Initialiser l'app avant de créer le handler
    await initializeApp();
    
    if (!handler) {
      handler = serverless(app, {
        binary: ['image/*', 'application/pdf', 'application/octet-stream'],
      });
    }
    
    return handler;
  } catch (error) {
    console.error('[Vercel] Failed to get handler:', error);
    throw error;
  }
}

// Export pour Vercel (format serverless function)
export default async function vercelHandler(req, res) {
  try {
    const serverlessHandler = await getHandler();
    return await serverlessHandler(req, res);
  } catch (error) {
    console.error('[Vercel] Error in handler:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name,
      code: error?.code,
      path: req?.path,
      method: req?.method
    });
    
    // Si l'erreur vient de l'initialisation, retourner une erreur claire
    if (error?.message?.includes('Database connection failed') || 
        error?.message?.includes('Variables d\'environnement manquantes')) {
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: 'Erreur de configuration du serveur',
          code: 'CONFIGURATION_ERROR',
          error: process.env.VERCEL_ENV === 'preview' || process.env.VERCEL_ENV === 'development' ? {
            message: error?.message || String(error)
          } : undefined
        });
      }
    }
    
    if (!res.headersSent) {
      return res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        code: 'FUNCTION_INVOCATION_FAILED',
        error: process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview' ? {
          message: error?.message || String(error),
          stack: error?.stack
        } : undefined
      });
    }
  }
}
