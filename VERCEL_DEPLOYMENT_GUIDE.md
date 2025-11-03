# 🚀 Guide de Déploiement Vercel - Monorepo

## ✅ OUI, ça va fonctionner !

Vercel **supporte les monorepos** ! Vous pouvez déployer votre application sans problème.

---

## 🎯 Option Recommandée : Deux Projets Vercel Séparés

**Pourquoi** : Plus simple, plus flexible, meilleure séparation.

### Structure
- **Projet 1** : API Backend (`apps/api`) → `api.votre-domaine.com`
- **Projet 2** : Frontend Web (`apps/web`) → `votre-domaine.com`

---

## 📋 Étapes de Déploiement

### 1️⃣ Préparer GitHub

```bash
# Commit tous les fichiers de configuration
git add .
git commit -m "Ajout configuration Vercel pour monorepo"
git push origin main
```

### 2️⃣ Déployer l'API (Backend)

#### A. Créer le projet sur Vercel

1. Aller sur https://vercel.com
2. **New Project** → Importer depuis GitHub
3. Sélectionner votre repo

#### B. Configuration du projet API

**Settings** :
- **Project Name** : `edustats-api`
- **Root Directory** : `apps/api`
- **Framework Preset** : `Other`
- **Build Command** : `cd ../.. && pnpm install && cd apps/api && pnpm build`
- **Output Directory** : `apps/api/dist`
- **Install Command** : `cd ../.. && pnpm install`
- **Dev Command** : `cd ../.. && pnpm install && cd apps/api && pnpm dev`

**Important** : 
- Utilisez `cd ../..` pour revenir à la racine du monorepo
- Puis `cd apps/api` pour aller dans l'app API

#### C. Variables d'environnement API

Dans **Settings → Environment Variables**, ajoutez :

```bash
DATABASE_URL=postgresql://avnadmin:VOTRE_MOT_DE_PASSE_AIVEN@pg-XXXXXX-allianceconsultants893-23db.h.aivencloud.com:17875/defaultdb?sslmode=require
JWT_SECRET=votre-secret-jwt-super-long-256-caracteres-minimum
JWT_REFRESH_SECRET=votre-secret-refresh-super-long-256-caracteres-minimum
CSRF_SECRET=votre-secret-csrf-super-long
NODE_ENV=production
CORS_ORIGIN=https://votre-frontend.vercel.app
PORT=3001
```

**Note** : `CORS_ORIGIN` sera mis à jour après le déploiement du frontend.

#### D. Fonction Serverless (Alternative)

**Option A : Utiliser l'export direct**

Modifiez `apps/api/src/server.ts` pour exporter l'app :
```typescript
export default app;
```

Puis créez `apps/api/api/server.ts` :
```typescript
import app from '../src/server';
export default app;
```

**Configuration Vercel** :
- **Functions Directory** : `api`
- **Routes** : Configurer dans `vercel.json`

**Option B : Utiliser le build standard**

Si vous gardez `app.listen()`, Vercel le détectera automatiquement mais c'est moins optimal.

### 3️⃣ Déployer le Web (Frontend)

#### A. Créer le projet sur Vercel

1. **New Project** → Même repo GitHub
2. Sélectionner le même repo (oui, deux projets pour un même repo !)

#### B. Configuration du projet Web

**Settings** :
- **Project Name** : `edustats-web`
- **Root Directory** : `apps/web`
- **Framework Preset** : `Vite`
- **Build Command** : `cd ../.. && pnpm install && cd apps/web && pnpm build`
- **Output Directory** : `apps/web/dist`
- **Install Command** : `cd ../.. && pnpm install`
- **Dev Command** : `cd ../.. && pnpm install && cd apps/web && pnpm dev`

#### C. Variables d'environnement Web

```bash
VITE_API_URL=https://votre-api.vercel.app
```

**Important** : Mettez l'URL de l'API que vous venez de déployer !

#### D. Mettre à jour CORS dans l'API

Une fois le frontend déployé, mettez à jour `CORS_ORIGIN` dans l'API avec l'URL du frontend.

---

## 📝 Fichiers de Configuration Créés

J'ai créé les fichiers suivants pour vous :

### 1. `apps/api/vercel.json`
Configuration Vercel pour l'API (optionnel, peut être configuré via le dashboard)

### 2. `apps/web/vercel.json`
Configuration Vercel pour le Web (optionnel)

