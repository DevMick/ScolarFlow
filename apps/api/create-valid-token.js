const jwt = require('jsonwebtoken');

// Utiliser la même clé secrète que l'API
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

// Créer un token pour l'utilisateur ID 4
const payload = {
  id: 4,
  email: 'mickael.andjui.12@gmail.com',
  firstName: 'Kacou',
  lastName: 'Mariam'
};

const token = jwt.sign(payload, JWT_SECRET, { 
  expiresIn: '24h',
  issuer: 'edustats',
  audience: 'edustats-users'
});

console.log('🔑 Token JWT valide créé:');
console.log(token);

console.log('\n🧪 Pour tester l\'endpoint:');
console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3001/api/compte-gratuit/info`);

// Vérifier le token
try {
  const decoded = jwt.verify(token, JWT_SECRET);
  console.log('\n✅ Token décodé avec succès:');
  console.log(decoded);
} catch (error) {
  console.log('\n❌ Erreur lors de la vérification du token:', error.message);
}
