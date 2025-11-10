# 🚀 Guide de Déploiement API sur Vercel

## 📋 Structure du Projet

```
ScolarFlow/
├── api/                          # Point d'entrée Vercel pour l'API
│   └── index.ts                 # Re-export du handler Express
├── apps/
│   ├── api/                      # Backend Express/TypeScript
│   │   ├── src/
│   │   │   └── index.ts         # Handler Vercel Serverless Function
│   │   └── package.json
│   └── web/                      # Frontend Vite (déployé séparément sur scolarflow.com)
├── packages/
│   └── shared/                   # Code partagé
├── vercel.json                   # Configuration Vercel pour l'API
└── package.json                  # Root package.json
```

---

## 📁 Fichiers de Configuration

### 1. `api/index.ts` (Point d'entrée Vercel)

```typescript
// Re-export du handler Vercel depuis apps/api/src/index.ts
export { default } from '../apps/api/src/index';
```

**Rôle :** Vercel détecte automatiquement les fichiers dans le dossier `api/` comme des fonctions serverless. Ce fichier re-exporte simplement le handler principal.

---

### 2. `vercel.json` (Configuration Vercel)

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

**Configuration :**
- **buildCommand** : Build uniquement l'API (pas le frontend)
- **rewrites** : Toutes les routes `/api/*` sont redirigées vers `/api` (fonction serverless)
- **functions** : Configuration de la fonction serverless (runtime Node.js 20, mémoire, durée max)
- **regions** : Région de déploiement (cdg1 = Paris)

---

## 🧪 Test Local

### 1. Installer Vercel CLI

```bash
npm i -g vercel
```

### 2. Tester localement

```bash
# Depuis la racine du projet
vercel dev
```

Cela démarre un serveur local qui simule l'environnement Vercel.

### 3. URLs de Test

Une fois `vercel dev` lancé, testez les endpoints :

- **Health Check** : `http://localhost:3000/api/health`
- **Database Status** : `http://localhost:3000/api/health/db-status`
- **Auth** : `http://localhost:3000/api/auth`
- **Classes** : `http://localhost:3000/api/classes`
- **Students** : `http://localhost:3000/api/students`
- **Evaluations** : `http://localhost:3000/api/evaluations`

### 4. Test avec curl

```bash
# Test de la route health
curl http://localhost:3000/api/health

# Test avec verbose pour voir les headers
curl -v http://localhost:3000/api/health

# Test de la route auth (POST)
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"test123"}'
```

---

## 🔧 Build de l'API

### Vérifier que le build fonctionne

```bash
# Depuis la racine du projet
cd apps/api
pnpm install
pnpm build
```

**Commandes exécutées :**
1. `prisma generate` : Génère le client Prisma
2. `tsc` : Compile TypeScript vers JavaScript
3. `node scripts/fix-import-extensions.cjs` : Corrige les extensions d'import

**Résultat attendu :**
- Dossier `apps/api/dist/` créé
- Fichier `apps/api/dist/index.js` généré
- Aucune erreur TypeScript

---

## 🌍 Variables d'Environnement sur Vercel

### Configuration dans le Dashboard Vercel

1. Allez dans **Settings** → **Environment Variables**
2. Ajoutez les variables suivantes :

#### Variables Requises

| Variable | Description | Exemple |
|----------|-------------|---------|
| `DATABASE_URL` | URL de connexion PostgreSQL | `postgresql://user:password@host:port/database?sslmode=require` |
| `JWT_SECRET` | Secret pour signer les tokens JWT | `votre-secret-jwt-super-securise` |

#### Variables Optionnelles

| Variable | Description | Exemple |
|----------|-------------|---------|
| `CORS_ORIGIN` | Origine autorisée pour CORS | `https://www.scolarflow.com` |
| `NODE_ENV` | Environnement (défini automatiquement) | `production` |

### Configuration par Environnement

Vous pouvez définir des variables différentes pour :
- **Production** : Variables pour la production
- **Preview** : Variables pour les previews (pull requests)
- **Development** : Variables pour le développement local

---

## 🚀 Déploiement sur Vercel

### 1. Première Déploiement

```bash
# Depuis la racine du projet
vercel
```

**Étapes :**
1. Suivez les instructions pour lier le projet à un projet Vercel existant ou créer un nouveau projet
2. Configurez les variables d'environnement si demandé
3. Attendez la fin du build et du déploiement

### 2. Déploiement en Production

```bash
vercel --prod
```

### 3. Vérifier les Logs

```bash
# Voir les logs en temps réel
vercel logs

# Voir les logs d'une fonction spécifique
vercel logs --follow
```

---

## 📍 Routes API Disponibles

### Routes Principales

