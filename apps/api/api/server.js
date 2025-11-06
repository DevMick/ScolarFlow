// Point d'entrée Vercel Serverless Function
// Ce fichier réexporte l'application depuis dist/server.js

import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

// Obtenir le répertoire du fichier actuel
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Imports avec gestion d'erreur
let app, prisma, serverless, createApiRoutes, notFoundHandler, secureErrorHandler;
let importError = null;

// Fonction pour charger les modules de manière asynchrone
async function loadModules() {
  if (importError) {
    throw importError;
  }
  
  if (!app || !prisma) {
    try {
      console.log('[Vercel] Loading modules...');
      console.log('[Vercel] Current working directory:', process.cwd());
      console.log('[Vercel] __dirname:', __dirname);
      console.log('[Vercel] __filename:', __filename);
      
      // Construire le chemin vers dist/server.js
      // Dans Vercel, api/server.js est dans le dossier api/, et dist/ est au même niveau
      const distServerPath = join(__dirname, '..', 'dist', 'server.js');
      const distRoutesPath = join(__dirname, '..', 'dist', 'routes', 'index.js');
      const distErrorHandlerPath = join(__dirname, '..', 'dist', 'middleware', 'errorHandler.js');
      const distSecureErrorHandlerPath = join(__dirname, '..', 'dist', 'middleware', 'errorHandler.security.js');
      
      console.log('[Vercel] Checking paths:');
      console.log('[Vercel] - dist/server.js:', distServerPath, existsSync(distServerPath));
      console.log('[Vercel] - dist/routes/index.js:', distRoutesPath, existsSync(distRoutesPath));
      
      // Essayer plusieurs chemins possibles pour l'import
      let serverModule;
      const possiblePaths = [
        '../dist/server.js',  // Chemin relatif standard (depuis api/)
        join(__dirname, '..', 'dist', 'server.js'),  // Chemin absolu
        './dist/server.js',  // Si on est à la racine
        'dist/server.js'  // Si on est dans le même dossier
      ];
      
      let importPath = null;
      let lastError = null;
      
      for (const path of possiblePaths) {
        try {
          // Convertir le chemin en URL pour l'import
          let importUrl;
          if (path.startsWith('.')) {
            // Chemin relatif - utiliser tel quel
            importUrl = path;
          } else {
            // Chemin absolu - convertir en file:// URL
            importUrl = pathToFileURL(path).href;
          }
          
          console.log('[Vercel] Trying import path:', importUrl, '(original:', path, ')');
          serverModule = await import(importUrl);
          if (serverModule && serverModule.app && serverModule.prisma) {
            importPath = importUrl;
            console.log('[Vercel] Successfully imported from:', importUrl);
            break;
          } else {
            console.log('[Vercel] Import succeeded but missing exports');
          }
        } catch (err) {
          lastError = err;
          console.log('[Vercel] Failed to import from:', path, '-', err.message);
          continue;
        }
      }
      
      if (!serverModule || !importPath) {
        // Si tous les chemins ont échoué, lancer l'erreur
        throw new Error(`Failed to import server.js from any path. Last error: ${lastError?.message || 'Unknown error'}`);
      }
      if (!serverModule.app || !serverModule.prisma) {
        throw new Error('server.js does not export app and prisma');
      }
      app = serverModule.app;
      prisma = serverModule.prisma;
      console.log('[Vercel] Server module loaded');
      
      const serverlessModule = await import('serverless-http');
      serverless = serverlessModule.default;
      console.log('[Vercel] Serverless module loaded');
      
      const routesModule = await import('../dist/routes/index.js');
      createApiRoutes = routesModule.createApiRoutes;
      console.log('[Vercel] Routes module loaded');
      
      const errorHandlerModule = await import('../dist/middleware/errorHandler.js');
      notFoundHandler = errorHandlerModule.notFoundHandler;
      console.log('[Vercel] Error handler module loaded');
      
      const secureErrorHandlerModule = await import('../dist/middleware/errorHandler.security.js');
      secureErrorHandler = secureErrorHandlerModule.secureErrorHandler;
      console.log('[Vercel] Secure error handler module loaded');
      
      console.log('[Vercel] Modules loaded successfully');
    } catch (error) {
      console.error('[Vercel] Failed to import modules:', {
        message: error?.message,
        stack: error?.stack,
        code: error?.code,
        name: error?.name,
        cause: error?.cause,
        errno: error?.errno,
        syscall: error?.syscall,
        path: error?.path
      });
      importError = error;
      throw error;
    }
  }
}

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
        
        // Charger les modules d'abord
        await loadModules();
        
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
    
    // Si l'erreur vient de l'import des modules
    if (error?.message?.includes('Cannot find module') || 
        error?.message?.includes('Failed to import') ||
        error?.code === 'MODULE_NOT_FOUND') {
      if (!res.headersSent) {
        return res.status(500).json({
          success: false,
          message: 'Erreur de chargement des modules',
          code: 'MODULE_LOAD_ERROR',
          error: process.env.VERCEL_ENV === 'preview' || process.env.VERCEL_ENV === 'development' ? {
            message: error?.message || String(error),
            stack: error?.stack
          } : undefined
        });
      }
    }
    
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
