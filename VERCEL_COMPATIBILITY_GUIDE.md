# ✅ Guide de Compatibilité Vercel - API Scolar Flow

## 🎯 Objectif

Adapter le projet API pour qu'il soit **100% compatible avec Vercel** et résoudre l'erreur **404 NOT_FOUND**.

---

## 📋 Structure Finale

```
ScolarFlow/
├── api/
│   └── index.ts                 # Point d'entrée Vercel (NOUVEAU)
├── apps/
│   └── api/                     # Backend Express/TypeScript
│       ├── src/
│       │   ├── index.ts         # Handler Vercel (existant)
│       │   ├── server.ts        # App Express (existant)
│       │   └── ...
│       └── package.json
├── vercel.json                  # Configuration Vercel (MIS À JOUR)
└── package.json
```

---

## 🔧 Fichiers Modifiés/Créés

### 1. `vercel.json` (Mis à jour)

```json
{
  "version": 2,
  "builds": [
    {
      "src": "api/index.ts",
      "use": "@vercel/node"
    }
  ],
  "routes": [
    {
      "src": "/api/(.*)",
      "dest": "api/index.ts"
    },
    {
      "src": "/",
      "dest": "api/index.ts"
    }
  ],
  "buildCommand": "cd apps/api && pnpm install && pnpm build",
  "installCommand": "pnpm install",
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

**Points importants :**
- ✅ `builds` : Configure `api/index.ts` comme fonction serverless
- ✅ `routes` : Redirige `/api/*` et `/` vers `api/index.ts`
- ✅ `buildCommand` : Build uniquement `apps/api`
- ✅ `functions` : Configuration runtime Node.js 20

---

### 2. `api/index.ts` (Créé/Mis à jour)

Ce fichier est le **point d'entrée principal** pour Vercel.

**Fonctionnalités :**
- ✅ Importe l'app Express depuis `apps/api/src/server`
- ✅ Initialise les routes API dynamiquement
- ✅ Gère la connexion à la base de données
- ✅ Route racine `/` : "API Scolar Flow is running 🚀"
- ✅ Route de test `/api/hello` : `{ "message": "Hello from Scolar Flow API" }`
- ✅ Exporte un handler Vercel compatible

**Structure :**
```typescript
// Import de l'app Express
import { app } from '../apps/api/src/server';

// Initialisation des routes
async function initializeApp() {
  // Connexion DB
  // Initialisation des routes API
  // Configuration des middlewares d'erreur
}

// Routes simples
app.get('/', (req, res) => {
  res.send('API Scolar Flow is running 🚀');
});

app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Scolar Flow API' });
});

// Handler Vercel
export default async function handler(req: VercelRequest, res: VercelResponse) {
  await initializeApp();
  // Passe la requête à Express
}
```

---

## 🚀 Comportement Attendu

### Après Déploiement sur Vercel

1. **Route racine** :
   ```
   GET https://scolar-flow-api.vercel.app/
   ```
   **Réponse :** `API Scolar Flow is running 🚀`

2. **Route de test** :
   ```
   GET https://scolar-flow-api.vercel.app/api/hello
   ```
   **Réponse :** 
   ```json
   {
     "message": "Hello from Scolar Flow API"
   }
   ```

3. **Route health** :
   ```
   GET https://scolar-flow-api.vercel.app/api/health
   ```
   **Réponse :** 
   ```json
   {
     "success": true,
     "status": "healthy",
     "timestamp": "2025-01-11T...",
     "version": "1.0.0",
     "environment": "production",
     "services": {
       "database": "connected",
       "api": "operational"
     }
   }
   ```

4. **Toutes les autres routes API** :
   ```
   GET https://scolar-flow-api.vercel.app/api/auth
   GET https://scolar-flow-api.vercel.app/api/classes
   GET https://scolar-flow-api.vercel.app/api/students
   ...
   ```
   **Réponse :** Fonctionnent correctement

---

## 🔍 Debug et Logs

### Logs Disponibles

Le fichier `api/index.ts` inclut des logs détaillés pour le debug :

```
[API Entry] ========================================
[API Entry] 📥 API request received
[API Entry] Method: GET
[API Entry] URL: /api/health
[API Entry] Path: /api/health
[API Entry] ========================================
[API Entry] 🔄 Initializing app...
[API Entry] ✅ Connected to PostgreSQL database
[API Entry] ✅ File directories initialized
[API Entry] 🔄 Initializing API routes...
[API Entry] ✅ API routes initialized successfully
[API Entry] ✅ App initialized successfully
[API Entry] 🔀 Routing to Express app
[API Entry] 📤 Passing request to Express app
[Express] GET /api/health
[Express] Path: /api/health
[API Entry] ✅ Request handled successfully
[API Entry] Response status: 200
```

### Voir les Logs Vercel

```bash
# Voir les logs en temps réel
vercel logs --follow

# Ou depuis le dashboard Vercel
# Allez dans votre projet → Deployments → Cliquez sur un déploiement → Logs
```

---

## ✅ Checklist de Vérification

### Avant Déploiement

- [ ] `api/index.ts` existe à la racine
- [ ] `vercel.json` est à la racine et correctement configuré
- [ ] `apps/api/src/server.ts` exporte `app`
- [ ] `apps/api/src/index.ts` existe (pour compatibilité)
- [ ] Variables d'environnement configurées dans Vercel :
  - [ ] `DATABASE_URL`
  - [ ] `JWT_SECRET`
  - [ ] `JWT_REFRESH_SECRET` (optionnel)
  - [ ] `CORS_ORIGIN` (optionnel)
  - [ ] `NODE_ENV` (défini automatiquement)

### Après Déploiement

- [ ] Route `/` répond : "API Scolar Flow is running 🚀"
- [ ] Route `/api/hello` répond : `{ "message": "Hello from Scolar Flow API" }`
- [ ] Route `/api/health` répond avec le statut de l'API
- [ ] Toutes les routes `/api/*` fonctionnent
- [ ] Plus d'erreur 404 NOT_FOUND
- [ ] Logs apparaissent dans `vercel logs --follow`

---

## 🧪 Test Local

### 1. Tester avec Vercel Dev

```bash
# Depuis la racine du projet
vercel dev
```

### 2. Tester les Routes

```bash
# Test route racine
curl http://localhost:3000/

# Test route hello
curl http://localhost:3000/api/hello

# Test route health
curl http://localhost:3000/api/health
```

### 3. Vérifier les Logs

Les logs devraient apparaître dans le terminal où `vercel dev` est lancé.

---

## 🚀 Déploiement

### 1. Redéployer sur Vercel

```bash
# Depuis la racine du projet
vercel --prod
```

### 2. Vérifier le Déploiement

```bash
# Tester les routes
curl https://votre-projet-api.vercel.app/
curl https://votre-projet-api.vercel.app/api/hello
curl https://votre-projet-api.vercel.app/api/health

# Voir les logs
vercel logs --follow
```

---

## 🆘 Résolution de Problèmes

### Problème : Erreur 404 persiste

**Solutions :**
1. Vérifier que `api/index.ts` existe à la racine
2. Vérifier que `vercel.json` configure correctement `api/index.ts`
3. Vérifier les logs Vercel avec `vercel logs --follow`
4. Vérifier que le build fonctionne : `cd apps/api && pnpm build`

### Problème : Erreur "Cannot find module"

**Solutions :**
1. Vérifier que `pnpm install` s'exécute correctement
2. Vérifier que toutes les dépendances sont dans `apps/api/package.json`
3. Vérifier que le build génère correctement les fichiers

### Problème : Erreur de connexion à la base de données

**Solutions :**
1. Vérifier que `DATABASE_URL` est configurée dans Vercel
2. Vérifier que l'URL de connexion est correcte
3. Vérifier que le firewall de la base de données autorise les connexions depuis Vercel

---

## 📝 Résumé des Changements

### Fichiers Modifiés

1. **`vercel.json`** :
   - Ajout de `builds` avec `api/index.ts`
   - Ajout de `routes` pour `/api/*` et `/`
   - Configuration de la fonction serverless

2. **`api/index.ts`** :
   - Créé/Mis à jour pour être le point d'entrée Vercel
   - Ajout des routes `/` et `/api/hello`
   - Initialisation des routes API
   - Handler Vercel compatible

### Fichiers Non Modifiés

- `apps/api/src/server.ts` : Reste inchangé (exporte `app`)
- `apps/api/src/index.ts` : Reste inchangé (pour compatibilité)
- `apps/api/package.json` : Reste inchangé
- `apps/api/tsconfig.json` : Reste inchangé

---

## 🎯 Résultat Attendu

Après déploiement :
- ✅ Route `/` fonctionne : "API Scolar Flow is running 🚀"
- ✅ Route `/api/hello` fonctionne : `{ "message": "Hello from Scolar Flow API" }`
- ✅ Toutes les routes `/api/*` fonctionnent
- ✅ Plus d'erreur 404 NOT_FOUND
- ✅ Logs détaillés disponibles dans Vercel
- ✅ API 100% compatible avec Vercel

---

## 📞 Support

Si le problème persiste :
1. Vérifier les logs Vercel : `vercel logs --follow`
2. Tester localement : `vercel dev`
3. Vérifier la configuration : `vercel.json` et `api/index.ts`
4. Vérifier les variables d'environnement dans Vercel

Le projet est maintenant **100% compatible avec Vercel** ! 🚀

