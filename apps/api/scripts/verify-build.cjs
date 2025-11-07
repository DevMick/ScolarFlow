#!/usr/bin/env node
/**
 * Script de vérification du build
 * Vérifie que tous les fichiers nécessaires sont générés après le build
 * Usage: node scripts/verify-build.cjs
 */

const fs = require('fs');
const path = require('path');

console.log('🔍 Vérification du build...\n');

const apiPath = path.join(__dirname, '..');
const distPath = path.join(apiPath, 'dist');
const apiServerPath = path.join(apiPath, 'api', 'server.js');

// Fichiers critiques à vérifier
const criticalFiles = [
  'dist/server.js',
  'dist/routes/index.js',
  'dist/middleware/errorHandler.js',
  'dist/middleware/errorHandler.security.js',
  'api/server.js'
];

let allFilesExist = true;

console.log('Vérification des fichiers critiques:\n');
for (const file of criticalFiles) {
  const filePath = path.join(apiPath, file);
  const exists = fs.existsSync(filePath);
  const status = exists ? '✅' : '❌';
  console.log(`${status} ${file}`);
  
  if (!exists) {
    allFilesExist = false;
  } else {
    // Vérifier que le fichier n'est pas vide
    const stats = fs.statSync(filePath);
    if (stats.size === 0) {
      console.log(`   ⚠️  Le fichier est vide!`);
      allFilesExist = false;
    }
  }
}

// Vérifier les exports de dist/server.js
console.log('\nVérification des exports de dist/server.js...');
const distServerPath = path.join(distPath, 'server.js');
if (fs.existsSync(distServerPath)) {
  const content = fs.readFileSync(distServerPath, 'utf8');
  const hasAppExport = content.includes('export') && (content.includes('app') || content.includes('export { app }'));
  const hasPrismaExport = content.includes('prisma') && (content.includes('export') || content.includes('export const prisma'));
  
  console.log(hasAppExport ? '✅ Export app trouvé' : '❌ Export app manquant');
  console.log(hasPrismaExport ? '✅ Export prisma trouvé' : '❌ Export prisma manquant');
  
  if (!hasAppExport || !hasPrismaExport) {
    allFilesExist = false;
  }
}

// Vérifier la structure de dist/
console.log('\nVérification de la structure dist/...');
if (fs.existsSync(distPath)) {
  const distFiles = fs.readdirSync(distPath, { recursive: true });
  const requiredDirs = ['routes', 'middleware', 'controllers', 'services'];
  
  for (const dir of requiredDirs) {
    const dirPath = path.join(distPath, dir);
    const exists = fs.existsSync(dirPath);
    console.log(exists ? `✅ dist/${dir}/ existe` : `⚠️  dist/${dir}/ manquant`);
  }
  
  console.log(`\n📊 Total de fichiers dans dist/: ${distFiles.length}`);
}

// Vérifier api/server.js
console.log('\nVérification de api/server.js...');
if (fs.existsSync(apiServerPath)) {
  const content = fs.readFileSync(apiServerPath, 'utf8');
  
  // Vérifier qu'il importe depuis dist/server.js
  const importsDist = content.includes('../dist/server.js') || content.includes('./dist/server.js') || content.includes('dist/server.js');
  console.log(importsDist ? '✅ Import depuis dist/server.js trouvé' : '⚠️  Import depuis dist/server.js non trouvé');
  
  // Vérifier qu'il exporte un handler par défaut
  const hasDefaultExport = content.includes('export default');
  console.log(hasDefaultExport ? '✅ Export default trouvé' : '❌ Export default manquant');
  
  if (!importsDist || !hasDefaultExport) {
    allFilesExist = false;
  }
} else {
  console.log('❌ api/server.js n\'existe pas');
  allFilesExist = false;
}

console.log('\n' + '='.repeat(50));
if (allFilesExist) {
  console.log('✅ Tous les fichiers critiques sont présents!');
  console.log('💡 Vous pouvez maintenant tester avec: node scripts/test-vercel-local.cjs');
  process.exit(0);
} else {
  console.log('❌ Certains fichiers critiques sont manquants!');
  console.log('💡 Lancez: pnpm build');
  process.exit(1);
}

