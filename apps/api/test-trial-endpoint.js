const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testTrialEndpoint() {
  try {
    console.log('🔍 Test de l\'endpoint des comptes gratuits...');
    
    // Trouver l'utilisateur avec l'ID 4 (Kacou)
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

    console.log('✅ Utilisateur trouvé:', user.email);
    
    if (!user.compteGratuit) {
      console.log('❌ Aucun compte gratuit trouvé pour cet utilisateur');
      return;
    }

    const compteGratuit = user.compteGratuit;
    console.log('📊 Informations du compte gratuit:');
    console.log('   - ID:', compteGratuit.id);
    console.log('   - Date début:', compteGratuit.dateDebut);
    console.log('   - Date fin:', compteGratuit.dateFin);
    console.log('   - Actif:', compteGratuit.isActive);

    // Calculer les jours restants comme dans le service
    const now = new Date();
    const daysRemaining = Math.ceil((compteGratuit.dateFin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    const isExpired = now > compteGratuit.dateFin;

    console.log('\n🧮 Calcul des jours restants:');
    console.log('   - Maintenant:', now);
    console.log('   - Date fin:', compteGratuit.dateFin);
    console.log('   - Différence (ms):', compteGratuit.dateFin.getTime() - now.getTime());
    console.log('   - Différence (heures):', (compteGratuit.dateFin.getTime() - now.getTime()) / (1000 * 60 * 60));
    console.log('   - Jours restants:', daysRemaining);
    console.log('   - Expiré:', isExpired);

    // Test avec différentes méthodes de calcul
    console.log('\n🔬 Tests alternatifs:');
    
    // Méthode 1: Calcul direct
    const diffMs = compteGratuit.dateFin.getTime() - now.getTime();
    const diffDays1 = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    console.log('   - Méthode 1 (ceil):', diffDays1);
    
    // Méthode 2: Math.floor
    const diffDays2 = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    console.log('   - Méthode 2 (floor):', diffDays2);
    
    // Méthode 3: Math.round
    const diffDays3 = Math.round(diffMs / (1000 * 60 * 60 * 24));
    console.log('   - Méthode 3 (round):', diffDays3);

    // Test avec dates UTC
    const nowUTC = new Date(now.toISOString());
    const dateFinUTC = new Date(compteGratuit.dateFin.toISOString());
    const diffDaysUTC = Math.ceil((dateFinUTC.getTime() - nowUTC.getTime()) / (1000 * 60 * 60 * 24));
    console.log('   - Méthode UTC:', diffDaysUTC);

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testTrialEndpoint();
