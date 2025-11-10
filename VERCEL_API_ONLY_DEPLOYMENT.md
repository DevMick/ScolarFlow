# 🚀 Déploiement API Seule sur Vercel

## ✅ Confirmation

**OUI, vous déployez uniquement l'API sur Vercel.**

Le frontend est déjà déployé sur **https://www.scolarflow.com/** et reste indépendant.

---

## 📋 Configuration Actuelle

### Structure du Projet

```
ScolarFlow/
├── api/                          # Point d'entrée Vercel pour l'API
│   └── index.ts                 # Re-export du handler Express
├── apps/
│   ├── api/                      # Backend Express/TypeScript (à déployer)
│   │   ├── src/
│   │   │   └── index.ts         # Handler Vercel Serverless Function
│   │   └── package.json
│   └── web/                      # Frontend Vite (déjà déployé sur scolarflow.com)
├── vercel.json                   # Configuration Vercel pour l'API UNIQUEMENT
└── package.json                  # Root package.json
```

---

## ⚙️ Configuration Vercel

### Fichier `vercel.json` (à la racine)

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

**Points importants :**
- ✅ `buildCommand` : Build uniquement `apps/api` (pas le frontend)
- ✅ `rewrites` : Redirige uniquement `/api/*` vers la fonction serverless
- ✅ Aucune configuration pour le frontend
- ✅ Aucun `outputDirectory` pour le frontend

---

## 🎯 Configuration du Projet Vercel

### Dans le Dashboard Vercel

Lors de la création ou configuration du projet API sur Vercel :

1. **Project Settings** → **General**
   - **Root Directory** : Laisser vide ou mettre `/` (racine du monorepo)
   - **Framework Preset** : `Other` ou `Node.js`
   - **Build Command** : `cd apps/api && pnpm install && pnpm build` (déjà dans vercel.json)
   - **Output Directory** : Laisser vide (pas de build statique)
   - **Install Command** : `pnpm install` (déjà dans vercel.json)

2. **Project Settings** → **Environment Variables**
   - `DATABASE_URL`
   - `JWT_SECRET`
   - `JWT_REFRESH_SECRET`
   - `CORS_ORIGIN` (ex: `https://www.scolarflow.com`)
   - `NODE_ENV` (défini automatiquement)

3. **Project Settings** → **Functions**
   - Vercel détecte automatiquement `api/index.ts` comme fonction serverless
   - Runtime : Node.js 20.x
   - Région : cdg1 (Paris)

---

## ⚠️ Fichiers à Ignorer

### Fichiers `vercel.json` dans les sous-dossiers

Il existe d'autres fichiers `vercel.json` dans le projet :
- `apps/api/vercel.json` - Ancien fichier (peut être ignoré)
- `apps/web/vercel.json` - Pour le frontend (non utilisé car frontend déployé ailleurs)

**Important :** Vercel utilise uniquement le `vercel.json` à la **racine** du projet.

Si vous avez configuré un **Root Directory** dans Vercel, Vercel cherchera le `vercel.json` dans ce répertoire.

---

## 🔍 Vérification

### Comment vérifier que seul l'API est déployée

1. **Vérifier les logs de build Vercel**
   - Le build doit exécuter : `cd apps/api && pnpm install && pnpm build`
   - Aucun build du frontend ne doit être exécuté

2. **Vérifier les routes disponibles**
   - ✅ `/api/health` → Doit fonctionner
   - ✅ `/api/auth` → Doit fonctionner
   - ✅ `/api/classes` → Doit fonctionner
   - ❌ `/` → Doit retourner 404 (pas de frontend)
   - ❌ `/index.html` → Doit retourner 404 (pas de frontend)

3. **Vérifier les fonctions serverless**
   - Dans Vercel Dashboard → **Functions**
   - Une seule fonction doit apparaître : `api/index.ts`

---

## 🚀 Déploiement

### 1. Préparer le projet

```bash
# Depuis la racine du projet
git add .
git commit -m "feat: Configuration Vercel pour API seule"
git push origin main
```

### 2. Déployer sur Vercel

```bash
# Depuis la racine du projet
vercel --prod
```

Ou depuis le dashboard Vercel :
1. Aller sur https://vercel.com
2. Sélectionner votre projet API
3. Cliquer sur **Deploy**

### 3. Vérifier le déploiement

```bash
# Tester l'API
curl https://votre-projet-api.vercel.app/api/health

# Vérifier les logs
vercel logs --follow
```

---

## 📊 Résultat Attendu

Après déploiement :

- ✅ L'API est accessible sur `https://votre-projet-api.vercel.app/api/health`
- ✅ Toutes les routes `/api/*` fonctionnent
- ✅ Le frontend sur `https://www.scolarflow.com/` peut appeler l'API
- ❌ Les routes `/` retournent 404 (normal, pas de frontend)
- ❌ Aucun fichier frontend n'est déployé

---

## 🔧 Configuration CORS

Puisque le frontend est sur `https://www.scolarflow.com/`, configurez `CORS_ORIGIN` dans Vercel :

```
CORS_ORIGIN=https://www.scolarflow.com
```

Cela permettra au frontend d'appeler l'API sans erreurs CORS.

---

## ✅ Checklist

- [ ] `vercel.json` à la racine configure uniquement l'API
- [ ] `buildCommand` dans vercel.json build uniquement `apps/api`
- [ ] Aucun `outputDirectory` pour le frontend dans vercel.json
- [ ] `rewrites` redirige uniquement `/api/*`
- [ ] Variables d'environnement configurées dans Vercel
- [ ] `CORS_ORIGIN` pointe vers `https://www.scolarflow.com`
- [ ] Test local avec `vercel dev` fonctionne
- [ ] Déploiement sur Vercel réussi
- [ ] Routes `/api/*` fonctionnent
- [ ] Routes `/` retournent 404 (normal)

---

## 🆘 Problèmes Courants

### Problème : Vercel essaie de déployer le frontend

**Solution :**
- Vérifier que `vercel.json` à la racine n'a pas de configuration pour le frontend
- Vérifier que `outputDirectory` n'est pas défini
- Vérifier que `buildCommand` ne build pas le frontend

### Problème : Routes `/api/*` retournent 404

**Solution :**
- Vérifier que `api/index.ts` existe à la racine
- Vérifier que `vercel.json` configure correctement les rewrites
- Vérifier les logs Vercel avec `vercel logs --follow`

### Problème : Erreur CORS depuis le frontend

**Solution :**
- Vérifier que `CORS_ORIGIN` est configuré dans Vercel avec `https://www.scolarflow.com`
- Vérifier que le frontend utilise la bonne URL API

---

## 📝 Résumé

**Configuration actuelle :**
- ✅ API seule déployée sur Vercel
- ✅ Frontend déployé séparément sur `https://www.scolarflow.com/`
- ✅ Configuration `vercel.json` correcte pour API seule
- ✅ Routes `/api/*` configurées correctement

**Le projet est prêt pour le déploiement de l'API seule sur Vercel !**

