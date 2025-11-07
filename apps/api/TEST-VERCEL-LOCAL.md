# Guide de Test Local pour Vercel

Ce guide vous explique comment tester votre API localement dans un environnement similaire à Vercel pour détecter et corriger les erreurs `MODULE_LOAD_ERROR` avant le déploiement.

## 🎯 Objectif

Éviter les erreurs de déploiement sur Vercel en testant localement que :
- Tous les modules se chargent correctement
- Les chemins d'import sont corrects
- Les exports sont présents
- L'application peut démarrer dans un environnement serverless

## 📋 Prérequis

1. Avoir fait le build de l'API : `pnpm build`
2. Avoir Node.js installé
3. Avoir les variables d'environnement configurées (au moins `DATABASE_URL`)

## 🔍 Étape 1 : Vérifier le Build

Avant de tester, vérifiez que le build a généré tous les fichiers nécessaires :

### Sur Windows (PowerShell) :
```powershell
.\scripts\verify-build.ps1
```

### Sur Linux/Mac :
```bash
node scripts/verify-build.cjs
```

Ce script vérifie :
- ✅ Que `dist/server.js` existe
- ✅ Que `dist/routes/index.js` existe
- ✅ Que `dist/middleware/errorHandler.js` existe
- ✅ Que `api/server.js` existe
- ✅ Que les exports `app` et `prisma` sont présents dans `dist/server.js`

**Si des fichiers manquent**, lancez :
```bash
pnpm build
```

## 🧪 Étape 2 : Tester Localement (Simulation Vercel)

Testez le chargement des modules comme le ferait Vercel :

### Sur Windows (PowerShell) :
```powershell
.\scripts\test-vercel-local.ps1
```

### Sur Linux/Mac :
```bash
node scripts/test-vercel-local.cjs
```

Ce script :
1. Vérifie que tous les fichiers nécessaires existent
2. Simule l'environnement Vercel (`VERCEL=1`, `NODE_ENV=production`)
3. Tente d'importer `api/server.js`
4. Teste l'exécution du handler avec une requête mock

## 🔧 Étape 3 : Corriger les Erreurs Courantes

### Erreur : "Cannot find module '../dist/server.js'"

**Cause** : Le fichier `dist/server.js` n'existe pas ou le chemin est incorrect.

**Solution** :
1. Vérifiez que le build a réussi : `pnpm build`
2. Vérifiez que `dist/server.js` existe
3. Vérifiez les logs dans `api/server.js` pour voir les chemins testés

### Erreur : "server.js does not export app and prisma"

**Cause** : Les exports ne sont pas corrects dans `dist/server.js`.

**Solution** :
1. Vérifiez que `src/server.ts` exporte bien `app` et `prisma` :
   ```typescript
   export { app };
   export const prisma = new PrismaClient(...);
   ```
2. Relancez le build : `pnpm build`
3. Vérifiez le contenu de `dist/server.js` pour confirmer les exports

### Erreur : "MODULE_NOT_FOUND"

**Cause** : Un module ou une dépendance est manquante.

**Solution** :
1. Vérifiez que toutes les dépendances sont installées : `pnpm install`
2. Vérifiez que Prisma Client est généré : `pnpm prisma generate`
3. Vérifiez les logs pour identifier le module manquant

### Erreur : "Database connection failed"

**Cause** : La variable d'environnement `DATABASE_URL` n'est pas définie.

**Solution** :
1. Créez un fichier `.env` avec `DATABASE_URL`
2. Pour le test local, vous pouvez utiliser une URL de test (même si la DB n'existe pas, le test vérifie juste le chargement des modules)

## 📝 Étape 4 : Vérifier les Logs

Si le test échoue, examinez les logs détaillés :

1. **Logs de chargement des modules** : Vérifiez les chemins testés
2. **Logs d'import** : Vérifiez les erreurs d'import spécifiques
3. **Logs d'exports** : Vérifiez quels exports sont disponibles

Les logs incluent :
- Le répertoire de travail actuel
- Les chemins testés pour l'import
- Les exports disponibles dans les modules
- Les erreurs détaillées avec codes et messages

## 🚀 Étape 5 : Déployer sur Vercel

Une fois que le test local passe :

1. **Committez vos changements** :
   ```bash
   git add .
   git commit -m "Fix: Amélioration de la gestion des erreurs de modules"
   git push
   ```

2. **Vérifiez sur Vercel** :
   - Les logs de build
   - Les logs de déploiement
   - Les logs de runtime (Function Logs)

3. **Testez l'endpoint** :
   ```bash
   curl https://votre-api.vercel.app/api/health
   ```

## 🔍 Debugging sur Vercel

Si l'erreur persiste sur Vercel :

1. **Vérifiez les logs Vercel** :
   - Allez dans votre projet Vercel
   - Cliquez sur "Functions" → votre fonction → "Logs"
   - Cherchez les logs `[Vercel]` pour voir les détails

2. **Vérifiez la configuration** :
   - `vercel.json` : Vérifiez que `functions` pointe vers `api/server.js`
   - `package.json` : Vérifiez que `build` génère bien les fichiers
   - Variables d'environnement : Vérifiez que `DATABASE_URL` est définie

3. **Vérifiez le build** :
   - Les logs de build Vercel montrent si le build a réussi
   - Vérifiez que `dist/` est bien créé
   - Vérifiez que `api/server.js` est présent

## 📚 Scripts Disponibles

Ajoutez ces scripts à votre `package.json` pour faciliter les tests :

```json
{
  "scripts": {
    "test:vercel": "node scripts/test-vercel-local.cjs",
    "verify:build": "node scripts/verify-build.cjs"
  }
}
```

Puis utilisez :
```bash
pnpm test:vercel
pnpm verify:build
```

## ✅ Checklist Avant Déploiement

- [ ] Le build passe sans erreur : `pnpm build`
- [ ] La vérification du build passe : `pnpm verify:build`
- [ ] Le test Vercel local passe : `pnpm test:vercel`
- [ ] Les variables d'environnement sont configurées
- [ ] Les logs ne montrent pas d'erreurs de modules
- [ ] L'endpoint `/api/health` répond correctement en local

## 🆘 Besoin d'Aide ?

Si vous rencontrez toujours des erreurs :

1. **Vérifiez les logs détaillés** dans la console
2. **Comparez avec un build qui fonctionnait** auparavant
3. **Vérifiez les changements récents** dans `api/server.js` ou `src/server.ts`
4. **Consultez la documentation Vercel** sur les serverless functions

## 📖 Ressources

- [Documentation Vercel Serverless Functions](https://vercel.com/docs/functions)
- [Documentation Node.js ES Modules](https://nodejs.org/api/esm.html)
- [Documentation Prisma](https://www.prisma.io/docs)

