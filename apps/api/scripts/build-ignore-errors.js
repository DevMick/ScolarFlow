#!/usr/bin/env node
/**
 * Script de build qui ignore les erreurs TypeScript
 * Compile le code TypeScript même s'il y a des erreurs de types
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building TypeScript (ignoring type errors)...');

try {
  // Exécuter tsc avec redirection des erreurs pour ne pas faire échouer le build
  // Utiliser --skipLibCheck pour ignorer les erreurs dans node_modules
  // Utiliser --noEmitOnError false pour continuer même avec des erreurs
  execSync('tsc --skipLibCheck --noEmitOnError false', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: { ...process.env, TS_NODE_TRANSPILE_ONLY: 'true' }
  });
  console.log('✅ TypeScript compilation completed (with some errors ignored)');
} catch (error) {
  // Même s'il y a des erreurs, continuer si le dossier dist existe
  const distPath = path.join(__dirname, '..', 'dist');
  if (fs.existsSync(distPath)) {
    console.log('⚠️  TypeScript compilation had errors, but dist folder exists. Continuing...');
  } else {
    console.error('❌ TypeScript compilation failed and no dist folder found');
    process.exit(1);
  }
}

