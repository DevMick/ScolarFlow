// Script de test pour vérifier la méthode getAllPayments
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function testGetAllPayments() {
  try {
    console.log('🔍 Test de la méthode getAllPayments...\n');

    // Test 1: Vérifier si la table paiement existe
    console.log('1. Vérification de la table paiement...');
    const tableExists = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'paiement'
      );
    `;
    console.log('Table paiement existe:', tableExists[0].exists);

    // Test 2: Compter les paiements
    console.log('\n2. Comptage des paiements...');
    const count = await prisma.paiement.count();
    console.log('Nombre de paiements:', count);

    // Test 3: Récupérer tous les paiements
    console.log('\n3. Récupération de tous les paiements...');
    const payments = await prisma.paiement.findMany({
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log('Paiements trouvés:', payments.length);
    console.log('Premier paiement:', payments[0] || 'Aucun paiement');

    // Test 4: Test avec validatedOnly = false
    console.log('\n4. Test avec validatedOnly = false...');
    const whereClause = { isPaid: false };
    const pendingPayments = await prisma.paiement.findMany({
      where: whereClause,
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });
    console.log('Paiements en attente:', pendingPayments.length);

    console.log('\n✅ Test terminé avec succès!');

  } catch (error) {
    console.error('❌ Erreur lors du test:', error);
  } finally {
    await prisma.$disconnect();
  }
}

testGetAllPayments();
