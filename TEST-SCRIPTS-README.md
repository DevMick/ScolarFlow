# 🧪 Scripts de Test - Guide d'Utilisation

## 📋 Vue d'ensemble

Plusieurs scripts de test ont été créés pour valider les corrections apportées aux endpoints de l'API.

## 🚀 Démarrage Rapide

### Option 1: Automatique (Recommandé)
```powershell
.\run-tests.ps1
```
Ce script:
1. Démarre l'API automatiquement
2. Attend que l'API soit prête
3. Exécute les tests
4. Affiche les résultats
5. Arrête l'API

### Option 2: Manuel
```powershell
# Terminal 1: Démarrer l'API
cd apps/api
npm run dev

# Terminal 2: Exécuter les tests
.\test-api-complete.ps1
```

## 📁 Scripts Disponibles

### 1. `run-tests.ps1` (PowerShell)
**Description**: Script complet qui démarre l'API et exécute les tests

**Utilisation**:
```powershell
.\run-tests.ps1
```

**Avantages**:
- ✅ Automatique
- ✅ Gère le démarrage et l'arrêt de l'API
- ✅ Affiche les résultats détaillés

**Inconvénients**:
- ❌ Nécessite PowerShell
- ❌ Crée un processus enfant

### 2. `test-api-complete.ps1` (PowerShell)
**Description**: Script de test PowerShell

**Utilisation**:
```powershell
# Assurez-vous que l'API est en cours d'exécution
.\test-api-complete.ps1
```

**Avantages**:
- ✅ Détaillé
- ✅ Affiche les résultats formatés
- ✅ Gère les erreurs gracieusement

**Inconvénients**:
- ❌ Nécessite PowerShell
- ❌ Nécessite que l'API soit déjà en cours d'exécution

### 3. `test-api-complete.js` (Node.js)
**Description**: Script de test Node.js

**Utilisation**:
```bash
# Assurez-vous que l'API est en cours d'exécution
node test-api-complete.js
```

**Avantages**:
- ✅ Multiplateforme
- ✅ Pas de dépendances externes
- ✅ Affiche les résultats colorés

**Inconvénients**:
- ❌ Nécessite Node.js
- ❌ Nécessite que l'API soit déjà en cours d'exécution

### 4. `start-and-test.ps1` (PowerShell)
**Description**: Script simple qui démarre l'API dans une nouvelle fenêtre et exécute les tests

**Utilisation**:
```powershell
.\start-and-test.ps1
```

**Avantages**:
- ✅ Simple
- ✅ Démarre l'API dans une nouvelle fenêtre
- ✅ Exécute les tests automatiquement

**Inconvénients**:
- ❌ Nécessite PowerShell
- ❌ Crée une nouvelle fenêtre

### 5. `test-endpoints-simple.sh` (Bash)
**Description**: Script Bash simple pour tester les endpoints

**Utilisation**:
```bash
chmod +x test-endpoints-simple.sh
./test-endpoints-simple.sh
```

**Avantages**:
- ✅ Simple
- ✅ Utilise curl et jq
- ✅ Multiplateforme (Linux/Mac)

**Inconvénients**:
- ❌ Nécessite curl et jq
- ❌ Nécessite que l'API soit déjà en cours d'exécution

## 📊 Tests Inclus

Tous les scripts exécutent les mêmes tests:

### Test 1: Health Check
```
GET /api/health
Résultat attendu: 200 OK
```

### Test 2: Authentification
```
POST /api/auth/login
Données: { email, password }
Résultat attendu: 200 OK avec token
```

### Test 3: Compte Gratuit
```
GET /api/compte-gratuit/info
Authentification: Bearer token
Résultat attendu: 200 OK ou 404 Not Found (JAMAIS 500)
```

### Test 4: Années Scolaires
```
GET /api/school-years
Authentification: Bearer token
Résultat attendu: 200 OK (JAMAIS 500)
```

## ✅ Critères de Succès

Tous les tests doivent passer:
- ✅ Health Check: 200 OK
- ✅ Login: 200 OK avec token
- ✅ Compte Gratuit: 200 OK ou 404 (pas 500)
- ✅ Années Scolaires: 200 OK (pas 500)

## 🔧 Configuration

### Variables d'Environnement

Les scripts utilisent les valeurs par défaut suivantes:
- **API_URL**: `http://localhost:3001/api`
- **EMAIL**: `mickael.andjui.12@gmail.com`
- **PASSWORD**: `password123`

Pour utiliser des valeurs différentes:

**PowerShell**:
```powershell
.\test-api-complete.ps1 -ApiUrl "http://localhost:3001" -Email "user@example.com" -Password "password"
```

**Node.js**:
```bash
API_URL=http://localhost:3001/api EMAIL=user@example.com PASSWORD=password node test-api-complete.js
```

**Bash**:
```bash
API_URL="http://localhost:3001/api" EMAIL="user@example.com" PASSWORD="password" ./test-endpoints-simple.sh
```

## 📝 Résultats Attendus

### Succès
```
✅ Health Check: API est en ligne
✅ Login: Authentification réussie
✅ GET /api/compte-gratuit/info: Réponse reçue
✅ GET /api/school-years: Réponse reçue
```

### Erreur
```
❌ Health Check: Erreur: connect ECONNREFUSED
```

## 🐛 Dépannage

### L'API ne démarre pas
1. Vérifiez que le port 3001 est disponible
2. Vérifiez que PostgreSQL est en cours d'exécution
3. Vérifiez les variables d'environnement

### Les tests échouent
1. Vérifiez que l'API est en cours d'exécution
2. Vérifiez que l'utilisateur existe
3. Vérifiez que le mot de passe est correct
4. Vérifiez les logs de l'API

### Erreur 500 toujours présente
1. Vérifiez que les fichiers ont été modifiés
2. Redémarrez l'API
3. Vérifiez les logs de l'API

## 📚 Documentation Supplémentaire

- **TESTING-GUIDE.md**: Guide complet de test
- **CORRECTIONS-SUMMARY.md**: Résumé des corrections
- **FIXES-APPLIED.md**: Détails des corrections appliquées

## 🎯 Prochaines Étapes

1. Exécuter les tests pour valider les corrections
2. Vérifier que tous les endpoints retournent les codes de statut corrects
3. Mettre à jour la documentation API si nécessaire
4. Considérer l'ajout de tests unitaires pour les services

