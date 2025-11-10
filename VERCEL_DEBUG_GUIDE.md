# 🐛 Guide de Debug Vercel - Résolution Erreur 404

## 📋 Problème Identifié

L'API renvoie actuellement des erreurs **404 NOT_FOUND** sur Vercel.

## ✅ Corrections Appliquées

### 1. Logs Détaillés Ajoutés

Des logs détaillés ont été ajoutés à plusieurs niveaux pour diagnostiquer le problème :

#### Dans `api/index.ts` (Point d'entrée Vercel)
```typescript
console.log('[API Entry] 📍 api/index.ts loaded');
console.log('[API Entry] 🔄 Re-exporting handler from apps/api/src/index.ts');
```

#### Dans `apps/api/src/index.ts` (Handler principal)
- Logs au démarrage du module
- Logs détaillés de chaque requête reçue
- Logs de l'initialisation de l'app
- Logs du routing vers Express
- Logs des erreurs

#### Dans `apps/api/src/server.ts` (Middleware Express)
- Logs de toutes les requêtes Express
- Logs du path, query, et request ID

---

## 🔍 Comment Diagnostiquer le Problème

### 1. Vérifier les Logs Vercel

```bash
# Voir les logs en temps réel
vercel logs --follow

# Voir les logs d'un déploiement spécifique
vercel logs <deployment-url>
```

### 2. Logs Attendus

Si tout fonctionne correctement, vous devriez voir dans les logs :

```
[API Entry] 📍 api/index.ts loaded
[API Entry] 🔄 Re-exporting handler from apps/api/src/index.ts
[Vercel] 🚀 API module loaded
[Vercel] 📍 Handler location: apps/api/src/index.ts
[Vercel] 🌍 Environment: production
[Vercel] 🔧 Vercel environment: production
[Vercel] ✅ Vercel detected: yes
[Vercel] ✅ Variables d'environnement requises présentes
[Vercel Handler] ========================================
[Vercel Handler] 📥 API request received
[Vercel Handler] Method: GET
[Vercel Handler] URL: /api/health
[Vercel Handler] Path: /api/health
[Vercel Handler] 🔄 Initializing app...
[Vercel] 🚀 Initializing app...
[Vercel] ✅ Connected to PostgreSQL database
[Vercel] ✅ File directories initialized
[Vercel] 🔄 Initializing API routes...
[Vercel] ✅ API routes initialized successfully
[Vercel] ✅ App initialized successfully
[Vercel Handler] ✅ App initialized
[Vercel Handler] 🔀 Routing to Express app
[Vercel Handler] 📤 Passing request to Express app
[Express] GET /api/health
[Express] Path: /api/health
[Vercel Handler] ✅ Request handled successfully
[Vercel Handler] Response status: 200
```

### 3. Si vous voyez une erreur 404

Vérifiez dans les logs :
- Est-ce que `[API Entry]` apparaît ? → Si non, Vercel ne trouve pas `api/index.ts`
- Est-ce que `[Vercel Handler]` apparaît ? → Si non, le handler n'est pas appelé
- Est-ce que `[Express]` apparaît ? → Si non, la requête n'atteint pas Express

---

## 🔧 Solutions Possibles

### Solution 1 : Vérifier que `api/index.ts` existe

```bash
# Vérifier que le fichier existe
ls -la api/index.ts

# Vérifier le contenu
cat api/index.ts
```

Le fichier doit contenir :
```typescript
export { default } from '../apps/api/src/index';
```

### Solution 2 : Vérifier la configuration `vercel.json`

Le fichier `vercel.json` doit être à la racine et contenir :

```json
{
  "version": 2,
  "buildCommand": "cd apps/api && pnpm install && pnpm build",
  "installCommand": "pnpm install",
  "rewrites": [
    {
      "source": "/api/(.*)",
      "destination": "/api"
    }
  ],
  "functions": {
    "api/index.ts": {
      "runtime": "nodejs20.x",
      "memory": 1024,
      "maxDuration": 30
    }
  },
  "env": {
    "NODE_ENV": "production"
  },
  "regions": ["cdg1"]
}
```

### Solution 3 : Vérifier que le build fonctionne

