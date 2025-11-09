#!/usr/bin/env node

/**
 * Script de vérification post-build pour Vercel
 * Vérifie que dist/index.js existe après le build
 */

const fs = require('fs');
const path = require('path');

const indexPath = path.join(__dirname, '..', 'dist', 'index.js');

if (!fs.existsSync(indexPath)) {
  console.error('❌ ERREUR: dist/index.js manquant après le build');
  console.error(`   Chemin attendu: ${indexPath}`);
  console.error('   Assurez-vous que le build TypeScript a généré le fichier index.js');
  process.exit(1);
}

const stats = fs.statSync(indexPath);
if (stats.size === 0) {
  console.error('❌ ERREUR: dist/index.js existe mais est vide');
  process.exit(1);
}

console.log('✅ dist/index.js existe et est valide');
console.log(`   Taille: ${(stats.size / 1024).toFixed(2)} KB`);
process.exit(0);

