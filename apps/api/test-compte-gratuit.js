const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createTestTrialAccount() {
  try {
    console.log('🔧 Création d\'un compte gratuit de test...');
    
    // Créer un utilisateur de test s'il n'existe pas
    const testUser = await prisma.user.upsert({
      where: { email: 'test-trial@example.com' },
      update: {},
      create: {
        email: 'test-trial@example.com',
        passwordHash: 'test-hash',
        firstName: 'Test',
        lastName: 'Trial',
        directionRegionale: 'Test Region',
        secteurPedagogique: 'Test Sector',
        isActive: true
      }
    });

    console.log('✅ Utilisateur de test créé/trouvé:', testUser.email);

    // Créer un compte gratuit qui expire dans 3 jours
    const dateDebut = new Date();
    const dateFin = new Date();
    dateFin.setDate(dateFin.getDate() + 3); // Expire dans 3 jours

    const compteGratuit = await prisma.compteGratuit.upsert({
      where: { userId: testUser.id },
      update: {
        dateDebut,
        dateFin,
        isActive: true
      },
      create: {
        userId: testUser.id,
        dateDebut,
        dateFin,
        isActive: true
      }
    });

    console.log('✅ Compte gratuit créé:');
    console.log(`   - Date de début: ${compteGratuit.dateDebut}`);
    console.log(`   - Date de fin: ${compteGratuit.dateFin}`);
    console.log(`   - Actif: ${compteGratuit.isActive}`);
    
    // Calculer les jours restants
    const now = new Date();
    const daysRemaining = Math.ceil((compteGratuit.dateFin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    console.log(`   - Jours restants: ${daysRemaining}`);

    // Créer aussi un compte expiré pour tester
    const expiredUser = await prisma.user.upsert({
      where: { email: 'test-expired@example.com' },
      update: {},
      create: {
        email: 'test-expired@example.com',
        passwordHash: 'test-hash',
        firstName: 'Test',
        lastName: 'Expired',
        directionRegionale: 'Test Region',
        secteurPedagogique: 'Test Sector',
        isActive: true
      }
    });

    const expiredDateFin = new Date();
    expiredDateFin.setDate(expiredDateFin.getDate() - 1); // Expiré hier

    const expiredCompte = await prisma.compteGratuit.upsert({
      where: { userId: expiredUser.id },
      update: {
        dateDebut: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000), // Il y a 15 jours
        dateFin: expiredDateFin,
        isActive: false
      },
      create: {
        userId: expiredUser.id,
        dateDebut: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000),
        dateFin: expiredDateFin,
        isActive: false
      }
    });

    console.log('✅ Compte expiré créé:', expiredUser.email);
    console.log(`   - Date de fin: ${expiredCompte.dateFin}`);
    console.log(`   - Actif: ${expiredCompte.isActive}`);

    console.log('\n🎯 Comptes de test créés:');
    console.log('   - test-trial@example.com (expire dans 3 jours)');
    console.log('   - test-expired@example.com (expiré)');
    console.log('\n💡 Vous pouvez maintenant tester la fonctionnalité avec ces comptes.');

  } catch (error) {
    console.error('❌ Erreur lors de la création des comptes de test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

createTestTrialAccount();
