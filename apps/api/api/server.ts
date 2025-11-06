// ========================================
// WRAPPER SERVERLESS POUR VERCEL
// ========================================

/**
 * Ce fichier est utilisé pour Vercel Serverless Functions
 * L'app Express est déjà complètement configurée dans src/server.ts
 */

import { app, prisma } from '../dist/server.js';
import serverless from 'serverless-http';

// Créer le handler serverless avec l'app Express
const handler = serverless(app, {
  binary: ['image/*', 'application/pdf', 'application/octet-stream'],
});

// Export pour Vercel (format serverless function)
export default handler;
