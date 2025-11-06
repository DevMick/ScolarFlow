#!/usr/bin/env node
/**
 * Script pour créer le point d'entrée Vercel api/server.js
 * Ce script crée un fichier simple qui réexporte depuis dist/src/server.js
 */

const fs = require('fs');
const path = require('path');

const distServerPath = path.join(__dirname, '../dist/server.js');
const apiDir = path.join(__dirname, '../api');
const apiServerPath = path.join(apiDir, 'server.js');

// Vérifier que le fichier source existe
if (!fs.existsSync(distServerPath)) {
  console.error('❌ dist/server.js not found! Run build first.');
  process.exit(1);
}

// Créer le dossier api/ s'il n'existe pas
if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true });
}

// Créer api/server.js avec un import simple depuis dist/server.js
// En ES modules, on doit utiliser l'extension .js dans les imports
const serverContent = `// Point d'entrée Vercel Serverless Function
// Ce fichier réexporte l'application depuis dist/server.js

import { app, prisma } from '../dist/server.js';
import serverless from 'serverless-http';

// Créer le handler serverless avec l'app Express
const handler = serverless(app, {
  binary: ['image/*', 'application/pdf', 'application/octet-stream'],
});

// Export pour Vercel (format serverless function)
export default handler;
`;

fs.writeFileSync(apiServerPath, serverContent, 'utf8');
console.log('✅ Created api/server.js with correct ES module import from dist/server.js');
