#!/usr/bin/env node

/**
 * Script de test complet pour les endpoints de l'API
 * Teste les endpoints /api/compte-gratuit/info et /api/school-years
 */

const axios = require('axios');

const API_URL = process.env.API_URL || 'http://localhost:3001/api';
const EMAIL = process.env.EMAIL || 'mickael.andjui.12@gmail.com';
const PASSWORD = process.env.PASSWORD || 'password123';

let authToken = null;
let testResults = [];

// Couleurs pour le terminal
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  gray: '\x1b[90m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function addTestResult(name, success, message) {
  testResults.push({ name, success, message });
  const icon = success ? '✅' : '❌';
  const color = success ? 'green' : 'red';
  log(`${icon} ${name}`, color);
  log(`   ${message}`, 'gray');
}

async function testHealthCheck() {
  log('\n📋 Test 1: Health Check', 'yellow');
  try {
    const response = await axios.get(`${API_URL}/health`);
    if (response.status === 200) {
      addTestResult('Health Check', true, `API est en ligne - Status: ${response.data.status}`);
      return true;
    }
  } catch (error) {
    addTestResult('Health Check', false, `Erreur: ${error.message}`);
    return false;
  }
}

async function testLogin() {
  log('\n📋 Test 2: Authentification', 'yellow');
  try {
    const response = await axios.post(`${API_URL}/auth/login`, {
      email: EMAIL,
      password: PASSWORD
    });
    
    if (response.status === 200 && response.data.token) {
      authToken = response.data.token;
      addTestResult('Login', true, 'Authentification réussie - Token obtenu');
      return true;
    }
  } catch (error) {
    addTestResult('Login', false, `Erreur: ${error.response?.data?.message || error.message}`);
    return false;
  }
}

async function testCompteGratuitInfo() {
  log('\n📋 Test 3: GET /api/compte-gratuit/info', 'yellow');
  try {
    const response = await axios.get(`${API_URL}/compte-gratuit/info`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status === 200) {
      addTestResult('GET /api/compte-gratuit/info', true, 'Réponse reçue avec succès');
      log(`   Données: ${JSON.stringify(response.data, null, 2)}`, 'gray');
      return true;
    }
  } catch (error) {
    if (error.response?.status === 404) {
      addTestResult('GET /api/compte-gratuit/info', true, '404 - Aucun compte gratuit trouvé (attendu)');
      return true;
    } else {
      const message = error.response?.data?.message || error.message;
      addTestResult('GET /api/compte-gratuit/info', false, `Erreur: ${message} (Code: ${error.response?.status})`);
      if (error.response?.data) {
        log(`   Détails: ${JSON.stringify(error.response.data, null, 2)}`, 'gray');
      }
      return false;
    }
  }
}

async function testSchoolYears() {
  log('\n📋 Test 4: GET /api/school-years', 'yellow');
  try {
    const response = await axios.get(`${API_URL}/school-years`, {
      headers: {
        'Authorization': `Bearer ${authToken}`
      }
    });
    
    if (response.status === 200) {
      const count = response.data.schoolYears?.length || 0;
      addTestResult('GET /api/school-years', true, 'Réponse reçue avec succès');
      log(`   Nombre d'années scolaires: ${count}`, 'gray');
      return true;
    }
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    addTestResult('GET /api/school-years', false, `Erreur: ${message} (Code: ${error.response?.status})`);
    if (error.response?.data) {
      log(`   Détails: ${JSON.stringify(error.response.data, null, 2)}`, 'gray');
    }
    return false;
  }
}

async function runTests() {
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║         TEST COMPLET DES ENDPOINTS DE L\'API               ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  // Test health
  const healthOk = await testHealthCheck();
  if (!healthOk) {
    log('\n⚠️  API non accessible. Arrêt des tests.', 'yellow');
    process.exit(1);
  }
  
  // Test login
  const loginOk = await testLogin();
  if (!loginOk) {
    log('\n⚠️  Impossible de se connecter. Arrêt des tests.', 'yellow');
    process.exit(1);
  }
  
  // Test endpoints
  await testCompteGratuitInfo();
  await testSchoolYears();
  
  // Résumé
  log('\n╔════════════════════════════════════════════════════════════╗', 'cyan');
  log('║                    RÉSUMÉ DES TESTS                        ║', 'cyan');
  log('╚════════════════════════════════════════════════════════════╝', 'cyan');
  
  const successCount = testResults.filter(r => r.success).length;
  const totalCount = testResults.length;
  
  log(`\nRésultats: ${successCount}/${totalCount} tests réussis`, successCount === totalCount ? 'green' : 'yellow');
  
  testResults.forEach(result => {
    const status = result.success ? '✅' : '❌';
    const color = result.success ? 'green' : 'red';
    log(`${status} ${result.name}: ${result.message}`, color);
  });
  
  if (successCount === totalCount) {
    log('\n🎉 Tous les tests sont passés!', 'green');
    process.exit(0);
  } else {
    log('\n⚠️  Certains tests ont échoué', 'yellow');
    process.exit(1);
  }
}

// Attendre que le serveur soit prêt
setTimeout(runTests, 2000);

