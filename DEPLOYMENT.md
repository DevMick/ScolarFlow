# 🚀 Guide de Déploiement Vercel - ScolarFlow Monorepo

## 📋 Résumé des Problèmes Identifiés

### Problèmes principaux résolus :

1. **Erreur `_interopRequireDefault$3 is not a function`**
   - Cause : Configuration incorrecte du package `@edustats/shared` (pas de `type: "module"`)
   - Cause : Package en `devDependencies` au lieu de `dependencies`
   - Cause : Build command Vercel trop complexe avec chemins relatifs

2. **Transpilation ESM/CommonJS**
   - Package shared ne compilait pas correctement en ESM
   - Manque d'optimisation dans `optimizeDeps` de Vite

3. **Configuration Vercel**
   - Build command utilisait des `cd` multiples
   - Pas de `rootDirectory` spécifié
   - Output directory incorrect

## 🔧 Modifications Effectuées

### 1. Package `@edustats/shared` (`packages/shared/package.json`)

**Changements :**
- ✅ Ajout de `"type": "module"` pour forcer ESM
- ✅ Ajout du champ `"module"` pour compatibilité
- ✅ Amélioration des `exports` avec tous les sous-paths
- ✅ Ajout de `"default"` dans les exports

**Fichier corrigé :**
```json
{
  "name": "@edustats/shared",
  "version": "1.0.0",
  "type": "module",
  "main": "./dist/index.js",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.js",
      "default": "./dist/index.js"
    },
    "./types": { ... },
    "./validation": { ... },
    "./utils": { ... }
  }
}
```

### 2. Application Web (`apps/web/package.json`)

**Changements :**
- ✅ Déplacement de `@edustats/shared` de `devDependencies` vers `dependencies`
- ✅ Le package est maintenant disponible en production

### 3. Configuration Vercel (`apps/web/vercel.json`)

**Changements :**
- ✅ Utilisation de `pnpm --filter` pour les builds (plus robuste)
- ✅ Ajout de `rootDirectory: "apps/web"`
- ✅ Correction de `outputDirectory` vers `apps/web/dist`
- ✅ Utilisation de `--frozen-lockfile` pour des builds reproductibles
- ✅ Build command simplifiée et plus fiable

**Avant :**
```json
{
  "buildCommand": "cd ../.. && npx --yes pnpm@8.12.0 install && cd packages/shared && npx --yes pnpm@8.12.0 build && cd ../../apps/web && npx --yes pnpm@8.12.0 build",
  "outputDirectory": "dist"
}
```

**Après :**
```json
{
  "buildCommand": "pnpm install --frozen-lockfile && pnpm --filter @edustats/shared build && pnpm --filter @scolarflow/web build",
  "outputDirectory": "apps/web/dist",
  "rootDirectory": "apps/web"
}
```

### 4. Configuration Vite (`apps/web/vite.config.ts`)

**Changements :**
- ✅ Ajout de `@edustats/shared` dans `optimizeDeps.include`
- ✅ Configuration `target: 'es2020'` dans `esbuildOptions`
- ✅ Configuration `interop: 'default'` pour injection inline des helpers
- ✅ Un seul chunk via `manualChunks` pour éviter les problèmes de partage

## 🌍 Variables d'Environnement Requises

### Variables à configurer dans Vercel Dashboard

#### Variables Publiques (préfixées `VITE_`)

```bash
# URL de l'API backend
VITE_API_URL=https://votre-api.vercel.app/api
# Exemple de production : https://scolarflow-api.vercel.app/api
# Exemple de développement : http://localhost:3001/api
```

#### Variables Privées (si nécessaire pour le build)

```bash
# Node environment (généralement géré automatiquement par Vercel)
NODE_ENV=production
```

### Configuration dans Vercel

1. Allez sur votre projet Vercel
2. Settings → Environment Variables
3. Ajoutez les variables suivantes :

| Variable | Valeur Production | Valeur Preview | Valeur Development |
|----------|-------------------|----------------|-------------------|
| `VITE_API_URL` | `https://votre-api.vercel.app/api` | `https://votre-api-preview.vercel.app/api` | `http://localhost:3001/api` |

**Note :** Remplacez `votre-api.vercel.app` par l'URL réelle de votre API.

## 📝 Instructions de Déploiement

### Étape 1 : Préparer le Code

```bash
# 1. Vérifier que tout est commité
git status

# 2. S'assurer que le build fonctionne localement
cd apps/web
pnpm install
pnpm build

# 3. Vérifier que le package shared est bien construit
cd ../../packages/shared
pnpm build

# 4. Revenir à la racine et tester le build complet
cd ../..
pnpm build
```

### Étape 2 : Configurer Vercel

#### Option A : Via Dashboard Vercel (Recommandé)

