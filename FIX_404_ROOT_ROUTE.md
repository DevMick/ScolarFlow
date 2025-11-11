# 🔧 Correction du Problème 404 sur la Route Racine

## 🐛 Problème Identifié

La route racine `/` retournait 404 sur Vercel (`scolar-flow-api.vercel.app/`).

### Cause

Le fichier `vercel.json` contient un rewrite qui redirige `/` vers `/api` :

```json
{
  "rewrites": [
    {
      "source": "/",
      "destination": "/api"
    }
  ]
}
```

Quand une requête arrive sur `/`, Vercel la réécrit en `/api` avant de l'envoyer au handler. Donc dans le code Express, `req.url = '/api'`.

Mais la route était définie comme :
```typescript
app.get('/', (req, res) => { ... })
```

Cette route ne match pas `/api`, donc la requête tombait dans le `notFoundHandler` et retournait 404.

## ✅ Solution

Modifier la route pour gérer à la fois `/` et `/api` :

```typescript
// Handle both / and /api because vercel.json rewrites / to /api
app.get(['/', '/api'], (req, res) => {
  res.json({
    success: true,
    message: 'API Scolar Flow is running 🚀',
    version: '1.0.0',
    endpoints: {
      health: '/api/health',
      hello: '/api/hello'
    }
  });
});
```

## 📝 Fichier Modifié

- `api/index.ts` - Ligne 69 : Route racine modifiée pour gérer `['/', '/api']`

## 🚀 Déploiement

Après cette correction :

1. **Rebuild l'API** :
   ```powershell
   cd apps/api
   pnpm build
   ```

2. **Commit et push** :
   ```powershell
   git add api/index.ts
   git commit -m "fix: Correction 404 route racine - gérer / et /api"
   git push origin main
   ```

3. **Vercel redéploiera automatiquement** et la route `/` devrait maintenant fonctionner.

## ✅ Test

Après déploiement, tester :
- `https://scolar-flow-api.vercel.app/` → Devrait retourner JSON avec `success: true`
- `https://scolar-flow-api.vercel.app/api/health` → Devrait fonctionner
