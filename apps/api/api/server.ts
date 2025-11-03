// ========================================
// WRAPPER SERVERLESS POUR VERCEL
// ========================================

/**
 * Ce fichier est utilisé pour Vercel Serverless Functions
 * Il exporte l'app Express pour qu'elle soit utilisable comme fonction serverless
 */

import app from '../src/server';

// Export pour Vercel (format serverless function)
// Vercel attend un export default avec (req, res) => {}
export default app;
