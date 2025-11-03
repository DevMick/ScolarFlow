#!/bin/bash

# ========================================
# SCRIPT D'EXÉCUTION DE TOUS LES TESTS
# ========================================

set -e  # Arrêter en cas d'erreur

echo "🧪 EDUSTATS - SUITE DE TESTS COMPLÈTE"
echo "======================================"

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Variables
BACKEND_DIR="apps/api"
FRONTEND_DIR="apps/web"
SHARED_DIR="packages/shared"
REPORTS_DIR="test-reports"

# Fonction d'affichage
print_step() {
    echo -e "\n${BLUE}📋 $1${NC}"
    echo "----------------------------------------"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Créer le répertoire de rapports
mkdir -p $REPORTS_DIR

# ========================================
# 1. VÉRIFICATIONS PRÉALABLES
# ========================================

print_step "Vérifications préalables"

# Vérifier Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js n'est pas installé"
    exit 1
fi

# Vérifier pnpm
if ! command -v pnpm &> /dev/null; then
    print_error "pnpm n'est pas installé"
    exit 1
fi

print_success "Environnement vérifié"

# ========================================
# 2. INSTALLATION DES DÉPENDANCES
# ========================================

print_step "Installation des dépendances"

pnpm install
if [ $? -eq 0 ]; then
    print_success "Dépendances installées"
else
    print_error "Échec de l'installation des dépendances"
    exit 1
fi

# ========================================
# 3. BUILD DU PACKAGE SHARED
# ========================================

print_step "Build du package shared"

cd $SHARED_DIR
pnpm run build
if [ $? -eq 0 ]; then
    print_success "Package shared compilé"
else
    print_error "Échec de la compilation du package shared"
    exit 1
fi
cd - > /dev/null

# ========================================
# 4. TESTS DE SÉCURITÉ DU MOTEUR DE FORMULES
# ========================================

print_step "Tests de sécurité du moteur de formules"

cd $BACKEND_DIR
pnpm test -- --testPathPattern="formula-engine.security.test.ts" --coverage --coverageDirectory="../../$REPORTS_DIR/security-coverage"
SECURITY_EXIT_CODE=$?

if [ $SECURITY_EXIT_CODE -eq 0 ]; then
    print_success "Tests de sécurité réussis"
else
    print_error "Échec des tests de sécurité"
fi

cd - > /dev/null

# ========================================
# 5. TESTS UNITAIRES BACKEND
# ========================================

print_step "Tests unitaires backend"

cd $BACKEND_DIR
pnpm test -- --testPathPattern="\.test\.ts$" --coverage --coverageDirectory="../../$REPORTS_DIR/backend-coverage" --testPathIgnorePatterns="integration|performance"
BACKEND_UNIT_EXIT_CODE=$?

if [ $BACKEND_UNIT_EXIT_CODE -eq 0 ]; then
    print_success "Tests unitaires backend réussis"
else
    print_error "Échec des tests unitaires backend"
fi

cd - > /dev/null

# ========================================
# 6. TESTS D'INTÉGRATION BACKEND
# ========================================

print_step "Tests d'intégration backend"

cd $BACKEND_DIR
pnpm test -- --testPathPattern="integration.test.ts" --coverage --coverageDirectory="../../$REPORTS_DIR/integration-coverage"
BACKEND_INTEGRATION_EXIT_CODE=$?

if [ $BACKEND_INTEGRATION_EXIT_CODE -eq 0 ]; then
    print_success "Tests d'intégration backend réussis"
else
    print_error "Échec des tests d'intégration backend"
fi

cd - > /dev/null

# ========================================
# 7. TESTS DE PERFORMANCE
# ========================================

print_step "Tests de performance"

cd $BACKEND_DIR
pnpm test -- --testPathPattern="performance.test.ts" --testTimeout=60000
PERFORMANCE_EXIT_CODE=$?

if [ $PERFORMANCE_EXIT_CODE -eq 0 ]; then
    print_success "Tests de performance réussis"
else
    print_warning "Tests de performance échoués (non bloquant)"
fi

cd - > /dev/null

# ========================================
# 8. TESTS UNITAIRES FRONTEND
# ========================================

print_step "Tests unitaires frontend"

cd $FRONTEND_DIR
pnpm test -- --coverage --coverageDirectory="../../$REPORTS_DIR/frontend-coverage" --testPathIgnorePatterns="e2e"
FRONTEND_UNIT_EXIT_CODE=$?

if [ $FRONTEND_UNIT_EXIT_CODE -eq 0 ]; then
    print_success "Tests unitaires frontend réussis"
else
    print_error "Échec des tests unitaires frontend"
fi

cd - > /dev/null

# ========================================
# 9. TESTS E2E (OPTIONNELS)
# ========================================

print_step "Tests End-to-End"

if [ "$RUN_E2E" = "true" ]; then
    cd $FRONTEND_DIR
    
    # Démarrer le serveur de développement en arrière-plan
    pnpm run dev &
    DEV_SERVER_PID=$!
    
    # Attendre que le serveur soit prêt
    sleep 10
    
    # Exécuter les tests E2E
    pnpm run test:e2e
    E2E_EXIT_CODE=$?
    
    # Arrêter le serveur de développement
    kill $DEV_SERVER_PID
    
    if [ $E2E_EXIT_CODE -eq 0 ]; then
        print_success "Tests E2E réussis"
    else
        print_warning "Tests E2E échoués (non bloquant)"
    fi
    
    cd - > /dev/null
else
    print_warning "Tests E2E ignorés (définir RUN_E2E=true pour les exécuter)"
fi

# ========================================
# 10. ANALYSE STATIQUE ET LINTING
# ========================================

print_step "Analyse statique et linting"

# Backend linting
cd $BACKEND_DIR
pnpm run lint > "../../$REPORTS_DIR/backend-lint.log" 2>&1
BACKEND_LINT_EXIT_CODE=$?
cd - > /dev/null

# Frontend linting
cd $FRONTEND_DIR
pnpm run lint > "../../$REPORTS_DIR/frontend-lint.log" 2>&1
FRONTEND_LINT_EXIT_CODE=$?
cd - > /dev/null

if [ $BACKEND_LINT_EXIT_CODE -eq 0 ] && [ $FRONTEND_LINT_EXIT_CODE -eq 0 ]; then
    print_success "Linting réussi"
else
    print_warning "Problèmes de linting détectés (voir les logs)"
fi

# ========================================
# 11. VÉRIFICATION DE SÉCURITÉ DES DÉPENDANCES
# ========================================

print_step "Audit de sécurité des dépendances"

pnpm audit --audit-level moderate > "$REPORTS_DIR/security-audit.log" 2>&1
AUDIT_EXIT_CODE=$?

if [ $AUDIT_EXIT_CODE -eq 0 ]; then
    print_success "Audit de sécurité réussi"
else
    print_warning "Vulnérabilités détectées (voir security-audit.log)"
fi

# ========================================
# 12. GÉNÉRATION DU RAPPORT FINAL
# ========================================

print_step "Génération du rapport final"

cat > "$REPORTS_DIR/test-summary.md" << EOF
# 📊 Rapport de Tests EduStats - $(date)

## 🎯 Résumé Exécutif

| Test Suite | Statut | Code de Sortie |
|------------|--------|----------------|
| Sécurité Formules | $([ $SECURITY_EXIT_CODE -eq 0 ] && echo "✅ RÉUSSI" || echo "❌ ÉCHEC") | $SECURITY_EXIT_CODE |
| Tests Unitaires Backend | $([ $BACKEND_UNIT_EXIT_CODE -eq 0 ] && echo "✅ RÉUSSI" || echo "❌ ÉCHEC") | $BACKEND_UNIT_EXIT_CODE |
| Tests Intégration Backend | $([ $BACKEND_INTEGRATION_EXIT_CODE -eq 0 ] && echo "✅ RÉUSSI" || echo "❌ ÉCHEC") | $BACKEND_INTEGRATION_EXIT_CODE |
| Tests Performance | $([ $PERFORMANCE_EXIT_CODE -eq 0 ] && echo "✅ RÉUSSI" || echo "⚠️ ÉCHEC") | $PERFORMANCE_EXIT_CODE |
| Tests Unitaires Frontend | $([ $FRONTEND_UNIT_EXIT_CODE -eq 0 ] && echo "✅ RÉUSSI" || echo "❌ ÉCHEC") | $FRONTEND_UNIT_EXIT_CODE |
| Linting Backend | $([ $BACKEND_LINT_EXIT_CODE -eq 0 ] && echo "✅ RÉUSSI" || echo "⚠️ ÉCHEC") | $BACKEND_LINT_EXIT_CODE |
| Linting Frontend | $([ $FRONTEND_LINT_EXIT_CODE -eq 0 ] && echo "✅ RÉUSSI" || echo "⚠️ ÉCHEC") | $FRONTEND_LINT_EXIT_CODE |
| Audit Sécurité | $([ $AUDIT_EXIT_CODE -eq 0 ] && echo "✅ RÉUSSI" || echo "⚠️ VULNÉRABILITÉS") | $AUDIT_EXIT_CODE |

## 📁 Rapports Détaillés

- **Couverture Backend**: \`backend-coverage/index.html\`
- **Couverture Frontend**: \`frontend-coverage/index.html\`
- **Couverture Sécurité**: \`security-coverage/index.html\`
- **Logs Linting**: \`backend-lint.log\`, \`frontend-lint.log\`
- **Audit Sécurité**: \`security-audit.log\`

## 🔒 Sécurité

$([ $SECURITY_EXIT_CODE -eq 0 ] && echo "✅ Tous les tests de sécurité du moteur de formules sont passés" || echo "❌ Des vulnérabilités ont été détectées dans le moteur de formules")

## 📈 Performance

$([ $PERFORMANCE_EXIT_CODE -eq 0 ] && echo "✅ Toutes les métriques de performance sont dans les limites acceptables" || echo "⚠️ Certaines métriques de performance sont en dehors des limites")

## 🎯 Recommandations

$([ $SECURITY_EXIT_CODE -ne 0 ] && echo "- 🔴 **CRITIQUE**: Corriger immédiatement les vulnérabilités de sécurité")
$([ $BACKEND_UNIT_EXIT_CODE -ne 0 ] && echo "- 🔴 **CRITIQUE**: Corriger les tests unitaires backend échoués")
$([ $FRONTEND_UNIT_EXIT_CODE -ne 0 ] && echo "- 🔴 **CRITIQUE**: Corriger les tests unitaires frontend échoués")
$([ $BACKEND_INTEGRATION_EXIT_CODE -ne 0 ] && echo "- 🔴 **CRITIQUE**: Corriger les tests d'intégration échoués")
$([ $PERFORMANCE_EXIT_CODE -ne 0 ] && echo "- 🟡 **ATTENTION**: Optimiser les performances")
$([ $BACKEND_LINT_EXIT_CODE -ne 0 ] && echo "- 🟡 **ATTENTION**: Corriger les problèmes de linting backend")
$([ $FRONTEND_LINT_EXIT_CODE -ne 0 ] && echo "- 🟡 **ATTENTION**: Corriger les problèmes de linting frontend")
$([ $AUDIT_EXIT_CODE -ne 0 ] && echo "- 🟡 **ATTENTION**: Mettre à jour les dépendances vulnérables")

---
*Rapport généré automatiquement par le script de test EduStats*
EOF

print_success "Rapport généré: $REPORTS_DIR/test-summary.md"

# ========================================
# 13. RÉSUMÉ FINAL
# ========================================

echo ""
echo "🏁 RÉSUMÉ FINAL"
echo "==============="

TOTAL_CRITICAL_FAILURES=0

if [ $SECURITY_EXIT_CODE -ne 0 ]; then
    print_error "Tests de sécurité échoués"
    ((TOTAL_CRITICAL_FAILURES++))
fi

if [ $BACKEND_UNIT_EXIT_CODE -ne 0 ]; then
    print_error "Tests unitaires backend échoués"
    ((TOTAL_CRITICAL_FAILURES++))
fi

if [ $BACKEND_INTEGRATION_EXIT_CODE -ne 0 ]; then
    print_error "Tests d'intégration backend échoués"
    ((TOTAL_CRITICAL_FAILURES++))
fi

if [ $FRONTEND_UNIT_EXIT_CODE -ne 0 ]; then
    print_error "Tests unitaires frontend échoués"
    ((TOTAL_CRITICAL_FAILURES++))
fi

if [ $TOTAL_CRITICAL_FAILURES -eq 0 ]; then
    print_success "TOUS LES TESTS CRITIQUES SONT PASSÉS! 🎉"
    print_success "EduStats est prêt pour la production!"
    exit 0
else
    print_error "$TOTAL_CRITICAL_FAILURES test(s) critique(s) échoué(s)"
    print_error "Corriger les problèmes avant le déploiement"
    exit 1
fi
