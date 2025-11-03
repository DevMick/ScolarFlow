#!/bin/bash
# Script de test pour simuler le build Vercel
# Usage: ./test-vercel-build.sh [api|web|all]

TARGET="${1:-all}"

echo "========================================="
echo "Test de Build Vercel"
echo "========================================="
echo ""

# Vérifier la version de pnpm
echo "1. Vérification de la version pnpm..."
if ! command -v pnpm &> /dev/null; then
    echo "   ❌ pnpm n'est pas installé"
    exit 1
fi

PNPM_VERSION=$(pnpm -v)
echo "   Version pnpm: $PNPM_VERSION"

# Vérifier que pnpm >= 8.0.0
MAJOR_VERSION=$(echo $PNPM_VERSION | cut -d. -f1)
if [ "$MAJOR_VERSION" -lt 8 ]; then
    echo "   ⚠️  Version pnpm < 8.0.0 (requis: >=8.0.0)"
    echo "   Installation de pnpm 8.12.0..."
    npm install -g pnpm@8.12.0
    if [ $? -ne 0 ]; then
        echo "   ❌ Impossible d'installer pnpm 8.12.0"
        exit 1
    fi
    echo "   ✅ pnpm 8.12.0 installé"
fi

# Test API
if [ "$TARGET" = "api" ] || [ "$TARGET" = "all" ]; then
    echo ""
    echo "2. Test de build API..."
    echo "   Simulation: cd ../.. && pnpm install && cd apps/api && pnpm build"
    
    cd "$(dirname "$0")"
    
    # Installer les dépendances
    echo "   Installation des dépendances..."
    pnpm install
    if [ $? -ne 0 ]; then
        echo "   ❌ Échec de l'installation des dépendances"
        exit 1
    fi
    
    # Build API
    echo "   Build de l'API..."
    cd apps/api
    pnpm build
    if [ $? -ne 0 ]; then
        echo "   ❌ Échec du build API"
        exit 1
    fi
    echo "   ✅ Build API réussi"
    cd ../..
fi

# Test Web
if [ "$TARGET" = "web" ] || [ "$TARGET" = "all" ]; then
    echo ""
    echo "3. Test de build Web..."
    echo "   Simulation: cd ../.. && pnpm install && cd apps/web && pnpm build"
    
    cd "$(dirname "$0")"
    
    # Installer les dépendances
    echo "   Installation des dépendances..."
    pnpm install
    if [ $? -ne 0 ]; then
        echo "   ❌ Échec de l'installation des dépendances"
        exit 1
    fi
    
    # Build Web
    echo "   Build du Web..."
    cd apps/web
    pnpm build
    if [ $? -ne 0 ]; then
        echo "   ❌ Échec du build Web"
        exit 1
    fi
    echo "   ✅ Build Web réussi"
    cd ../..
fi

echo ""
echo "========================================="
echo "✅ Tous les tests sont passés !"
echo "Vous pouvez maintenant push sur GitHub"
echo "========================================="

