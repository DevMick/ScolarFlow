#!/usr/bin/env node
/**
 * Script de test pour vérifier que le build TypeScript fonctionne
 * Usage: node scripts/test-build.js
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🔍 Test du build TypeScript...\n');

const apiPath = path.join(__dirname, '..');

// Aller dans le répertoire de l'API
process.chdir(apiPath);

try {
  // Installer les dépendances si nécessaire
  if (!fs.existsSync(path.join(apiPath, 'node_modules'))) {
    console.log('📦 Installation des dépendances...');
    execSync('pnpm install', { stdio: 'inherit' });
  }

  // Générer Prisma Client
  console.log('🗄️  Génération du Prisma Client...');
  execSync('pnpm prisma generate', { stdio: 'inherit' });

  // Compiler TypeScript
  console.log('🔨 Compilation TypeScript...');
  const buildOutput = execSync('pnpm tsc', { 
    encoding: 'utf8',
    stdio: 'pipe'
  });

  console.log('✅ Build réussi ! Aucune erreur TypeScript.');
  process.exit(0);
} catch (error) {
  const errorOutput = error.stdout || error.stderr || error.message;
  const errorCount = (errorOutput.match(/error TS/g) || []).length;
  
  if (errorCount > 0) {
    console.error(`❌ Build échoué avec ${errorCount} erreur(s) TypeScript.`);
    const errors = errorOutput.split('\n').filter(line => line.includes('error TS'));
    console.error(errors.slice(0, 20).join('\n'));
  } else {
    console.error('❌ Erreur lors du build:', error.message);
  }
  process.exit(1);
}