```bash
# Depuis la racine
cd apps/api
pnpm install
pnpm build

# Vérifier que dist/index.js existe
ls -la dist/index.js
```

### Solution 4 : Vérifier les variables d'environnement

Dans le dashboard Vercel, vérifiez que :
- `DATABASE_URL` est configurée
- `JWT_SECRET` est configurée
- `CORS_ORIGIN` est configurée (optionnel mais recommandé)

---

## 🧪 Test Local

### 1. Tester avec Vercel Dev

```bash
# Depuis la racine du projet
vercel dev
```

Cela démarre un serveur local qui simule Vercel.

### 2. Tester les Routes

```bash
# Test de la route health
curl http://localhost:3000/api/health

# Test avec verbose pour voir les headers
curl -v http://localhost:3000/api/health

# Test d'une autre route
curl http://localhost:3000/api/auth
```

### 3. Vérifier les Logs Locaux

Les logs devraient apparaître dans le terminal où `vercel dev` est lancé.

---

## 🚀 Déploiement

### 1. Redéployer sur Vercel

```bash
# Depuis la racine du projet
vercel --prod
```

### 2. Vérifier les Logs après Déploiement

```bash
# Voir les logs en temps réel
vercel logs --follow

# Ou depuis le dashboard Vercel
# Allez dans votre projet → Deployments → Cliquez sur un déploiement → Logs
```

### 3. Tester les Routes Déployées

```bash
# Remplacer par votre URL Vercel
curl https://votre-projet-api.vercel.app/api/health

# Test avec verbose
curl -v https://votre-projet-api.vercel.app/api/health
```

---

## 📊 Checklist de Vérification

- [ ] `api/index.ts` existe à la racine
- [ ] `vercel.json` est à la racine et correctement configuré
- [ ] `apps/api/src/index.ts` exporte `export default async function handler`
- [ ] Le build fonctionne : `cd apps/api && pnpm build`
- [ ] `apps/api/dist/index.js` existe après le build
- [ ] Variables d'environnement configurées dans Vercel
- [ ] `DATABASE_URL` est correcte
- [ ] `JWT_SECRET` est configurée
- [ ] Test local avec `vercel dev` fonctionne
- [ ] Logs apparaissent dans `vercel logs --follow`

---

## 🆘 Si le Problème Persiste

### 1. Vérifier les Logs Vercel

Les logs vous diront exactement où le problème se situe :
- Si `[API Entry]` n'apparaît pas → Problème de configuration Vercel
- Si `[Vercel Handler]` n'apparaît pas → Problème de routing
- Si `[Express]` n'apparaît pas → Problème de passage à Express
- Si une erreur apparaît → Vérifier le message d'erreur

### 2. Vérifier la Structure du Projet

```
ScolarFlow/
├── api/
│   └── index.ts          ← Doit exister
├── apps/
│   └── api/
│       ├── src/
│       │   └── index.ts ← Handler principal
│       └── dist/
│           └── index.js ← Généré par le build
├── vercel.json           ← Configuration Vercel
└── package.json
```

### 3. Vérifier la Configuration Vercel

Dans le dashboard Vercel :
- **Settings** → **General** → Vérifier que le **Root Directory** est correct
- **Settings** → **Environment Variables** → Vérifier toutes les variables
- **Deployments** → Vérifier les logs du dernier déploiement

---

## 📝 Fichiers Modifiés

1. **`apps/api/src/index.ts`** : Ajout de logs détaillés dans le handler
2. **`apps/api/src/server.ts`** : Ajout de logs dans le middleware Express
3. **`api/index.ts`** : Ajout de logs au point d'entrée
4. **`vercel.json`** : Configuration pour API seule (déjà correcte)

---

## 🎯 Résultat Attendu

Après correction et redéploiement :
- ✅ Les routes `/api/*` fonctionnent correctement
- ✅ Plus d'erreurs 404 NOT_FOUND
- ✅ Les logs apparaissent dans `vercel logs --follow`
- ✅ L'API répond correctement aux requêtes

---

## 📞 Support

Si le problème persiste après avoir suivi ce guide :
1. Vérifier les logs Vercel avec `vercel logs --follow`
2. Copier les logs complets
3. Vérifier que tous les fichiers sont correctement configurés
4. Tester localement avec `vercel dev`

