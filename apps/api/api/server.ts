// ========================================
// WRAPPER SERVERLESS POUR VERCEL
// ========================================

/**
 * Ce fichier est utilisé pour Vercel Serverless Functions
 * Il initialise l'app Express avec toutes les routes et l'exporte pour Vercel
 */

// Imports - utiliser des chemins qui fonctionnent au runtime
// Le fichier api/server.ts est compilé dans dist/api/server.js
// Au runtime, les fichiers compilés sont dans dist/server.js, dist/routes/index.js, etc.
// Donc depuis dist/api/, on doit pointer vers ../ pour accéder à dist/

// Import depuis src/ pour TypeScript (sera compilé vers dist/)
// Au runtime, Node.js cherchera dans dist/ depuis dist/api/
import { app, prisma } from '../src/server';
import { createApiRoutes } from '../src/routes';
import { notFoundHandler } from '../src/middleware/errorHandler';
import { secureErrorHandler } from '../src/middleware/errorHandler.security';
import { ensureDirectories } from '../src/utils/fileUpload';
import { Logger } from '../src/utils/logger';

// Initialiser les routes pour Vercel (une seule fois)
let routesInitialized = false;

async function initializeRoutes() {
  if (routesInitialized) {
    return;
  }

  try {
    // Initialiser les répertoires de fichiers
    ensureDirectories();
    Logger.info('File directories initialized for Vercel');

    // Initialiser les routes API
    Logger.info('Initializing API routes for Vercel...');
    const apiRoutes = await createApiRoutes(prisma);
    app.use('/api', apiRoutes);
    Logger.info('API routes initialized successfully for Vercel');

    // Error handling middleware (must be last)
    app.use(notFoundHandler);
    app.use(secureErrorHandler);

    routesInitialized = true;
  } catch (error) {
    Logger.error('Failed to initialize routes for Vercel', error);
    throw error;
  }
}

// Initialiser les routes au chargement du module
// Utiliser une promesse pour éviter les problèmes de synchronisation
const initPromise = initializeRoutes().catch((error) => {
  Logger.error('Critical error during route initialization', error);
});

// Export pour Vercel (format serverless function)
// Vercel attend un handler qui gère (req, res)
export default async function handler(req: any, res: any) {
  try {
    // Attendre que les routes soient initialisées
    await initPromise;
    
    // Passer la requête à l'app Express
    // Express peut être utilisé directement comme handler HTTP
    return app(req, res);
  } catch (error) {
    Logger.error('Error in Vercel handler', error);
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Internal server error',
        error: process.env.NODE_ENV === 'development' ? String(error) : undefined
      });
    }
  }
}
