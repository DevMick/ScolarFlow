// Script pour déboguer le calcul des jours restants
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function debugDaysCalculation() {
  try {
    console.log('🔍 Débogage du calcul des jours restants...');
    
    // Récupérer le compte gratuit de l'utilisateur ID 4
    const compteGratuit = await prisma.compteGratuit.findUnique({
      where: { userId: 4 }
    });

    if (!compteGratuit) {
      console.log('❌ Aucun compte gratuit trouvé pour l\'utilisateur ID 4');
      return;
    }

    console.log('📊 Données du compte gratuit:');
    console.log('   - ID:', compteGratuit.id);
    console.log('   - Date début:', compteGratuit.dateDebut);
    console.log('   - Date fin:', compteGratuit.dateFin);
    console.log('   - Actif:', compteGratuit.isActive);

    // Calculer les jours restants comme dans le service
    const now = new Date();
    const dateFin = new Date(compteGratuit.dateFin);
    
    console.log('\n🧮 Calcul détaillé:');
    console.log('   - Maintenant:', now);
    console.log('   - Date fin:', dateFin);
    console.log('   - Différence (ms):', dateFin.getTime() - now.getTime());
    console.log('   - Différence (heures):', (dateFin.getTime() - now.getTime()) / (1000 * 60 * 60));
    console.log('   - Différence (jours):', (dateFin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    // Méthode 1: Math.ceil (comme dans le service)
    const daysRemaining1 = Math.ceil((dateFin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    console.log('   - Math.ceil:', daysRemaining1);
    
    // Méthode 2: Math.floor
    const daysRemaining2 = Math.floor((dateFin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    console.log('   - Math.floor:', daysRemaining2);
    
    // Méthode 3: Math.round
    const daysRemaining3 = Math.round((dateFin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    console.log('   - Math.round:', daysRemaining3);
    
    // Méthode 4: Calcul avec Math.max(0, ...)
    const daysRemaining4 = Math.max(0, Math.ceil((dateFin.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    console.log('   - Math.max(0, ceil):', daysRemaining4);
    
    // Vérifier si expiré
    const isExpired = now > dateFin;
    console.log('   - Expiré:', isExpired);
    
    // Test avec différentes dates
    console.log('\n🧪 Tests avec différentes dates:');
    
    // Date d'aujourd'hui
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    console.log('   - Aujourd\'hui (00:00):', today);
    
    // Date de fin à minuit
    const dateFinMidnight = new Date(dateFin);
    dateFinMidnight.setHours(0, 0, 0, 0);
    console.log('   - Date fin (00:00):', dateFinMidnight);
    
    const daysToMidnight = Math.ceil((dateFinMidnight.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    console.log('   - Jours jusqu\'à minuit:', daysToMidnight);

  } catch (error) {
    console.error('❌ Erreur lors du débogage:', error);
  } finally {
    await prisma.$disconnect();
  }
}

debugDaysCalculation();
