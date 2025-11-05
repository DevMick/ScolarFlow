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

// Corriger les imports: ../src/... -> ../dist/...
content = content.replace(/require\("\.\.\/src\//g, 'require("../dist/');
content = content.replace(/require\('\.\.\/src\//g, "require('../dist/");
// Corriger aussi les imports directs de ../server ou ../dist/server -> ../dist/src/server
content = content.replace(/require\("\.\.\/server"/g, 'require("../dist/src/server"');
content = content.replace(/require\('\.\.\/server'/g, "require('../dist/src/server'");
content = content.replace(/require\("\.\.\/dist\/server"/g, 'require("../dist/src/server"');
content = content.replace(/require\('\.\.\/dist\/server'/g, "require('../dist/src/server'");
// Corriger les imports de ../utils/... ou ../dist/utils/... -> ../dist/src/utils/...
content = content.replace(/require\("\.\.\/utils\//g, 'require("../dist/src/utils/');
content = content.replace(/require\('\.\.\/utils\//g, "require('../dist/src/utils/');
content = content.replace(/require\("\.\.\/dist\/utils\//g, 'require("../dist/src/utils/');
content = content.replace(/require\('\.\.\/dist\/utils\//g, "require('../dist/src/utils/');
// Corriger les imports de ../routes ou ../dist/routes -> ../dist/src/routes
content = content.replace(/require\("\.\.\/routes"/g, 'require("../dist/src/routes"');
content = content.replace(/require\('\.\.\/routes'/g, "require('../dist/src/routes'");
content = content.replace(/require\("\.\.\/dist\/routes"/g, 'require("../dist/src/routes"');
content = content.replace(/require\('\.\.\/dist\/routes'/g, "require('../dist/src/routes'");
// Corriger les imports de ../middleware/... ou ../dist/middleware/... -> ../dist/src/middleware/...
// (car TypeScript compile src/ vers dist/src/ avec rootDir=".")
content = content.replace(/require\("\.\.\/middleware\//g, 'require("../dist/src/middleware/');
content = content.replace(/require\('\.\.\/middleware\//g, "require('../dist/src/middleware/");
content = content.replace(/require\("\.\.\/dist\/middleware\//g, 'require("../dist/src/middleware/');
content = content.replace(/require\('\.\.\/dist\/middleware\//g, "require('../dist/src/middleware/");

// Supprimer la ligne const path = require('path'); si elle n'est pas utilisée
content = content.replace(/const path = require\('path'\);?\s*\n/g, '');

// Corriger l'export pour Vercel: exports.default -> module.exports
// Si on a exports.default = handler, on le remplace par module.exports = handler
content = content.replace(/exports\.default\s*=\s*handler\s*;/, 'module.exports = handler;');
// Si on a exports.default = handler; à la fin, on le remplace
if (content.includes('exports.default = handler;')) {
  content = content.replace(/exports\.default\s*=\s*handler\s*;/, 'module.exports = handler;');
}

// Écrire le fichier corrigé dans dist/api/server.js
fs.writeFileSync(distApiServerPath, content, 'utf8');
console.log('✅ Fixed imports and exports in dist/api/server.js');

// Créer le dossier api/ s'il n'existe pas
if (!fs.existsSync(apiDir)) {
  fs.mkdirSync(apiDir, { recursive: true });
}

// Copier le fichier vers api/server.js pour que Vercel le trouve
fs.copyFileSync(distApiServerPath, apiServerPath);
console.log('✅ Copied dist/api/server.js to api/server.js for Vercel');

