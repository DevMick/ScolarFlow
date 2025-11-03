// Script pour configurer l'administrateur par défaut
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function setupAdmin() {
  console.log('🔧 Configuration de l\'administrateur par défaut...\n');

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
      return;
    }

    // Hasher le mot de passe
    console.log('🔐 Hachage du mot de passe...');
    const hashedPassword = await bcrypt.hash('DevMick@2003', 12);

    // Créer l'administrateur
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

  } catch (error) {
    console.error('❌ Erreur lors de la configuration:', error.message);
    
    if (error.code === 'P2002') {
      console.log('💡 L\'administrateur existe peut-être déjà');
    }
    
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

setupAdmin();
