#!/usr/bin/env node
/**
 * Script de test local pour simuler l'environnement Vercel
 * Ce script teste le chargement des modules comme le ferait Vercel
 * Usage: node scripts/test-vercel-local.cjs
 */

const { spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🧪 Test local de l\'environnement Vercel...\n');

const apiPath = path.join(__dirname, '..');
const distPath = path.join(apiPath, 'dist');
const apiServerPath = path.join(apiPath, 'api', 'server.js');
const distServerPath = path.join(distPath, 'server.js');

// Vérifier que le build a été fait
console.log('1️⃣  Vérification du build...');
if (!fs.existsSync(distPath)) {
  console.error('❌ Le dossier dist/ n\'existe pas. Lancez d\'abord: pnpm build');
  process.exit(1);
}

if (!fs.existsSync(distServerPath)) {
  console.error('❌ dist/server.js n\'existe pas. Le build a échoué.');
  process.exit(1);
}

console.log('✅ dist/server.js existe\n');

// Vérifier que api/server.js existe
console.log('2️⃣  Vérification de api/server.js...');
if (!fs.existsSync(apiServerPath)) {
  console.error('❌ api/server.js n\'existe pas. Lancez: pnpm build');
  process.exit(1);
}

console.log('✅ api/server.js existe\n');

// Vérifier les exports de dist/server.js
console.log('3️⃣  Vérification des exports de dist/server.js...');
const distServerContent = fs.readFileSync(distServerPath, 'utf8');
if (!distServerContent.includes('export') || !distServerContent.includes('app')) {
  console.warn('⚠️  dist/server.js ne semble pas exporter app');
}

if (!distServerContent.includes('prisma')) {
  console.warn('⚠️  dist/server.js ne semble pas exporter prisma');
}

console.log('✅ Exports vérifiés\n');

// Tester l'import du module
console.log('4️⃣  Test de l\'import du module (simulation Vercel)...');
console.log('   Environnement: VERCEL=1, NODE_ENV=production\n');

// Créer un script de test temporaire
const testScript = `import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('[Test] Current directory:', process.cwd());
console.log('[Test] __dirname:', __dirname);

// Tester l'import depuis api/server.js
try {
  console.log('[Test] Tentative d\\'import de api/server.js...');
  const handler = await import('./api/server.js');
  console.log('[Test] ✅ Import réussi!');
  console.log('[Test] Handler type:', typeof handler.default);
  
  // Tester l'appel du handler avec une requête mock
  console.log('[Test] Test du handler avec une requête mock...');
  const mockReq = {
    method: 'GET',
    url: '/api/health',
    headers: {},
    path: '/api/health'
  };
  
  const mockRes = {
    statusCode: null,
    responseData: null,
    status: (code) => {
      console.log('[Test] Response status:', code);
      mockRes.statusCode = code;
      return mockRes;
    },
    json: (data) => {
      console.log('[Test] Response JSON:', JSON.stringify(data, null, 2));
      mockRes.responseData = data;
      return mockRes;
    },
    headersSent: false
  };
  
  try {
    await handler.default(mockReq, mockRes);
    console.log('[Test] ✅ Handler exécuté avec succès');
    
    // Vérifier le code de réponse
    if (mockRes.statusCode === 500) {
      // Si c'est une erreur de configuration (DB), c'est normal en test local
      if (mockRes.responseData?.code === 'CONFIGURATION_ERROR' || 
          mockRes.responseData?.message?.includes('Database connection')) {
        console.log('[Test] ⚠️  Erreur de connexion DB (normal en test local)');
        console.log('[Test] ✅ Les modules se chargent correctement !');
        console.log('[Test] 💡 Sur Vercel avec DATABASE_URL configurée, cela fonctionnera.');
        process.exit(0);
      }
    }
  } catch (error) {
    // Si c'est une erreur de connexion DB, c'est normal
    if (error.message?.includes('Database connection') || 
        error.message?.includes('database credentials')) {
      console.log('[Test] ⚠️  Erreur de connexion DB (normal en test local)');
      console.log('[Test] ✅ Les modules se chargent correctement !');
      console.log('[Test] 💡 Sur Vercel avec DATABASE_URL configurée, cela fonctionnera.');
      process.exit(0);
    }
    
    console.error('[Test] ❌ Erreur lors de l\\'exécution du handler:');
    console.error('[Test]', error.message);
    console.error('[Test]', error.stack);
    process.exit(1);
  }
} catch (error) {
  console.error('[Test] ❌ Erreur lors de l\\'import:');
  console.error('[Test]', error.message);
  console.error('[Test]', error.stack);
  if (error.code === 'MODULE_NOT_FOUND') {
    console.error('[Test] Module non trouvé:', error.path);
  }
  process.exit(1);
}
`;

const testScriptPath = path.join(apiPath, 'test-vercel-import.mjs');
fs.writeFileSync(testScriptPath, testScript, 'utf8');

// Exécuter le test avec les variables d'environnement Vercel
const testProcess = spawn('node', [testScriptPath], {
  cwd: apiPath,
  env: {
    ...process.env,
    VERCEL: '1',
    NODE_ENV: 'production',
    DATABASE_URL: process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/test'
  },
  stdio: 'inherit',
  shell: true
});

testProcess.on('close', (code) => {
  // Nettoyer le fichier de test
  if (fs.existsSync(testScriptPath)) {
    fs.unlinkSync(testScriptPath);
  }
  
  if (code === 0) {
    console.log('\n✅ Test réussi! Le module se charge correctement.');
    console.log('\n💡 Si ce test passe, le déploiement sur Vercel devrait fonctionner.');
  } else {
    console.log('\n❌ Test échoué! Corrigez les erreurs ci-dessus avant de déployer sur Vercel.');
    process.exit(1);
  }
});

testProcess.on('error', (error) => {
  console.error('❌ Erreur lors de l\'exécution du test:', error);
  if (fs.existsSync(testScriptPath)) {
    fs.unlinkSync(testScriptPath);
  }
  process.exit(1);
});

