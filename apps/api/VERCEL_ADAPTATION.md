# 🚀 Adaptation Vercel Serverless Functions - Guide Complet

## ✅ Modifications Effectuées

### 1. **Instance Globale Prisma** (`src/lib/prisma.ts`)
- ✅ Création d'une instance globale unique de Prisma pour éviter les erreurs "PrismaClient is already connected" sur Vercel
- ✅ Utilisation du pattern recommandé par Prisma pour les environnements serverless

```typescript
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient({...});
```

### 2. **Point d'Entrée Vercel** (`src/index.ts`)
- ✅ Création d'un nouveau fichier `src/index.ts` qui exporte un handler compatible avec `@vercel/node`
- ✅ Initialisation asynchrone de l'application Express
- ✅ Gestion des erreurs pour les environnements serverless
- ✅ Tous les middlewares (Helmet, CORS, rate-limit, JWT, etc.) sont conservés

### 3. **Configuration Vercel** (`vercel.json`)
- ✅ Mise à jour pour utiliser `@vercel/node` avec le fichier `src/index.ts`
- ✅ Configuration des routes pour rediriger toutes les requêtes vers le handler

### 4. **Adaptation des Services et Controllers**
- ✅ Mise à jour de tous les fichiers qui créaient directement des instances `PrismaClient` :
  - `src/services/adminService.ts`
  - `src/services/paymentService.ts`
  - `src/controllers/statisticsController.ts`
  - `src/controllers/moyenneController.ts`
  - `src/controllers/classThresholdController.ts`
  - `src/controllers/tablesController.ts`
  - `src/services/studentService.ts`
  - `src/services/evaluationService.ts`
  - `src/routes/health.ts`

### 5. **Configuration TypeScript**
- ✅ Mise à jour de `tsconfig.json` pour utiliser `moduleResolution: "Node"` (compatible avec ESM et Vercel)

### 6. **Scripts Package.json**
- ✅ Ajout de la dépendance `@vercel/node`
- ✅ Mise à jour du script `build` pour compiler correctement

### 7. **Server.ts**
- ✅ Vérification que `server.ts` ne démarre pas le serveur sur Vercel (déjà en place)
- ✅ Utilisation de l'instance globale Prisma

## 📋 Structure des Fichiers

```
apps/api/
├── src/
│   ├── index.ts          ← Nouveau point d'entrée Vercel
│   ├── server.ts          ← Serveur local (ne démarre pas sur Vercel)
│   ├── lib/
│   │   └── prisma.ts      ← Instance globale Prisma
│   ├── routes/
│   │   └── health.ts      ← Route de santé (mise à jour)
│   └── ...
├── vercel.json            ← Configuration Vercel
└── package.json           ← Scripts et dépendances
```

## 🔧 Configuration Vercel

### Variables d'Environnement Requises

Dans **Project Settings > Environment Variables** sur Vercel, ajouter :

```
DATABASE_URL=postgresql://user:password@host:port/dbname
JWT_SECRET=your_secret_key
CORS_ORIGIN=https://your-frontend.vercel.app
NODE_ENV=production
```

### Configuration du Projet

1. **Root Directory** : `/apps/api` (ou laisser à la racine si monorepo)
2. **Build Command** : `pnpm install && pnpm build`
3. **Output Directory** : `dist` (généré par TypeScript)
4. **Install Command** : `pnpm install`

## 🚀 Déploiement

### Étapes de Déploiement

1. **Build Local** (test) :
   ```bash
   cd apps/api
   pnpm install
   pnpm build
   ```

2. **Pousser sur GitHub** :
   ```bash
   git add .
   git commit -m "feat: adaptation Vercel Serverless Functions"
   git push
   ```

3. **Relier le Projet à Vercel** :
   - Aller sur [Vercel Dashboard](https://vercel.com/dashboard)
   - Importer le projet depuis GitHub
   - **Root Directory** : `apps/api` (si monorepo)
   - Vercel détectera automatiquement `vercel.json`

4. **Vérifier le Déploiement** :
   - Tester l'endpoint de santé : `https://your-project.vercel.app/api/health`
   - Vérifier les logs dans Vercel Dashboard

## 🧪 Tests

### Test Local avec Vercel CLI

```bash
# Installer Vercel CLI
npm i -g vercel

# Tester localement
cd apps/api
vercel dev
```

### Endpoints de Test

- **Health Check** : `GET /api/health`
- **API Info** : `GET /api/info`
- **Auth** : `POST /api/auth/login`

## ⚠️ Points d'Attention

### 1. **Cold Start**
- Les fonctions serverless peuvent avoir un "cold start" lors de la première requête
- L'initialisation asynchrone dans `index.ts` gère cela automatiquement

### 2. **Connexions Prisma**
- L'instance globale Prisma évite les problèmes de connexions multiples
- Les connexions sont réutilisées entre les invocations

### 3. **Limites Vercel**
- **Timeout** : 10s (Hobby), 60s (Pro)
- **Memory** : 1024 MB par défaut (configurable dans `vercel.json`)
- **Max Duration** : 30s (configurable)

### 4. **Fichiers Statiques**
- Les fichiers uploadés doivent être stockés dans un service externe (S3, Cloudinary, etc.)
- Le système de fichiers local n'est pas persistant sur Vercel

## 🔍 Dépannage

### Erreur : "Cannot find module"
- Vérifier que `@vercel/node` est installé
- Vérifier que le build TypeScript génère bien les fichiers `.js`

### Erreur : "PrismaClient is already connected"
- Vérifier que tous les fichiers utilisent `import { prisma } from '../lib/prisma'`
- Ne pas créer de nouvelles instances `new PrismaClient()`

### Erreur : "Database connection failed"
- Vérifier les variables d'environnement sur Vercel
- Vérifier que `DATABASE_URL` est correctement configuré
- Vérifier que la base de données accepte les connexions depuis Vercel

### Erreur : "Function timeout"
- Augmenter `maxDuration` dans `vercel.json`
- Optimiser les requêtes Prisma
- Utiliser la pagination pour les grandes requêtes

## 📚 Ressources

- [Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Prisma Serverless Guide](https://www.prisma.io/docs/guides/deployment/serverless)
- [@vercel/node Documentation](https://vercel.com/docs/functions/runtimes/node-js)

## ✅ Checklist de Déploiement

- [ ] Variables d'environnement configurées sur Vercel
- [ ] Build local réussi (`pnpm build`)
- [ ] Projet relié à Vercel
- [ ] Root Directory configuré (`apps/api` si monorepo)
- [ ] Test de l'endpoint `/api/health` réussi
- [ ] Test des routes principales (auth, etc.)
- [ ] Vérification des logs Vercel
- [ ] Configuration CORS pour le frontend

---

**Note** : Cette adaptation permet de déployer l'API Express sur Vercel tout en conservant la compatibilité avec le développement local. Le fichier `server.ts` continue de fonctionner pour le développement local, tandis que `index.ts` est utilisé par Vercel.

