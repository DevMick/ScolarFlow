#!/bin/bash

# ========================================
# SCRIPT DE TESTS PHASE 7 - BILANS ANNUELS
# ========================================

echo "🎓 PHASE 7 - TESTS BILANS ANNUELS INTELLIGENTS"
echo "=============================================="

# Couleurs pour l'affichage
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Fonction d'affichage avec couleur
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Variables
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0
START_TIME=$(date +%s)

# Fonction de nettoyage
cleanup() {
    print_status "Nettoyage des ressources de test..."
    # Arrêt des services de test si nécessaire
    pkill -f "test-server" 2>/dev/null || true
}

# Trap pour nettoyage en cas d'interruption
trap cleanup EXIT

# ========================================
# PRÉPARATION DE L'ENVIRONNEMENT
# ========================================

print_status "Préparation de l'environnement de test..."

# Vérification des dépendances
if ! command -v node &> /dev/null; then
    print_error "Node.js n'est pas installé"
    exit 1
fi

if ! command -v npm &> /dev/null; then
    print_error "npm n'est pas installé"
    exit 1
fi

# Vérification de la structure du projet
if [ ! -f "package.json" ]; then
    print_error "package.json introuvable. Exécutez ce script depuis la racine du projet."
    exit 1
fi

# Configuration des variables d'environnement de test
export NODE_ENV=test
export TEST_DATABASE_URL="postgresql://test_user:test_password@localhost:5432/edustats_test"
export JEST_TIMEOUT=30000

print_success "Environnement préparé"

# ========================================
# TESTS BACKEND - SERVICES REPORTS
# ========================================

print_status "Exécution des tests backend - Services Reports..."

cd apps/api

# Installation des dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    print_status "Installation des dépendances backend..."
    npm install
fi

# Tests unitaires des services
print_status "Tests unitaires - AnalyticsEngine..."
if npm test -- --testPathPattern="AnalyticsEngine" --verbose; then
    print_success "AnalyticsEngine - Tests passés"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    print_error "AnalyticsEngine - Tests échoués"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

print_status "Tests unitaires - RecommendationEngine..."
if npm test -- --testPathPattern="RecommendationEngine" --verbose; then
    print_success "RecommendationEngine - Tests passés"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    print_error "RecommendationEngine - Tests échoués"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

print_status "Tests unitaires - AnnualReportService..."
if npm test -- --testPathPattern="AnnualReportService" --verbose; then
    print_success "AnnualReportService - Tests passés"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    print_error "AnnualReportService - Tests échoués"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

print_status "Tests unitaires - ExportService..."
if npm test -- --testPathPattern="ExportService" --verbose; then
    print_success "ExportService - Tests passés"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    print_error "ExportService - Tests échoués"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

print_status "Tests unitaires - ArchiveService..."
if npm test -- --testPathPattern="ArchiveService" --verbose; then
    print_success "ArchiveService - Tests passés"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    print_error "ArchiveService - Tests échoués"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

print_status "Tests unitaires - PerformanceOptimizer..."
if npm test -- --testPathPattern="PerformanceOptimizer" --verbose; then
    print_success "PerformanceOptimizer - Tests passés"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    print_error "PerformanceOptimizer - Tests échoués"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Tests d'intégration
print_status "Tests d'intégration - Bilans Annuels Complets..."
if npm test -- --testPathPattern="AnnualReports.integration" --verbose --runInBand; then
    print_success "Tests d'intégration - Passés"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    print_error "Tests d'intégration - Échoués"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Tests de performance
print_status "Tests de performance - Génération < 30s..."
if npm test -- --testPathPattern="performance" --verbose; then
    print_success "Tests de performance - Passés"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    print_warning "Tests de performance - Échoués (non bloquant)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

cd ../..

# ========================================
# TESTS FRONTEND - COMPOSANTS REPORTS
# ========================================

print_status "Exécution des tests frontend - Composants Reports..."

cd apps/web

# Installation des dépendances si nécessaire
if [ ! -d "node_modules" ]; then
    print_status "Installation des dépendances frontend..."
    npm install
fi

# Tests des composants
print_status "Tests composants - ReportGenerator..."
if npm test -- --testPathPattern="ReportGenerator" --verbose; then
    print_success "ReportGenerator - Tests passés"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    print_error "ReportGenerator - Tests échoués"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Tests des hooks
print_status "Tests hooks - useAnnualReports..."
if npm test -- --testPathPattern="useAnnualReports" --verbose; then
    print_success "useAnnualReports - Tests passés"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    print_error "useAnnualReports - Tests échoués"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

cd ../..

# ========================================
# TESTS E2E - WORKFLOW COMPLET
# ========================================

print_status "Tests End-to-End - Workflow complet..."

cd apps/web

