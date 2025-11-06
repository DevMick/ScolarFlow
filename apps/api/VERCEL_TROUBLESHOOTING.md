# Guide de dépannage Vercel - Erreur FUNCTION_INVOCATION_FAILED

## Problème
Erreur `500 : ERREUR_INTERNE_DU_SERVEUR` avec code `FUNCTION_INVOCATION_FAILED` lors du déploiement sur Vercel.

## Causes possibles

### 1. Variables d'environnement manquantes

**Solution:** Vérifiez que toutes les variables d'environnement sont configurées dans Vercel:

1. Allez dans votre projet Vercel
2. Settings → Environment Variables
3. Ajoutez les variables suivantes:

#### Variables requises:
- `DATABASE_URL` - URL de connexion PostgreSQL (format: `postgresql://user:password@host:port/database?sslmode=require`)
- `NODE_ENV` - `production` (défini automatiquement par Vercel)
- `JWT_SECRET` - Secret pour signer les tokens JWT (si utilisé)
- `CORS_ORIGIN` - Origine autorisée pour CORS (optionnel)

#### Exemple de DATABASE_URL:
```
postgresql://avnadmin:VOTRE_MOT_DE_PASSE@pg-XXXXXX-allianceconsultants893-23db.h.aivencloud.com:17875/defaultdb?sslmode=require
```

### 2. Prisma Client non généré

**Solution:** Assurez-vous que Prisma Client est généré pendant le build:

Le script de build dans `package.json` devrait inclure:
```json
{
  "build": "prisma generate && node scripts/build-ignore-errors.cjs && node scripts/fix-vercel-imports.cjs",
  "postinstall": "prisma generate"
}
```

Vérifiez que `prisma generate` s'exécute correctement dans les logs de build Vercel.

### 3. Problème de connexion à la base de données

**Solution:** Vérifiez:
- La `DATABASE_URL` est correcte
- La base de données est accessible depuis Internet (pas de restriction IP)
- Les certificats SSL sont correctement configurés (`sslmode=require`)

### 4. Problème avec les imports ES modules

**Solution:** Vérifiez que tous les imports utilisent l'extension `.js`:
```javascript
import { app, prisma } from '../dist/server.js';
```

### 5. Timeout de fonction

**Solution:** Augmentez le timeout dans `vercel.json`:
```json
{
  "functions": {
    "api/server.js": {
      "memory": 1024,
      "maxDuration": 60
    }
  }
}
```

## Vérification des logs

1. Allez dans votre projet Vercel
2. Cliquez sur "Functions" dans le menu
3. Cliquez sur la fonction qui échoue
4. Consultez les logs pour voir l'erreur exacte

Les logs devraient maintenant inclure des messages préfixés par `[Vercel]` pour faciliter le débogage.

## Test local

Pour tester localement avant de déployer:

1. Créez un fichier `.env` avec vos variables d'environnement
2. Exécutez:
```bash
cd apps/api
pnpm build
node api/server.js
```

## Commandes utiles

### Vérifier la configuration Vercel
```bash
vercel env ls
```

### Voir les logs en temps réel
```bash
vercel logs --follow
```

### Tester le build localement
```bash
cd apps/api
pnpm build
```

## Prochaines étapes

Si le problème persiste après avoir vérifié les points ci-dessus:

1. Consultez les logs Vercel pour l'erreur exacte
2. Vérifiez que `api/server.js` existe dans le dossier de build
3. Vérifiez que `dist/server.js` est correctement compilé
4. Vérifiez que Prisma Client est généré dans `node_modules/.prisma/client`

