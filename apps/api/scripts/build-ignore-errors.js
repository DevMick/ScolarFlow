#!/usr/bin/env node
/**
 * Script de build qui ignore les erreurs TypeScript
 * Compile le code TypeScript même s'il y a des erreurs de types
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔨 Building TypeScript (ignoring type errors)...');

const distPath = path.join(__dirname, '..', 'dist');
const srcPath = path.join(__dirname, '..', 'src');

// Exécuter tsc avec redirection des erreurs pour ne pas faire échouer le build
// Utiliser --skipLibCheck pour ignorer les erreurs dans node_modules
// Utiliser --noEmitOnError false pour continuer même avec des erreurs
try {
  execSync('tsc --skipLibCheck --noEmitOnError false', {
    stdio: 'inherit',
    cwd: path.join(__dirname, '..'),
    env: { ...process.env }
  });
  console.log('✅ TypeScript compilation completed');
} catch (error) {
  // Même s'il y a des erreurs TypeScript, continuer si le dossier dist existe
  // TypeScript peut émettre des fichiers même avec des erreurs de types
  if (fs.existsSync(distPath)) {
    const distFiles = fs.readdirSync(distPath, { recursive: true });
    if (distFiles.length > 0) {
      console.log('⚠️  TypeScript compilation had type errors, but JavaScript files were generated. Continuing...');
    } else {
      console.error('❌ TypeScript compilation failed and no output files found');
      process.exit(1);
    }
  } else {
    console.error('❌ TypeScript compilation failed and no dist folder found');
    process.exit(1);
  }
}

