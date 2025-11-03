# ⚡ Démarrage Rapide - Tests des Corrections

## 🎯 Objectif
Valider que les erreurs 500 ont été corrigées sur les endpoints:
- `GET /api/compte-gratuit/info`
- `GET /api/school-years`

## 🚀 Démarrage en 3 Étapes

### Étape 1: Ouvrir PowerShell
```powershell
# Ouvrir PowerShell et aller au répertoire du projet
cd c:\ScolarFlow
```

### Étape 2: Exécuter le Script de Test
```powershell
# Exécuter le script qui démarre l'API et exécute les tests
.\run-tests.ps1
```

### Étape 3: Attendre les Résultats
Le script va:
1. ✅ Démarrer l'API
2. ✅ Attendre que l'API soit prête
3. ✅ Exécuter les tests
4. ✅ Afficher les résultats
5. ✅ Arrêter l'API

## ✅ Résultats Attendus

```
╔════════════════════════════════════════════════════════════╗
║         TEST COMPLET DES ENDPOINTS DE L'API               ║
╚════════════════════════════════════════════════════════════╝

📋 Test 1: Health Check
✅ Health Check: API est en ligne - Status: ok

📋 Test 2: Authentification
✅ Login: Authentification réussie - Token obtenu

📋 Test 3: GET /api/compte-gratuit/info
✅ GET /api/compte-gratuit/info: Réponse reçue avec succès

📋 Test 4: GET /api/school-years
✅ GET /api/school-years: Réponse reçue avec succès

╔════════════════════════════════════════════════════════════╗
║                    RÉSUMÉ DES TESTS                        ║
╚════════════════════════════════════════════════════════════╝

Résultats: 4/4 tests réussis

✅ Health Check: API est en ligne - Status: ok
✅ Login: Authentification réussie - Token obtenu
✅ GET /api/compte-gratuit/info: Réponse reçue avec succès
✅ GET /api/school-years: Réponse reçue avec succès

🎉 Tous les tests sont passés!
```

## 🔍 Vérification Manuelle

Si vous préférez tester manuellement:

### 1. Démarrer l'API
```powershell
cd c:\ScolarFlow\apps\api
npm run dev
```

### 2. Ouvrir un autre terminal et tester
```powershell
# Test 1: Health Check
curl http://localhost:3001/api/health

# Test 2: Login
$loginBody = @{
    email = "mickael.andjui.12@gmail.com"
    password = "password123"
} | ConvertTo-Json

$response = Invoke-WebRequest -Uri "http://localhost:3001/api/auth/login" `
    -Method Post `
    -ContentType "application/json" `
    -Body $loginBody

$token = ($response.Content | ConvertFrom-Json).token

# Test 3: Compte Gratuit
curl -H "Authorization: Bearer $token" http://localhost:3001/api/compte-gratuit/info

# Test 4: Années Scolaires
curl -H "Authorization: Bearer $token" http://localhost:3001/api/school-years
```

## 🎯 Critères de Succès

✅ **Tous les tests doivent passer:**
- Health Check: 200 OK
- Login: 200 OK avec token
- Compte Gratuit: 200 OK ou 404 (JAMAIS 500)
- Années Scolaires: 200 OK (JAMAIS 500)

## ❌ Dépannage

### L'API ne démarre pas
```powershell
# Vérifier que le port 3001 est disponible
Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue

# Vérifier que PostgreSQL est en cours d'exécution
# Vérifier les variables d'environnement dans .env
```

### Les tests échouent
```powershell
# Vérifier que l'API est en cours d'exécution
curl http://localhost:3001/api/health

# Vérifier les logs de l'API
# Vérifier que l'utilisateur existe
```

## 📚 Documentation Complète

Pour plus de détails, consultez:
- **TESTING-GUIDE.md** - Guide complet de test
- **CORRECTIONS-SUMMARY.md** - Résumé des corrections
- **FIXES-APPLIED.md** - Détails des corrections appliquées
- **TEST-SCRIPTS-README.md** - Guide d'utilisation des scripts

## 🎉 Conclusion

Les erreurs 500 ont été corrigées! Exécutez les tests pour valider les corrections.

```powershell
.\run-tests.ps1
```

**C'est tout! 🚀**

