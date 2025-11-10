// Re-export du handler Vercel depuis apps/api/src/index.ts
// Ce fichier est le point d'entrée pour Vercel Serverless Functions
// Vercel détecte automatiquement les fichiers dans le dossier api/ comme des fonctions serverless

console.log('[API Entry] 📍 api/index.ts loaded');
console.log('[API Entry] 🔄 Re-exporting handler from apps/api/src/index.ts');

export { default } from '../apps/api/src/index';

