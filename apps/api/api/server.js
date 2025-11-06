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

// Fonction pour initialiser l'app pour Vercel
async function initializeApp() {
  if (isInitialized) {
    return;
  }

  if (!initializationPromise) {
    initializationPromise = (async () => {
      try {
        console.log('Initializing app for Vercel...');
        
        // Connecter Prisma
        try {
          await prisma.$connect();
          console.log('Prisma connected');
        } catch (error) {
          // Peut être déjà connecté, ignorer
          console.warn('Prisma connection warning:', error.message);
        }

        // Initialiser les routes API dynamiques
        // Note: Les routes statiques sont déjà montées dans server.ts
        try {
          const apiRoutes = await createApiRoutes(prisma);
          app.use('/api', apiRoutes);
          console.log('API routes initialized');
        } catch (error) {
          console.error('Failed to initialize API routes:', error);
          throw error;
        }

        // Error handling middleware (must be last)
        try {
          app.use(notFoundHandler);
          app.use(secureErrorHandler);
          console.log('Error handlers initialized');
        } catch (error) {
          console.warn('Error handlers initialization warning:', error.message);
        }

        isInitialized = true;
        console.log('App initialized successfully for Vercel');
      } catch (error) {
        console.error('Failed to initialize app for Vercel:', error);
        isInitialized = false;
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
  // Initialiser l'app avant de créer le handler
  await initializeApp();
  
  if (!handler) {
    handler = serverless(app, {
      binary: ['image/*', 'application/pdf', 'application/octet-stream'],
    });
  }
  
  return handler;
}

// Export pour Vercel (format serverless function)
export default async function vercelHandler(req, res) {
  try {
    const serverlessHandler = await getHandler();
    return await serverlessHandler(req, res);
  } catch (error) {
    console.error('Error in Vercel handler:', error);
    console.error('Error details:', {
      message: error?.message,
      stack: error?.stack,
      name: error?.name
    });
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Erreur interne du serveur',
        error: process.env.NODE_ENV === 'development' || process.env.VERCEL_ENV === 'preview' ? {
          message: error?.message || String(error),
          stack: error?.stack
        } : undefined
      });
    }
  }
}
