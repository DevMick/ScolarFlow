/// <reference path="./types/express.d.ts" />
/// <reference types="express" />
/// <reference types="node" />

import type { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Vérification des variables d'environnement critiques
const requiredEnvVars = ['DATABASE_URL'];
const optionalEnvVars = ['JWT_SECRET', 'CORS_ORIGIN', 'NODE_ENV'];

function checkEnvironmentVariables() {
  const missing: string[] = [];
  const present: string[] = [];
  
  // Vérifier les variables requises
  requiredEnvVars.forEach((varName) => {
    if (!process.env[varName]) {
      missing.push(varName);
    } else {
      present.push(varName);
    }
  });
  
  // Vérifier les variables optionnelles
  optionalEnvVars.forEach((varName) => {
    if (process.env[varName]) {
      present.push(varName);
    }
  });
  
  if (missing.length > 0) {
    console.error('[Vercel] ❌ Variables d\'environnement manquantes:', missing.join(', '));
    console.error('[Vercel] ⚠️  Ces variables sont requises pour le fonctionnement de l\'API');
  } else {
    console.log('[Vercel] ✅ Variables d\'environnement requises présentes');
  }
  
  if (present.length > 0) {
    console.log(`[Vercel] 📋 Variables d'environnement détectées: ${present.length}`);
  }
  
  // Log détaillé en mode développement
  if (process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview') {
    console.log('[Vercel] 🔍 Variables d\'environnement:', {
      required: requiredEnvVars.map(v => ({ name: v, set: !!process.env[v] })),
      optional: optionalEnvVars.map(v => ({ name: v, set: !!process.env[v] }))
    });
  }
  
  return missing.length === 0;
}

// Vérifier les variables d'environnement au démarrage
const envCheck = checkEnvironmentVariables();
if (!envCheck) {
  console.warn('[Vercel] ⚠️  Certaines variables d\'environnement sont manquantes. L\'API peut ne pas fonctionner correctement.');
}

// Import l'app Express depuis server.ts (évite la duplication)
import { app } from './server';
import { prisma } from './lib/prisma';
import { Logger } from './utils/logger';
import { ensureDirectories } from './utils/fileUpload';
import { notFoundHandler } from './middleware/errorHandler';
import { secureErrorHandler } from './middleware/errorHandler.security';
import { createApiRoutes } from './routes';

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
        console.log('[Vercel] 🚀 Initializing app...');
        
        // Test database connection
        try {
          await prisma.$connect();
          console.log('[Vercel] ✅ Connected to PostgreSQL database');
          Logger.info('Database connection established (Vercel)');
        } catch (dbError) {
          const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
          console.error('[Vercel] ❌ Database connection error:', errorMessage);
          Logger.error('Database connection failed (Vercel)', dbError);
          throw new Error(`Database connection failed: ${errorMessage}`);
        }

        // Initialize file directories
        try {
          ensureDirectories();
          console.log('[Vercel] ✅ File directories initialized');
        } catch (dirError) {
          console.warn('[Vercel] ⚠️  File directories initialization warning:', dirError);
          // Ne pas bloquer si les répertoires ne peuvent pas être créés
        }

        // Initialize API routes (must be done before error handlers)
        console.log('[Vercel] 🔄 Initializing API routes...');
        try {
          const apiRoutes = await createApiRoutes(prisma);
          app.use('/api', apiRoutes);
          console.log('[Vercel] ✅ API routes initialized successfully');
        } catch (routesError) {
          console.error('[Vercel] ❌ Failed to initialize API routes:', routesError);
          Logger.error('Failed to initialize API routes (Vercel)', routesError);
          throw routesError;
        }

        // Error handling middleware (must be last)
        app.use(notFoundHandler);
        app.use(secureErrorHandler);

        isInitialized = true;
        console.log('[Vercel] ✅ App initialized successfully');
        Logger.info('App initialized successfully (Vercel)');
      } catch (error) {
        console.error('[Vercel] ❌ Failed to initialize app:', error);
        Logger.error('Failed to initialize app (Vercel)', error);
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
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[Vercel] ❌ Error in handler:', {
      message: errorMessage,
      stack: errorStack,
      name: error instanceof Error ? error.name : undefined
    });
    
    Logger.error('Error in Vercel handler', error);
    
    if (!res.headersSent) {
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
