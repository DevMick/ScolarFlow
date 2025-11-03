// Script pour créer l'administrateur DevMick directement
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

async function createAdminDirect() {
  console.log('🔧 Création de l\'administrateur DevMick...\n');

  try {
    // Vérifier si l'admin existe déjà
    const existingAdmin = await prisma.admin.findUnique({
      where: { username: 'DevMick' }
    });

    if (existingAdmin) {
      console.log('✅ L\'administrateur DevMick existe déjà');
      console.log('   ID:', existingAdmin.id);
      console.log('   Nom d\'utilisateur:', existingAdmin.username);
      console.log('   Actif:', existingAdmin.isActive);
      console.log('   Créé le:', existingAdmin.createdAt);
      return;
    }

    // Créer l'administrateur avec le mot de passe hashé
    // Le hash bcrypt pour 'DevMick@2003' avec salt rounds 12
    const hashedPassword = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewdBPj4J7Kz9Kz2C';
    
    console.log('👤 Création de l\'administrateur...');
    const admin = await prisma.admin.create({
      data: {
        username: 'DevMick',
        password: hashedPassword,
        isActive: true
      }
    });

    console.log('✅ Administrateur créé avec succès!');
    console.log('   ID:', admin.id);
    console.log('   Nom d\'utilisateur:', admin.username);
    console.log('   Actif:', admin.isActive);
    console.log('   Créé le:', admin.createdAt);

    console.log('\n📋 Informations de connexion:');
    console.log('   URL: http://localhost:3000/admin/login');
    console.log('   Nom d\'utilisateur: DevMick');
    console.log('   Mot de passe: DevMick@2003');

    console.log('\n🎉 L\'administrateur est maintenant prêt à être utilisé!');

  } catch (error) {
    console.error('❌ Erreur lors de la création:', error.message);
    
    if (error.code === 'P2002') {
      console.log('💡 L\'administrateur existe peut-être déjà');
    }
    
    console.error('Détails de l\'erreur:', error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

createAdminDirect();
