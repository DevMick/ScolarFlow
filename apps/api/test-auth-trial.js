const { PrismaClient } = require('@prisma/client');
const jwt = require('jsonwebtoken');

const prisma = new PrismaClient();

async function testAuthTrial() {
  try {
    console.log('🔍 Test de l\'authentification et du compte gratuit...');
    
    // Trouver l'utilisateur avec l'ID 4
    const user = await prisma.user.findUnique({
      where: { id: 4 },
      include: {
        compteGratuit: true
      }
    });

    if (!user) {
      console.log('❌ Utilisateur avec ID 4 non trouvé');
      return;
    }

    console.log('✅ Utilisateur trouvé:', {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName
    });

    if (!user.compteGratuit) {
      console.log('❌ Aucun compte gratuit trouvé pour cet utilisateur');
      console.log('🔧 Création d\'un compte gratuit...');
      
      const dateDebut = new Date();
      const dateFin = new Date();
      dateFin.setDate(dateFin.getDate() + 14); // 14 jours

      const compteGratuit = await prisma.compteGratuit.create({
        data: {
          userId: user.id,
          dateDebut,
          dateFin,
          isActive: true
        }
      });

      console.log('✅ Compte gratuit créé:', {
        id: compteGratuit.id,
        dateDebut: compteGratuit.dateDebut,
        dateFin: compteGratuit.dateFin,
        isActive: compteGratuit.isActive
      });
    } else {
      console.log('✅ Compte gratuit existant:', {
        id: user.compteGratuit.id,
        dateDebut: user.compteGratuit.dateDebut,
        dateFin: user.compteGratuit.dateFin,
        isActive: user.compteGratuit.isActive
      });
    }

    // Créer un token JWT pour tester l'endpoint
    const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';
    const token = jwt.sign(
      { 
        id: user.id, 
        email: user.email 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    console.log('\n🔑 Token JWT créé pour les tests');
    console.log('Token:', token.substring(0, 50) + '...');

    // Test de l'endpoint avec curl ou fetch
    console.log('\n🧪 Pour tester l\'endpoint, utilisez:');
    console.log(`curl -H "Authorization: Bearer ${token}" http://localhost:3001/api/compte-gratuit/info`);

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testAuthTrial();
