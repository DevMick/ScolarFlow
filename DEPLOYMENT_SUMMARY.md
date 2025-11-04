# 📋 Résumé des Corrections - Déploiement Vercel Monorepo

## ✅ Problèmes Résolus

### 1. Erreur `_interopRequireDefault$3 is not a function`
**Cause :** Configuration incorrecte du package `@edustats/shared` (pas de `type: "module"` et en `devDependencies`)

**Solution :**
- ✅ Ajout de `"type": "module"` dans `packages/shared/package.json`
- ✅ Déplacement de `@edustats/shared` vers `dependencies` dans `apps/web/package.json`
- ✅ Ajout de `@edustats/shared` dans `optimizeDeps.include` de Vite
- ✅ Configuration `interop: 'default'` pour injection inline des helpers

### 2. Configuration Vercel
**Cause :** Build command trop complexe avec chemins relatifs multiples

**Solution :**
- ✅ Utilisation de `pnpm --filter` pour les builds ciblés
- ✅ Ajout de `--frozen-lockfile` pour des builds reproductibles
- ✅ Configuration de `rootDirectory` et `outputDirectory` correctes

### 3. Transpilation ESM/CommonJS
**Cause :** Package shared ne compilait pas correctement en ESM

**Solution :**
- ✅ Ajout de `"type": "module"` dans le package shared
- ✅ Amélioration des exports avec tous les sous-paths
- ✅ Configuration correcte de Vite pour optimiser le package

## 📝 Fichiers Modifiés

### 1. `packages/shared/package.json`
- Ajout de `"type": "module"`
- Ajout de `"module"` field
- Amélioration des `exports` avec `default` et tous les sous-paths

### 2. `apps/web/package.json`
- Déplacement de `@edustats/shared` de `devDependencies` vers `dependencies`

### 3. `apps/web/vercel.json`
- Build command optimisée avec `pnpm --filter`
- Ajout de `--frozen-lockfile`
- Configuration de `outputDirectory: "apps/web/dist"`
- Configuration de `rootDirectory: "apps/web"` (à configurer dans Vercel Dashboard)

### 4. `apps/web/vite.config.ts`
- Ajout de `@edustats/shared` dans `optimizeDeps.include`
- Configuration `target: 'es2020'` dans `esbuildOptions`
- Configuration `interop: 'default'` pour injection inline

## 🌍 Variables d'Environnement

### À configurer dans Vercel Dashboard

```bash
# Variable publique (accessible côté client)
VITE_API_URL=https://votre-api.vercel.app/api
```

**Où configurer :**
1. Vercel Dashboard → Votre Projet → Settings → Environment Variables
2. Ajouter `VITE_API_URL` avec la valeur de production

**Valeurs recommandées :**
- **Production** : `https://votre-api.vercel.app/api`
- **Preview** : `https://votre-api-preview.vercel.app/api`
- **Development** : `http://localhost:3001/api`

## 🚀 Commandes de Déploiement

### Test Local
```bash
# Depuis la racine du monorepo
pnpm install
pnpm --filter @edustats/shared build
pnpm --filter @scolarflow/web build
```

### Déploiement Vercel
```bash
# Push vers GitHub (Vercel déploiera automatiquement)
git add .
git commit -m "Fix: Configuration Vercel monorepo et résolution erreurs build"
git push origin main
```

## 📋 Checklist de Vérification

Avant de déployer :

- [x] `packages/shared/package.json` a `"type": "module"`
- [x] `@edustats/shared` est en `dependencies` dans `apps/web/package.json`
- [x] `apps/web/vercel.json` utilise `pnpm --filter`
- [x] `apps/web/vite.config.ts` inclut `@edustats/shared` dans `optimizeDeps`
- [ ] Variable `VITE_API_URL` configurée dans Vercel Dashboard
- [ ] `rootDirectory` configuré à `apps/web` dans Vercel Dashboard (si nécessaire)

## 🔍 Configuration Vercel Dashboard

### Paramètres à vérifier dans Vercel :

1. **Root Directory** : `apps/web` (ou laisser vide si configuré dans `vercel.json`)
2. **Framework Preset** : Vite (détecté automatiquement)
3. **Build Command** : (sera lu depuis `apps/web/vercel.json`)
4. **Output Directory** : `dist` (sera lu depuis `apps/web/vercel.json`)
5. **Install Command** : (sera lu depuis `apps/web/vercel.json`)

### Variables d'Environnement :

| Variable | Valeur Production | Valeur Preview | Valeur Development |
|----------|-------------------|----------------|-------------------|
| `VITE_API_URL` | `https://votre-api.vercel.app/api` | `https://votre-api-preview.vercel.app/api` | `http://localhost:3001/api` |

## 📚 Documentation Complète

Voir `DEPLOYMENT.md` pour la documentation complète avec :
- Instructions détaillées étape par étape
- Dépannage complet
- Maintenance future
- Ressources additionnelles

---

**Date :** 2025-01-04  
**Version :** 1.0.0

