#!/usr/bin/env node
/**
 * Script pour corriger les imports dans dist/api/server.js
 * TypeScript compile les imports depuis src/, mais au runtime, les fichiers sont dans dist/
 */

const fs = require('fs');
const path = require('path');

const distApiServerPath = path.join(__dirname, '../dist/api/server.js');

if (!fs.existsSync(distApiServerPath)) {
  console.error('File dist/api/server.js not found. Run build first.');
  process.exit(1);
}

let content = fs.readFileSync(distApiServerPath, 'utf8');

// Corriger les imports: ../src/... -> ../...
content = content.replace(/require\("\.\.\/src\//g, 'require("../');
content = content.replace(/require\('\.\.\/src\//g, "require('../");

// Supprimer la ligne const path = require('path'); si elle n'est pas utilisée
content = content.replace(/const path = require\('path'\);?\s*\n/g, '');

fs.writeFileSync(distApiServerPath, content, 'utf8');
console.log('✅ Fixed imports in dist/api/server.js');

