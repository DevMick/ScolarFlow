/// <reference types="@vercel/node" />
import type { VercelRequest, VercelResponse } from '@vercel/node';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

// Import l'app Express depuis server.ts
import { app } from '../apps/api/src/server';
import { prisma } from '../apps/api/src/lib/prisma';
import { Logger } from '../apps/api/src/utils/logger';
import { ensureDirectories } from '../apps/api/src/utils/fileUpload';
import { notFoundHandler } from '../apps/api/src/middleware/errorHandler';
import { secureErrorHandler } from '../apps/api/src/middleware/errorHandler.security';
import { createApiRoutes } from '../apps/api/src/routes';

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
        console.log('[API Entry] 🚀 Initializing app...');
        
        // Test database connection
        try {
          await prisma.$connect();
          console.log('[API Entry] ✅ Connected to PostgreSQL database');
          Logger.info('Database connection established (Vercel)');
        } catch (dbError) {
          const errorMessage = dbError instanceof Error ? dbError.message : String(dbError);
          console.error('[API Entry] ❌ Database connection error:', errorMessage);
          Logger.error('Database connection failed (Vercel)', dbError);
          throw new Error(`Database connection failed: ${errorMessage}`);
        }

        // Initialize file directories
        try {
          ensureDirectories();
          console.log('[API Entry] ✅ File directories initialized');
        } catch (dirError) {
          console.warn('[API Entry] ⚠️  File directories initialization warning:', dirError);
          // Ne pas bloquer si les répertoires ne peuvent pas être créés
        }

        // Initialize API routes (must be done before error handlers)
        console.log('[API Entry] 🔄 Initializing API routes...');
        try {
          const apiRoutes = await createApiRoutes(prisma);
          app.use('/api', apiRoutes);
          console.log('[API Entry] ✅ API routes initialized successfully');
        } catch (routesError) {
          console.error('[API Entry] ❌ Failed to initialize API routes:', routesError);
          Logger.error('Failed to initialize API routes (Vercel)', routesError);
          throw routesError;
        }

        // Root route handler - must be registered after API routes but before error handlers
        app.get('/', (req, res) => {
          res.json({
            success: true,
            message: 'API Scolar Flow is running 🚀',
            version: '1.0.0',
            endpoints: {
              health: '/api/health',
              hello: '/api/hello'
            }
          });
        });

        // Test route
        app.get('/api/hello', (req, res) => {
          res.json({
            success: true,
            message: 'Hello from Scolar Flow API'
          });
        });

        // Error handling middleware (must be last)
        app.use(notFoundHandler);
        app.use(secureErrorHandler);

        isInitialized = true;
        console.log('[API Entry] ✅ App initialized successfully');
        Logger.info('App initialized successfully (Vercel)');
      } catch (error) {
        console.error('[API Entry] ❌ Failed to initialize app:', error);
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
  // Log initial de la requête reçue
  console.log('[API Entry] ========================================');
  console.log('[API Entry] 📥 API request received');
  console.log('[API Entry] Method:', req.method);
  console.log('[API Entry] URL:', req.url);
  console.log('[API Entry] Path:', req.url?.split('?')[0]);
  console.log('[API Entry] ========================================');
  
  try {
    // Initialiser l'app si ce n'est pas déjà fait
    console.log('[API Entry] 🔄 Initializing app...');
    await initializeApp();
    console.log('[API Entry] ✅ App initialized');
    
    // Log avant de router vers Express
    console.log('[API Entry] 🔀 Routing to Express app');
    console.log('[API Entry] Request path:', req.url);
    console.log('[API Entry] Request method:', req.method);
    
    // Passer la requête à Express
    // Express peut gérer directement les objets VercelRequest et VercelResponse
    return new Promise<void>((resolve, reject) => {
      // Log avant de passer à Express
      console.log('[API Entry] 📤 Passing request to Express app');
      
      app(req as any, res as any, (err?: any) => {
        if (err) {
          console.error('[API Entry] ❌ Error from Express app:', {
            message: err?.message,
            stack: err?.stack,
            name: err?.name
          });
          reject(err);
        } else {
          console.log('[API Entry] ✅ Request handled successfully');
          console.log('[API Entry] Response status:', res.statusCode);
          console.log('[API Entry] Headers sent:', res.headersSent);
          resolve();
        }
      });
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    console.error('[API Entry] ❌ Error in handler:', {
      message: errorMessage,
      stack: errorStack,
      name: error instanceof Error ? error.name : undefined,
      url: req.url,
      method: req.method
    });
    
    Logger.error('Error in Vercel handler', error);
    
    if (!res.headersSent) {
      // Afficher plus de détails en preview/development
      const showDetails = process.env.VERCEL_ENV === 'preview' || 
                         process.env.VERCEL_ENV === 'development' ||
                         process.env.NODE_ENV === 'development';
      
      console.log('[API Entry] 📤 Sending error response');
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