### 3. `.vercelignore`
Fichiers à ignorer lors du déploiement

### 4. `apps/api/api/server.ts`
Wrapper serverless pour Vercel (nécessaire si vous utilisez les fonctions serverless)

---

## ⚙️ Configuration Importante

### Pour l'API

**Scripts `package.json` modifiés** :
```json
{
  "scripts": {
    "build": "prisma generate && tsc",
    "postinstall": "prisma generate"
  }
}
```

**Pourquoi** : Prisma doit générer le client avant le build.

### Pour le Web

Assurez-vous que `apps/web/src/services/api.ts` ou similaire utilise `import.meta.env.VITE_API_URL`.

---

## 🔧 Configuration Vercel via Dashboard (RECOMMANDÉ)

Au lieu d'utiliser `vercel.json`, configurez directement dans le dashboard Vercel :

### API Project Settings

```
Root Directory: apps/api
Build Command: cd ../.. && pnpm install && cd apps/api && pnpm build
Output Directory: apps/api/dist
Install Command: cd ../.. && pnpm install
```

### Web Project Settings

```
Root Directory: apps/web
Framework Preset: Vite
Build Command: cd ../.. && pnpm install && cd apps/web && pnpm build
Output Directory: apps/web/dist
Install Command: cd ../.. && pnpm install
```

---

## 🚨 Points d'Attention

### 1. Base de Données Aiven

Vérifiez que :
- ✅ Aiven accepte les connexions externes
- ✅ Les IPs de Vercel sont autorisées (si nécessaire)
- ✅ `sslmode=require` est dans la `DATABASE_URL`

### 2. Workspace Dependencies

Vercel doit installer à la racine du monorepo pour que les workspace dependencies (`@edustats/shared`) fonctionnent.

**Solution** : `Install Command` = `cd ../.. && pnpm install`

### 3. Prisma en Production

Le client Prisma doit être généré avant le build.

**Solution** : `postinstall` script qui exécute `prisma generate`

### 4. CORS

Après le déploiement, mettez à jour `CORS_ORIGIN` dans l'API avec l'URL du frontend.

---

## ✅ Checklist de Déploiement

### Avant de déployer

- [ ] Tous les fichiers sont commités sur GitHub
- [ ] `.env` est dans `.gitignore`
- [ ] `DATABASE_URL` pointe vers Aiven
- [ ] Les secrets sont prêts (JWT_SECRET, etc.)

### Déploiement API

- [ ] Projet créé sur Vercel
- [ ] Root Directory = `apps/api`
- [ ] Build Command configuré correctement
- [ ] Variables d'environnement ajoutées
- [ ] Déploiement réussi
- [ ] Test `/api/health` fonctionne

### Déploiement Web

- [ ] Projet créé sur Vercel
- [ ] Root Directory = `apps/web`
- [ ] Framework = Vite
- [ ] `VITE_API_URL` configuré
- [ ] Déploiement réussi
- [ ] Test de l'authentification

### Après le déploiement

- [ ] Mise à jour `CORS_ORIGIN` dans l'API
- [ ] Test complet de l'application
- [ ] Configuration des domaines personnalisés
- [ ] Mise à jour des URLs finales

---

## 🔍 Dépannage

### Erreur : "Cannot find module @edustats/shared"

**Solution** : Vérifiez que l'`Install Command` installe à la racine :
```
cd ../.. && pnpm install
```

### Erreur : "Prisma Client not generated"

**Solution** : Vérifiez que `postinstall` exécute `prisma generate` :
```json
"postinstall": "prisma generate"
```

### Erreur : "CORS error"

**Solution** : Vérifiez que `CORS_ORIGIN` dans l'API correspond à l'URL du frontend Vercel.

### Erreur : "Database connection failed"

**Solution** :
1. Vérifiez que `DATABASE_URL` est correcte
2. Vérifiez qu'Aiven accepte les connexions externes
3. Testez la connexion depuis votre machine locale

---

## 📚 Ressources

- [Vercel Monorepo Guide](https://vercel.com/docs/monorepos)
- [Vercel Environment Variables](https://vercel.com/docs/concepts/projects/environment-variables)
- [Prisma on Vercel](https://www.prisma.io/docs/guides/deployment/deployment-guides/deploying-to-vercel)

---

**Vous êtes prêt !** 🚀

Suivez les étapes ci-dessus et votre monorepo sera déployé sur Vercel sans problème.

