# 🚀 Guide de Démarrage Rapide - Sécurité

## ✅ Ce qui est déjà implémenté

Votre application a maintenant une architecture de sécurité complète :

1. ✅ **Helmet** : En-têtes de sécurité HTTP configurés
2. ✅ **Rate Limiting** : Protection contre les attaques par force brute
3. ✅ **Validation Zod** : Toutes les entrées peuvent être validées
4. ✅ **Sanitisation** : Nettoyage automatique des données
5. ✅ **CSRF Protection** : Protection contre les attaques CSRF
6. ✅ **Gestion d'erreurs sécurisée** : Pas de détails techniques en production
7. ✅ **Logging de sécurité** : Surveillance des événements critiques
8. ✅ **Upload sécurisé** : Validation et renommage des fichiers

## 📝 Comment utiliser

### 1. Valider les entrées avec Zod

```typescript
import { validateBody, validateParams, validateQuery } from '../middleware/validation';
import { registerSchema } from '../validations/auth.validations';
import { idSchema } from '../validations/common.validations';

// Valider le body
router.post('/endpoint', 
  validateBody(registerSchema),
  handler
);

// Valider les params
router.get('/users/:id', 
  validateParams(idSchema),
  handler
);

// Valider les query params
router.get('/items', 
  validateQuery(paginationSchema),
  handler
);
```

### 2. Utiliser l'upload sécurisé

```typescript
import { createSecureUploader, validateUploadedFile } from '../middleware/secureFileUpload';

const upload = createSecureUploader({
  category: 'image', // 'image' | 'document' | 'spreadsheet'
  maxSize: 5 * 1024 * 1024, // 5MB
  fieldName: 'file'
});

router.post('/upload', 
  authenticateToken,
  upload,
  validateUploadedFile,
  handler
);
```

### 3. Protéger les routes avec CSRF

```typescript
import { csrfProtectionLite } from '../middleware/csrf';

router.post('/sensitive-action',
  authenticateToken,
  csrfProtectionLite,
  validateBody(schema),
  handler
);
```

### 4. Logger les événements de sécurité

```typescript
import { logSecurityEvent, SecurityEventType } from '../middleware/securityLogging';

logSecurityEvent(
  SecurityEventType.UNAUTHORIZED_ACCESS,
  'high',
  'Tentative d\'accès non autorisé',
  {
    ip: req.ip,
    userId: req.user?.id,
    path: req.path,
    requestId: req.requestId
  }
);
```

## 🔧 Configuration rapide

### Variables d'environnement

Ajoutez dans `apps/api/.env` :

```bash
# CSRF (peut utiliser JWT_SECRET)
CSRF_SECRET="votre-secret-csrf-tres-long-et-aleatoire"

# Pour production
NODE_ENV="production"
CORS_ORIGIN="https://votre-domaine.com"
```

### Redémarrer le serveur

```bash
pnpm dev
```

## 📚 Fichiers créés

- `apps/api/src/config/helmet.config.ts` - Configuration Helmet
- `apps/api/src/middleware/validation.ts` - Validation Zod
- `apps/api/src/middleware/csrf.ts` - Protection CSRF
- `apps/api/src/middleware/errorHandler.security.ts` - Gestion d'erreurs
- `apps/api/src/middleware/securityLogging.ts` - Logging de sécurité
- `apps/api/src/middleware/secureFileUpload.ts` - Upload sécurisé
- `apps/api/src/validations/auth.validations.ts` - Schémas d'auth
- `apps/api/src/validations/common.validations.ts` - Schémas communs
- `apps/api/SECURITY.md` - Documentation complète
- `apps/api/src/routes/auth.secure.example.ts` - Exemples d'utilisation

## 🎯 Prochaines étapes recommandées

1. **Tester les validations** : Ajouter `validateBody` sur les routes existantes
2. **Améliorer l'auth** : Ajouter les schémas Zod aux routes d'authentification
3. **Protéger les routes sensibles** : Ajouter CSRF sur les routes modifiant l'état
4. **Utiliser l'upload sécurisé** : Remplacer multer basique par `createSecureUploader`
5. **Surveiller les logs** : Configurer des alertes pour les événements de sécurité

---

Pour plus de détails, consultez `SECURITY.md`

