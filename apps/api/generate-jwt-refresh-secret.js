#!/usr/bin/env node
/**
 * Script pour générer un JWT_REFRESH_SECRET sécurisé
 * Utilise crypto.randomBytes pour générer une clé aléatoire de 64 bytes (128 caractères en hex)
 */

import crypto from 'crypto';

// Générer un secret de 64 bytes (512 bits) = 128 caractères en hex
const jwtRefreshSecret = crypto.randomBytes(64).toString('hex');

console.log('\n========================================');
console.log('🔐 JWT_REFRESH_SECRET généré avec succès');
console.log('========================================\n');
console.log('Voici votre JWT_REFRESH_SECRET sécurisé :\n');
console.log(jwtRefreshSecret);
console.log('\n========================================');
console.log('📋 Instructions pour Vercel :');
console.log('========================================');
console.log('1. Allez sur https://vercel.com');
console.log('2. Sélectionnez votre projet API');
console.log('3. Allez dans Settings → Environment Variables');
console.log('4. Cliquez sur "Add New"');
console.log('5. Nom : JWT_REFRESH_SECRET');
console.log('6. Valeur : copiez la valeur ci-dessus');
console.log('7. Environnements : Production, Preview, Development');
console.log('8. Cliquez sur "Save"');
console.log('\n⚠️  IMPORTANT : Gardez ce secret en sécurité !');
console.log('   Ne le partagez jamais publiquement.');
console.log('   Il doit être DIFFÉRENT de votre JWT_SECRET.\n');

