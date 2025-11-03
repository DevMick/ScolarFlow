# 🚀 Guide de Déploiement Vercel - Monorepo

## 📋 Vue d'ensemble

Votre projet est un **monorepo** avec :
- **Backend API** (`apps/api`) - Node.js/Express
- **Frontend Web** (`apps/web`) - React/Vite
- **Packages partagés** (`packages/shared`)

Vercel supporte les monorepos ! Vous avez deux options de déploiement.

---

## 🎯 Option 1 : Deux Projets Vercel Séparés (RECOMMANDÉ)

**Avantages** :
- ✅ Déploiements indépendants
- ✅ URLs séparées (api.votre-domaine.com vs votre-domaine.com)
- ✅ Configuration spécifique par app
- ✅ Plus facile à gérer

### Étape 1 : Préparer le dépôt GitHub

```bash
# S'assurer que tous les fichiers sont commités
git add .
git commit -m "Préparation pour déploiement Vercel"
git push origin main
```

### Étape 2 : Déployer l'API (Backend)

1. **Aller sur Vercel** : https://vercel.com
2. **New Project** → Importer depuis GitHub
3. **Configuration** :
   - **Repository** : Votre repo GitHub
   - **Framework Preset** : Other
   - **Root Directory** : `apps/api`
   - **Build Command** : `cd ../.. && pnpm install && cd apps/api && pnpm build`
   - **Output Directory** : `apps/api/dist`
   - **Install Command** : `cd ../.. && pnpm install`
   - **Dev Command** : `cd ../.. && pnpm install && cd apps/api && pnpm dev`

4. **Variables d'environnement** :
   ```
   DATABASE_URL=postgresql://...
   JWT_SECRET=...
   JWT_REFRESH_SECRET=...
   CSRF_SECRET=...
   NODE_ENV=production
   CORS_ORIGIN=https://votre-domaine-frontend.vercel.app
   PORT=3001
   ```

5. **Déployer**

### Étape 3 : Déployer le Web (Frontend)

1. **New Project** → Importer depuis GitHub
2. **Configuration** :
   - **Repository** : Même repo GitHub
   - **Framework Preset** : Vite
   - **Root Directory** : `apps/web`
   - **Build Command** : `cd ../.. && pnpm install && cd apps/web && pnpm build`
   - **Output Directory** : `apps/web/dist`
   - **Install Command** : `cd ../.. && pnpm install`
   - **Dev Command** : `cd ../.. && pnpm install && cd apps/web && pnpm dev`

3. **Variables d'environnement** :
   ```
   VITE_API_URL=https://votre-api.vercel.app
   ```

4. **Déployer**

### Étape 4 : Configurer les domaines personnalisés

- **API** : `api.votre-domaine.com`
- **Web** : `votre-domaine.com`

Puis mettre à jour `CORS_ORIGIN` dans l'API avec l'URL du frontend.

---

## 🎯 Option 2 : Un Seul Projet Vercel

**Avantages** :
- ✅ Un seul projet à gérer
- ✅ URL unique pour tout

**Inconvénients** :
- ⚠️ Plus complexe à configurer
- ⚠️ Déploiements liés

### Configuration

Utilisez le fichier `vercel.json` à la racine du projet.

**Problème** : Vercel ne supporte pas nativement plusieurs outputs dans un seul projet.

**Solution** : Utiliser des rewrites et fonctions serverless.

Créer `vercel.json` à la racine :

```json
{
  "version": 2,
  "buildCommand": "pnpm install && pnpm build",
  "installCommand": "pnpm install",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api/server"
    },
    {
      "source": "/(.*)",
      "destination": "/index.html"
    }
  ],
  "functions": {
    "api/server.js": {
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
```

---

## ✅ Recommandation

**Je recommande l'Option 1 (Deux projets séparés)** car :
1. Plus simple à configurer
2. Déploiements indépendants
3. Meilleure séparation des préoccupations
4. Plus facile à déboguer