| Route | Méthode | Description |
|-------|---------|-------------|
| `/api/health` | GET | Health check de l'API |
| `/api/health/db-status` | GET | Statut de la base de données |
| `/api/auth/login` | POST | Connexion utilisateur |
| `/api/auth/register` | POST | Inscription utilisateur |
| `/api/classes` | GET, POST | Gestion des classes |
| `/api/students` | GET, POST | Gestion des étudiants |
| `/api/evaluations` | GET, POST | Gestion des évaluations |
| `/api/notes` | GET, POST | Gestion des notes |
| `/api/moyennes` | GET | Calcul des moyennes |
| `/api/admin/auth/login` | POST | Connexion admin |
| `/api/admin/payments` | GET | Gestion des paiements (admin) |

### Routes Complètes

Toutes les routes sont montées avec le préfixe `/api/` dans `apps/api/src/server.ts` et `apps/api/src/index.ts`.

---

## ✅ Vérifications Post-Déploiement

### 1. Tester la Route Health

```bash
curl https://votre-projet-api.vercel.app/api/health
```

**Réponse attendue :**
```json
{
  "status": "ok",
  "timestamp": "2025-01-11T00:00:00.000Z",
  "service": "EduStats API",
  "version": "1.0.0",
  "database": "connected",
  "environment": "production"
}
```

### 2. Vérifier les Logs

```bash
vercel logs --follow
```

Cherchez les messages :
- `[Vercel] ✅ Variables d'environnement requises présentes`
- `[Vercel] ✅ Connected to PostgreSQL database`
- `[Vercel] ✅ API routes initialized successfully`
- `[Vercel] ✅ App initialized successfully`

### 3. Tester une Route Authentifiée

```bash
# 1. Se connecter pour obtenir un token
curl -X POST https://votre-projet-api.vercel.app/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"votre-email@example.com","password":"votre-mot-de-passe"}'

# 2. Utiliser le token pour accéder à une route protégée
curl https://votre-projet-api.vercel.app/api/classes \
  -H "Authorization: Bearer VOTRE_TOKEN_JWT"
```

---

## 🔍 Résolution de Problèmes

### Erreur : `NOT_FOUND` sur les routes `/api/*`

**Solutions :**
1. Vérifier que `api/index.ts` existe et exporte correctement
2. Vérifier que `apps/api/src/index.ts` exporte `export default async function handler`
3. Vérifier les logs Vercel : `vercel logs --follow`
4. Vérifier que le build fonctionne : `cd apps/api && pnpm build`

### Erreur : `FUNCTION_INVOCATION_FAILED`

**Solutions :**
1. Vérifier les variables d'environnement dans le dashboard Vercel
2. Vérifier que `DATABASE_URL` est correctement configurée
3. Vérifier les logs pour voir l'erreur exacte
4. Vérifier que Prisma est correctement généré : `cd apps/api && pnpm prisma generate`

### Erreur : `Cannot find module`

**Solutions :**
1. Vérifier que toutes les dépendances sont dans `apps/api/package.json`
2. Vérifier que `pnpm install` s'exécute correctement
3. Vérifier que le build génère correctement `apps/api/dist/index.js`

---

## 📝 Notes Importantes

1. **Frontend séparé** : Le frontend est déployé séparément sur `https://www.scolarflow.com/` et n'est pas inclus dans ce déploiement Vercel.

2. **CORS** : Assurez-vous que `CORS_ORIGIN` est configuré pour autoriser les requêtes depuis `https://www.scolarflow.com/`.

3. **Base de données** : La base de données PostgreSQL doit être accessible depuis Vercel. Vérifiez que l'URL de connexion est correcte et que le firewall autorise les connexions depuis Vercel.

4. **Build** : Le build de l'API est exécuté dans `apps/api/`, pas à la racine. La commande `buildCommand` dans `vercel.json` gère cela.

5. **Fonctions Serverless** : Vercel compile automatiquement TypeScript, donc `api/index.ts` peut importer depuis `apps/api/src/index.ts` même si c'est du TypeScript.

---

## 🎯 Résultat Attendu

Après déploiement :
- ✅ L'API est accessible sur `https://votre-projet-api.vercel.app/api/health`
- ✅ Toutes les routes `/api/*` fonctionnent correctement
- ✅ Plus d'erreurs `NOT_FOUND` pour les routes API
- ✅ Le frontend sur `https://www.scolarflow.com/` peut appeler l'API
- ✅ Les variables d'environnement sont correctement configurées

---

## 📞 Support

En cas de problème :
1. Vérifier les logs Vercel : `vercel logs --follow`
2. Tester localement : `vercel dev`
3. Vérifier le build local : `cd apps/api && pnpm build`
4. Consulter la documentation Vercel : https://vercel.com/docs