1. **Connecter le dépôt GitHub**
   - Vercel Dashboard → New Project
   - Sélectionner votre dépôt GitHub
   - **Root Directory** : Laissez vide (Vercel utilisera `apps/web/vercel.json`)

2. **Configurer les paramètres de build**
   - Vercel détectera automatiquement `apps/web/vercel.json`
   - Si ce n'est pas le cas, configurez :
     - **Framework Preset** : Vite
     - **Root Directory** : `apps/web`
     - **Build Command** : `pnpm install --frozen-lockfile && pnpm --filter @edustats/shared build && pnpm --filter @scolarflow/web build`
     - **Output Directory** : `dist`
     - **Install Command** : `pnpm install --frozen-lockfile`

3. **Ajouter les variables d'environnement**
   - Settings → Environment Variables
   - Ajouter `VITE_API_URL` avec la valeur appropriée

#### Option B : Via CLI Vercel

```bash
# Installer Vercel CLI si nécessaire
npm i -g vercel

# Se connecter à Vercel
vercel login

# Depuis la racine du projet
vercel

# Suivre les instructions
# - Root Directory : apps/web
# - Build Command : (sera lu depuis vercel.json)
```

### Étape 3 : Déployer

```bash
# Push vers GitHub (Vercel déploiera automatiquement)
git add .
git commit -m "Fix: Configuration Vercel et résolution erreurs build"
git push origin main
```

### Étape 4 : Vérifier le Déploiement

1. **Vérifier les logs de build dans Vercel Dashboard**
   - Allez sur votre projet → Deployments
   - Cliquez sur le dernier déploiement
   - Vérifiez que :
     - ✅ `pnpm install` réussit
     - ✅ `pnpm --filter @edustats/shared build` réussit
     - ✅ `pnpm --filter @scolarflow/web build` réussit
     - ✅ Les fichiers sont générés dans `apps/web/dist`

2. **Tester l'application**
   - Ouvrir l'URL de déploiement
   - Vérifier la console du navigateur (F12)
   - S'assurer qu'il n'y a pas d'erreur `_interopRequireDefault`

## 🔍 Dépannage

### Problème : Build échoue avec "Cannot find module '@edustats/shared'"

**Solution :**
```bash
# Vérifier que le package shared est bien construit
cd packages/shared
pnpm build

# Vérifier que le package est bien dans node_modules
cd ../../apps/web
ls node_modules/@edustats
```

### Problème : Erreur `_interopRequireDefault` persiste

**Solution :**
1. Vérifier que `packages/shared/package.json` a bien `"type": "module"`
2. Vérifier que `apps/web/vite.config.ts` inclut `@edustats/shared` dans `optimizeDeps.include`
3. Nettoyer le cache Vercel : Settings → General → Clear Build Cache

### Problème : Variables d'environnement non disponibles

**Solution :**
- Vérifier que les variables sont préfixées avec `VITE_`
- Redéployer après avoir ajouté les variables
- Vérifier dans Vercel Dashboard → Settings → Environment Variables

### Problème : Build trop lent

**Solution :**
- Utiliser `--frozen-lockfile` (déjà configuré)
- Vérifier que Turbo cache fonctionne (si configuré)
- Vérifier les logs pour identifier les étapes lentes

## ✅ Checklist de Vérification

Avant de déployer, vérifiez :

- [ ] Le build local fonctionne : `pnpm build`
- [ ] Le package shared est bien construit : `cd packages/shared && pnpm build`
- [ ] `@edustats/shared` est en `dependencies` (pas `devDependencies`)
- [ ] `packages/shared/package.json` a `"type": "module"`
- [ ] `apps/web/vercel.json` utilise `pnpm --filter`
- [ ] Variables d'environnement configurées dans Vercel
- [ ] `rootDirectory` est correctement configuré
- [ ] `outputDirectory` pointe vers `apps/web/dist`

## 📚 Ressources

- [Documentation Vercel Monorepo](https://vercel.com/docs/concepts/monorepos)
- [Documentation Vite](https://vitejs.dev/)
- [Documentation pnpm Workspaces](https://pnpm.io/workspaces)
- [Documentation Turborepo](https://turbo.build/repo/docs)

## 🔄 Maintenance Future

### Ajouter un nouveau package interne

1. Créer le package dans `packages/`
2. Ajouter `"type": "module"` dans son `package.json`
3. L'ajouter dans `pnpm-workspace.yaml` si nécessaire
4. L'ajouter dans `optimizeDeps.include` de Vite si utilisé par l'app web
5. Mettre à jour le `buildCommand` dans `vercel.json` si nécessaire

### Modifier la configuration de build

1. Modifier `apps/web/vite.config.ts`
2. Tester localement : `cd apps/web && pnpm build`
3. Vérifier que le build Vercel fonctionne toujours

---

**Dernière mise à jour :** 2025-01-04
**Version :** 1.0.0

