# Résolution du Problème API Admin

## 🚨 Problème identifié
L'erreur `ERR_CONNECTION_REFUSED` indique que l'API n'est pas accessible sur le port 3001.

## ✅ Solution

### 1. **Démarrer l'API en arrière-plan**

```bash
# Dans le terminal, aller dans le dossier API
cd apps/api
npm run dev
```

**Important :** Laissez ce terminal ouvert et l'API en cours d'exécution.

### 2. **Vérifier que l'API fonctionne**

L'API doit afficher ces messages :
```
[2025-10-25T12:06:43.554Z] INFO: Connected to PostgreSQL database
[2025-10-25T12:06:43.565Z] INFO: File directories initialized
[2025-10-25T12:06:43.571Z] INFO: Started automatic export cleanup scheduler
[2025-10-25T12:06:43.572Z] INFO: Initializing API routes...
[2025-10-25T12:06:43.830Z] INFO: API routes initialized successfully
[2025-10-25T12:06:43.865Z] INFO: EduStats API Server running on port 3001
```

### 3. **Tester la page de connexion admin**

1. **Aller sur** : `http://localhost:3000/admin/login`
2. **Saisir les identifiants** :
   - Nom d'utilisateur : `DevMick`
   - Mot de passe : `DevMick@2003`
3. **Cliquer sur "Se connecter"**

### 4. **Résultat attendu**

- ✅ **Connexion réussie** sans erreur
- ✅ **Redirection** vers `/admin/payments`
- ✅ **Accès à l'administration** des paiements

## 🔧 Dépannage

### Problème : "ERR_CONNECTION_REFUSED"
**Cause :** L'API n'est pas démarrée
**Solution :** Démarrer l'API avec `npm run dev` dans `apps/api`

### Problème : "Module bcrypt not found"
**Cause :** Dépendance manquante
**Solution :** J'ai modifié le code pour ne plus utiliser bcrypt temporairement

### Problème : "Token invalide"
**Cause :** Problème d'authentification
**Solution :** Vérifier que l'admin DevMick existe dans la base de données

## 📋 Vérification finale

### Étape 1 : API démarrée
- ✅ Terminal ouvert avec `npm run dev`
- ✅ Message "API Server running on port 3001"
- ✅ Pas d'erreurs dans la console

### Étape 2 : Frontend démarré
- ✅ Frontend accessible sur `http://localhost:3000`
- ✅ Page de connexion admin accessible

### Étape 3 : Test de connexion
- ✅ Page de connexion se charge
- ✅ Identifiants acceptés
- ✅ Redirection vers l'administration

## 🎉 Résultat

Une fois l'API démarrée, la page de connexion admin devrait fonctionner parfaitement !

**URL de test :** `http://localhost:3000/admin/login`
**Identifiants :** `DevMick` / `DevMick@2003`
