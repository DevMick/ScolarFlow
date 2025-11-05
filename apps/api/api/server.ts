// ========================================
// WRAPPER SERVERLESS POUR VERCEL
// ========================================

/**
 * Ce fichier est utilisé pour Vercel Serverless Functions
 * L'app Express est déjà complètement configurée dans src/server.ts
 * avec toutes les routes et middleware pour l'environnement Vercel
 */

// Importer l'app Express et prisma depuis src/server
import { app, prisma } from '../src/server';
import { Logger } from '../src/utils/logger';

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

        // Test database connection
        await prisma.$connect();
        Logger.info('Connected to PostgreSQL database (Vercel)');

        // Initialize file directories
        const { ensureDirectories } = await import('../src/utils/fileUpload');
        ensureDirectories();
        Logger.info('File directories initialized (Vercel)');

        // Les routes sont déjà montées dans src/server.ts
        // On ajoute juste les routes de createApiRoutes si nécessaire
        // Vérifier si les routes de createApiRoutes sont déjà montées
        const { createApiRoutes } = await import('../src/routes');
        const apiRoutes = await createApiRoutes(prisma);
        
        // Ajouter les routes de createApiRoutes (pour les routes qui ne sont pas déjà montées)
        app.use('/api', apiRoutes);
        Logger.info('Additional API routes initialized for Vercel');

        // Error handling middleware (must be last)
        const { notFoundHandler } = await import('../src/middleware/errorHandler');
        const { secureErrorHandler } = await import('../src/middleware/errorHandler.security');
        app.use(notFoundHandler);
        app.use(secureErrorHandler);

        isInitialized = true;
        Logger.info('Vercel initialization completed successfully');
      } catch (error) {
        Logger.error('Failed to initialize for Vercel', error);
        isInitialized = false;
        initializationPromise = null;
        throw error;
      }
    })();
  }

  return initializationPromise;
}

// Export pour Vercel (format serverless function)
// Vercel attend un handler qui gère (req, res)
export default async function handler(req: any, res: any) {
  try {
    // Attendre que l'initialisation soit terminée avant de traiter la requête
    await ensureInitialized();

    // Passer la requête à l'app Express
    // L'app Express est maintenant complètement configurée
    app(req, res);
  } catch (error: any) {
    Logger.error('Error in Vercel handler', error);
    
    // Réponse d'erreur par défaut si l'initialisation échoue
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' ? (error?.message || String(error)) : undefined
      });
    }
  }
}
