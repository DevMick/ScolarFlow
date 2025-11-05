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

// Import dynamique pour éviter les erreurs au chargement du module
let app: any;
let prisma: any;
let Logger: any;
let serverless: any;

async function initializeImports() {
  if (app && prisma && Logger && serverless) {
    return;
  }
  
  try {
    console.log('Initializing imports...');
    const serverModule = await import('../src/server');
    app = serverModule.app;
    prisma = serverModule.prisma;
    console.log('Server module imported');
    
    const loggerModule = await import('../src/utils/logger');
    Logger = loggerModule.Logger;
    console.log('Logger module imported');
    
    const serverlessModule = await import('serverless-http');
    serverless = serverlessModule.default;
    console.log('Serverless module imported');
  } catch (error) {
    console.error('Failed to import modules:', error);
    console.error('Import error details:', {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined
    });
    throw error;
  }
}

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
        console.log('Starting Vercel initialization...');
        
        // Initialiser les imports d'abord
        await initializeImports();
        console.log('Imports initialized');
        
        // S'assurer que VERCEL est défini pour forcer l'initialisation
        if (!process.env.VERCEL) {
          process.env.VERCEL = '1';
        }

        // Vérifier que DATABASE_URL est défini
        if (!process.env.DATABASE_URL) {
          console.error('DATABASE_URL is not set');
          throw new Error('DATABASE_URL environment variable is not set');
        }
        console.log('DATABASE_URL is set');

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
    // Initialiser les imports d'abord
    await initializeImports();
    
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
    console.log('Vercel handler called:', req.method, req.url);
    
    // Obtenir le handler serverless (qui s'initialisera automatiquement si nécessaire)
    console.log('Getting serverless handler...');
    const handler = await getHandler();
    console.log('Serverless handler obtained');
    
    // Appeler le handler serverless qui gère correctement l'app Express
    // serverless-http retourne une Promise, donc on doit l'attendre
    console.log('Calling serverless handler...');
    const result = await handler(req, res);
    console.log('Serverless handler completed');
    return result;
  } catch (error: any) {
    // Logger peut aussi échouer, donc on utilise console.error en fallback
    console.error('Error in Vercel handler:', error);
    console.error('Error message:', error?.message);
    console.error('Error stack:', error?.stack);
    console.error('Error name:', error?.name);
    
    try {
      if (Logger) {
        Logger.error('Error in Vercel handler', error);
      }
    } catch {
      // Logger peut échouer aussi
    }
    
    // Réponse d'erreur par défaut si l'initialisation échoue
    // Toujours afficher l'erreur en développement pour le diagnostic
    const isDevelopment = process.env.NODE_ENV === 'development' || 
                          process.env.VERCEL_ENV === 'development' || 
                          process.env.VERCEL_ENV === 'preview';
    
    if (!res.headersSent) {
      try {
        res.status(500).json({
          success: false,
          message: 'Erreur interne du serveur',
          error: isDevelopment 
            ? {
                message: error?.message || String(error),
                name: error?.name,
                stack: error?.stack
              }
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
