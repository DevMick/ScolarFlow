// ========================================
// WRAPPER SERVERLESS POUR VERCEL
// ========================================

/**
 * Ce fichier est utilisé pour Vercel Serverless Functions
 * L'app Express est déjà complètement configurée dans src/server.ts
 * avec toutes les routes et middleware pour l'environnement Vercel
 */

// Importer l'app Express et prisma depuis src/server
/// <reference path="../src/types/express.d.ts" />

import { app, prisma } from '../src/server';
import { Logger } from '../src/utils/logger';
import serverless from 'serverless-http';

// Variable pour suivre l'état de l'initialisation
let isInitialized = false;
let initializationPromise: Promise<void> | null = null;

/**
 * Initialise l'application pour Vercel
 * Cette fonction garantit que la base de données est connectée
 * et que les répertoires de fichiers sont initialisés
 */
async function ensureInitialized(): Promise<void> {
  if (isInitialized) {
    return;
  }

  if (!initializationPromise) {
    initializationPromise = (async () => {
      try {
        // S'assurer que VERCEL est défini pour forcer l'initialisation
        if (!process.env.VERCEL) {
          process.env.VERCEL = '1';
        }

        // Vérifier que DATABASE_URL est défini
        if (!process.env.DATABASE_URL) {
          throw new Error('DATABASE_URL environment variable is not set');
        }

        // Test database connection avec timeout
        try {
          await Promise.race([
            prisma.$connect(),
            new Promise((_, reject) => 
              setTimeout(() => reject(new Error('Database connection timeout')), 10000)
            )
          ]);
          Logger.info('Connected to PostgreSQL database (Vercel)');
        } catch (dbError) {
          console.error('Database connection error:', dbError);
          throw new Error(`Database connection failed: ${dbError instanceof Error ? dbError.message : String(dbError)}`);
        }

        // Initialize file directories (avec gestion d'erreur)
        try {
          const { ensureDirectories } = await import('../src/utils/fileUpload');
          ensureDirectories();
          Logger.info('File directories initialized (Vercel)');
        } catch (dirError) {
          console.warn('File directories initialization warning:', dirError);
          // Ne pas bloquer si les répertoires ne peuvent pas être créés
        }

        // Les routes sont déjà montées dans src/server.ts
        // On ajoute juste les routes de createApiRoutes si nécessaire
        try {
          const { createApiRoutes } = await import('../src/routes');
          const apiRoutes = await createApiRoutes(prisma);
          
          // Ajouter les routes de createApiRoutes (pour les routes qui ne sont pas déjà montées)
          app.use('/api', apiRoutes);
          Logger.info('Additional API routes initialized for Vercel');
        } catch (routesError) {
          console.warn('Routes initialization warning:', routesError);
          // Ne pas bloquer si les routes ne peuvent pas être montées
        }

        // Error handling middleware (must be last)
        try {
          const { notFoundHandler } = await import('../src/middleware/errorHandler');
          const { secureErrorHandler } = await import('../src/middleware/errorHandler.security');
          app.use(notFoundHandler);
          app.use(secureErrorHandler);
        } catch (middlewareError) {
          console.warn('Middleware initialization warning:', middlewareError);
          // Ne pas bloquer si les middlewares ne peuvent pas être montés
        }

        isInitialized = true;
        Logger.info('Vercel initialization completed successfully');
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        const errorStack = error instanceof Error ? error.stack : undefined;
        console.error('Failed to initialize for Vercel:', errorMessage, errorStack);
        try {
          Logger.error('Failed to initialize for Vercel', error);
        } catch {
          // Logger peut échouer aussi
        }
        isInitialized = false;
        initializationPromise = null;
        throw error;
      }
    })();
  }

  return initializationPromise;
}

// Créer le handler serverless avec serverless-http
// Cela convertit l'app Express en handler compatible avec les serverless functions
let serverlessHandler: any = null;

async function getHandler() {
  if (!serverlessHandler) {
    // Attendre que l'initialisation soit terminée
    await ensureInitialized();
    
    // Créer le handler serverless avec l'app Express
    serverlessHandler = serverless(app, {
      binary: ['image/*', 'application/pdf', 'application/octet-stream'],
    });
  }
  return serverlessHandler;
}

// Export pour Vercel (format serverless function)
// Vercel attend un handler qui gère (req, res)
// Pour CommonJS, on utilise module.exports
async function handler(req: any, res: any) {
  try {
    // Obtenir le handler serverless (qui s'initialisera automatiquement si nécessaire)
    const handler = await getHandler();
    
    // Appeler le handler serverless qui gère correctement l'app Express
    return handler(req, res);
  } catch (error: any) {
    // Logger peut aussi échouer, donc on utilise console.error en fallback
    try {
      Logger.error('Error in Vercel handler', error);
    } catch {
      console.error('Error in Vercel handler:', error);
    }
    
    // Réponse d'erreur par défaut si l'initialisation échoue
    if (!res.headersSent) {
      try {
        res.status(500).json({
          success: false,
          message: 'Erreur interne du serveur',
          error: process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'development' 
            ? (error?.message || String(error)) 
            : undefined
        });
      } catch (sendError) {
        console.error('Failed to send error response:', sendError);
      }
    }
  }
}

// Export pour Vercel (CommonJS)
module.exports = handler;