# Vérification de Playwright
if command -v npx playwright &> /dev/null; then
    print_status "Exécution des tests E2E avec Playwright..."
    
    # Installation des navigateurs si nécessaire
    npx playwright install --with-deps chromium
    
    if npx playwright test tests/e2e/annual-reports.e2e.test.ts --reporter=line; then
        print_success "Tests E2E - Passés"
        PASSED_TESTS=$((PASSED_TESTS + 1))
    else
        print_error "Tests E2E - Échoués"
        FAILED_TESTS=$((FAILED_TESTS + 1))
    fi
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
else
    print_warning "Playwright non disponible - Tests E2E ignorés"
fi

cd ../..

# ========================================
# TESTS DE SÉCURITÉ
# ========================================

print_status "Tests de sécurité - Formules et Exports..."

cd apps/api

# Tests de sécurité du moteur de formules
print_status "Tests sécurité - FormulaEngine..."
if npm test -- --testPathPattern="formula.*security" --verbose; then
    print_success "Tests sécurité FormulaEngine - Passés"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    print_error "Tests sécurité FormulaEngine - Échoués"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

# Tests de sécurité des exports
print_status "Tests sécurité - ExportService..."
if npm test -- --testPathPattern="export.*security" --verbose; then
    print_success "Tests sécurité ExportService - Passés"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    print_error "Tests sécurité ExportService - Échoués"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

cd ../..

# ========================================
# TESTS DE CHARGE
# ========================================

print_status "Tests de charge - Génération simultanée..."

cd apps/api

if npm test -- --testPathPattern="load.*test" --verbose; then
    print_success "Tests de charge - Passés"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    print_warning "Tests de charge - Échoués (non bloquant)"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

cd ../..

# ========================================
# VALIDATION DES DONNÉES DE TEST
# ========================================

print_status "Validation des données de test..."

# Vérification de la génération avec données réelles
print_status "Test avec jeu de données réaliste..."

cd apps/api

# Exécution du test de validation avec données complètes
if npm test -- --testPathPattern="realistic.*data" --verbose; then
    print_success "Validation données réalistes - Passée"
    PASSED_TESTS=$((PASSED_TESTS + 1))
else
    print_error "Validation données réalistes - Échouée"
    FAILED_TESTS=$((FAILED_TESTS + 1))
fi
TOTAL_TESTS=$((TOTAL_TESTS + 1))

cd ../..

# ========================================
# GÉNÉRATION DU RAPPORT DE TESTS
# ========================================

END_TIME=$(date +%s)
DURATION=$((END_TIME - START_TIME))

print_status "Génération du rapport de tests..."

# Création du répertoire de rapports
mkdir -p reports/phase7

