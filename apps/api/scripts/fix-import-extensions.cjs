#!/usr/bin/env node
/**
 * Script pour ajouter les extensions .js aux imports relatifs dans les fichiers compilés
 * Ce script corrige les imports pour qu'ils fonctionnent avec ES modules
 * Usage: node scripts/fix-import-extensions.cjs
 */

const fs = require('fs');
const path = require('path');

console.log('🔧 Correction des extensions d\'import dans dist/...\n');

const distPath = path.join(__dirname, '..', 'dist');

// Fonction récursive pour traiter tous les fichiers .js
function processDirectory(dir) {
  const files = fs.readdirSync(dir, { withFileTypes: true });
  let fileCount = 0;
  let importCount = 0;

  for (const file of files) {
    const filePath = path.join(dir, file.name);

    if (file.isDirectory()) {
      // Ignorer node_modules
      if (file.name !== 'node_modules') {
        const result = processDirectory(filePath);
        fileCount += result.files;
        importCount += result.imports;
      }
    } else if (file.isFile() && file.name.endsWith('.js')) {
      fileCount++;
      const content = fs.readFileSync(filePath, 'utf8');
      let modified = false;
      let newContent = content;

      // Étape 1: Corriger les imports qui se terminent par .js mais pointent vers un dossier avec index.js
      // Pattern: import ... from './dossier.js' où dossier est un dossier avec index.js
      const importWithJsRegex = /from\s+['"](\.\.?\/[^'"]+\.js)['"]/g;
      let match;
      
      while ((match = importWithJsRegex.exec(content)) !== null) {
        const importPath = match[1];
        // Enlever l'extension .js pour vérifier si c'est un dossier
        const pathWithoutExt = importPath.replace(/\.js$/, '');
        const fullPath = path.join(path.dirname(filePath), pathWithoutExt);
        const indexPath = path.join(fullPath, 'index.js');
        
        // Si c'est un dossier avec index.js, corriger l'import
        if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory() && fs.existsSync(indexPath)) {
          const newImportPath = pathWithoutExt + '/index.js';
          const quote = match[0].includes("'") ? "'" : '"';
          newContent = newContent.replace(match[0], `from ${quote}${newImportPath}${quote}`);
          modified = true;
          importCount++;
        }
      }
      
      // Étape 2: Remplacer les imports relatifs sans extension
      // Pattern: import ... from './path' ou import ... from '../path'
      // Mais pas: import ... from 'package' ou import ... from './path.js'
      const importRegex = /from\s+['"](\.\.?\/[^'"]+)['"]/g;
      
      while ((match = importRegex.exec(content)) !== null) {
        const importPath = match[1];
        // Ignorer si c'est déjà un .js, .json, ou un chemin avec extension
        if (!importPath.match(/\.(js|json|ts|tsx)$/)) {
          // Vérifier si c'est un dossier qui devrait pointer vers index.js
          const fullPath = path.join(path.dirname(filePath), importPath);
          const indexPath = path.join(fullPath, 'index.js');
          
          let newImportPath;
          if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory() && fs.existsSync(indexPath)) {
            // C'est un dossier avec un index.js, utiliser ./dossier/index.js
            newImportPath = importPath + '/index.js';
          } else {
            // C'est un fichier, ajouter .js
            newImportPath = importPath + '.js';
          }
          
          const quote = match[0].includes("'") ? "'" : '"';
          newContent = newContent.replace(match[0], `from ${quote}${newImportPath}${quote}`);
          modified = true;
          importCount++;
        }
      }

      // Remplacer aussi les require() si présents (pour compatibilité)
      const requireRegex = /require\s*\(\s*['"](\.\.?\/[^'"]+)['"]\s*\)/g;
      
      while ((match = requireRegex.exec(newContent)) !== null) {
        const requirePath = match[1];
        if (!requirePath.match(/\.(js|json|ts|tsx)$/)) {
          const newRequirePath = requirePath + '.js';
          const quote = match[0].includes("'") ? "'" : '"';
          newContent = newContent.replace(match[0], `require(${quote}${newRequirePath}${quote})`);
          modified = true;
          importCount++;
        }
      }

      if (modified) {
        fs.writeFileSync(filePath, newContent, 'utf8');
        console.log(`✅ Corrigé: ${path.relative(distPath, filePath)}`);
      }
    }
  }

  return { files: fileCount, imports: importCount };
}

try {
  if (!fs.existsSync(distPath)) {
    console.error('❌ Le dossier dist/ n\'existe pas. Lancez d\'abord: pnpm build');
    process.exit(1);
  }

  const result = processDirectory(distPath);
  console.log(`\n✅ Traitement terminé:`);
  console.log(`   - Fichiers traités: ${result.files}`);
  console.log(`   - Imports corrigés: ${result.imports}`);
} catch (error) {
  console.error('❌ Erreur lors de la correction:', error);
  process.exit(1);
}

