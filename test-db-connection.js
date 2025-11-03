#!/usr/bin/env node

/**
 * Script pour tester la connexion à la base de données
 */

const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient({
  log: ['query', 'error', 'warn']
});

async function testConnection() {
  try {
    console.log('🔍 Test de connexion à la base de données...\n');
    
    // Test 1: Vérifier la connexion
    console.log('1️⃣  Vérification de la connexion...');
    await prisma.$queryRaw`SELECT 1`;
    console.log('✅ Connexion réussie\n');
    
    // Test 2: Vérifier si la table CompteGratuit existe
    console.log('2️⃣  Vérification de la table compte_gratuit...');
    const result = await prisma.$queryRaw`
      SELECT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_name = 'compte_gratuit'
      );
    `;
    console.log('Résultat:', result);
    
    if (result[0].exists) {
      console.log('✅ Table compte_gratuit existe\n');
      
      // Test 3: Compter les enregistrements
      console.log('3️⃣  Comptage des enregistrements...');
      const count = await prisma.compteGratuit.count();
      console.log(`✅ ${count} enregistrement(s) trouvé(s)\n`);
      
      // Test 4: Afficher les colonnes
      console.log('4️⃣  Colonnes de la table...');
      const columns = await prisma.$queryRaw`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'compte_gratuit'
        ORDER BY ordinal_position;
      `;
      console.log('Colonnes:');
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type}`);
      });
    } else {
      console.log('❌ Table compte_gratuit n\'existe pas\n');
    }
    
    // Test 5: Vérifier les utilisateurs
    console.log('\n5️⃣  Vérification des utilisateurs...');
    const userCount = await prisma.user.count();
    console.log(`✅ ${userCount} utilisateur(s) trouvé(s)`);
    
    if (userCount > 0) {
      const users = await prisma.user.findMany({
        select: { id: true, email: true },
        take: 3
      });
      console.log('Premiers utilisateurs:');
      users.forEach(user => {
        console.log(`  - ID: ${user.id}, Email: ${user.email}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    if (error.code) {
      console.error('Code d\'erreur:', error.code);
    }
  } finally {
    await prisma.$disconnect();
  }
}

testConnection();

