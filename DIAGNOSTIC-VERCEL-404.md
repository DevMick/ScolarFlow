# 🔍 Diagnostic Erreur 404 Vercel

## ❌ Problème Actuel

Toutes les routes retournent **404 NOT_FOUND** :
- `GET /` → 404
- `GET /api/health` → 404
- `GET /api/hello` → 404

## 🔍 Causes Possibles

### 1. Vercel ne détecte pas la fonction serverless

**Vérification** :
- Allez sur https://vercel.com/dashboard
- Ouvrez votre projet
- Allez dans l'onglet **Functions**
- Vérifiez si `api/index.ts` apparaît dans la liste

**Si `api/index.ts` n'apparaît pas** :
- Vercel ne détecte pas automatiquement la fonction
- Il faut peut-être utiliser `builds` dans `vercel.json`

### 2. Erreur de build/compilation

**Vérification** :
- Allez dans l'onglet **Deployments**
- Ouvrez le dernier déploiement
- Vérifiez les **Build Logs**
- Cherchez les erreurs de compilation TypeScript

**Erreurs possibles** :
- Erreurs d'import
- Erreurs de dépendances manquantes
- Erreurs de compilation TypeScript

### 3. Variables d'environnement manquantes

**Vérification** :
- Allez dans **Settings** → **Environment Variables**
- Vérifiez que toutes les variables sont configurées :
  - `DATABASE_URL`
  - `JWT_SECRET`
  - `JWT_REFRESH_SECRET`
  - `CORS_ORIGIN`
  - `NODE_ENV`

### 4. Configuration Root Directory incorrecte

**Vérification** :
- Allez dans **Settings** → **General**
- Vérifiez le **Root Directory**
- Si un Root Directory est configuré, Vercel cherche `vercel.json` dans ce répertoire

**Solution** :
- Si Root Directory = `/` ou vide → `vercel.json` doit être à la racine ✅
- Si Root Directory = `/apps/api` → `vercel.json` doit être dans `apps/api/` ❌

## 🛠️ Solutions à Essayer

### Solution 1 : Vérifier les logs Vercel

```bash
# Dans votre terminal
vercel logs https://scolar-flow-api.vercel.app
```

Cherchez :
- `[API Entry]` → Si absent, la fonction n'est pas appelée
- Erreurs de compilation
- Erreurs d'initialisation

### Solution 2 : Vérifier le build local

```bash
cd apps/api
pnpm install
pnpm build
```

Vérifiez que le build fonctionne sans erreur.

### Solution 3 : Essayer avec `builds` explicite

Modifier `vercel.json` pour utiliser `builds` :

```json
{
  "version": 2,
  "buildCommand": "cd apps/api && pnpm install && pnpm build",
  "installCommand": "pnpm install",
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
  "functions": {
    "api/index.ts": {
      "runtime": "nodejs20.x",
      "memory": 1024,
      "maxDuration": 30
    }
  }
}
```

## 📋 Checklist de Diagnostic

- [ ] Vérifier que `api/index.ts` existe à la racine
- [ ] Vérifier que `vercel.json` est à la racine
- [ ] Vérifier les logs de build Vercel
- [ ] Vérifier les logs runtime Vercel
- [ ] Vérifier les variables d'environnement
- [ ] Vérifier le Root Directory dans Vercel
- [ ] Vérifier que le build local fonctionne
- [ ] Vérifier que `api/index.ts` exporte bien `export default handler`

## 🆘 Prochaines Étapes

1. **Vérifier les logs Vercel** dans le dashboard
2. **Partager les logs** pour diagnostic approfondi
3. **Vérifier la configuration** Root Directory dans Vercel
4. **Tester le build local** pour s'assurer qu'il fonctionne

