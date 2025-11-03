const axios = require('axios');

// Configuration
const API_URL = 'http://localhost:3001/api';

// Données de test - simuler la création de moyennes
const moyennes = [
  {
    studentId: 4,
    evaluationId: 1,
    moyenne: 12.00,
    date: '2025-10-17'
  },
  {
    studentId: 5,
    evaluationId: 1,
    moyenne: 13.00,
    date: '2025-10-17'
  },
  {
    studentId: 6,
    evaluationId: 1,
    moyenne: 12.25,
    date: '2025-10-17'
  },
  {
    studentId: 7,
    evaluationId: 1,
    moyenne: 13.00,
    date: '2025-10-17'
  }
];

async function testMoyennesAPI() {
  console.log('🧪 Test de l\'API /moyennes/bulk...\n');
  
  // D'abord, on doit se connecter pour obtenir un token
  try {
    console.log('1️⃣ Connexion à l\'API...');
    const loginResponse = await axios.post(`${API_URL}/auth/login`, {
      email: 'admin@test.com', // Modifier avec un email valide
      password: 'password123'    // Modifier avec le bon mot de passe
    });
    
    if (!loginResponse.data.success) {
      console.error('❌ Échec de connexion:', loginResponse.data);
      return;
    }
    
    const token = loginResponse.data.token;
    console.log('✅ Connexion réussie, token obtenu\n');
    
    // Test de l'endpoint /moyennes/bulk
    console.log('2️⃣ Envoi des moyennes à l\'API...');
    console.log('   URL:', `${API_URL}/moyennes/bulk`);
    console.log('   Données:', JSON.stringify(moyennes, null, 2));
    
    const response = await axios.post(
      `${API_URL}/moyennes/bulk`,
      moyennes,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      }
    );
    
    console.log('\n✅ Réponse de l\'API:');
    console.log(JSON.stringify(response.data, null, 2));
    
    if (response.data.success) {
      console.log(`\n🎉 ${response.data.data.saved} moyenne(s) enregistrée(s) avec succès!`);
      if (response.data.data.errors && response.data.data.errors.length > 0) {
        console.log(`⚠️  ${response.data.data.errors.length} erreur(s):`);
        response.data.data.errors.forEach((error, index) => {
          console.log(`   ${index + 1}. Élève ID ${error.studentId}: ${error.error}`);
        });
      }
    } else {
      console.log('\n❌ Échec de l\'enregistrement');
    }
    
  } catch (error) {
    console.error('\n❌ Erreur lors du test:');
    
    if (error.response) {
      // Erreur de réponse HTTP
      console.error('Status:', error.response.status);
      console.error('Données:', JSON.stringify(error.response.data, null, 2));
      console.error('Headers:', error.response.headers);
    } else if (error.request) {
      // Pas de réponse reçue
      console.error('Aucune réponse reçue:', error.message);
    } else {
      // Autre erreur
      console.error('Erreur:', error.message);
    }
  }
}

// Vérifier si axios est disponible
if (typeof axios === 'undefined') {
  console.error('❌ axios n\'est pas installé. Installez-le avec: npm install axios');
} else {
  testMoyennesAPI();
}

