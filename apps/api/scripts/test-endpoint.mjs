// Script de test rapide pour vérifier un endpoint
import http from 'http';

const PORT = process.env.PORT || 3000;
const ENDPOINT = process.env.ENDPOINT || '/api/health';

console.log(`🧪 Test de l'endpoint: http://localhost:${PORT}${ENDPOINT}\n`);

const req = http.request({
  hostname: 'localhost',
  port: PORT,
  path: ENDPOINT,
  method: 'GET',
  headers: {
    'Content-Type': 'application/json'
  }
}, (res) => {
  console.log(`📊 Status: ${res.statusCode}`);
  console.log(`📋 Headers:`, res.headers);
  console.log('');

  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });

  res.on('end', () => {
    console.log('📦 Response:');
    try {
      const json = JSON.parse(data);
      console.log(JSON.stringify(json, null, 2));
    } catch {
      console.log(data);
    }
    console.log('');
    
    if (res.statusCode === 200) {
      console.log('✅ Test réussi!');
      process.exit(0);
    } else {
      console.log('❌ Test échoué (status code non 200)');
      process.exit(1);
    }
  });
});

req.on('error', (error) => {
  console.error('❌ Erreur lors de la requête:');
  console.error('   Message:', error.message);
  console.error('   Code:', error.code);
  console.error('');
  console.error('💡 Assurez-vous que le serveur est démarré avec: pnpm test:production');
  process.exit(1);
});

req.setTimeout(5000, () => {
  console.error('❌ Timeout: Le serveur ne répond pas');
  console.error('💡 Assurez-vous que le serveur est démarré avec: pnpm test:production');
  req.destroy();
  process.exit(1);
});

req.end();

