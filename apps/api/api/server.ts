// ========================================
// WRAPPER SERVERLESS POUR VERCEL
// ========================================

/**
 * Ce fichier est utilisé pour Vercel Serverless Functions
 * L'app Express est déjà complètement configurée dans src/server.ts
 * avec toutes les routes et middleware pour l'environnement Vercel
 */

// Importer l'app Express depuis src/server
// L'app Express est déjà configurée avec tout le middleware et les routes
// pour l'environnement Vercel (voir initializeForVercel dans src/server.ts)
import { app } from '../src/server';

// Export pour Vercel (format serverless function)
// Vercel attend un handler qui gère (req, res)
// L'app Express gère tout (middleware, routes, error handlers)
export default async function handler(req: any, res: any) {
  // Passer directement la requête à l'app Express
  // L'app Express est déjà complètement configurée
  return app(req, res);
}
