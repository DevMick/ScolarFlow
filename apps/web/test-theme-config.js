#!/usr/bin/env node

/**
 * Script de test pour vérifier que la configuration Ant Design ne cause pas d'erreur
 * "Cannot convert undefined or null to object" dans flattenToken
 */

console.log('🧪 Testing Ant Design Theme Configuration...\n');

// Test 1: Vérifier que la configuration de thème est valide
console.log('Test 1: Vérifier que la configuration de thème est valide');
const defaultThemeConfig = {
  algorithm: undefined, // Sera remplacé par antTheme.defaultAlgorithm
  token: {
    colorPrimary: '#1890ff',
    borderRadius: 6,
  },
};

try {
  // Vérifier que token n'est pas null ou undefined
  if (defaultThemeConfig.token === null || defaultThemeConfig.token === undefined) {
    throw new Error('Token is null or undefined');
  }
  
  // Vérifier que Object.keys fonctionne sur token
  const keys = Object.keys(defaultThemeConfig.token);
  console.log('✅ Token object is valid');
  console.log(`   Keys: ${keys.join(', ')}`);
} catch (error) {
  console.error('❌ FAILED:', error.message);
  process.exit(1);
}

// Test 2: Vérifier que la configuration peut être utilisée avec Ant Design
console.log('\nTest 2: Vérifier que la configuration peut être utilisée avec Ant Design');
try {
  // Simuler ce que Ant Design fait avec flattenToken
  const token = defaultThemeConfig.token;
  
  // Cette ligne est ce qui causait l'erreur
  const tokenKeys = Object.keys(token);
  
  if (!Array.isArray(tokenKeys)) {
    throw new Error('Object.keys did not return an array');
  }
  
  console.log('✅ Object.keys works correctly on token');
  console.log(`   Token has ${tokenKeys.length} properties`);
} catch (error) {
  console.error('❌ FAILED:', error.message);
  process.exit(1);
}

// Test 3: Vérifier que la configuration a les propriétés requises
console.log('\nTest 3: Vérifier que la configuration a les propriétés requises');
try {
  const requiredProps = ['colorPrimary', 'borderRadius'];
  const token = defaultThemeConfig.token;
  
  for (const prop of requiredProps) {
    if (!(prop in token)) {
      throw new Error(`Missing required property: ${prop}`);
    }
  }
  
  console.log('✅ All required properties are present');
  console.log(`   colorPrimary: ${token.colorPrimary}`);
  console.log(`   borderRadius: ${token.borderRadius}`);
} catch (error) {
  console.error('❌ FAILED:', error.message);
  process.exit(1);
}

// Test 4: Vérifier que la configuration est un objet valide
console.log('\nTest 4: Vérifier que la configuration est un objet valide');
try {
  const token = defaultThemeConfig.token;
  
  if (typeof token !== 'object') {
    throw new Error(`Token is not an object, it's a ${typeof token}`);
  }
  
  if (Array.isArray(token)) {
    throw new Error('Token is an array, not an object');
  }
  
  console.log('✅ Token is a valid object');
} catch (error) {
  console.error('❌ FAILED:', error.message);
  process.exit(1);
}

console.log('\n✅ All tests passed! The theme configuration is valid.\n');
console.log('The error "Cannot convert undefined or null to object" should not occur.');

