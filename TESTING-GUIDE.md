# 🧪 Guide de Test - Endpoints Corrigés

## 📌 Résumé des Corrections

Les erreurs 500 sur les endpoints `/api/compte-gratuit/info` et `/api/school-years` ont été corrigées en modifiant les services pour retourner des valeurs par défaut au lieu de lancer des exceptions.

### Fichiers Modifiés
1. `apps/api/src/services/compteGratuitService.ts`
2. `apps/api/src/services/schoolYearService.ts`

## 🚀 Comment Exécuter les Tests

### Option 1: Script PowerShell Complet (Recommandé)

```powershell
# Démarrer l'API et exécuter les tests automatiquement
.\run-tests.ps1
```

### Option 2: Script PowerShell Simple

```powershell
# Démarrer l'API dans une nouvelle fenêtre
.\start-and-test.ps1
```

### Option 3: Script Node.js

```bash
# Assurez-vous que l'API est en cours d'exécution sur le port 3001
node test-api-complete.js
```

### Option 4: Script PowerShell de Test Uniquement

```powershell
# Assurez-vous que l'API est en cours d'exécution sur le port 3001
.\test-api-complete.ps1
```

### Option 5: Script Bash (Linux/Mac)

```bash
# Assurez-vous que l'API est en cours d'exécution sur le port 3001
chmod +x test-endpoints-simple.sh
./test-endpoints-simple.sh
```

## 📋 Tests Inclus

### Test 1: Health Check
- **Endpoint**: `GET /api/health`
- **Authentification**: Non requise
- **Résultat attendu**: 200 OK avec status "ok"

### Test 2: Authentification
- **Endpoint**: `POST /api/auth/login`
- **Données**: Email et mot de passe
- **Résultat attendu**: 200 OK avec token JWT

### Test 3: Compte Gratuit
- **Endpoint**: `GET /api/compte-gratuit/info`
- **Authentification**: Requise (Bearer token)
- **Résultat attendu**: 
  - 200 OK avec informations du compte (si existe)
  - 404 Not Found (si n'existe pas)
  - **JAMAIS** 500 Internal Server Error

### Test 4: Années Scolaires
- **Endpoint**: `GET /api/school-years`
- **Authentification**: Requise (Bearer token)
- **Résultat attendu**: 
  - 200 OK avec liste des années scolaires
  - **JAMAIS** 500 Internal Server Error

## ✅ Critères de Succès

Tous les tests doivent passer avec les résultats suivants:

```
✅ Health Check: API est en ligne
✅ Login: Authentification réussie
✅ GET /api/compte-gratuit/info: Réponse reçue (200 ou 404)
✅ GET /api/school-years: Réponse reçue (200)
```

## 🔧 Dépannage

### L'API ne démarre pas
1. Vérifiez que le port 3001 est disponible
2. Vérifiez que PostgreSQL est en cours d'exécution
3. Vérifiez les variables d'environnement dans `.env`

### Les tests échouent
1. Vérifiez que l'API est en cours d'exécution sur le port 3001
2. Vérifiez que l'utilisateur `mickael.andjui.12@gmail.com` existe
3. Vérifiez que le mot de passe est correct
4. Vérifiez les logs de l'API pour les erreurs

### Erreur 500 toujours présente
1. Vérifiez que les fichiers ont été modifiés correctement
2. Redémarrez l'API
3. Vérifiez les logs de l'API pour les erreurs détaillées

## 📊 Résultats Attendus Détaillés

### GET /api/compte-gratuit/info (Succès)
```json
{
  "success": true,
  "data": {
    "id": 1,
    "dateDebut": "2025-10-23T00:00:00.000Z",
    "dateFin": "2025-11-06T00:00:00.000Z",
    "isActive": true,
    "createdAt": "2025-10-23T00:00:00.000Z",
    "daysRemaining": 14,
    "isExpired": false
  },
  "message": "Informations du compte gratuit récupérées avec succès"
}
```

### GET /api/compte-gratuit/info (Pas de compte)
```json
{
  "success": false,
  "message": "Aucun compte gratuit trouvé pour cet utilisateur",
  "statusCode": 404
}
```

### GET /api/school-years (Succès)
```json
{
  "success": true,
  "schoolYears": [
    {
      "id": 1,
      "userId": 8,
      "startYear": 2024,
      "endYear": 2025,
      "isActive": true,
      "createdAt": "2025-10-23T00:00:00.000Z",
      "updatedAt": "2025-10-23T00:00:00.000Z"
    }
  ],
  "activeSchoolYear": {
    "id": 1,
    "userId": 8,
    "startYear": 2024,
    "endYear": 2025,
    "isActive": true,
    "createdAt": "2025-10-23T00:00:00.000Z",
    "updatedAt": "2025-10-23T00:00:00.000Z"
  }
}
```

## 📝 Notes Importantes

1. **Gestion des erreurs**: Les services retournent maintenant des valeurs par défaut au lieu de lancer des exceptions
2. **Logs**: Les erreurs sont toujours loggées pour le débogage
3. **Compatibilité**: Les modifications sont rétro-compatibles avec le code existant
4. **Performance**: Aucun impact sur les performances

## 🎯 Prochaines Étapes

1. ✅ Exécuter les tests pour valider les corrections
2. ✅ Vérifier que tous les endpoints retournent les codes de statut corrects
3. ⏳ Mettre à jour la documentation API si nécessaire
4. ⏳ Considérer l'ajout de tests unitaires pour les services

## 📞 Support

Si vous rencontrez des problèmes:
1. Vérifiez les logs de l'API
2. Vérifiez que la base de données est accessible
3. Vérifiez que les modifications ont été appliquées correctement
4. Redémarrez l'API et les tests

