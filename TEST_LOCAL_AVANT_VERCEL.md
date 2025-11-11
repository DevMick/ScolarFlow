# 🧪 Guide : Tester Localement Avant de Déployer sur Vercel

Ce guide vous explique comment tester votre API localement dans un environnement identique à Vercel, pour éviter les erreurs 404 et autres problèmes lors du déploiement.

## 🎯 Pourquoi Tester Localement ?

- ✅ **Détecter les erreurs avant le déploiement** : Économisez du temps et évitez les déploiements qui échouent
- ✅ **Environnement identique à Vercel** : `vercel dev` simule exactement l'environnement de production
- ✅ **Debugging plus facile** : Les logs sont visibles directement dans votre terminal
- ✅ **Tests rapides** : Pas besoin d'attendre le déploiement pour tester

---

## 📋 Prérequis

1. **Installer Vercel CLI** :
   ```powershell
   npm i -g vercel
   ```

2. **Vérifier l'installation** :
   ```powershell
   vercel --version
   ```

3. **Se connecter à Vercel** (première fois seulement) :
   ```powershell
   vercel login
   ```

---

## 🚀 Méthode 1 : Test avec `vercel dev` (Recommandé)

Cette méthode simule **exactement** l'environnement Vercel en local.

### Étape 1 : Build de l'API

```powershell
# Depuis la racine du projet
cd apps/api
pnpm install
pnpm build
cd ../..
```

### Étape 2 : Lancer `vercel dev`

```powershell
# Depuis la racine du projet
vercel dev
```

**Ce que fait `vercel dev` :**
- ✅ Simule l'environnement Vercel
- ✅ Utilise votre `vercel.json` pour la configuration
- ✅ Charge les variables d'environnement depuis `.env.local` ou `.env`
- ✅ Expose l'API sur `http://localhost:3000` (par défaut)
- ✅ Hot reload automatique lors des changements

### Étape 3 : Tester les Endpoints

Une fois `vercel dev` lancé, testez vos endpoints :

#### Test de la route racine `/`
```powershell
# Test avec PowerShell
Invoke-WebRequest -Uri "http://localhost:3000/" -Method GET

# Ou avec curl
curl http://localhost:3000/
```

**Résultat attendu :**
```json
{
  "success": true,
  "message": "API Scolar Flow is running 🚀",
  "version": "1.0.0",
  "endpoints": {
    "health": "/api/health",
    "hello": "/api/hello"
  }
}
```

#### Test de `/api/health`
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/health" -Method GET
```

#### Test de `/api/hello`
```powershell
Invoke-WebRequest -Uri "http://localhost:3000/api/hello" -Method GET
```

### Étape 4 : Vérifier les Logs

Les logs de `vercel dev` montrent :
- ✅ Les requêtes reçues
- ✅ Les routes matchées
- ✅ Les erreurs éventuelles
- ✅ Les temps de réponse

---

## 🔧 Méthode 2 : Test avec Script PowerShell Automatisé

Un script PowerShell pour automatiser tout le processus.

### Utiliser le Script

```powershell
# Depuis la racine du projet
.\test-local-vercel.ps1
```

Le script :
1. ✅ Vérifie que Vercel CLI est installé
2. ✅ Build l'API automatiquement
3. ✅ Lance `vercel dev`
4. ✅ Teste les endpoints principaux
5. ✅ Affiche les résultats

---

## 🧪 Méthode 3 : Test avec Node.js Direct (Sans Vercel CLI)

Si vous ne voulez pas installer Vercel CLI, vous pouvez tester directement le handler.

### Script de Test

```powershell
# Depuis la racine du projet
cd apps/api
pnpm test:vercel
```

Ce script :
- ✅ Vérifie que le build existe
- ✅ Simule l'environnement Vercel
- ✅ Teste le chargement du handler
- ✅ Teste une requête mock

---

## 📝 Configuration des Variables d'Environnement

### Fichier `.env.local` (Recommandé pour `vercel dev`)

Créez un fichier `.env.local` à la racine du projet :

```env
# Base de données
DATABASE_URL=postgresql://user:password@localhost:5432/edustats_db

# JWT
JWT_SECRET=votre_secret_jwt
JWT_REFRESH_SECRET=votre_secret_refresh

# CORS
CORS_ORIGIN=http://localhost:3000

