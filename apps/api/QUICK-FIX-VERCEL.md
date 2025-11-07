# 🚀 Guide Rapide : Corriger l'Erreur MODULE_LOAD_ERROR sur Vercel

## ⚡ Solution Rapide

### 1. Vérifier le Build Localement

```bash
cd apps/api
pnpm build
pnpm verify:build
```

### 2. Tester Localement (Simulation Vercel)

**Sur Windows (PowerShell)** :
```powershell
.\scripts\test-vercel-local.ps1
```

**Sur Linux/Mac** :
```bash
pnpm test:vercel
```

### 3. Si le Test Local Passe, Déployer

```bash
git add .
git commit -m "Fix: Amélioration gestion erreurs modules"
git push
```

## 🔍 Diagnostic Rapide

### Erreur : "Cannot find module '../dist/server.js'"

**Solution** :
1. Vérifiez que `dist/server.js` existe après le build
2. Vérifiez que `api/server.js` existe
3. Relancez : `pnpm build`

### Erreur : "server.js does not export app and prisma"

**Solution** :
1. Vérifiez que `src/server.ts` exporte bien :
   ```typescript
   export { app };
   export const prisma = new PrismaClient(...);
   ```
2. Relancez : `pnpm build`

### Erreur : "MODULE_NOT_FOUND"

**Solution** :
1. Installez les dépendances : `pnpm install`
2. Générez Prisma : `pnpm prisma generate`
3. Relancez le build : `pnpm build`

## 📋 Checklist Avant Déploiement

- [ ] `pnpm build` passe sans erreur
- [ ] `pnpm verify:build` confirme tous les fichiers
- [ ] `pnpm test:vercel` passe localement
- [ ] Variables d'environnement configurées sur Vercel (DATABASE_URL)

## 🆘 Si Ça Ne Marche Toujours Pas

1. **Vérifiez les logs Vercel** :
   - Allez dans votre projet Vercel
   - Functions → Logs
   - Cherchez les logs `[Vercel]` pour les détails

2. **Vérifiez la configuration** :
   - `vercel.json` : `functions` pointe vers `api/server.js`
   - `package.json` : `build` génère bien les fichiers

3. **Consultez le guide complet** : `TEST-VERCEL-LOCAL.md`

## 📚 Scripts Disponibles

```bash
# Vérifier le build
pnpm verify:build

# Tester localement (simulation Vercel)
pnpm test:vercel

# Build complet
pnpm build
```

