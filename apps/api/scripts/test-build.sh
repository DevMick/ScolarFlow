#!/bin/bash
# Script de test pour vérifier que le build TypeScript fonctionne
# Usage: ./scripts/test-build.sh

set -e

echo "🔍 Test du build TypeScript..."
echo ""

# Aller dans le répertoire de l'API
cd "$(dirname "$0")/.."

# Installer les dépendances si nécessaire
if [ ! -d "node_modules" ]; then
  echo "📦 Installation des dépendances..."
  pnpm install
fi

# Générer Prisma Client
echo "🗄️  Génération du Prisma Client..."
pnpm prisma generate

# Compiler TypeScript
echo "🔨 Compilation TypeScript..."
pnpm tsc

# Compter les erreurs
ERROR_COUNT=$(pnpm tsc 2>&1 | grep -c "error TS" || echo "0")

if [ "$ERROR_COUNT" -eq "0" ]; then
  echo "✅ Build réussi ! Aucune erreur TypeScript."
  exit 0
else
  echo "❌ Build échoué avec $ERROR_COUNT erreur(s) TypeScript."
  pnpm tsc 2>&1 | grep "error TS" | head -20
  exit 1
fi