# Génération du rapport HTML
cat > reports/phase7/test-report.html << EOF
<!DOCTYPE html>
<html lang="fr">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Rapport de Tests - Phase 7 Bilans Annuels</title>
    <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        .header { background: #3b82f6; color: white; padding: 20px; border-radius: 8px; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; margin: 20px 0; }
        .metric { background: #f3f4f6; padding: 15px; border-radius: 8px; text-align: center; }
        .success { color: #10b981; font-weight: bold; }
        .error { color: #ef4444; font-weight: bold; }
        .warning { color: #f59e0b; font-weight: bold; }
        .details { margin-top: 30px; }
        .test-section { margin: 20px 0; padding: 15px; border-left: 4px solid #3b82f6; }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎓 Rapport de Tests - Phase 7 Bilans Annuels</h1>
        <p>Tests exécutés le $(date)</p>
    </div>
    
    <div class="summary">
        <div class="metric">
            <h3>Tests Total</h3>
            <div style="font-size: 2em; font-weight: bold;">$TOTAL_TESTS</div>
        </div>
        <div class="metric">
            <h3>Tests Réussis</h3>
            <div class="success" style="font-size: 2em;">$PASSED_TESTS</div>
        </div>
        <div class="metric">
            <h3>Tests Échoués</h3>
            <div class="error" style="font-size: 2em;">$FAILED_TESTS</div>
        </div>
        <div class="metric">
            <h3>Durée</h3>
            <div style="font-size: 2em; font-weight: bold;">${DURATION}s</div>
        </div>
    </div>
    
    <div class="details">
        <h2>Détails par Composant</h2>
        
        <div class="test-section">
            <h3>🧠 AnalyticsEngine</h3>
            <p>Classification automatique des profils d'élèves et détection d'insights</p>
            <ul>
                <li>Classification des 6 profils d'élèves</li>
                <li>Détection d'insights pédagogiques</li>
                <li>Calcul des métriques de performance</li>
                <li>Algorithmes de régression et corrélation</li>
            </ul>
        </div>
        
        <div class="test-section">
            <h3>💡 RecommendationEngine</h3>
            <p>Génération de recommandations pédagogiques contextualisées</p>
            <ul>
                <li>Recommandations basées sur profils</li>
                <li>Priorisation intelligente</li>
                <li>Support individualisé</li>
                <li>Planification année suivante</li>
            </ul>
        </div>
        
        <div class="test-section">
            <h3>📊 AnnualReportService</h3>
            <p>Orchestration complète de génération de bilans</p>
            <ul>
                <li>Génération < 30 secondes</li>
                <li>Validation qualité des données</li>
                <li>Cache intelligent</li>
                <li>Templates personnalisables</li>
            </ul>
        </div>
        
        <div class="test-section">
            <h3>📄 ExportService</h3>
            <p>Export multi-formats professionnel</p>
            <ul>
                <li>PDF haute qualité</li>
                <li>Excel avec données structurées</li>
                <li>CSV pour analyses externes</li>
                <li>Préservation de la mise en forme</li>
            </ul>
        </div>
        
        <div class="test-section">
            <h3>🗄️ ArchiveService</h3>
            <p>Archivage intelligent et consultation historique</p>
            <ul>
                <li>Archivage avec compression</li>
                <li>Vérification d'intégrité</li>
                <li>Recherche avancée</li>
                <li>Comparaison inter-années</li>
            </ul>
        </div>
        
        <div class="test-section">
            <h3>⚡ PerformanceOptimizer</h3>
            <p>Optimisations de performance avancées</p>
            <ul>
                <li>Cache multi-niveaux</li>
                <li>Parallélisation des calculs</li>
                <li>Optimisations algorithmiques</li>
                <li>Monitoring en temps réel</li>
            </ul>
        </div>
    </div>
    
    <div style="margin-top: 40px; padding: 20px; background: #f9fafb; border-radius: 8px;">
        <h3>🎯 Résumé de la Phase 7</h3>
        <p>La Phase 7 - Bilans Annuels Intelligents représente une révolution dans l'analyse pédagogique française avec :</p>
        <ul>
            <li><strong>IA de Classification :</strong> 6 profils d'élèves détectés automatiquement</li>
            <li><strong>Analyses Prédictives :</strong> Recommandations pour l'année suivante</li>
            <li><strong>Performance Optimisée :</strong> Génération < 30 secondes</li>
            <li><strong>Export Professionnel :</strong> PDF de qualité administrative</li>
            <li><strong>Archivage Intelligent :</strong> Conservation et consultation historique</li>
        </ul>
    </div>
</body>
</html>
EOF

print_success "Rapport HTML généré : reports/phase7/test-report.html"

# ========================================
# RÉSUMÉ FINAL
# ========================================

echo ""
echo "=========================================="
echo "🎓 RÉSUMÉ DES TESTS PHASE 7"
echo "=========================================="
echo ""

if [ $FAILED_TESTS -eq 0 ]; then
    print_success "✅ TOUS LES TESTS SONT PASSÉS !"
    print_success "🎉 Phase 7 - Bilans Annuels validée avec succès"
    echo ""
    echo "🚀 FONCTIONNALITÉS VALIDÉES :"
    echo "   • 🧠 IA de classification (6 profils d'élèves)"
    echo "   • 📊 Analyses prédictives et recommandations"
    echo "   • 🎯 Détection automatique d'insights"
    echo "   • 📈 Génération < 30s avec cache intelligent"
    echo "   • 📄 Export PDF professionnel"
    echo "   • 🗄️ Archivage intelligent"
    echo "   • 🔍 Recherche avancée historique"
    echo "   • ⚡ Performance optimisée"
    echo ""
    print_success "EduStats dispose maintenant du système de bilans le plus avancé au monde ! 🌟"
    
    exit 0
else
    print_error "❌ $FAILED_TESTS test(s) ont échoué sur $TOTAL_TESTS"
    print_warning "🔧 Vérifiez les logs ci-dessus pour les détails"
    echo ""
    echo "📊 STATISTIQUES :"
    echo "   • Tests réussis : $PASSED_TESTS/$TOTAL_TESTS ($(( PASSED_TESTS * 100 / TOTAL_TESTS ))%)"
    echo "   • Tests échoués : $FAILED_TESTS/$TOTAL_TESTS ($(( FAILED_TESTS * 100 / TOTAL_TESTS ))%)"
    echo "   • Durée totale : ${DURATION}s"
    echo ""
    
    if [ $PASSED_TESTS -gt $(( TOTAL_TESTS * 80 / 100 )) ]; then
        print_warning "✨ Plus de 80% des tests passent - Phase 7 globalement fonctionnelle"
        exit 1
    else
        print_error "🚨 Moins de 80% des tests passent - Corrections nécessaires"
        exit 2
    fi
fi
