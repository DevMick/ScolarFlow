// Script de test production locale pour simuler Vercel
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { readFileSync, existsSync } from 'fs';
import http from 'http';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Simuler l'environnement Vercel
process.env.VERCEL = '1';
process.env.NODE_ENV = 'production';

// Charger les variables d'environnement si .env existe
const envPath = join(rootDir, '.env');
if (existsSync(envPath)) {
  const envContent = readFileSync(envPath, 'utf-8');
  envContent.split('\n').forEach(line => {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const [key, ...valueParts] = trimmed.split('=');
      const value = valueParts.join('=').replace(/^["']|["']$/g, '');
      if (key && value) {
        process.env[key.trim()] = value.trim();
      }
    }
  });
  console.log('✅ Variables d\'environnement chargées depuis .env\n');
}

async function testHandler() {
  try {
    console.log('🧪 Test Production Locale - Simulation Vercel\n');
    console.log('📁 Répertoire:', rootDir);
    console.log('🌍 Environnement:', process.env.NODE_ENV);
    console.log('☁️  Vercel:', process.env.VERCEL);
    console.log('');

    // Vérifier que le build existe
    const distIndexPath = join(rootDir, 'dist', 'index.js');
    if (!existsSync(distIndexPath)) {
      console.error('❌ Le fichier dist/index.js n\'existe pas!');
      console.error('   Lancez d\'abord: pnpm build');
      process.exit(1);
    }

    console.log('📦 Import du handler depuis dist/index.js...\n');

    // Importer le handler
    const handlerModule = await import(`file://${distIndexPath}`);
    const handler = handlerModule.default;

    if (!handler) {
      throw new Error('Handler non trouvé dans le module (export default manquant)');
    }

    console.log('✅ Handler importé avec succès\n');
    console.log('🚀 Démarrage du serveur de test sur http://localhost:3000\n');
    console.log('📋 Endpoints disponibles:');
    console.log('   - GET  http://localhost:3000/api/health');
    console.log('   - GET  http://localhost:3000/api/info');
    console.log('   - POST http://localhost:3000/api/auth/login');
    console.log('');
    console.log('💡 Appuyez sur Ctrl+C pour arrêter le serveur\n');
    console.log('─'.repeat(60));
    console.log('');

    // Créer un serveur HTTP simple
    const server = http.createServer((req, res) => {
      // Convertir la requête HTTP en format Vercel
      const vercelReq = {
        method: req.method || 'GET',
        url: req.url || '/',
        path: req.url?.split('?')[0] || '/',
        headers: req.headers || {},
        query: {},
        body: {},
        ip: req.socket.remoteAddress || '127.0.0.1',
        on: req.on.bind(req),
        pipe: req.pipe.bind(req),
        once: req.once.bind(req),
        removeListener: req.removeListener.bind(req),
        readable: req.readable,
        readableEncoding: req.readableEncoding,
        readableEnded: req.readableEnded,
        readableFlowing: req.readableFlowing,
        readableHighWaterMark: req.readableHighWaterMark,
        readableLength: req.readableLength,
        readableObjectMode: req.readableObjectMode,
        resume: req.resume.bind(req),
        setEncoding: req.setEncoding.bind(req),
        unpipe: req.unpipe.bind(req),
        unshift: req.unshift.bind(req),
        wrap: req.wrap.bind(req),
        [Symbol.asyncIterator]: req[Symbol.asyncIterator]?.bind(req)
      };

      // Parser les query params
      if (req.url && req.url.includes('?')) {
        const queryString = req.url.split('?')[1];
        queryString.split('&').forEach(param => {
          const [key, value] = param.split('=');
          if (key) {
            vercelReq.query[decodeURIComponent(key)] = value ? decodeURIComponent(value) : '';
          }
        });
      }

      // Lire le body si présent
      let bodyData = '';
      req.on('data', chunk => {
        bodyData += chunk.toString();
      });

      req.on('end', async () => {
        if (bodyData) {
          try {
            vercelReq.body = JSON.parse(bodyData);
          } catch {
            vercelReq.body = bodyData;
          }
        }

        // Créer une réponse Express-like
        const vercelRes = {
          statusCode: 200,
          headersSent: false,
          headers: {},
          status: function(code) {
            this.statusCode = code;
            return this;
          },
          json: function(data) {
            if (!this.headersSent) {
              this.setHeader('Content-Type', 'application/json');
              res.writeHead(this.statusCode, this.headers);
              res.end(JSON.stringify(data));
              this.headersSent = true;
            }
            return this;
          },
          send: function(data) {
            if (!this.headersSent) {
              res.writeHead(this.statusCode, this.headers);
              res.end(typeof data === 'string' ? data : JSON.stringify(data));
              this.headersSent = true;
            }
            return this;
          },
          setHeader: function(name, value) {
            this.headers[name.toLowerCase()] = value;
            return this;
          },
          getHeader: function(name) {
            return this.headers[name.toLowerCase()];
          },
          end: function(data) {
            if (!this.headersSent) {
              res.writeHead(this.statusCode, this.headers);
              res.end(data);
              this.headersSent = true;
            }
            return this;
          }
        };

        try {
          // Exécuter le handler
          await handler(vercelReq, vercelRes);

          // Si la réponse n'a pas été envoyée, envoyer une réponse par défaut
          if (!vercelRes.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({ error: 'Handler did not send response' }));
          }
        } catch (error) {
          console.error(`❌ Erreur lors du traitement de ${req.method} ${req.url}:`);
          console.error('   Message:', error.message);
          console.error('   Stack:', error.stack);
          
          if (!vercelRes.headersSent) {
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: 'Internal Server Error',
              message: error.message,
              code: 'FUNCTION_INVOCATION_FAILED'
            }));
          }
        }
      });
    });

    const PORT = process.env.PORT || 3000;
    server.listen(PORT, () => {
      console.log(`✅ Serveur démarré sur http://localhost:${PORT}`);
      console.log('');
    });

    // Gérer l'arrêt propre
    process.on('SIGINT', () => {
      console.log('\n\n🛑 Arrêt du serveur...');
      server.close(() => {
        console.log('✅ Serveur arrêté');
        process.exit(0);
      });
    });

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

