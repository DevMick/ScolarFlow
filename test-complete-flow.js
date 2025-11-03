#!/usr/bin/env node

/**
 * Script de test complet pour les endpoints
 * 1. Crée un utilisateur de test
 * 2. Crée un compte gratuit
 * 3. Teste les endpoints
 */

const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

let authToken = null;
let userId = null;

const testUser = {
  email: `test-${Date.now()}@example.com`,
  password: 'TestPassword123!',
  firstName: 'Test',
  lastName: 'User',
  directionRegionale: 'Test Region',
  secteurPedagogique: 'Test Sector'
};

async function register() {
  try {
    console.log('\n📝 Enregistrement d\'un nouvel utilisateur...');
    console.log('Email:', testUser.email);
    
    const response = await axios.post(`${API_URL}/auth/register`, testUser);
    
    authToken = response.data.token;
    userId = response.data.user.id;
    
    console.log('✅ Enregistrement réussi');
    console.log('User ID:', userId);
    console.log('Token:', authToken.substring(0, 20) + '...');
    return true;
  } catch (error) {
    console.error('❌ Erreur d\'enregistrement:', error.response?.data || error.message);
    return false;
  }
}

async function createCompteGratuit() {
  try {
    console.log('\n📝 Création d\'un compte gratuit...');
    
    // Créer directement dans la base de données via une requête POST
    // (si un endpoint existe) ou via une migration
    
    // Pour l'instant, on va juste tester si l'endpoint retourne une erreur appropriée
    console.log('⏭️  Skipping compte gratuit creation (à faire via migration)');
    return true;
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    return false;
  }
}

async function testCompteGratuitInfo() {
  try {
    console.log('\n🧪 Test: GET /api/compte-gratuit/info');
    const response = await axios.get(`${API_URL}/compte-gratuit/info`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Succès:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    if (error.response?.status === 404) {
      console.log('⚠️  404 - Aucun compte gratuit trouvé (attendu)');
    } else {
      console.error('❌ Erreur:', error.response?.data || error.message);
      if (error.response?.data) {
        console.error('Détails:', JSON.stringify(error.response.data, null, 2));
      }
    }
  }
}

async function testSchoolYears() {
  try {
    console.log('\n🧪 Test: GET /api/school-years');
    const response = await axios.get(`${API_URL}/school-years`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    console.log('✅ Succès:', JSON.stringify(response.data, null, 2));
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Détails:', JSON.stringify(error.response.data, null, 2));
    }
  }
}

async function testHealth() {
  try {
    console.log('\n🧪 Test: GET /api/health');
    const response = await axios.get(`${API_URL}/health`);
    console.log('✅ Succès:', response.data);
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  }
}

async function runTests() {
  console.log('🚀 Démarrage des tests complets...');
  
  // Test health
  await testHealth();
  
  // Register
  const registered = await register();
  if (!registered) {
    console.log('\n⚠️  Impossible de s\'enregistrer. Arrêt des tests.');
    process.exit(1);
  }
  
  // Create compte gratuit
  await createCompteGratuit();
  
  // Tests
  await testCompteGratuitInfo();
  await testSchoolYears();
  
  console.log('\n✅ Tests terminés');
}

// Attendre que le serveur soit prêt
setTimeout(runTests, 2000);

