const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testEndpointWithAuth() {
  try {
    console.log('🔍 Test de l\'endpoint avec authentification...');
    
    // Créer un token valide pour l'utilisateur ID 4
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
    const token = jwt.sign(
      { 
        id: 4, 
        email: 'mickael.andjui.12@gmail.com',
        firstName: 'Kacou',
        lastName: 'Mariam'
      },
      JWT_SECRET,
      { 
        expiresIn: '24h',
        issuer: 'edustats',
        audience: 'edustats-users'
      }
    );

    console.log('🔑 Token créé:', token.substring(0, 50) + '...');

    // Tester l'endpoint avec curl
    const { exec } = require('child_process');
    const curlCommand = `curl -H "Authorization: Bearer ${token}" http://localhost:3001/api/compte-gratuit/info`;
    
    console.log('\n🧪 Commande curl:');
    console.log(curlCommand);
    
    exec(curlCommand, (error, stdout, stderr) => {
      if (error) {
        console.error('❌ Erreur curl:', error);
        return;
      }
      
      console.log('\n📊 Réponse de l\'API:');
      console.log(stdout);
      
      if (stderr) {
        console.log('\n⚠️ Erreurs:');
        console.log(stderr);
      }
    });

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testEndpointWithAuth();
