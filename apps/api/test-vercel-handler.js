// Script de test local pour le handler Vercel
import { fileURLToPath, pathToFileURL } from 'url';
import { dirname, join } from 'path';
import { readFileSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Simuler l'environnement Vercel
process.env.VERCEL = '1';
process.env.NODE_ENV = 'production';

// Mock d'une requête Vercel
const mockRequest = {
  method: 'GET',
  url: '/api/health',
  path: '/api/health',
  headers: {
    'user-agent': 'test-agent',
    'host': 'localhost'
  },
  query: {},
  body: {},
  ip: '127.0.0.1'
};

// Mock d'une réponse Vercel
const mockResponse = {
  statusCode: 200,
  headersSent: false,
  headers: {},
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    console.log('Response:', JSON.stringify(data, null, 2));
    this.headersSent = true;
    return this;
  },
  send: function(data) {
    console.log('Response:', data);
    this.headersSent = true;
    return this;
  },
  header: function(name, value) {
    this.headers[name] = value;
    return this;
  },
  setHeader: function(name, value) {
    this.headers[name] = value;
    return this;
  },
  getHeader: function(name) {
    return this.headers[name];
  },
  end: function(data) {
    if (data) console.log('Response:', data);
    this.headersSent = true;
    return this;
  }
};

async function testHandler() {
  try {
    console.log('🧪 Test du handler Vercel local...\n');
    console.log('📁 Répertoire:', __dirname);
    console.log('📦 Import du handler...\n');

    // Importer le handler depuis dist/index.js
    const handlerPath = join(__dirname, 'dist', 'index.js');
    console.log('📂 Chemin du handler:', handlerPath);
    
    // Convertir en file:// URL pour Windows
    const handlerUrl = pathToFileURL(handlerPath).href;
    console.log('📂 URL du handler:', handlerUrl);
    
    const handlerModule = await import(handlerUrl);
    const handler = handlerModule.default;

    if (!handler) {
      throw new Error('Handler non trouvé dans le module');
    }

    console.log('✅ Handler importé avec succès\n');
    console.log('🚀 Exécution du handler...\n');

    // Exécuter le handler
    await handler(mockRequest, mockResponse);

    console.log('\n✅ Test terminé avec succès!');
  } catch (error) {
    console.error('\n❌ Erreur lors du test:');
    console.error('Message:', error.message);
    console.error('Stack:', error.stack);
    console.error('Code:', error.code);
    console.error('Name:', error.name);
    
    if (error.cause) {
      console.error('Cause:', error.cause);
    }
    
    process.exit(1);
  }
}

testHandler();

