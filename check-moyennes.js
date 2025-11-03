const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function checkMoyennes() {
  try {
    console.log('🔍 Vérification des moyennes dans la base de données...\n');
    
    // Compter le nombre total de moyennes
    const totalMoyennes = await prisma.moyenne.count();
    console.log(`📊 Nombre total de moyennes: ${totalMoyennes}`);
    
    // Récupérer les 10 dernières moyennes
    const recentMoyennes = await prisma.moyenne.findMany({
      orderBy: { createdAt: 'desc' },
      take: 10,
      include: {
        student: {
          select: {
            name: true,
            studentNumber: true
          }
        },
        evaluation: {
          select: {
            nom: true,
            date: true
          }
        }
      }
    });
    
    console.log('\n📝 Les 10 dernières moyennes:');
    console.log('═'.repeat(80));
    
    if (recentMoyennes.length === 0) {
      console.log('⚠️  Aucune moyenne trouvée dans la base de données!');
    } else {
      recentMoyennes.forEach((moyenne, index) => {
        console.log(`\n${index + 1}. Élève: ${moyenne.student.name} (${moyenne.student.studentNumber || 'N/A'})`);
        console.log(`   Évaluation: ${moyenne.evaluation.nom} (${moyenne.evaluation.date.toISOString().split('T')[0]})`);
        console.log(`   Moyenne: ${moyenne.moyenne}`);
        console.log(`   Date calcul: ${moyenne.date.toISOString().split('T')[0]}`);
        console.log(`   Créé le: ${moyenne.createdAt.toISOString()}`);
      });
    }
    
    // Vérifier s'il y a des notes sans moyennes
    const totalNotes = await prisma.note.count({
      where: { isActive: true }
    });
    
    const totalEvaluations = await prisma.evaluation.count();
    
    console.log('\n\n📈 Statistiques générales:');
    console.log('═'.repeat(80));
    console.log(`Total de notes: ${totalNotes}`);
    console.log(`Total d'évaluations: ${totalEvaluations}`);
    console.log(`Total de moyennes: ${totalMoyennes}`);
    
    if (totalEvaluations > 0 && totalMoyennes === 0) {
      console.log('\n⚠️  PROBLÈME: Il y a des évaluations mais aucune moyenne n\'a été calculée!');
    } else if (totalMoyennes < totalEvaluations) {
      console.log(`\n⚠️  ATTENTION: Certaines évaluations n'ont pas de moyennes (${totalEvaluations - totalMoyennes} manquantes)`);
    } else {
      console.log('\n✅ Tout semble normal.');
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error);
  } finally {
    await prisma.$disconnect();
  }
}

checkMoyennes();

