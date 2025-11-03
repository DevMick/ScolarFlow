// Script Node.js pour exécuter la migration de la colonne screenshot_type
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function runMigration() {
  console.log('🔄 Exécution de la migration pour ajouter la colonne screenshot_type...\n');

  try {
    // Vérifier si la colonne existe déjà
    const checkColumn = await prisma.$queryRaw`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'paiements' 
      AND column_name = 'screenshot_type'
    `;

    if (checkColumn.length > 0) {
      console.log('✅ La colonne screenshot_type existe déjà dans la table paiements');
    } else {
      console.log('❌ La colonne screenshot_type n\'existe pas, ajout en cours...\n');

      // Ajouter la colonne screenshot_type
      await prisma.$executeRaw`
        ALTER TABLE paiements ADD COLUMN screenshot_type VARCHAR(50)
      `;

      console.log('✅ Colonne screenshot_type ajoutée avec succès!\n');
    }

    // Afficher la structure de la table
    console.log('📋 Structure actuelle de la table paiements:');
    const columns = await prisma.$queryRaw`
      SELECT 
        column_name, 
        data_type, 
        is_nullable,
        column_default
      FROM information_schema.columns 
      WHERE table_name = 'paiements' 
      ORDER BY ordinal_position
    `;

    console.table(columns);

    console.log('\n✅ Migration terminée avec succès!');
    console.log('Vous pouvez maintenant tester l\'upload d\'images sur la page de paiement.\n');

  } catch (error) {
    console.error('❌ Erreur lors de la migration:', error.message);
    console.error('\n💡 Solutions possibles:');
    console.error('   1. Vérifiez que PostgreSQL est en cours d\'exécution');
    console.error('   2. Vérifiez les paramètres de connexion dans .env');
    console.error('   3. Exécutez manuellement dans pgAdmin:');
    console.error('      ALTER TABLE paiements ADD COLUMN screenshot_type VARCHAR(50);');
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();
