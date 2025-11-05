#!/usr/bin/env node
/**
 * Script pour corriger les imports dans dist/api/server.js
 * TypeScript compile les imports depuis src/, mais au runtime, les fichiers sont dans dist/
 * Aussi, corrige l'export pour Vercel (module.exports au lieu de exports.default)
 * Et copie le fichier vers api/server.js pour que Vercel le trouve
 */

const fs = require('fs');
const path = require('path');

const distApiServerPath = path.join(__dirname, '../dist/api/server.js');
const apiServerPath = path.join(__dirname, '../api/server.js');
const apiDir = path.join(__dirname, '../api');

if (!fs.existsSync(distApiServerPath)) {
  console.error('File dist/api/server.js not found. Run build first.');
  process.exit(1);
}

let content = fs.readFileSync(distApiServerPath, 'utf8');

// Fonction pour corriger les imports dans un fichier
function fixImportsInFile(filePath, fileContent) {
  let fixedContent = fileContent;
  
  // Corriger les imports dans __importStar(require(...))
  fixedContent = fixedContent.replace(/__importStar\(require\("\.\.\/src\//g, '__importStar(require("../dist/src/');
  fixedContent = fixedContent.replace(/__importStar\(require\('\.\.\/src\//g, "__importStar(require('../dist/src/");
  fixedContent = fixedContent.replace(/__importStar\(require\("\.\.\/src\/server"\)/g, '__importStar(require("../dist/src/server")');
  fixedContent = fixedContent.replace(/__importStar\(require\('\.\.\/src\/server'\)/g, "__importStar(require('../dist/src/server')");
  fixedContent = fixedContent.replace(/__importStar\(require\("\.\.\/src\/utils\//g, '__importStar(require("../dist/src/utils/');
  fixedContent = fixedContent.replace(/__importStar\(require\('\.\.\/src\/utils\//g, "__importStar(require('../dist/src/utils/");
  fixedContent = fixedContent.replace(/__importStar\(require\("\.\.\/src\/routes"\)/g, '__importStar(require("../dist/src/routes")');
  fixedContent = fixedContent.replace(/__importStar\(require\('\.\.\/src\/routes'\)/g, "__importStar(require('../dist/src/routes')");
  fixedContent = fixedContent.replace(/__importStar\(require\("\.\.\/src\/middleware\//g, '__importStar(require("../dist/src/middleware/');
  fixedContent = fixedContent.replace(/__importStar\(require\('\.\.\/src\/middleware\//g, "__importStar(require('../dist/src/middleware/");

  // Corriger les require() directs
  fixedContent = fixedContent.replace(/require\("\.\.\/src\//g, 'require("../dist/src/');
  fixedContent = fixedContent.replace(/require\('\.\.\/src\//g, "require('../dist/src/");
  fixedContent = fixedContent.replace(/require\("\.\.\/server"/g, 'require("../dist/src/server"');
  fixedContent = fixedContent.replace(/require\('\.\.\/server'/g, "require('../dist/src/server'");
  fixedContent = fixedContent.replace(/require\("\.\.\/dist\/server"/g, 'require("../dist/src/server"');
  fixedContent = fixedContent.replace(/require\('\.\.\/dist\/server'/g, "require('../dist/src/server'");
  fixedContent = fixedContent.replace(/require\("\.\.\/utils\//g, 'require("../dist/src/utils/');
  fixedContent = fixedContent.replace(/require\('\.\.\/utils\//g, "require('../dist/src/utils/')");
  fixedContent = fixedContent.replace(/require\("\.\.\/dist\/utils\//g, 'require("../dist/src/utils/');
  fixedContent = fixedContent.replace(/require\('\.\.\/dist\/utils\//g, "require('../dist/src/utils/')");
  fixedContent = fixedContent.replace(/require\("\.\.\/routes"/g, 'require("../dist/src/routes"');
  fixedContent = fixedContent.replace(/require\('\.\.\/routes'/g, "require('../dist/src/routes'");
  fixedContent = fixedContent.replace(/require\("\.\.\/dist\/routes"/g, 'require("../dist/src/routes"');
  fixedContent = fixedContent.replace(/require\('\.\.\/dist\/routes'/g, "require('../dist/src/routes'");
  fixedContent = fixedContent.replace(/require\("\.\.\/middleware\//g, 'require("../dist/src/middleware/');
  fixedContent = fixedContent.replace(/require\('\.\.\/middleware\//g, "require('../dist/src/middleware/')");
  fixedContent = fixedContent.replace(/require\("\.\.\/dist\/middleware\//g, 'require("../dist/src/middleware/');
  fixedContent = fixedContent.replace(/require\('\.\.\/dist\/middleware\//g, "require('../dist/src/middleware/')");

  // Corriger l'export
  fixedContent = fixedContent.replace(/exports\.default\s*=\s*handler\s*;/, 'module.exports = handler;');
  if (fixedContent.includes('exports.default = handler;')) {
    fixedContent = fixedContent.replace(/exports\.default\s*=\s*handler\s*;/, 'module.exports = handler;');
  }

  return fixedContent;
}

// Corriger les imports dans le contenu
content = fixImportsInFile(distApiServerPath, content);

// Supprimer la ligne const path = require('path'); si elle n'est pas utilisée
content = content.replace(/const path = require\('path'\);?\s*\n/g, '');

// Écrire le fichier corrigé dans dist/api/server.js
fs.writeFileSync(distApiServerPath, content, 'utf8');
console.log('✅ Fixed imports and exports in dist/api/server.js');

// Créer le dossier api/ s'il n'existe pas
if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true });
}

// Si api/server.js existe déjà (compilé par Vercel depuis api/server.ts), le corriger aussi
if (fs.existsSync(apiServerPath)) {
  let apiServerContent = fs.readFileSync(apiServerPath, 'utf8');
  apiServerContent = fixImportsInFile(apiServerPath, apiServerContent);
  apiServerContent = apiServerContent.replace(/const path = require\('path'\);?\s*\n/g, '');
  fs.writeFileSync(apiServerPath, apiServerContent, 'utf8');
  console.log('✅ Fixed imports and exports in api/server.js (compiled by Vercel)');
} else {
  // Copier le fichier vers api/server.js pour que Vercel le trouve
  fs.copyFileSync(distApiServerPath, apiServerPath);
  console.log('✅ Copied dist/api/server.js to api/server.js for Vercel');
}

