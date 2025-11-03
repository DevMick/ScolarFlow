#!/usr/bin/env node

/**
 * Script de test pour déboguer les erreurs 500
 * Teste les endpoints /api/compte-gratuit/info et /api/school-years
 */

const axios = require('axios');

const API_URL = 'http://localhost:3001/api';

// Token de test (à remplacer par un vrai token)
let authToken = null;

async function login() {
  try {
    console.log('\n📝 Tentative de connexion...');
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: 'test@example.com',
      password: 'password123'
    });
    
    authToken = response.data.token;
    console.log('✅ Connexion réussie');
    console.log('Token:', authToken.substring(0, 20) + '...');
    return true;
  } catch (error) {
    console.error('❌ Erreur de connexion:', error.response?.data || error.message);
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
    
    console.log('✅ Succès:', response.data);
  } catch (error) {
    console.error('❌ Erreur:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Détails:', JSON.stringify(error.response.data, null, 2));
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
    
    console.log('✅ Succès:', response.data);
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
  console.log('🚀 Démarrage des tests...');
  
  // Test health
  await testHealth();
  
  // Login
  const loggedIn = await login();
  if (!loggedIn) {
    console.log('\n⚠️  Impossible de se connecter. Arrêt des tests.');
    process.exit(1);
  }
  
  // Tests
  await testCompteGratuitInfo();
  await testSchoolYears();
  
  console.log('\n✅ Tests terminés');
}

runTests().catch(console.error);