---

## 🔧 Configuration des Variables d'Environnement

### Pour l'API (`apps/api`)

```bash
DATABASE_URL=postgresql://avnadmin:...@pg-...h.aivencloud.com:17875/defaultdb?sslmode=require
JWT_SECRET=votre-secret-jwt-super-long-256-caracteres-minimum
JWT_REFRESH_SECRET=votre-secret-refresh-super-long-256-caracteres-minimum
CSRF_SECRET=votre-secret-csrf
NODE_ENV=production
CORS_ORIGIN=https://votre-frontend.vercel.app
PORT=3001
```

### Pour le Web (`apps/web`)

Créez un fichier `.env.production` dans `apps/web/` :

```bash
VITE_API_URL=https://votre-api.vercel.app
```

Ou configurez-le dans Vercel Dashboard → Settings → Environment Variables.

---

## 🚨 Points Importants

### 1. Prisma en Production

Prisma doit générer le client avant le build. Ajoutez dans `apps/api/package.json` :

```json
{
  "scripts": {
    "postinstall": "prisma generate",
    "build": "prisma generate && tsc",
    "start": "node dist/server.js"
  }
}
```

### 2. Base de Données Aiven

Assurez-vous que :
- ✅ Aiven accepte les connexions depuis Vercel
- ✅ Whitelist les IPs de Vercel si nécessaire
- ✅ `sslmode=require` est dans la `DATABASE_URL`

### 3. Build du Monorepo

Vercel doit installer les dépendances à la racine du monorepo. Le `Install Command` doit être :
```
cd ../.. && pnpm install
```

### 4. Paths relatifs

Dans `apps/api/vercel.json`, utilisez des chemins relatifs depuis la racine du repo.

---

## 📝 Checklist de Déploiement

### Avant de déployer

- [ ] Tous les fichiers sont commités sur GitHub
- [ ] `.env` est dans `.gitignore`
- [ ] `DATABASE_URL` pointe vers Aiven
- [ ] `CORS_ORIGIN` est configuré
- [ ] Les secrets sont forts (256+ caractères)

### Déploiement API

- [ ] Projet créé sur Vercel
- [ ] Root Directory = `apps/api`
- [ ] Build Command configuré
- [ ] Output Directory = `apps/api/dist`
- [ ] Variables d'environnement configurées
- [ ] Déploiement réussi
- [ ] Test de l'endpoint `/api/health`

### Déploiement Web

- [ ] Projet créé sur Vercel
- [ ] Root Directory = `apps/web`
- [ ] Build Command configuré
- [ ] Output Directory = `apps/web/dist`
- [ ] `VITE_API_URL` pointant vers l'API
- [ ] Déploiement réussi
- [ ] Test de l'authentification

### Après le déploiement

- [ ] Tester l'authentification complète
- [ ] Vérifier les logs Vercel
- [ ] Configurer les domaines personnalisés
- [ ] Mettre à jour `CORS_ORIGIN` avec le domaine final
- [ ] Tester toutes les fonctionnalités

---

## 🔍 Dépannage

### Erreur : "Cannot find module"

**Solution** : Vérifiez que le `Install Command` installe à la racine :
```
cd ../.. && pnpm install
```

### Erreur : "Prisma Client not generated"

**Solution** : Ajoutez `prisma generate` dans le script `build` :
```json
"build": "prisma generate && tsc"
```

### Erreur : "CORS error"

**Solution** : Vérifiez que `CORS_ORIGIN` dans l'API correspond à l'URL du frontend.

### Erreur : "Database connection failed"

**Solution** :
1. Vérifiez que la `DATABASE_URL` est correcte
2. Vérifiez que Aiven accepte les connexions externes
3. Ajoutez les IPs de Vercel à la whitelist si nécessaire

---

## 📚 Ressources

- [Vercel Monorepo Guide](https://vercel.com/docs/monorepos)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Prisma on Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

---

**Date de mise à jour** : 2025-11-03