# Node
NODE_ENV=development
```

**Note :** `.env.local` est automatiquement chargé par `vercel dev` et ignoré par Git.

### Fichier `.env` (Alternative)

Vous pouvez aussi utiliser `.env`, mais il sera commité dans Git (sauf si dans `.gitignore`).

---

## ✅ Checklist Avant Déploiement

Avant de déployer sur Vercel, vérifiez que :

- [ ] **Build réussi** : `cd apps/api && pnpm build` sans erreur
- [ ] **Test local réussi** : `vercel dev` fonctionne et les endpoints répondent
- [ ] **Route `/` fonctionne** : Retourne un JSON valide (pas de 404)
- [ ] **Route `/api/health` fonctionne** : Retourne le statut de l'API
- [ ] **Variables d'environnement** : Configurées dans Vercel Dashboard
- [ ] **Logs propres** : Pas d'erreurs dans les logs de `vercel dev`
- [ ] **CORS configuré** : `CORS_ORIGIN` pointe vers votre frontend

---

## 🔍 Résolution des Problèmes Courants

### Problème 1 : Erreur 404 sur `/`

**Symptôme :** `GET http://localhost:3000/` retourne 404

**Solutions :**
1. Vérifiez que `vercel.json` contient le rewrite pour `/` :
   ```json
   {
     "rewrites": [
       {
         "source": "/",
         "destination": "/api"
       }
     ]
   }
   ```

2. Vérifiez que `api/index.ts` gère la route `/` :
   ```typescript
   app.get('/', (req, res) => {
     res.json({ message: 'API is running' });
   });
   ```

3. Redémarrez `vercel dev` après modification de `vercel.json`

### Problème 2 : Erreur "Cannot find module"

**Symptôme :** `MODULE_NOT_FOUND` dans les logs

**Solutions :**
1. Vérifiez que le build a réussi : `cd apps/api && pnpm build`
2. Vérifiez que `apps/api/dist/` existe et contient les fichiers compilés
3. Vérifiez que `api/index.ts` importe depuis `../apps/api/dist/` (pas `src/`)

### Problème 3 : Erreur de connexion à la base de données

**Symptôme :** `Database connection failed`

**Solutions :**
1. Vérifiez que `DATABASE_URL` est définie dans `.env.local`
2. Vérifiez que PostgreSQL est démarré et accessible
3. Testez la connexion : `psql $DATABASE_URL`

### Problème 4 : Port déjà utilisé

**Symptôme :** `Port 3000 is already in use`

**Solutions :**
1. Arrêtez le processus qui utilise le port 3000
2. Ou spécifiez un autre port : `vercel dev -p 3001`

---

## 🚀 Workflow Recommandé

### 1. Développement Local

```powershell
# Terminal 1 : API en mode dev (avec hot reload)
cd apps/api
pnpm dev

# Terminal 2 : Frontend (si nécessaire)
cd apps/web
pnpm dev
```

### 2. Test Avant Déploiement

```powershell
# Build l'API
cd apps/api
pnpm build
cd ../..

# Test avec vercel dev
vercel dev

# Dans un autre terminal, tester les endpoints
Invoke-WebRequest -Uri "http://localhost:3000/api/health"
```

### 3. Déploiement sur Vercel

```powershell
# Si tout fonctionne en local, déployer
vercel --prod

# Ou via Git (push déclenche le déploiement automatique)
git add .
git commit -m "feat: Nouvelle fonctionnalité"
git push origin main
```

---

## 📊 Comparaison des Méthodes

| Méthode | Avantages | Inconvénients | Quand l'utiliser |
|---------|-----------|---------------|------------------|
| `vercel dev` | ✅ Environnement identique à Vercel<br>✅ Hot reload<br>✅ Logs détaillés | ❌ Nécessite Vercel CLI | **Recommandé** pour tester avant déploiement |
| `pnpm dev` | ✅ Rapide<br>✅ Pas besoin de build | ❌ Environnement différent de Vercel | Pour le développement quotidien |
| `pnpm test:vercel` | ✅ Pas besoin de Vercel CLI<br>✅ Test rapide | ❌ Ne simule pas complètement Vercel | Pour vérifier le build rapidement |

---

## 🎯 Résumé

**Pour tester localement avant de déployer sur Vercel :**

1. **Installer Vercel CLI** : `npm i -g vercel`
2. **Build l'API** : `cd apps/api && pnpm build`
3. **Lancer vercel dev** : `vercel dev` (depuis la racine)
4. **Tester les endpoints** : `http://localhost:3000/` et `http://localhost:3000/api/health`
5. **Si tout fonctionne** : Déployer sur Vercel avec `vercel --prod`

**C'est tout !** 🎉

---

## 📚 Ressources

- [Documentation Vercel CLI](https://vercel.com/docs/cli)
- [Documentation Vercel Dev](https://vercel.com/docs/cli/dev)
- [Documentation Vercel Serverless Functions](https://vercel.com/docs/functions)

